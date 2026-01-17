<?php

declare(strict_types=1);

namespace RehabSource\Controllers;

use RehabSource\Core\Auth;
use RehabSource\Core\Database;
use RehabSource\Core\Response;
use RehabSource\Core\Validator;

/**
 * Share Pack Controller
 * Handles secure document sharing with expiry and audit
 */
class SharePackController
{
    /**
     * Create a share pack
     */
    public static function create(): void
    {
        $user = Auth::require();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validator = Validator::make($data)
            ->required('case_id')
            ->required('recipient_email')
            ->required('purpose')
            ->required('expires_in_days');

        if ($validator->fails()) {
            Response::validationError($validator->errors());
        }

        // Verify access to case
        $caseAccess = Database::queryOne(
            "SELECT 1 FROM cases WHERE id = ? AND therapist_id = ?
             UNION SELECT 1 FROM case_team_members WHERE case_id = ? AND user_id = ? AND is_active = 1",
            [$data['case_id'], $user['id'], $data['case_id'], $user['id']]
        );

        if (!$caseAccess) {
            Response::forbidden('Access denied to this case');
        }

        // Get client consent
        $consent = Database::queryOne(
            "SELECT * FROM client_consents 
             WHERE case_id = ? AND consent_type = 'share_documents' AND status = 'granted'
             AND (expires_at IS NULL OR expires_at > NOW())",
            [$data['case_id']]
        );

        if (!$consent) {
            Response::badRequest('Client consent required for document sharing');
        }

        $packId = Database::generateUUID();
        $accessToken = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime("+{$data['expires_in_days']} days"));

        Database::beginTransaction();

        try {
            // Create share pack
            Database::execute(
                "INSERT INTO share_packs (id, case_id, created_by, recipient_email, recipient_name,
                 purpose, access_token, expires_at, max_views, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')",
                [
                    $packId,
                    $data['case_id'],
                    $user['id'],
                    $data['recipient_email'],
                    $data['recipient_name'] ?? null,
                    $data['purpose'],
                    $accessToken,
                    $expiresAt,
                    $data['max_views'] ?? 10
                ]
            );

            // Add documents to pack
            $documents = $data['documents'] ?? [];
            foreach ($documents as $docType) {
                $itemId = Database::generateUUID();
                Database::execute(
                    "INSERT INTO share_pack_items (id, pack_id, document_type, document_id)
                     VALUES (?, ?, ?, ?)",
                    [$itemId, $packId, $docType['type'], $docType['id'] ?? null]
                );
            }

            // Log audit
            Auth::logAudit($user['id'], 'share_pack_created', 'share_packs', $packId, null, [
                'recipient' => mask_email($data['recipient_email']),
                'purpose' => $data['purpose'],
                'expires_at' => $expiresAt
            ]);

            Database::commit();

            // Queue notification email
            EmailController::queue([
                'to_email' => $data['recipient_email'],
                'to_name' => $data['recipient_name'] ?? null,
                'subject' => 'Documents Shared with You',
                'template' => 'share_pack_invitation',
                'data' => [
                    'sharer_name' => $user['first_name'] . ' ' . $user['last_name'],
                    'purpose' => $data['purpose']
                ],
                'priority' => 'high'
            ]);

            Response::success([
                'id' => $packId,
                'access_url' => config('app.url') . '/share/' . $accessToken,
                'expires_at' => $expiresAt
            ], 'Share pack created', 201);

        } catch (\Exception $e) {
            Database::rollback();
            log_error("Share pack creation failed: " . $e->getMessage());
            Response::serverError('Failed to create share pack');
        }
    }

    /**
     * List share packs for a case
     */
    public static function index(array $params): void
    {
        $user = Auth::require();
        $caseId = $params['case_id'] ?? null;

        // Verify access
        $caseAccess = Database::queryOne(
            "SELECT 1 FROM cases WHERE id = ? AND therapist_id = ?
             UNION SELECT 1 FROM case_team_members WHERE case_id = ? AND user_id = ? AND is_active = 1",
            [$caseId, $user['id'], $caseId, $user['id']]
        );

        if (!$caseAccess) {
            Response::forbidden('Access denied');
        }

        $packs = Database::query(
            "SELECT sp.*, 
                    (SELECT COUNT(*) FROM share_pack_items WHERE pack_id = sp.id) as item_count,
                    (SELECT COUNT(*) FROM share_pack_access_log WHERE pack_id = sp.id) as view_count
             FROM share_packs sp
             WHERE sp.case_id = ?
             ORDER BY sp.created_at DESC",
            [$caseId]
        );

        Response::success($packs);
    }

    /**
     * Access share pack (public endpoint with token)
     */
    public static function access(array $params): void
    {
        $token = $params['token'] ?? null;

        if (!$token) {
            Response::badRequest('Access token required');
        }

        $pack = Database::queryOne(
            "SELECT sp.*, c.case_number,
                    u.first_name as creator_first_name, u.last_name as creator_last_name
             FROM share_packs sp
             JOIN cases c ON sp.case_id = c.id
             JOIN users u ON sp.created_by = u.id
             WHERE sp.access_token = ? AND sp.status = 'active'",
            [$token]
        );

        if (!$pack) {
            Response::notFound('Share pack not found or inactive');
        }

        // Check expiry
        if (strtotime($pack['expires_at']) < time()) {
            Database::execute(
                "UPDATE share_packs SET status = 'expired' WHERE id = ?",
                [$pack['id']]
            );
            Response::badRequest('This share pack has expired');
        }

        // Check view limit
        if ($pack['view_count'] >= $pack['max_views']) {
            Response::badRequest('Maximum views reached for this share pack');
        }

        // Log access
        $logId = Database::generateUUID();
        Database::execute(
            "INSERT INTO share_pack_access_log (id, pack_id, accessed_from_ip, user_agent)
             VALUES (?, ?, ?, ?)",
            [
                $logId,
                $pack['id'],
                $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ]
        );

        // Update view count
        Database::execute(
            "UPDATE share_packs SET view_count = view_count + 1, last_accessed = NOW() WHERE id = ?",
            [$pack['id']]
        );

        // Get items
        $items = Database::query(
            "SELECT spi.*, 
                    CASE 
                        WHEN spi.document_type = 'report' THEN (SELECT r.report_type FROM reports r WHERE r.id = spi.document_id)
                        WHEN spi.document_type = 'media' THEN (SELECT mf.original_filename FROM media_files mf WHERE mf.id = spi.document_id)
                        ELSE spi.document_type
                    END as document_name
             FROM share_pack_items spi
             WHERE spi.pack_id = ?",
            [$pack['id']]
        );

        // Remove sensitive fields
        unset($pack['access_token']);

        $pack['items'] = $items;
        $pack['remaining_views'] = $pack['max_views'] - $pack['view_count'] - 1;

        Response::success($pack);
    }

    /**
     * Download document from share pack
     */
    public static function downloadItem(array $params): void
    {
        $token = $params['token'] ?? null;
        $itemId = $params['item_id'] ?? null;

        if (!$token || !$itemId) {
            Response::badRequest('Token and item ID required');
        }

        // Verify pack access
        $pack = Database::queryOne(
            "SELECT * FROM share_packs WHERE access_token = ? AND status = 'active' AND expires_at > NOW()",
            [$token]
        );

        if (!$pack) {
            Response::forbidden('Invalid or expired share pack');
        }

        // Get item
        $item = Database::queryOne(
            "SELECT * FROM share_pack_items WHERE id = ? AND pack_id = ?",
            [$itemId, $pack['id']]
        );

        if (!$item) {
            Response::notFound('Item not found in share pack');
        }

        // Log download
        Database::execute(
            "INSERT INTO share_pack_access_log (id, pack_id, item_id, action, accessed_from_ip)
             VALUES (?, ?, ?, 'download', ?)",
            [Database::generateUUID(), $pack['id'], $itemId, $_SERVER['REMOTE_ADDR'] ?? 'unknown']
        );

        // Redirect to appropriate download based on type
        if ($item['document_type'] === 'media') {
            // Get file and stream
            $file = Database::queryOne(
                "SELECT * FROM media_files WHERE id = ? AND is_deleted = 0",
                [$item['document_id']]
            );

            if (!$file) {
                Response::notFound('File not found');
            }

            $filePath = storage_path('uploads/' . $file['file_path']);
            
            if (!file_exists($filePath)) {
                Response::notFound('File not found on disk');
            }

            header('Content-Type: ' . $file['mime_type']);
            header('Content-Disposition: attachment; filename="' . $file['original_filename'] . '"');
            header('Content-Length: ' . $file['file_size']);
            
            readfile($filePath);
            exit;
        }

        // For reports, return JSON data for frontend PDF generation
        if ($item['document_type'] === 'report') {
            $report = Database::queryOne(
                "SELECT r.*, rv.content, rv.version_number
                 FROM reports r
                 JOIN report_versions rv ON r.id = rv.report_id
                 WHERE r.id = ?
                 ORDER BY rv.version_number DESC LIMIT 1",
                [$item['document_id']]
            );

            if (!$report) {
                Response::notFound('Report not found');
            }

            Response::success([
                'type' => 'report',
                'data' => $report
            ]);
        }

        Response::badRequest('Unknown document type');
    }

    /**
     * Revoke share pack
     */
    public static function revoke(array $params): void
    {
        $user = Auth::require();
        $packId = $params['id'] ?? null;

        $pack = Database::queryOne(
            "SELECT * FROM share_packs WHERE id = ?",
            [$packId]
        );

        if (!$pack) {
            Response::notFound('Share pack not found');
        }

        // Only creator or case therapist can revoke
        if ($pack['created_by'] !== $user['id']) {
            $isTherapist = Database::queryOne(
                "SELECT 1 FROM cases WHERE id = ? AND therapist_id = ?",
                [$pack['case_id'], $user['id']]
            );

            if (!$isTherapist) {
                Response::forbidden('Cannot revoke this share pack');
            }
        }

        Database::execute(
            "UPDATE share_packs SET status = 'revoked', revoked_at = NOW(), revoked_by = ? WHERE id = ?",
            [$user['id'], $packId]
        );

        Auth::logAudit($user['id'], 'share_pack_revoked', 'share_packs', $packId);

        Response::success(null, 'Share pack revoked');
    }

    /**
     * Get access log for share pack
     */
    public static function accessLog(array $params): void
    {
        $user = Auth::require();
        $packId = $params['id'] ?? null;

        $pack = Database::queryOne(
            "SELECT * FROM share_packs WHERE id = ?",
            [$packId]
        );

        if (!$pack) {
            Response::notFound('Share pack not found');
        }

        // Verify access
        if ($pack['created_by'] !== $user['id']) {
            $isTherapist = Database::queryOne(
                "SELECT 1 FROM cases WHERE id = ? AND therapist_id = ?",
                [$pack['case_id'], $user['id']]
            );

            if (!$isTherapist) {
                Response::forbidden('Access denied');
            }
        }

        $logs = Database::query(
            "SELECT * FROM share_pack_access_log WHERE pack_id = ? ORDER BY accessed_at DESC",
            [$packId]
        );

        Response::success($logs);
    }
}
