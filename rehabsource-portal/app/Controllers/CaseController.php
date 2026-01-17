<?php
/**
 * Case Management Controller
 * Handles cases, visits, notes, and case members
 */

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;
use App\Core\Validator;

class CaseController
{
    /**
     * List cases for current user
     * GET /api/cases
     */
    public function index(): void
    {
        $user = Auth::require();
        $roles = Auth::roles();
        
        $status = $_GET['status'] ?? null;
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(10, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        
        // Build query based on role
        if (in_array('admin', $roles)) {
            $sql = "SELECT c.*, cp.first_name as client_first_name, cp.last_name as client_last_name,
                           tp.first_name as therapist_first_name, tp.last_name as therapist_last_name
                    FROM cases c
                    LEFT JOIN client_profiles cp ON c.client_id = cp.id
                    LEFT JOIN therapist_profiles tp ON c.primary_therapist_id = tp.id
                    WHERE 1=1";
            $params = [];
        } elseif (in_array('therapist', $roles)) {
            $therapist = Database::queryOne(
                "SELECT id FROM therapist_profiles WHERE user_id = ?",
                [Auth::id()]
            );
            
            $sql = "SELECT c.*, cp.first_name as client_first_name, cp.last_name as client_last_name
                    FROM cases c
                    LEFT JOIN client_profiles cp ON c.client_id = cp.id
                    WHERE c.primary_therapist_id = ?";
            $params = [$therapist['id'] ?? ''];
        } elseif (in_array('case_manager', $roles)) {
            $sql = "SELECT c.*, cp.first_name as client_first_name, cp.last_name as client_last_name,
                           tp.first_name as therapist_first_name, tp.last_name as therapist_last_name
                    FROM cases c
                    JOIN case_members cm ON c.id = cm.case_id
                    LEFT JOIN client_profiles cp ON c.client_id = cp.id
                    LEFT JOIN therapist_profiles tp ON c.primary_therapist_id = tp.id
                    WHERE cm.user_id = ? AND cm.is_active = 1";
            $params = [Auth::id()];
        } else {
            // Client view
            $client = Database::queryOne(
                "SELECT id FROM client_profiles WHERE user_id = ?",
                [Auth::id()]
            );
            
            $sql = "SELECT c.*, tp.first_name as therapist_first_name, tp.last_name as therapist_last_name
                    FROM cases c
                    LEFT JOIN therapist_profiles tp ON c.primary_therapist_id = tp.id
                    WHERE c.client_id = ?";
            $params = [$client['id'] ?? ''];
        }
        
        if ($status) {
            $sql .= " AND c.status = ?";
            $params[] = $status;
        }
        
        // Count total
        $countSql = preg_replace('/SELECT .+ FROM/', 'SELECT COUNT(*) as total FROM', $sql);
        $total = Database::queryOne($countSql, $params)['total'] ?? 0;
        
        $sql .= " ORDER BY c.updated_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $cases = Database::query($sql, $params);
        
        foreach ($cases as &$case) {
            $case['metadata'] = json_decode($case['metadata'], true);
        }
        
        Response::success([
            'data' => $cases,
            'pagination' => [
                'total' => (int)$total,
                'page' => $page,
                'limit' => $limit,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * Get single case
     * GET /api/cases/{id}
     */
    public function show(string $id): void
    {
        Auth::require();
        
        $case = $this->getAccessibleCase($id);
        
        if (!$case) {
            Response::notFound('Case not found');
        }
        
        // Get case members
        $case['members'] = Database::query(
            "SELECT cm.*, u.email,
                    COALESCE(cp.first_name, tp.first_name, cmp.first_name) as first_name,
                    COALESCE(cp.last_name, tp.last_name, cmp.last_name) as last_name
             FROM case_members cm
             JOIN users u ON cm.user_id = u.id
             LEFT JOIN client_profiles cp ON cm.user_id = cp.user_id
             LEFT JOIN therapist_profiles tp ON cm.user_id = tp.user_id
             LEFT JOIN case_manager_profiles cmp ON cm.user_id = cmp.user_id
             WHERE cm.case_id = ? AND cm.is_active = 1",
            [$id]
        );
        
        // Get recent visits
        $case['recent_visits'] = Database::query(
            "SELECT v.*, tp.first_name as therapist_first_name, tp.last_name as therapist_last_name
             FROM visits v
             LEFT JOIN therapist_profiles tp ON v.therapist_id = tp.id
             WHERE v.case_id = ?
             ORDER BY v.scheduled_start DESC
             LIMIT 5",
            [$id]
        );
        
        // Get recent notes (if therapist or admin)
        if (Auth::hasPermission('cases.view') || $this->isTherapistOnCase($id)) {
            $case['recent_notes'] = Database::query(
                "SELECT cn.*, u.email as author_email
                 FROM case_notes cn
                 JOIN users u ON cn.author_id = u.id
                 WHERE cn.case_id = ? AND cn.is_confidential = 0
                 ORDER BY cn.created_at DESC
                 LIMIT 5",
                [$id]
            );
        }
        
        // Get wizard runs
        $case['assessments'] = Database::query(
            "SELECT wr.id, wr.status, wr.current_step, wr.started_at, wr.completed_at,
                    wt.name as template_name, wt.category
             FROM wizard_runs wr
             JOIN wizard_templates wt ON wr.template_id = wt.id
             WHERE wr.case_id = ?
             ORDER BY wr.created_at DESC",
            [$id]
        );
        
        $case['metadata'] = json_decode($case['metadata'], true);
        
        Response::success($case);
    }

    /**
     * Create new case
     * POST /api/cases
     */
    public function store(): void
    {
        $user = Auth::requireAnyRole(['therapist', 'case_manager', 'admin']);
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = Validator::make($input)
            ->required('client_id')
            ->uuid('client_id')
            ->required('title')
            ->maxLength('title', 255)
            ->required('case_type')
            ->in('case_type', ['home_modification', 'equipment', 'functional_assessment', 'therapy', 'combined'])
            ->in('priority', ['low', 'normal', 'high', 'urgent'])
            ->in('funding_type', ['ndis', 'my_aged_care', 'dva', 'private', 'tac', 'workcover', 'other']);
        
        if ($validator->fails()) {
            Response::validationError($validator->firstErrors());
        }
        
        // Verify client exists
        $client = Database::queryOne(
            "SELECT id FROM client_profiles WHERE id = ?",
            [$input['client_id']]
        );
        
        if (!$client) {
            Response::notFound('Client not found');
        }
        
        // Get therapist ID if therapist role
        $therapistId = null;
        if (Auth::hasRole('therapist')) {
            $therapist = Database::queryOne(
                "SELECT id FROM therapist_profiles WHERE user_id = ?",
                [Auth::id()]
            );
            $therapistId = $therapist['id'] ?? null;
        }
        
        $caseId = Database::insert('cases', [
            'client_id' => $input['client_id'],
            'primary_therapist_id' => $therapistId ?? $input['therapist_id'] ?? null,
            'organization_id' => $input['organization_id'] ?? null,
            'title' => $input['title'],
            'description' => $input['description'] ?? null,
            'case_type' => $input['case_type'],
            'priority' => $input['priority'] ?? 'normal',
            'funding_type' => $input['funding_type'] ?? null,
            'funding_reference' => $input['funding_reference'] ?? null,
            'budget_approved' => $input['budget_approved'] ?? null,
            'start_date' => $input['start_date'] ?? date('Y-m-d'),
            'target_completion_date' => $input['target_completion_date'] ?? null,
            'metadata' => json_encode($input['metadata'] ?? []),
            'created_by' => Auth::id()
        ]);
        
        // Add case members
        // Add client
        $clientUser = Database::queryOne(
            "SELECT user_id FROM client_profiles WHERE id = ?",
            [$input['client_id']]
        );
        
        if ($clientUser) {
            Database::insert('case_members', [
                'case_id' => $caseId,
                'user_id' => $clientUser['user_id'],
                'role' => 'client',
                'added_by' => Auth::id()
            ]);
        }
        
        // Add therapist
        if ($therapistId) {
            Database::insert('case_members', [
                'case_id' => $caseId,
                'user_id' => Auth::id(),
                'role' => 'therapist',
                'added_by' => Auth::id()
            ]);
        }
        
        // Add case manager if they created it
        if (Auth::hasRole('case_manager')) {
            Database::insert('case_members', [
                'case_id' => $caseId,
                'user_id' => Auth::id(),
                'role' => 'case_manager',
                'added_by' => Auth::id()
            ]);
        }
        
        Auth::logAuditEvent('case.created', 'cases', $caseId, null, [
            'title' => $input['title'],
            'case_type' => $input['case_type']
        ]);
        
        Response::success(['id' => $caseId], 'Case created', 201);
    }

    /**
     * Update case
     * PUT /api/cases/{id}
     */
    public function update(string $id): void
    {
        Auth::require();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $case = $this->getAccessibleCase($id, true);
        
        if (!$case) {
            Response::notFound('Case not found');
        }
        
        $validator = Validator::make($input)
            ->maxLength('title', 255)
            ->in('status', ['intake', 'active', 'on_hold', 'pending_approval', 'completed', 'cancelled', 'archived'])
            ->in('priority', ['low', 'normal', 'high', 'urgent']);
        
        if ($validator->fails()) {
            Response::validationError($validator->firstErrors());
        }
        
        $updateData = [];
        $allowedFields = ['title', 'description', 'status', 'priority', 'funding_reference', 
                          'budget_approved', 'target_completion_date'];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updateData[$field] = $input[$field];
            }
        }
        
        if (!empty($updateData)) {
            Database::update('cases', $updateData, 'id = ?', [$id]);
            
            Auth::logAuditEvent('case.updated', 'cases', $id, $case, $updateData);
        }
        
        Response::success(null, 'Case updated');
    }

    /**
     * Add case member
     * POST /api/cases/{id}/members
     */
    public function addMember(string $id): void
    {
        Auth::require();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $case = $this->getAccessibleCase($id, true);
        
        if (!$case) {
            Response::notFound('Case not found');
        }
        
        $validator = Validator::make($input)
            ->required('user_id')
            ->uuid('user_id')
            ->required('role')
            ->in('role', ['client', 'carer', 'therapist', 'case_manager', 'support_coordinator', 'funder', 'builder', 'supplier', 'other']);
        
        if ($validator->fails()) {
            Response::validationError($validator->firstErrors());
        }
        
        // Check if already a member
        $existing = Database::queryOne(
            "SELECT id FROM case_members WHERE case_id = ? AND user_id = ? AND role = ? AND is_active = 1",
            [$id, $input['user_id'], $input['role']]
        );
        
        if ($existing) {
            Response::error('User is already a member with this role', 409);
        }
        
        Database::insert('case_members', [
            'case_id' => $id,
            'user_id' => $input['user_id'],
            'role' => $input['role'],
            'permissions' => json_encode($input['permissions'] ?? null),
            'added_by' => Auth::id()
        ]);
        
        Response::success(null, 'Member added', 201);
    }

    /**
     * Remove case member
     * DELETE /api/cases/{caseId}/members/{memberId}
     */
    public function removeMember(string $caseId, string $memberId): void
    {
        Auth::require();
        
        $case = $this->getAccessibleCase($caseId, true);
        
        if (!$case) {
            Response::notFound('Case not found');
        }
        
        Database::update('case_members', [
            'is_active' => 0,
            'removed_at' => date('Y-m-d H:i:s')
        ], 'id = ? AND case_id = ?', [$memberId, $caseId]);
        
        Response::success(null, 'Member removed');
    }

    /**
     * Create case note
     * POST /api/cases/{id}/notes
     */
    public function addNote(string $id): void
    {
        Auth::require();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $case = $this->getAccessibleCase($id, true);
        
        if (!$case) {
            Response::notFound('Case not found');
        }
        
        $validator = Validator::make($input)
            ->required('content')
            ->in('note_type', ['progress', 'clinical', 'soap', 'phone_call', 'email', 'internal', 'handover']);
        
        if ($validator->fails()) {
            Response::validationError($validator->firstErrors());
        }
        
        $noteId = Database::insert('case_notes', [
            'case_id' => $id,
            'visit_id' => $input['visit_id'] ?? null,
            'author_id' => Auth::id(),
            'note_type' => $input['note_type'] ?? 'progress',
            'title' => $input['title'] ?? null,
            'content' => $input['content'], // Should be encrypted in production
            'is_confidential' => $input['is_confidential'] ?? false,
            'is_billable' => $input['is_billable'] ?? false,
            'duration_minutes' => $input['duration_minutes'] ?? null
        ]);
        
        Auth::logAuditEvent('case.note.created', 'case_notes', $noteId);
        
        Response::success(['id' => $noteId], 'Note added', 201);
    }

    /**
     * Schedule visit
     * POST /api/cases/{id}/visits
     */
    public function scheduleVisit(string $id): void
    {
        Auth::requireAnyRole(['therapist', 'admin']);
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $case = $this->getAccessibleCase($id, true);
        
        if (!$case) {
            Response::notFound('Case not found');
        }
        
        $validator = Validator::make($input)
            ->required('visit_type')
            ->in('visit_type', ['initial_assessment', 'follow_up', 'home_visit', 'clinic', 'telehealth', 'equipment_trial', 'handover'])
            ->required('scheduled_start')
            ->required('scheduled_end')
            ->required('location_type')
            ->in('location_type', ['client_home', 'clinic', 'telehealth', 'other']);
        
        if ($validator->fails()) {
            Response::validationError($validator->firstErrors());
        }
        
        // Get therapist ID
        $therapist = Database::queryOne(
            "SELECT id FROM therapist_profiles WHERE user_id = ?",
            [Auth::id()]
        );
        
        if (!$therapist && !Auth::hasRole('admin')) {
            Response::error('Therapist profile required', 403);
        }
        
        $visitId = Database::insert('visits', [
            'case_id' => $id,
            'therapist_id' => $therapist['id'] ?? $input['therapist_id'],
            'visit_type' => $input['visit_type'],
            'scheduled_start' => $input['scheduled_start'],
            'scheduled_end' => $input['scheduled_end'],
            'location_type' => $input['location_type'],
            'location_address' => $input['location_address'] ?? null,
            'telehealth_link' => $input['telehealth_link'] ?? null,
            'notes' => $input['notes'] ?? null,
            'created_by' => Auth::id()
        ]);
        
        Response::success(['id' => $visitId], 'Visit scheduled', 201);
    }

    /**
     * Helper: Get case if user has access
     */
    private function getAccessibleCase(string $id, bool $requireEdit = false): ?array
    {
        $roles = Auth::roles();
        
        if (in_array('admin', $roles)) {
            return Database::queryOne("SELECT * FROM cases WHERE id = ?", [$id]);
        }
        
        // Check if user is a case member
        $member = Database::queryOne(
            "SELECT cm.role FROM case_members cm
             WHERE cm.case_id = ? AND cm.user_id = ? AND cm.is_active = 1",
            [$id, Auth::id()]
        );
        
        if ($member) {
            // Check edit permission based on role
            if ($requireEdit && in_array($member['role'], ['funder', 'other'])) {
                return null; // View-only roles
            }
            return Database::queryOne("SELECT * FROM cases WHERE id = ?", [$id]);
        }
        
        // Check if therapist is assigned
        if (in_array('therapist', $roles)) {
            $therapist = Database::queryOne(
                "SELECT id FROM therapist_profiles WHERE user_id = ?",
                [Auth::id()]
            );
            
            if ($therapist) {
                return Database::queryOne(
                    "SELECT * FROM cases WHERE id = ? AND primary_therapist_id = ?",
                    [$id, $therapist['id']]
                );
            }
        }
        
        return null;
    }

    /**
     * Helper: Check if current user is therapist on case
     */
    private function isTherapistOnCase(string $caseId): bool
    {
        $therapist = Database::queryOne(
            "SELECT id FROM therapist_profiles WHERE user_id = ?",
            [Auth::id()]
        );
        
        if (!$therapist) {
            return false;
        }
        
        $case = Database::queryOne(
            "SELECT 1 FROM cases WHERE id = ? AND primary_therapist_id = ?",
            [$caseId, $therapist['id']]
        );
        
        return $case !== null;
    }
}
