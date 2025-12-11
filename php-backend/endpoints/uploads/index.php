<?php
/**
 * File Upload Endpoint
 * POST /api/v1/uploads
 */

$userId = Auth::requireAuth();
$roles = Auth::getUserRoles($userId);

if (!in_array('ot_admin', $roles) && !in_array('system_admin', $roles)) {
    Response::forbidden('Insufficient permissions');
}

if ($method !== 'POST') {
    Response::methodNotAllowed('POST');
}

if (empty($_FILES['file'])) {
    Response::badRequest('No file uploaded');
}

$file = $_FILES['file'];
$assessmentId = $_POST['assessment_id'] ?? null;
$category = $_POST['category'] ?? 'general';

// Validate file
$maxSize = 20 * 1024 * 1024; // 20MB
if ($file['size'] > $maxSize) {
    Response::badRequest('File too large (max 20MB)');
}

$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!in_array($mimeType, $allowedTypes)) {
    Response::badRequest('Invalid file type');
}

// Generate unique filename
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = Database::generateUUID() . '.' . strtolower($ext);
$uploadDir = APP_ROOT . '/uploads/' . date('Y/m/');

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$filePath = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $filePath)) {
    Response::serverError('Failed to save file');
}

// Store in database
$fileId = Database::generateUUID();
$relativePath = 'uploads/' . date('Y/m/') . $filename;

Database::execute(
    "INSERT INTO uploaded_files (id, user_id, assessment_id, original_name, file_path, mime_type, file_size, category, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())",
    [$fileId, $userId, $assessmentId, $file['name'], $relativePath, $mimeType, $file['size'], $category]
);

$baseUrl = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];

Response::success([
    'id' => $fileId,
    'url' => $baseUrl . '/api/v1/uploads/' . $fileId,
    'original_name' => $file['name'],
    'mime_type' => $mimeType,
    'size' => $file['size']
], 'File uploaded', 201);
