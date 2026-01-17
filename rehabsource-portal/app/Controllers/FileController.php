<?php

declare(strict_types=1);

namespace RehabSource\Controllers;

use RehabSource\Core\Auth;
use RehabSource\Core\Database;
use RehabSource\Core\Response;
use RehabSource\Core\Validator;

/**
 * File Controller
 * Handles secure file uploads with EXIF stripping and validation
 */
class FileController
{
    private const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private const UPLOAD_DIR = __DIR__ . '/../../storage/uploads';
    
    private const ALLOWED_TYPES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'application/pdf' => 'pdf'
    ];

    /**
     * Upload file
     */
    public static function upload(): void
    {
        $user = Auth::require();

        if (empty($_FILES['file'])) {
            Response::badRequest('No file uploaded');
        }

        $file = $_FILES['file'];
        $caseId = $_POST['case_id'] ?? null;
        $category = $_POST['category'] ?? 'general';
        $description = $_POST['description'] ?? '';

        // Validate file
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::badRequest('File upload error: ' . self::getUploadErrorMessage($file['error']));
        }

        if ($file['size'] > self::MAX_FILE_SIZE) {
            Response::badRequest('File too large. Maximum size is 5MB');
        }

        // Verify MIME type
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);

        if (!isset(self::ALLOWED_TYPES[$mimeType])) {
            Response::badRequest('File type not allowed. Allowed: JPG, PNG, WebP, PDF');
        }

        // Verify case access if case_id provided
        if ($caseId) {
            $hasAccess = Database::queryOne(
                "SELECT 1 FROM case_team_members WHERE case_id = ? AND user_id = ? AND is_active = 1
                 UNION SELECT 1 FROM cases WHERE id = ? AND therapist_id = ?",
                [$caseId, $user['id'], $caseId, $user['id']]
            );

            if (!$hasAccess) {
                Response::forbidden('Access denied to this case');
            }
        }

        // Generate secure filename
        $fileId = Database::generateUUID();
        $extension = self::ALLOWED_TYPES[$mimeType];
        $filename = $fileId . '.' . $extension;

        // Create directory structure (by year/month)
        $subDir = date('Y/m');
        $fullDir = self::UPLOAD_DIR . '/' . $subDir;
        
        if (!is_dir($fullDir)) {
            mkdir($fullDir, 0755, true);
        }

        $filePath = $fullDir . '/' . $filename;
        $relativePath = $subDir . '/' . $filename;

        // Process image (strip EXIF, resize if needed)
        if (str_starts_with($mimeType, 'image/')) {
            $processed = self::processImage($file['tmp_name'], $filePath, $mimeType);
            if (!$processed) {
                Response::serverError('Failed to process image');
            }
        } else {
            // For non-images, just move the file
            if (!move_uploaded_file($file['tmp_name'], $filePath)) {
                Response::serverError('Failed to save file');
            }
        }

        // Calculate hash for integrity
        $fileHash = hash_file('sha256', $filePath);
        $finalSize = filesize($filePath);

        // Store in database
        Database::execute(
            "INSERT INTO media_files (id, case_id, uploaded_by, original_filename, stored_filename, 
             file_path, mime_type, file_size, file_hash, category, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $fileId, $caseId, $user['id'], $file['name'], $filename,
                $relativePath, $mimeType, $finalSize, $fileHash, $category, $description
            ]
        );

        // Log audit
        Auth::logAudit($user['id'], 'file_uploaded', 'media_files', $fileId, null, [
            'original_name' => $file['name'],
            'size' => $finalSize,
            'category' => $category
        ]);

        Response::success([
            'id' => $fileId,
            'filename' => $file['name'],
            'size' => $finalSize,
            'mime_type' => $mimeType,
            'url' => '/api/files/' . $fileId
        ], 'File uploaded successfully', 201);
    }

    /**
     * Get file (stream)
     */
    public static function show(array $params): void
    {
        $user = Auth::require();
        $fileId = $params['id'] ?? null;

        $file = Database::queryOne(
            "SELECT * FROM media_files WHERE id = ? AND is_deleted = 0",
            [$fileId]
        );

        if (!$file) {
            Response::notFound('File not found');
        }

        // Verify access
        if ($file['case_id']) {
            $hasAccess = Database::queryOne(
                "SELECT 1 FROM case_team_members WHERE case_id = ? AND user_id = ? AND is_active = 1
                 UNION SELECT 1 FROM cases WHERE id = ? AND (therapist_id = ? OR client_id = ?)",
                [$file['case_id'], $user['id'], $file['case_id'], $user['id'], $user['id']]
            );

            if (!$hasAccess) {
                Response::forbidden('Access denied');
            }
        }

        $filePath = self::UPLOAD_DIR . '/' . $file['file_path'];

        if (!file_exists($filePath)) {
            Response::notFound('File not found on disk');
        }

        // Log access
        Auth::logAudit($user['id'], 'file_accessed', 'media_files', $fileId);

        // Stream file
        header('Content-Type: ' . $file['mime_type']);
        header('Content-Length: ' . $file['file_size']);
        header('Content-Disposition: inline; filename="' . $file['original_filename'] . '"');
        header('Cache-Control: private, max-age=3600');
        
        readfile($filePath);
        exit;
    }

    /**
     * Download file
     */
    public static function download(array $params): void
    {
        $user = Auth::require();
        $fileId = $params['id'] ?? null;

        $file = Database::queryOne(
            "SELECT * FROM media_files WHERE id = ? AND is_deleted = 0",
            [$fileId]
        );

        if (!$file) {
            Response::notFound('File not found');
        }

        // Verify access (same as show)
        if ($file['case_id']) {
            $hasAccess = Database::queryOne(
                "SELECT 1 FROM case_team_members WHERE case_id = ? AND user_id = ? AND is_active = 1
                 UNION SELECT 1 FROM cases WHERE id = ? AND (therapist_id = ? OR client_id = ?)",
                [$file['case_id'], $user['id'], $file['case_id'], $user['id'], $user['id']]
            );

            if (!$hasAccess) {
                Response::forbidden('Access denied');
            }
        }

        $filePath = self::UPLOAD_DIR . '/' . $file['file_path'];

        if (!file_exists($filePath)) {
            Response::notFound('File not found on disk');
        }

        // Log download
        Auth::logAudit($user['id'], 'file_downloaded', 'media_files', $fileId);

        // Force download
        header('Content-Type: application/octet-stream');
        header('Content-Length: ' . $file['file_size']);
        header('Content-Disposition: attachment; filename="' . $file['original_filename'] . '"');
        
        readfile($filePath);
        exit;
    }

    /**
     * Delete file (soft delete)
     */
    public static function delete(array $params): void
    {
        $user = Auth::require();
        $fileId = $params['id'] ?? null;

        $file = Database::queryOne(
            "SELECT * FROM media_files WHERE id = ? AND is_deleted = 0",
            [$fileId]
        );

        if (!$file) {
            Response::notFound('File not found');
        }

        // Only uploader or case therapist can delete
        $canDelete = $file['uploaded_by'] === $user['id'];
        
        if (!$canDelete && $file['case_id']) {
            $isTherapist = Database::queryOne(
                "SELECT 1 FROM cases WHERE id = ? AND therapist_id = ?",
                [$file['case_id'], $user['id']]
            );
            $canDelete = $isTherapist !== null;
        }

        if (!$canDelete) {
            Response::forbidden('Cannot delete this file');
        }

        // Soft delete
        Database::execute(
            "UPDATE media_files SET is_deleted = 1, deleted_at = NOW(), deleted_by = ? WHERE id = ?",
            [$user['id'], $fileId]
        );

        // Log audit
        Auth::logAudit($user['id'], 'file_deleted', 'media_files', $fileId);

        Response::success(null, 'File deleted');
    }

    /**
     * Add annotation to image
     */
    public static function annotate(array $params): void
    {
        $user = Auth::require();
        $fileId = $params['id'] ?? null;
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $file = Database::queryOne(
            "SELECT * FROM media_files WHERE id = ? AND is_deleted = 0",
            [$fileId]
        );

        if (!$file) {
            Response::notFound('File not found');
        }

        if (!str_starts_with($file['mime_type'], 'image/')) {
            Response::badRequest('Can only annotate images');
        }

        // Verify access
        if ($file['case_id']) {
            $hasAccess = Database::queryOne(
                "SELECT 1 FROM case_team_members WHERE case_id = ? AND user_id = ? AND is_active = 1
                 UNION SELECT 1 FROM cases WHERE id = ? AND therapist_id = ?",
                [$file['case_id'], $user['id'], $file['case_id'], $user['id']]
            );

            if (!$hasAccess) {
                Response::forbidden('Access denied');
            }
        }

        $annotationId = Database::generateUUID();

        Database::execute(
            "INSERT INTO media_annotations (id, media_file_id, created_by, annotation_data)
             VALUES (?, ?, ?, ?)",
            [$annotationId, $fileId, $user['id'], json_encode($data['annotations'] ?? [])]
        );

        // Log audit
        Auth::logAudit($user['id'], 'annotation_added', 'media_annotations', $annotationId);

        Response::success(['id' => $annotationId], 'Annotation saved', 201);
    }

    /**
     * Add measurement calibration
     */
    public static function calibrate(array $params): void
    {
        $user = Auth::require();
        $fileId = $params['id'] ?? null;
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validator = Validator::make($data)
            ->required('reference_length_mm')
            ->required('pixel_coordinates');

        if ($validator->fails()) {
            Response::validationError($validator->errors());
        }

        $file = Database::queryOne(
            "SELECT * FROM media_files WHERE id = ? AND is_deleted = 0",
            [$fileId]
        );

        if (!$file) {
            Response::notFound('File not found');
        }

        $calibrationId = Database::generateUUID();

        Database::execute(
            "INSERT INTO measurement_calibrations (id, media_file_id, created_by, reference_length_mm, 
             pixel_coordinates, pixels_per_mm)
             VALUES (?, ?, ?, ?, ?, ?)",
            [
                $calibrationId,
                $fileId,
                $user['id'],
                $data['reference_length_mm'],
                json_encode($data['pixel_coordinates']),
                $data['pixels_per_mm'] ?? null
            ]
        );

        Response::success(['id' => $calibrationId], 'Calibration saved', 201);
    }

    /**
     * List files for a case
     */
    public static function listByCase(array $params): void
    {
        $user = Auth::require();
        $caseId = $params['case_id'] ?? null;

        // Verify access
        $hasAccess = Database::queryOne(
            "SELECT 1 FROM case_team_members WHERE case_id = ? AND user_id = ? AND is_active = 1
             UNION SELECT 1 FROM cases WHERE id = ? AND (therapist_id = ? OR client_id = ?)",
            [$caseId, $user['id'], $caseId, $user['id'], $user['id']]
        );

        if (!$hasAccess) {
            Response::forbidden('Access denied');
        }

        $category = $_GET['category'] ?? null;
        
        $sql = "SELECT mf.*, u.first_name as uploader_first_name, u.last_name as uploader_last_name,
                       (SELECT COUNT(*) FROM media_annotations WHERE media_file_id = mf.id) as annotation_count
                FROM media_files mf
                LEFT JOIN users u ON mf.uploaded_by = u.id
                WHERE mf.case_id = ? AND mf.is_deleted = 0";
        $params = [$caseId];

        if ($category) {
            $sql .= " AND mf.category = ?";
            $params[] = $category;
        }

        $sql .= " ORDER BY mf.created_at DESC";

        $files = Database::query($sql, $params);

        Response::success($files);
    }

    /**
     * Process image: strip EXIF, optionally resize
     */
    private static function processImage(string $sourcePath, string $destPath, string $mimeType): bool
    {
        try {
            // Load image
            switch ($mimeType) {
                case 'image/jpeg':
                    $image = imagecreatefromjpeg($sourcePath);
                    break;
                case 'image/png':
                    $image = imagecreatefrompng($sourcePath);
                    break;
                case 'image/webp':
                    $image = imagecreatefromwebp($sourcePath);
                    break;
                default:
                    return false;
            }

            if (!$image) {
                return false;
            }

            // Get dimensions
            $width = imagesx($image);
            $height = imagesy($image);

            // Resize if too large (max 4000px on any side)
            $maxDimension = 4000;
            if ($width > $maxDimension || $height > $maxDimension) {
                $ratio = min($maxDimension / $width, $maxDimension / $height);
                $newWidth = (int)($width * $ratio);
                $newHeight = (int)($height * $ratio);

                $resized = imagecreatetruecolor($newWidth, $newHeight);
                
                // Preserve transparency for PNG
                if ($mimeType === 'image/png') {
                    imagealphablending($resized, false);
                    imagesavealpha($resized, true);
                }

                imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
                imagedestroy($image);
                $image = $resized;
            }

            // Save without EXIF data
            switch ($mimeType) {
                case 'image/jpeg':
                    $result = imagejpeg($image, $destPath, 85);
                    break;
                case 'image/png':
                    $result = imagepng($image, $destPath, 8);
                    break;
                case 'image/webp':
                    $result = imagewebp($image, $destPath, 85);
                    break;
                default:
                    $result = false;
            }

            imagedestroy($image);
            return $result;

        } catch (\Exception $e) {
            error_log("Image processing error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get human-readable upload error message
     */
    private static function getUploadErrorMessage(int $errorCode): string
    {
        return match ($errorCode) {
            UPLOAD_ERR_INI_SIZE => 'File exceeds server limit',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds form limit',
            UPLOAD_ERR_PARTIAL => 'File only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Server configuration error',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file',
            UPLOAD_ERR_EXTENSION => 'Upload blocked by extension',
            default => 'Unknown error'
        };
    }
}
