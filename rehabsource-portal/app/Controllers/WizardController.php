<?php
/**
 * Assessment Wizard Controller
 * Handles wizard templates, steps, questions, and runs
 */

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;
use App\Core\Validator;

class WizardController
{
    /**
     * List available wizard templates
     * GET /api/wizards
     */
    public function index(): void
    {
        Auth::require();
        $roles = Auth::roles();
        
        // Filter by profession if therapist
        $profession = null;
        if (in_array('therapist', $roles)) {
            $profile = Database::queryOne(
                "SELECT profession FROM therapist_profiles WHERE user_id = ?",
                [Auth::id()]
            );
            $profession = $profile['profession'] ?? null;
        }
        
        $sql = "SELECT id, name, slug, description, category, profession, version, settings
                FROM wizard_templates 
                WHERE is_active = 1";
        $params = [];
        
        if ($profession) {
            $sql .= " AND (profession = 'all' OR profession = ?)";
            $params[] = $profession;
        }
        
        $sql .= " ORDER BY category, name";
        
        $templates = Database::query($sql, $params);
        
        // Parse settings JSON
        foreach ($templates as &$template) {
            $template['settings'] = json_decode($template['settings'], true);
        }
        
        Response::success($templates);
    }

    /**
     * Get wizard template with steps and questions
     * GET /api/wizards/{id}
     */
    public function show(string $id): void
    {
        Auth::require();
        
        $template = Database::queryOne(
            "SELECT * FROM wizard_templates WHERE id = ? AND is_active = 1",
            [$id]
        );
        
        if (!$template) {
            Response::notFound('Wizard template not found');
        }
        
        // Get steps with questions
        $steps = Database::query(
            "SELECT * FROM wizard_steps WHERE template_id = ? ORDER BY step_number",
            [$id]
        );
        
        foreach ($steps as &$step) {
            $step['conditions'] = json_decode($step['conditions'], true);
            
            // Get questions for this step
            $step['questions'] = Database::query(
                "SELECT * FROM wizard_questions WHERE step_id = ? ORDER BY question_order",
                [$step['id']]
            );
            
            foreach ($step['questions'] as &$question) {
                $question['options'] = json_decode($question['options'], true);
                $question['validation_rules'] = json_decode($question['validation_rules'], true);
                $question['conditions'] = json_decode($question['conditions'], true);
                $question['metadata'] = json_decode($question['metadata'], true);
            }
        }
        
        $template['settings'] = json_decode($template['settings'], true);
        $template['steps'] = $steps;
        
        Response::success($template);
    }

    /**
     * Start a new wizard run
     * POST /api/wizards/{id}/start
     */
    public function start(string $id): void
    {
        $user = Auth::requireAnyRole(['therapist', 'admin']);
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = Validator::make($input)
            ->required('client_id')
            ->uuid('client_id');
        
        if ($validator->fails()) {
            Response::validationError($validator->firstErrors());
        }
        
        // Verify template exists
        $template = Database::queryOne(
            "SELECT id FROM wizard_templates WHERE id = ? AND is_active = 1",
            [$id]
        );
        
        if (!$template) {
            Response::notFound('Wizard template not found');
        }
        
        // Get therapist profile
        $therapist = Database::queryOne(
            "SELECT id FROM therapist_profiles WHERE user_id = ?",
            [Auth::id()]
        );
        
        if (!$therapist && !Auth::hasRole('admin')) {
            Response::error('Therapist profile required', 403);
        }
        
        // Verify client exists
        $client = Database::queryOne(
            "SELECT id FROM client_profiles WHERE id = ?",
            [$input['client_id']]
        );
        
        if (!$client) {
            Response::notFound('Client not found');
        }
        
        // Create wizard run
        $runId = Database::insert('wizard_runs', [
            'template_id' => $id,
            'case_id' => $input['case_id'] ?? null,
            'visit_id' => $input['visit_id'] ?? null,
            'client_id' => $input['client_id'],
            'therapist_id' => $therapist['id'] ?? Auth::id(),
            'status' => 'in_progress',
            'started_at' => date('Y-m-d H:i:s'),
            'metadata' => json_encode($input['metadata'] ?? [])
        ]);
        
        // Log audit
        Auth::logAuditEvent('wizard.started', 'wizard_runs', $runId, null, [
            'template_id' => $id,
            'client_id' => $input['client_id']
        ]);
        
        Response::success(['run_id' => $runId], 'Wizard started', 201);
    }

    /**
     * Get wizard run with current progress
     * GET /api/wizard-runs/{id}
     */
    public function getRun(string $id): void
    {
        Auth::require();
        
        $run = Database::queryOne(
            "SELECT wr.*, wt.name as template_name, wt.slug as template_slug,
                    cp.first_name as client_first_name, cp.last_name as client_last_name
             FROM wizard_runs wr
             JOIN wizard_templates wt ON wr.template_id = wt.id
             JOIN client_profiles cp ON wr.client_id = cp.id
             WHERE wr.id = ?",
            [$id]
        );
        
        if (!$run) {
            Response::notFound('Wizard run not found');
        }
        
        // Check access
        if ($run['therapist_id'] !== Auth::id() && !Auth::hasRole('admin')) {
            $therapist = Database::queryOne(
                "SELECT user_id FROM therapist_profiles WHERE id = ?",
                [$run['therapist_id']]
            );
            
            if (!$therapist || $therapist['user_id'] !== Auth::id()) {
                Response::forbidden();
            }
        }
        
        // Get answers
        $answers = Database::query(
            "SELECT wa.*, wq.question_key
             FROM wizard_answers wa
             JOIN wizard_questions wq ON wa.question_id = wq.id
             WHERE wa.run_id = ?",
            [$id]
        );
        
        // Build answers map
        $answersMap = [];
        foreach ($answers as $answer) {
            $answersMap[$answer['question_key']] = [
                'value' => $answer['answer_value'],
                'json' => json_decode($answer['answer_json'], true),
                'file_ids' => json_decode($answer['file_ids'], true),
                'answered_at' => $answer['answered_at']
            ];
        }
        
        $run['metadata'] = json_decode($run['metadata'], true);
        $run['answers'] = $answersMap;
        
        // Get template structure
        $template = Database::queryOne(
            "SELECT * FROM wizard_templates WHERE id = ?",
            [$run['template_id']]
        );
        
        $steps = Database::query(
            "SELECT * FROM wizard_steps WHERE template_id = ? ORDER BY step_number",
            [$run['template_id']]
        );
        
        $run['total_steps'] = count($steps);
        
        Response::success($run);
    }

    /**
     * Save wizard answers
     * POST /api/wizard-runs/{id}/answers
     */
    public function saveAnswers(string $id): void
    {
        Auth::require();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        
        // Verify run exists and user has access
        $run = Database::queryOne(
            "SELECT * FROM wizard_runs WHERE id = ? AND status IN ('draft', 'in_progress', 'paused')",
            [$id]
        );
        
        if (!$run) {
            Response::notFound('Wizard run not found or already completed');
        }
        
        // Check access
        $therapist = Database::queryOne(
            "SELECT user_id FROM therapist_profiles WHERE id = ?",
            [$run['therapist_id']]
        );
        
        if ((!$therapist || $therapist['user_id'] !== Auth::id()) && !Auth::hasRole('admin')) {
            Response::forbidden();
        }
        
        Database::beginTransaction();
        
        try {
            foreach ($input['answers'] ?? [] as $questionKey => $answer) {
                // Get question ID
                $question = Database::queryOne(
                    "SELECT wq.id, wq.is_required, wq.validation_rules
                     FROM wizard_questions wq
                     JOIN wizard_steps ws ON wq.step_id = ws.id
                     WHERE ws.template_id = ? AND wq.question_key = ?",
                    [$run['template_id'], $questionKey]
                );
                
                if (!$question) {
                    continue;
                }
                
                // Prepare answer data
                $answerValue = null;
                $answerJson = null;
                $fileIds = null;
                $isEncrypted = false;
                
                if (is_array($answer)) {
                    if (isset($answer['files'])) {
                        $fileIds = json_encode($answer['files']);
                        $answerValue = count($answer['files']) . ' file(s)';
                    } else {
                        $answerJson = json_encode($answer);
                    }
                } else {
                    $answerValue = $answer;
                }
                
                // Upsert answer
                $existing = Database::queryOne(
                    "SELECT id FROM wizard_answers WHERE run_id = ? AND question_id = ?",
                    [$id, $question['id']]
                );
                
                if ($existing) {
                    Database::update('wizard_answers', [
                        'answer_value' => $answerValue,
                        'answer_json' => $answerJson,
                        'file_ids' => $fileIds,
                        'is_encrypted' => $isEncrypted,
                        'updated_at' => date('Y-m-d H:i:s')
                    ], 'id = ?', [$existing['id']]);
                } else {
                    Database::insert('wizard_answers', [
                        'run_id' => $id,
                        'question_id' => $question['id'],
                        'answer_value' => $answerValue,
                        'answer_json' => $answerJson,
                        'file_ids' => $fileIds,
                        'is_encrypted' => $isEncrypted
                    ]);
                }
            }
            
            // Update run progress
            $currentStep = $input['current_step'] ?? $run['current_step'];
            Database::update('wizard_runs', [
                'current_step' => $currentStep,
                'last_saved_at' => date('Y-m-d H:i:s'),
                'status' => 'in_progress'
            ], 'id = ?', [$id]);
            
            Database::commit();
            
            Response::success(null, 'Answers saved');
            
        } catch (\Exception $e) {
            Database::rollback();
            throw $e;
        }
    }

    /**
     * Complete wizard run
     * POST /api/wizard-runs/{id}/complete
     */
    public function complete(string $id): void
    {
        Auth::require();
        
        $run = Database::queryOne(
            "SELECT * FROM wizard_runs WHERE id = ? AND status IN ('in_progress', 'paused')",
            [$id]
        );
        
        if (!$run) {
            Response::notFound('Wizard run not found or already completed');
        }
        
        // Check access
        $therapist = Database::queryOne(
            "SELECT user_id FROM therapist_profiles WHERE id = ?",
            [$run['therapist_id']]
        );
        
        if ((!$therapist || $therapist['user_id'] !== Auth::id()) && !Auth::hasRole('admin')) {
            Response::forbidden();
        }
        
        // Validate all required questions are answered
        $unanswered = Database::query(
            "SELECT wq.question_key, wq.label
             FROM wizard_questions wq
             JOIN wizard_steps ws ON wq.step_id = ws.id
             LEFT JOIN wizard_answers wa ON wq.id = wa.question_id AND wa.run_id = ?
             WHERE ws.template_id = ? AND wq.is_required = 1 AND wa.id IS NULL",
            [$id, $run['template_id']]
        );
        
        if (!empty($unanswered)) {
            $missing = array_column($unanswered, 'label');
            Response::error('Required questions not answered: ' . implode(', ', $missing), 400);
        }
        
        // Complete the run
        Database::update('wizard_runs', [
            'status' => 'completed',
            'completed_at' => date('Y-m-d H:i:s')
        ], 'id = ?', [$id]);
        
        // Log audit
        Auth::logAuditEvent('wizard.completed', 'wizard_runs', $id);
        
        Response::success(null, 'Wizard completed');
    }

    /**
     * Pause wizard run
     * POST /api/wizard-runs/{id}/pause
     */
    public function pause(string $id): void
    {
        Auth::require();
        
        $run = Database::queryOne(
            "SELECT * FROM wizard_runs WHERE id = ? AND status = 'in_progress'",
            [$id]
        );
        
        if (!$run) {
            Response::notFound('Wizard run not found');
        }
        
        Database::update('wizard_runs', [
            'status' => 'paused',
            'last_saved_at' => date('Y-m-d H:i:s')
        ], 'id = ?', [$id]);
        
        Response::success(null, 'Wizard paused');
    }

    /**
     * Resume wizard run
     * POST /api/wizard-runs/{id}/resume
     */
    public function resume(string $id): void
    {
        Auth::require();
        
        $run = Database::queryOne(
            "SELECT * FROM wizard_runs WHERE id = ? AND status = 'paused'",
            [$id]
        );
        
        if (!$run) {
            Response::notFound('Wizard run not found or not paused');
        }
        
        Database::update('wizard_runs', [
            'status' => 'in_progress'
        ], 'id = ?', [$id]);
        
        Response::success(null, 'Wizard resumed');
    }

    /**
     * List wizard runs for current user
     * GET /api/wizard-runs
     */
    public function listRuns(): void
    {
        $user = Auth::require();
        
        $status = $_GET['status'] ?? null;
        $clientId = $_GET['client_id'] ?? null;
        
        $sql = "SELECT wr.*, wt.name as template_name, wt.category,
                       cp.first_name as client_first_name, cp.last_name as client_last_name
                FROM wizard_runs wr
                JOIN wizard_templates wt ON wr.template_id = wt.id
                JOIN client_profiles cp ON wr.client_id = cp.id
                JOIN therapist_profiles tp ON wr.therapist_id = tp.id
                WHERE tp.user_id = ?";
        $params = [Auth::id()];
        
        if ($status) {
            $sql .= " AND wr.status = ?";
            $params[] = $status;
        }
        
        if ($clientId) {
            $sql .= " AND wr.client_id = ?";
            $params[] = $clientId;
        }
        
        $sql .= " ORDER BY wr.updated_at DESC LIMIT 50";
        
        $runs = Database::query($sql, $params);
        
        foreach ($runs as &$run) {
            $run['metadata'] = json_decode($run['metadata'], true);
        }
        
        Response::success($runs);
    }

    /**
     * Admin: Create wizard template
     * POST /api/admin/wizards
     */
    public function create(): void
    {
        Auth::requireRole('admin');
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = Validator::make($input)
            ->required('name')
            ->maxLength('name', 255)
            ->required('slug')
            ->maxLength('slug', 100)
            ->required('category')
            ->in('category', ['intake', 'assessment', 'home_mods', 'equipment', 'progress', 'discharge', 'letter', 'other'])
            ->in('profession', ['all', 'occupational_therapist', 'physiotherapist', 'speech_pathologist']);
        
        if ($validator->fails()) {
            Response::validationError($validator->firstErrors());
        }
        
        // Check slug uniqueness
        if (Database::exists('wizard_templates', 'slug', $input['slug'])) {
            Response::error('Template slug already exists', 409);
        }
        
        $templateId = Database::insert('wizard_templates', [
            'name' => $input['name'],
            'slug' => $input['slug'],
            'description' => $input['description'] ?? null,
            'category' => $input['category'],
            'profession' => $input['profession'] ?? 'all',
            'settings' => json_encode($input['settings'] ?? []),
            'created_by' => Auth::id()
        ]);
        
        // Create steps if provided
        if (!empty($input['steps'])) {
            foreach ($input['steps'] as $index => $step) {
                $stepId = Database::insert('wizard_steps', [
                    'template_id' => $templateId,
                    'step_number' => $index + 1,
                    'title' => $step['title'],
                    'description' => $step['description'] ?? null,
                    'help_text' => $step['help_text'] ?? null,
                    'is_optional' => $step['is_optional'] ?? false,
                    'conditions' => json_encode($step['conditions'] ?? null)
                ]);
                
                // Create questions for this step
                if (!empty($step['questions'])) {
                    foreach ($step['questions'] as $qIndex => $question) {
                        Database::insert('wizard_questions', [
                            'step_id' => $stepId,
                            'question_order' => $qIndex + 1,
                            'question_key' => $question['key'],
                            'question_type' => $question['type'],
                            'label' => $question['label'],
                            'placeholder' => $question['placeholder'] ?? null,
                            'help_text' => $question['help_text'] ?? null,
                            'options' => json_encode($question['options'] ?? null),
                            'validation_rules' => json_encode($question['validation'] ?? null),
                            'default_value' => $question['default'] ?? null,
                            'is_required' => $question['required'] ?? false,
                            'conditions' => json_encode($question['conditions'] ?? null),
                            'metadata' => json_encode($question['metadata'] ?? null)
                        ]);
                    }
                }
            }
        }
        
        Auth::logAuditEvent('wizard.template.created', 'wizard_templates', $templateId);
        
        Response::success(['id' => $templateId], 'Wizard template created', 201);
    }
}
