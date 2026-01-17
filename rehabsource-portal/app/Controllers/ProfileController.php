<?php
/**
 * Profile Controller
 * Handles user profiles for all roles
 */

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;
use App\Core\Validator;

class ProfileController
{
    /**
     * Get current user's profile
     * GET /api/profile
     */
    public function show(): void
    {
        $user = Auth::require();
        $roles = Auth::roles();
        
        $profile = null;
        $profileType = null;
        
        if (in_array('therapist', $roles)) {
            $profile = Database::queryOne(
                "SELECT * FROM therapist_profiles WHERE user_id = ?",
                [$user['id']]
            );
            $profileType = 'therapist';
        } elseif (in_array('case_manager', $roles)) {
            $profile = Database::queryOne(
                "SELECT * FROM case_manager_profiles WHERE user_id = ?",
                [$user['id']]
            );
            $profileType = 'case_manager';
        } else {
            $profile = Database::queryOne(
                "SELECT * FROM client_profiles WHERE user_id = ?",
                [$user['id']]
            );
            $profileType = 'client';
        }
        
        if ($profile) {
            // Parse JSON fields
            $jsonFields = ['qualifications', 'specializations', 'service_areas', 'accepted_funding_types', 
                           'languages', 'availability', 'secondary_diagnoses', 'communication_preferences',
                           'service_regions'];
            
            foreach ($jsonFields as $field) {
                if (isset($profile[$field])) {
                    $profile[$field] = json_decode($profile[$field], true);
                }
            }
        }
        
        Response::success([
            'user' => $user,
            'roles' => $roles,
            'profile' => $profile,
            'profile_type' => $profileType
        ]);
    }

    /**
     * Update current user's profile
     * PUT /api/profile
     */
    public function update(): void
    {
        $user = Auth::require();
        $roles = Auth::roles();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        
        // Determine profile type
        $profileTable = 'client_profiles';
        if (in_array('therapist', $roles)) {
            $profileTable = 'therapist_profiles';
        } elseif (in_array('case_manager', $roles)) {
            $profileTable = 'case_manager_profiles';
        }
        
        // Base validation
        $validator = Validator::make($input)
            ->maxLength('first_name', 100)
            ->maxLength('last_name', 100)
            ->phone('phone_mobile')
            ->postcode('postcode')
            ->state('state');
        
        if ($validator->fails()) {
            Response::validationError($validator->firstErrors());
        }
        
        // Build update data
        $updateData = [];
        $allowedFields = ['first_name', 'last_name', 'phone_mobile', 'address_line1', 'address_line2',
                          'suburb', 'state', 'postcode'];
        
        // Add role-specific fields
        if ($profileTable === 'therapist_profiles') {
            $allowedFields = array_merge($allowedFields, [
                'phone_work', 'bio', 'service_radius_km', 'hourly_rate',
                'accepts_new_clients', 'telehealth_available', 'home_visits_available', 'clinic_visits_available'
            ]);
        } elseif ($profileTable === 'case_manager_profiles') {
            $allowedFields = array_merge($allowedFields, [
                'phone_work', 'organization_name', 'caseload_capacity'
            ]);
        } else {
            $allowedFields = array_merge($allowedFields, [
                'phone_home', 'preferred_name', 'date_of_birth', 'gender',
                'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
                'accessibility_needs'
            ]);
        }
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $input)) {
                $updateData[$field] = $input[$field];
            }
        }
        
        // Handle JSON fields
        $jsonFields = ['service_areas', 'accepted_funding_types', 'languages', 'availability',
                       'qualifications', 'specializations', 'service_regions', 'communication_preferences'];
        
        foreach ($jsonFields as $field) {
            if (isset($input[$field])) {
                $updateData[$field] = json_encode($input[$field]);
            }
        }
        
        if (!empty($updateData)) {
            $updateData['updated_at'] = date('Y-m-d H:i:s');
            
            Database::update($profileTable, $updateData, 'user_id = ?', [$user['id']]);
            
            Auth::logAuditEvent('profile.updated', $profileTable, $user['id']);
        }
        
        Response::success(null, 'Profile updated');
    }

    /**
     * Search therapists (for client matching)
     * GET /api/therapists/search
     */
    public function searchTherapists(): void
    {
        Auth::require();
        
        $profession = $_GET['profession'] ?? null;
        $postcode = $_GET['postcode'] ?? null;
        $fundingType = $_GET['funding_type'] ?? null;
        $telehealth = $_GET['telehealth'] ?? null;
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(10, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT tp.id, tp.system_id, tp.first_name, tp.last_name, tp.profession,
                       tp.qualifications, tp.specializations, tp.bio, tp.suburb, tp.state, tp.postcode,
                       tp.service_radius_km, tp.accepted_funding_types, tp.languages,
                       tp.telehealth_available, tp.home_visits_available, tp.clinic_visits_available,
                       tp.rating_average, tp.rating_count, tp.avatar_file_id
                FROM therapist_profiles tp
                WHERE tp.is_active = 1 AND tp.is_verified = 1 AND tp.accepts_new_clients = 1";
        $params = [];
        
        if ($profession) {
            $sql .= " AND tp.profession = ?";
            $params[] = $profession;
        }
        
        if ($telehealth === '1') {
            $sql .= " AND tp.telehealth_available = 1";
        }
        
        // TODO: Add geolocation filtering based on postcode and service_radius_km
        
        // Count total
        $countSql = preg_replace('/SELECT .+ FROM/', 'SELECT COUNT(*) as total FROM', $sql);
        $total = Database::queryOne($countSql, $params)['total'] ?? 0;
        
        $sql .= " ORDER BY tp.rating_average DESC, tp.rating_count DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $therapists = Database::query($sql, $params);
        
        foreach ($therapists as &$therapist) {
            $therapist['qualifications'] = json_decode($therapist['qualifications'], true);
            $therapist['specializations'] = json_decode($therapist['specializations'], true);
            $therapist['accepted_funding_types'] = json_decode($therapist['accepted_funding_types'], true);
            $therapist['languages'] = json_decode($therapist['languages'], true);
        }
        
        Response::success([
            'data' => $therapists,
            'pagination' => [
                'total' => (int)$total,
                'page' => $page,
                'limit' => $limit,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * Get therapist public profile
     * GET /api/therapists/{id}
     */
    public function getTherapist(string $id): void
    {
        Auth::require();
        
        $therapist = Database::queryOne(
            "SELECT tp.id, tp.system_id, tp.first_name, tp.last_name, tp.profession,
                    tp.qualifications, tp.specializations, tp.experience_years, tp.bio,
                    tp.suburb, tp.state, tp.postcode, tp.service_radius_km,
                    tp.accepted_funding_types, tp.languages, tp.availability,
                    tp.telehealth_available, tp.home_visits_available, tp.clinic_visits_available,
                    tp.rating_average, tp.rating_count, tp.avatar_file_id
             FROM therapist_profiles tp
             WHERE tp.id = ? AND tp.is_active = 1",
            [$id]
        );
        
        if (!$therapist) {
            Response::notFound('Therapist not found');
        }
        
        // Parse JSON fields
        $jsonFields = ['qualifications', 'specializations', 'accepted_funding_types', 'languages', 'availability'];
        foreach ($jsonFields as $field) {
            if (isset($therapist[$field])) {
                $therapist[$field] = json_decode($therapist[$field], true);
            }
        }
        
        // Get recent reviews
        $therapist['reviews'] = Database::query(
            "SELECT r.rating, r.title, r.content, r.created_at
             FROM reviews r
             WHERE r.reviewee_id = (SELECT user_id FROM therapist_profiles WHERE id = ?)
               AND r.is_public = 1 AND r.is_hidden = 0
             ORDER BY r.created_at DESC
             LIMIT 5",
            [$id]
        );
        
        Response::success($therapist);
    }

    /**
     * Get client profile (for therapists)
     * GET /api/clients/{id}
     */
    public function getClient(string $id): void
    {
        Auth::requireAnyRole(['therapist', 'case_manager', 'admin']);
        
        // Check if therapist has access to this client
        if (!Auth::hasRole('admin')) {
            $hasAccess = Database::queryOne(
                "SELECT 1 FROM cases c
                 JOIN case_members cm ON c.id = cm.case_id
                 WHERE c.client_id = ? AND cm.user_id = ? AND cm.is_active = 1",
                [$id, Auth::id()]
            );
            
            if (!$hasAccess) {
                // Check if therapist is primary on any case for this client
                $therapist = Database::queryOne(
                    "SELECT id FROM therapist_profiles WHERE user_id = ?",
                    [Auth::id()]
                );
                
                if ($therapist) {
                    $hasAccess = Database::queryOne(
                        "SELECT 1 FROM cases WHERE client_id = ? AND primary_therapist_id = ?",
                        [$id, $therapist['id']]
                    );
                }
            }
            
            if (!$hasAccess) {
                Response::forbidden('No access to this client');
            }
        }
        
        $client = Database::queryOne(
            "SELECT * FROM client_profiles WHERE id = ?",
            [$id]
        );
        
        if (!$client) {
            Response::notFound('Client not found');
        }
        
        // Parse JSON fields
        $jsonFields = ['secondary_diagnoses', 'communication_preferences'];
        foreach ($jsonFields as $field) {
            if (isset($client[$field])) {
                $client[$field] = json_decode($client[$field], true);
            }
        }
        
        Response::success($client);
    }

    /**
     * List clients for therapist
     * GET /api/clients
     */
    public function listClients(): void
    {
        Auth::requireAnyRole(['therapist', 'case_manager', 'admin']);
        
        $search = $_GET['search'] ?? null;
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(10, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        
        $roles = Auth::roles();
        
        if (in_array('admin', $roles)) {
            $sql = "SELECT cp.*, 
                           (SELECT COUNT(*) FROM cases WHERE client_id = cp.id) as case_count
                    FROM client_profiles cp
                    WHERE cp.is_active = 1";
            $params = [];
        } elseif (in_array('therapist', $roles)) {
            $therapist = Database::queryOne(
                "SELECT id FROM therapist_profiles WHERE user_id = ?",
                [Auth::id()]
            );
            
            $sql = "SELECT DISTINCT cp.*,
                           (SELECT COUNT(*) FROM cases WHERE client_id = cp.id AND primary_therapist_id = ?) as case_count
                    FROM client_profiles cp
                    JOIN cases c ON cp.id = c.client_id
                    WHERE cp.is_active = 1 AND c.primary_therapist_id = ?";
            $params = [$therapist['id'] ?? '', $therapist['id'] ?? ''];
        } else {
            // Case manager
            $sql = "SELECT DISTINCT cp.*,
                           (SELECT COUNT(*) FROM cases WHERE client_id = cp.id) as case_count
                    FROM client_profiles cp
                    JOIN cases c ON cp.id = c.client_id
                    JOIN case_members cm ON c.id = cm.case_id
                    WHERE cp.is_active = 1 AND cm.user_id = ? AND cm.is_active = 1";
            $params = [Auth::id()];
        }
        
        if ($search) {
            $sql .= " AND (cp.first_name LIKE ? OR cp.last_name LIKE ? OR cp.system_id LIKE ?)";
            $searchTerm = "%{$search}%";
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
        }
        
        // Count total
        $countSql = preg_replace('/SELECT .+ FROM/', 'SELECT COUNT(DISTINCT cp.id) as total FROM', $sql);
        $total = Database::queryOne($countSql, $params)['total'] ?? 0;
        
        $sql .= " ORDER BY cp.last_name, cp.first_name LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $clients = Database::query($sql, $params);
        
        Response::success([
            'data' => $clients,
            'pagination' => [
                'total' => (int)$total,
                'page' => $page,
                'limit' => $limit,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }
}
