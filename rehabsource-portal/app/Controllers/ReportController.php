<?php

declare(strict_types=1);

namespace RehabSource\Controllers;

use RehabSource\Core\Auth;
use RehabSource\Core\Database;
use RehabSource\Core\Response;
use RehabSource\Core\Validator;

/**
 * Report Controller
 * Handles report generation, versioning, and budget adjustments
 */
class ReportController
{
    /**
     * List reports for a case
     */
    public static function index(array $params): void
    {
        $user = Auth::require();
        $caseId = $params['case_id'] ?? null;

        if (!$caseId) {
            Response::badRequest('Case ID required');
        }

        // Verify access to case
        if (!self::hasAccessToCase($user['id'], $caseId)) {
            Response::forbidden('Access denied to this case');
        }

        $reports = Database::query(
            "SELECT r.*, u.first_name as created_by_name, u.last_name as created_by_surname,
                    (SELECT COUNT(*) FROM report_versions WHERE report_id = r.id) as version_count
             FROM reports r
             LEFT JOIN users u ON r.created_by = u.id
             WHERE r.case_id = ?
             ORDER BY r.created_at DESC",
            [$caseId]
        );

        Response::success($reports);
    }

    /**
     * Get single report with all versions
     */
    public static function show(array $params): void
    {
        $user = Auth::require();
        $reportId = $params['id'] ?? null;

        $report = Database::queryOne(
            "SELECT r.*, c.case_number, c.client_id,
                    cl.first_name as client_first_name, cl.last_name as client_last_name
             FROM reports r
             JOIN cases c ON r.case_id = c.id
             JOIN client_profiles cl ON c.client_id = cl.id
             WHERE r.id = ?",
            [$reportId]
        );

        if (!$report) {
            Response::notFound('Report not found');
        }

        // Verify access
        if (!self::hasAccessToCase($user['id'], $report['case_id'])) {
            Response::forbidden('Access denied');
        }

        // Get all versions
        $versions = Database::query(
            "SELECT rv.*, u.first_name, u.last_name
             FROM report_versions rv
             LEFT JOIN users u ON rv.created_by = u.id
             WHERE rv.report_id = ?
             ORDER BY rv.version_number DESC",
            [$reportId]
        );

        // Get budget adjustments for latest version
        $latestVersion = $versions[0] ?? null;
        $budgetAdjustments = [];
        
        if ($latestVersion) {
            $budgetAdjustments = Database::query(
                "SELECT * FROM report_budget_adjustments 
                 WHERE version_id = ?
                 ORDER BY created_at DESC",
                [$latestVersion['id']]
            );
        }

        $report['versions'] = $versions;
        $report['budget_adjustments'] = $budgetAdjustments;

        Response::success($report);
    }

    /**
     * Generate new report from assessment
     */
    public static function generate(array $params): void
    {
        $user = Auth::require();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validator = Validator::make($data)
            ->required('case_id')
            ->required('assessment_id')
            ->required('report_type');

        if ($validator->fails()) {
            Response::validationError($validator->errors());
        }

        // Verify access and get assessment data
        $assessment = Database::queryOne(
            "SELECT a.*, c.case_number, c.client_id
             FROM assessment_instances a
             JOIN cases c ON a.case_id = c.id
             WHERE a.id = ? AND a.case_id = ?",
            [$data['assessment_id'], $data['case_id']]
        );

        if (!$assessment) {
            Response::notFound('Assessment not found');
        }

        if (!self::hasAccessToCase($user['id'], $data['case_id'])) {
            Response::forbidden('Access denied');
        }

        if ($assessment['status'] !== 'completed') {
            Response::badRequest('Assessment must be completed before generating report');
        }

        Database::beginTransaction();

        try {
            $reportId = Database::generateUUID();
            
            // Create report
            Database::execute(
                "INSERT INTO reports (id, case_id, assessment_id, report_type, status, created_by)
                 VALUES (?, ?, ?, ?, 'draft', ?)",
                [$reportId, $data['case_id'], $data['assessment_id'], $data['report_type'], $user['id']]
            );

            // Generate report content from assessment responses
            $content = self::generateReportContent($assessment['id'], $data['report_type']);

            // Create version 1
            $versionId = Database::generateUUID();
            Database::execute(
                "INSERT INTO report_versions (id, report_id, version_number, content, total_cost, created_by)
                 VALUES (?, ?, 1, ?, ?, ?)",
                [$versionId, $reportId, json_encode($content), $content['total_cost'] ?? 0, $user['id']]
            );

            // Log audit
            Auth::logAudit($user['id'], 'report_generated', 'reports', $reportId, null, [
                'report_type' => $data['report_type'],
                'assessment_id' => $data['assessment_id']
            ]);

            Database::commit();

            Response::success([
                'id' => $reportId,
                'version_id' => $versionId
            ], 'Report generated successfully', 201);

        } catch (\Exception $e) {
            Database::rollback();
            error_log("Report generation failed: " . $e->getMessage());
            Response::serverError('Failed to generate report');
        }
    }

    /**
     * Create new version with budget adjustments
     */
    public static function createVersion(array $params): void
    {
        $user = Auth::require();
        $reportId = $params['id'] ?? null;
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $report = Database::queryOne(
            "SELECT r.*, c.case_id FROM reports r
             JOIN cases c ON r.case_id = c.id
             WHERE r.id = ?",
            [$reportId]
        );

        if (!$report) {
            Response::notFound('Report not found');
        }

        if (!self::hasAccessToCase($user['id'], $report['case_id'])) {
            Response::forbidden('Access denied');
        }

        // Get latest version
        $latestVersion = Database::queryOne(
            "SELECT * FROM report_versions 
             WHERE report_id = ? 
             ORDER BY version_number DESC LIMIT 1",
            [$reportId]
        );

        if (!$latestVersion) {
            Response::serverError('No existing version found');
        }

        Database::beginTransaction();

        try {
            $newVersionNumber = $latestVersion['version_number'] + 1;
            $versionId = Database::generateUUID();

            // Copy content and apply adjustments
            $content = json_decode($latestVersion['content'], true);
            $adjustments = $data['adjustments'] ?? [];
            $adjustmentReason = $data['reason'] ?? '';

            $totalAdjustment = 0;
            foreach ($adjustments as $adj) {
                $totalAdjustment += floatval($adj['amount'] ?? 0);
            }

            $newTotalCost = $latestVersion['total_cost'] + $totalAdjustment;

            // Create new version
            Database::execute(
                "INSERT INTO report_versions (id, report_id, version_number, content, total_cost, adjustment_reason, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?)",
                [$versionId, $reportId, $newVersionNumber, json_encode($content), $newTotalCost, $adjustmentReason, $user['id']]
            );

            // Record individual adjustments
            foreach ($adjustments as $adj) {
                $adjId = Database::generateUUID();
                Database::execute(
                    "INSERT INTO report_budget_adjustments (id, version_id, item_description, original_amount, adjusted_amount, reason)
                     VALUES (?, ?, ?, ?, ?, ?)",
                    [
                        $adjId,
                        $versionId,
                        $adj['item'] ?? '',
                        $adj['original'] ?? 0,
                        $adj['amount'] ?? 0,
                        $adj['reason'] ?? ''
                    ]
                );
            }

            // Log audit
            Auth::logAudit($user['id'], 'report_version_created', 'report_versions', $versionId, null, [
                'version_number' => $newVersionNumber,
                'adjustment_total' => $totalAdjustment
            ]);

            Database::commit();

            Response::success([
                'version_id' => $versionId,
                'version_number' => $newVersionNumber,
                'total_cost' => $newTotalCost
            ], 'New version created');

        } catch (\Exception $e) {
            Database::rollback();
            error_log("Version creation failed: " . $e->getMessage());
            Response::serverError('Failed to create version');
        }
    }

    /**
     * Finalize and approve report
     */
    public static function finalize(array $params): void
    {
        $user = Auth::require();
        $reportId = $params['id'] ?? null;

        $report = Database::queryOne(
            "SELECT r.*, c.case_id FROM reports r
             JOIN cases c ON r.case_id = c.id
             WHERE r.id = ?",
            [$reportId]
        );

        if (!$report) {
            Response::notFound('Report not found');
        }

        if (!self::hasAccessToCase($user['id'], $report['case_id'])) {
            Response::forbidden('Access denied');
        }

        if ($report['status'] === 'finalized') {
            Response::badRequest('Report already finalized');
        }

        Database::execute(
            "UPDATE reports SET status = 'finalized', finalized_at = NOW(), finalized_by = ? WHERE id = ?",
            [$user['id'], $reportId]
        );

        Auth::logAudit($user['id'], 'report_finalized', 'reports', $reportId);

        Response::success(null, 'Report finalized');
    }

    /**
     * Export report as PDF (returns data for frontend PDF generation)
     */
    public static function export(array $params): void
    {
        $user = Auth::require();
        $reportId = $params['id'] ?? null;
        $versionId = $_GET['version_id'] ?? null;

        $report = Database::queryOne(
            "SELECT r.*, c.case_number, c.client_id,
                    cl.first_name as client_first_name, cl.last_name as client_last_name,
                    cl.date_of_birth, cl.ndis_number, cl.address_line1, cl.suburb, cl.state, cl.postcode
             FROM reports r
             JOIN cases c ON r.case_id = c.id
             JOIN client_profiles cl ON c.client_id = cl.id
             WHERE r.id = ?",
            [$reportId]
        );

        if (!$report) {
            Response::notFound('Report not found');
        }

        if (!self::hasAccessToCase($user['id'], $report['case_id'])) {
            Response::forbidden('Access denied');
        }

        // Get specific version or latest
        if ($versionId) {
            $version = Database::queryOne(
                "SELECT * FROM report_versions WHERE id = ? AND report_id = ?",
                [$versionId, $reportId]
            );
        } else {
            $version = Database::queryOne(
                "SELECT * FROM report_versions WHERE report_id = ? ORDER BY version_number DESC LIMIT 1",
                [$reportId]
            );
        }

        if (!$version) {
            Response::notFound('Report version not found');
        }

        // Get budget adjustments
        $adjustments = Database::query(
            "SELECT * FROM report_budget_adjustments WHERE version_id = ?",
            [$version['id']]
        );

        // Get associated media
        $media = Database::query(
            "SELECT mf.*, ma.annotation_data
             FROM media_files mf
             LEFT JOIN media_annotations ma ON mf.id = ma.media_file_id
             WHERE mf.case_id = ? AND mf.is_deleted = 0
             ORDER BY mf.created_at",
            [$report['case_id']]
        );

        // Log export
        Auth::logAudit($user['id'], 'report_exported', 'reports', $reportId, null, [
            'version_id' => $version['id']
        ]);

        Response::success([
            'report' => $report,
            'version' => $version,
            'content' => json_decode($version['content'], true),
            'adjustments' => $adjustments,
            'media' => $media
        ]);
    }

    /**
     * Generate report content from assessment responses
     */
    private static function generateReportContent(string $assessmentId, string $reportType): array
    {
        // Get all responses for this assessment
        $responses = Database::query(
            "SELECT ar.*, aq.question_key, aq.question_text, aq.question_type, as2.section_key, as2.section_title
             FROM assessment_responses ar
             JOIN assessment_questions aq ON ar.question_id = aq.id
             JOIN assessment_sections as2 ON aq.section_id = as2.id
             WHERE ar.assessment_id = ?
             ORDER BY as2.order_index, aq.order_index",
            [$assessmentId]
        );

        // Structure content by section
        $sections = [];
        $totalCost = 0;

        foreach ($responses as $response) {
            $sectionKey = $response['section_key'];
            
            if (!isset($sections[$sectionKey])) {
                $sections[$sectionKey] = [
                    'title' => $response['section_title'],
                    'questions' => []
                ];
            }

            $value = json_decode($response['response_value'], true) ?? $response['response_value'];
            
            $sections[$sectionKey]['questions'][] = [
                'key' => $response['question_key'],
                'question' => $response['question_text'],
                'answer' => $value,
                'notes' => $response['notes']
            ];

            // Extract costs if present
            if (isset($value['cost'])) {
                $totalCost += floatval($value['cost']);
            }
        }

        return [
            'report_type' => $reportType,
            'generated_at' => date('Y-m-d H:i:s'),
            'sections' => $sections,
            'total_cost' => $totalCost,
            'recommendations' => self::generateRecommendations($responses),
            'compliance_summary' => self::generateComplianceSummary($responses)
        ];
    }

    /**
     * Generate recommendations based on responses
     */
    private static function generateRecommendations(array $responses): array
    {
        $recommendations = [];
        
        foreach ($responses as $response) {
            $value = json_decode($response['response_value'], true);
            
            if (is_array($value) && isset($value['recommendation'])) {
                $recommendations[] = [
                    'area' => $response['section_title'],
                    'recommendation' => $value['recommendation'],
                    'priority' => $value['priority'] ?? 'medium'
                ];
            }
        }

        return $recommendations;
    }

    /**
     * Generate compliance summary
     */
    private static function generateComplianceSummary(array $responses): array
    {
        $compliance = [
            'compliant' => 0,
            'non_compliant' => 0,
            'not_applicable' => 0,
            'items' => []
        ];

        foreach ($responses as $response) {
            $value = json_decode($response['response_value'], true);
            
            if (is_array($value) && isset($value['compliant'])) {
                if ($value['compliant'] === true) {
                    $compliance['compliant']++;
                } elseif ($value['compliant'] === false) {
                    $compliance['non_compliant']++;
                    $compliance['items'][] = [
                        'item' => $response['question_text'],
                        'issue' => $value['issue'] ?? 'Non-compliant',
                        'remediation' => $value['remediation'] ?? ''
                    ];
                } else {
                    $compliance['not_applicable']++;
                }
            }
        }

        return $compliance;
    }

    /**
     * Check if user has access to case
     */
    private static function hasAccessToCase(string $userId, string $caseId): bool
    {
        $access = Database::queryOne(
            "SELECT 1 FROM case_team_members WHERE case_id = ? AND user_id = ? AND is_active = 1
             UNION
             SELECT 1 FROM cases WHERE id = ? AND (therapist_id = ? OR client_id = ?)",
            [$caseId, $userId, $caseId, $userId, $userId]
        );

        return $access !== null;
    }
}
