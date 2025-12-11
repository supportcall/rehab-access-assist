<?php
/**
 * Admin Settings Endpoints
 * GET /api/v1/admin/settings - Get all settings
 * PUT /api/v1/admin/settings/{key} - Update setting
 */

$userId = Auth::requireAuth();
$roles = Auth::getUserRoles($userId);

if (!in_array('system_admin', $roles)) {
    Response::forbidden('System admin access required');
}

$settingKey = $routeParams['key'] ?? null;

if ($method === 'GET') {
    if ($settingKey) {
        $setting = Database::queryOne(
            "SELECT * FROM system_settings WHERE setting_key = ?",
            [$settingKey]
        );
        if (!$setting) {
            Response::notFound('Setting not found');
        }
        Response::success($setting);
    } else {
        $settings = Database::query("SELECT * FROM system_settings ORDER BY setting_key");
        Response::success($settings);
    }

} elseif ($method === 'PUT' || $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$settingKey && empty($input['setting_key'])) {
        Response::badRequest('setting_key is required');
    }

    $key = $settingKey ?? $input['setting_key'];
    $value = $input['setting_value'] ?? null;
    $description = $input['description'] ?? null;

    // Check if setting exists
    $existing = Database::queryOne("SELECT id FROM system_settings WHERE setting_key = ?", [$key]);

    if ($existing) {
        // Update
        $updates = ["setting_value = ?", "updated_at = NOW()"];
        $params = [is_array($value) ? json_encode($value) : $value];
        
        if ($description !== null) {
            $updates[] = "description = ?";
            $params[] = $description;
        }
        
        $params[] = $key;
        
        Database::execute(
            "UPDATE system_settings SET " . implode(', ', $updates) . " WHERE setting_key = ?",
            $params
        );
    } else {
        // Insert
        Database::execute(
            "INSERT INTO system_settings (id, setting_key, setting_value, description, created_at, updated_at)
             VALUES (?, ?, ?, ?, NOW(), NOW())",
            [
                Database::generateUUID(),
                $key,
                is_array($value) ? json_encode($value) : $value,
                $description
            ]
        );
    }

    $setting = Database::queryOne("SELECT * FROM system_settings WHERE setting_key = ?", [$key]);

    Logger::info("Setting updated: {$key} by admin: {$userId}");

    Response::success($setting, 'Setting saved');

} elseif ($method === 'DELETE') {
    if (!$settingKey) {
        Response::badRequest('Setting key required');
    }

    Database::execute("DELETE FROM system_settings WHERE setting_key = ?", [$settingKey]);

    Response::success(null, 'Setting deleted');

} else {
    Response::methodNotAllowed('GET, PUT, POST, DELETE');
}
