<?php
/**
 * Equipment Management Controller
 * Handles equipment items, suppliers, quotes, orders, and trials
 */

namespace RehabSource\Controllers;

use RehabSource\Core\Auth;
use RehabSource\Core\Database;
use RehabSource\Core\Response;
use RehabSource\Core\Validator;

class EquipmentController
{
    /**
     * List equipment items with filtering
     * GET /api/equipment
     */
    public static function index(): void
    {
        $user = Auth::require();
        $db = Database::getConnection();
        
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        
        $where = ['1=1'];
        $params = [];
        
        // Filter by category
        if (!empty($_GET['category'])) {
            $where[] = 'category = ?';
            $params[] = $_GET['category'];
        }
        
        // Filter by supplier
        if (!empty($_GET['supplier_id'])) {
            $where[] = 'supplier_id = ?';
            $params[] = $_GET['supplier_id'];
        }
        
        // Search by name or code
        if (!empty($_GET['search'])) {
            $where[] = '(name LIKE ? OR product_code LIKE ? OR description LIKE ?)';
            $search = '%' . $_GET['search'] . '%';
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
        }
        
        // Filter by active status
        if (isset($_GET['is_active'])) {
            $where[] = 'is_active = ?';
            $params[] = $_GET['is_active'] === 'true' ? 1 : 0;
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total count
        $countStmt = $db->prepare("SELECT COUNT(*) FROM equipment_items WHERE {$whereClause}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();
        
        // Get items with supplier info
        $sql = "
            SELECT ei.*, es.name as supplier_name, es.contact_email as supplier_email
            FROM equipment_items ei
            LEFT JOIN equipment_suppliers es ON ei.supplier_id = es.id
            WHERE {$whereClause}
            ORDER BY ei.name ASC
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $items = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        Response::success([
            'items' => $items,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }
    
    /**
     * Get single equipment item
     * GET /api/equipment/{id}
     */
    public static function show(string $id): void
    {
        $user = Auth::require();
        
        $item = Database::queryOne("
            SELECT ei.*, es.name as supplier_name, es.contact_email as supplier_email,
                   es.contact_phone as supplier_phone, es.website as supplier_website
            FROM equipment_items ei
            LEFT JOIN equipment_suppliers es ON ei.supplier_id = es.id
            WHERE ei.id = ?
        ", [$id]);
        
        if (!$item) {
            Response::notFound('Equipment item not found');
        }
        
        // Get specifications
        $item['specifications'] = json_decode($item['specifications'] ?? '{}', true);
        
        Response::success($item);
    }
    
    /**
     * Create equipment item
     * POST /api/equipment
     */
    public static function store(): void
    {
        $user = Auth::requireRole(['system_admin', 'org_admin']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = Validator::make($data)
            ->required('name', 'Name is required')
            ->maxLength('name', 255)
            ->required('category', 'Category is required')
            ->in('category', ['mobility_aid', 'bathroom', 'bedroom', 'kitchen', 'access', 'seating', 'transfer', 'other'])
            ->numeric('unit_price', 'Unit price must be a number')
            ->uuid('supplier_id', 'Invalid supplier ID');
        
        if ($validator->fails()) {
            Response::validationError($validator->errors());
        }
        
        $id = Database::insert('equipment_items', [
            'name' => $data['name'],
            'product_code' => $data['product_code'] ?? null,
            'category' => $data['category'],
            'description' => $data['description'] ?? null,
            'specifications' => json_encode($data['specifications'] ?? []),
            'unit_price' => $data['unit_price'] ?? null,
            'supplier_id' => $data['supplier_id'] ?? null,
            'lead_time_days' => $data['lead_time_days'] ?? null,
            'warranty_months' => $data['warranty_months'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'created_by' => $user['id']
        ]);
        
        Response::success(['id' => $id], 201, 'Equipment item created');
    }
    
    /**
     * Update equipment item
     * PUT /api/equipment/{id}
     */
    public static function update(string $id): void
    {
        $user = Auth::requireRole(['system_admin', 'org_admin']);
        
        $item = Database::queryOne("SELECT id FROM equipment_items WHERE id = ?", [$id]);
        if (!$item) {
            Response::notFound('Equipment item not found');
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $updateData = [];
        $allowedFields = ['name', 'product_code', 'category', 'description', 'unit_price', 
                         'supplier_id', 'lead_time_days', 'warranty_months', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $updateData[$field] = $data[$field];
            }
        }
        
        if (isset($data['specifications'])) {
            $updateData['specifications'] = json_encode($data['specifications']);
        }
        
        if (!empty($updateData)) {
            Database::update('equipment_items', $updateData, 'id = ?', [$id]);
        }
        
        Response::success(null, 200, 'Equipment item updated');
    }
    
    // ========== SUPPLIERS ==========
    
    /**
     * List suppliers
     * GET /api/equipment/suppliers
     */
    public static function listSuppliers(): void
    {
        $user = Auth::require();
        
        $suppliers = Database::query("
            SELECT es.*, 
                   (SELECT COUNT(*) FROM equipment_items WHERE supplier_id = es.id) as item_count
            FROM equipment_suppliers es
            WHERE es.is_active = 1
            ORDER BY es.name ASC
        ");
        
        Response::success($suppliers);
    }
    
    /**
     * Create supplier
     * POST /api/equipment/suppliers
     */
    public static function storeSupplier(): void
    {
        $user = Auth::requireRole(['system_admin', 'org_admin']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = Validator::make($data)
            ->required('name', 'Supplier name is required')
            ->maxLength('name', 255)
            ->email('contact_email', 'Invalid email format');
        
        if ($validator->fails()) {
            Response::validationError($validator->errors());
        }
        
        $id = Database::insert('equipment_suppliers', [
            'name' => $data['name'],
            'contact_name' => $data['contact_name'] ?? null,
            'contact_email' => $data['contact_email'] ?? null,
            'contact_phone' => $data['contact_phone'] ?? null,
            'address' => $data['address'] ?? null,
            'website' => $data['website'] ?? null,
            'abn' => $data['abn'] ?? null,
            'payment_terms' => $data['payment_terms'] ?? null,
            'notes' => $data['notes'] ?? null,
            'is_active' => true,
            'created_by' => $user['id']
        ]);
        
        Response::success(['id' => $id], 201, 'Supplier created');
    }
    
    // ========== QUOTES ==========
    
    /**
     * List quotes for a case
     * GET /api/cases/{caseId}/quotes
     */
    public static function listQuotes(string $caseId): void
    {
        $user = Auth::require();
        
        $quotes = Database::query("
            SELECT eq.*, es.name as supplier_name,
                   u.first_name as requested_by_first, u.last_name as requested_by_last
            FROM equipment_quotes eq
            LEFT JOIN equipment_suppliers es ON eq.supplier_id = es.id
            LEFT JOIN users u ON eq.requested_by = u.id
            WHERE eq.case_id = ?
            ORDER BY eq.created_at DESC
        ", [$caseId]);
        
        // Get quote items for each quote
        foreach ($quotes as &$quote) {
            $quote['items'] = Database::query("
                SELECT eqi.*, ei.name as item_name, ei.product_code
                FROM equipment_quote_items eqi
                LEFT JOIN equipment_items ei ON eqi.equipment_item_id = ei.id
                WHERE eqi.quote_id = ?
            ", [$quote['id']]);
        }
        
        Response::success($quotes);
    }
    
    /**
     * Create quote request
     * POST /api/cases/{caseId}/quotes
     */
    public static function storeQuote(string $caseId): void
    {
        $user = Auth::requireRole(['therapist', 'org_admin', 'system_admin']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = Validator::make($data)
            ->required('supplier_id', 'Supplier is required')
            ->uuid('supplier_id')
            ->required('items', 'At least one item is required');
        
        if ($validator->fails()) {
            Response::validationError($validator->errors());
        }
        
        $db = Database::getConnection();
        $db->beginTransaction();
        
        try {
            // Create quote
            $quoteId = Database::insert('equipment_quotes', [
                'case_id' => $caseId,
                'supplier_id' => $data['supplier_id'],
                'status' => 'draft',
                'notes' => $data['notes'] ?? null,
                'requested_by' => $user['id'],
                'valid_until' => $data['valid_until'] ?? null
            ]);
            
            // Add items
            $totalAmount = 0;
            foreach ($data['items'] as $item) {
                $itemPrice = ($item['unit_price'] ?? 0) * ($item['quantity'] ?? 1);
                $totalAmount += $itemPrice;
                
                Database::insert('equipment_quote_items', [
                    'quote_id' => $quoteId,
                    'equipment_item_id' => $item['equipment_item_id'] ?? null,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'] ?? 1,
                    'unit_price' => $item['unit_price'] ?? null,
                    'total_price' => $itemPrice,
                    'notes' => $item['notes'] ?? null
                ]);
            }
            
            // Update quote total
            Database::update('equipment_quotes', ['total_amount' => $totalAmount], 'id = ?', [$quoteId]);
            
            $db->commit();
            Response::success(['id' => $quoteId], 201, 'Quote created');
            
        } catch (\Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }
    
    /**
     * Update quote status
     * PATCH /api/quotes/{id}/status
     */
    public static function updateQuoteStatus(string $id): void
    {
        $user = Auth::requireRole(['therapist', 'org_admin', 'system_admin']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = Validator::make($data)
            ->required('status', 'Status is required')
            ->in('status', ['draft', 'sent', 'received', 'approved', 'rejected', 'expired']);
        
        if ($validator->fails()) {
            Response::validationError($validator->errors());
        }
        
        $quote = Database::queryOne("SELECT id FROM equipment_quotes WHERE id = ?", [$id]);
        if (!$quote) {
            Response::notFound('Quote not found');
        }
        
        Database::update('equipment_quotes', [
            'status' => $data['status'],
            'status_updated_at' => date('Y-m-d H:i:s'),
            'status_updated_by' => $user['id']
        ], 'id = ?', [$id]);
        
        Response::success(null, 200, 'Quote status updated');
    }
    
    // ========== ORDERS ==========
    
    /**
     * Create order from quote
     * POST /api/quotes/{quoteId}/order
     */
    public static function createOrder(string $quoteId): void
    {
        $user = Auth::requireRole(['org_admin', 'system_admin']);
        
        $quote = Database::queryOne("
            SELECT eq.*, c.client_id
            FROM equipment_quotes eq
            JOIN cases c ON eq.case_id = c.id
            WHERE eq.id = ? AND eq.status = 'approved'
        ", [$quoteId]);
        
        if (!$quote) {
            Response::notFound('Approved quote not found');
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $db = Database::getConnection();
        $db->beginTransaction();
        
        try {
            // Create order
            $orderId = Database::insert('equipment_orders', [
                'quote_id' => $quoteId,
                'case_id' => $quote['case_id'],
                'supplier_id' => $quote['supplier_id'],
                'status' => 'pending',
                'total_amount' => $quote['total_amount'],
                'shipping_address' => $data['shipping_address'] ?? null,
                'notes' => $data['notes'] ?? null,
                'ordered_by' => $user['id']
            ]);
            
            // Copy items from quote
            $quoteItems = Database::query("SELECT * FROM equipment_quote_items WHERE quote_id = ?", [$quoteId]);
            
            foreach ($quoteItems as $item) {
                Database::insert('equipment_order_items', [
                    'order_id' => $orderId,
                    'equipment_item_id' => $item['equipment_item_id'],
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['total_price']
                ]);
            }
            
            // Update quote status
            Database::update('equipment_quotes', ['status' => 'ordered'], 'id = ?', [$quoteId]);
            
            $db->commit();
            Response::success(['id' => $orderId], 201, 'Order created');
            
        } catch (\Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }
    
    /**
     * Update order status
     * PATCH /api/orders/{id}/status
     */
    public static function updateOrderStatus(string $id): void
    {
        $user = Auth::requireRole(['org_admin', 'system_admin']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = Validator::make($data)
            ->required('status', 'Status is required')
            ->in('status', ['pending', 'confirmed', 'shipped', 'delivered', 'installed', 'cancelled']);
        
        if ($validator->fails()) {
            Response::validationError($validator->errors());
        }
        
        $order = Database::queryOne("SELECT id FROM equipment_orders WHERE id = ?", [$id]);
        if (!$order) {
            Response::notFound('Order not found');
        }
        
        $updateData = [
            'status' => $data['status'],
            'status_updated_at' => date('Y-m-d H:i:s'),
            'status_updated_by' => $user['id']
        ];
        
        // Set specific timestamps
        if ($data['status'] === 'shipped') {
            $updateData['shipped_at'] = date('Y-m-d H:i:s');
        } elseif ($data['status'] === 'delivered') {
            $updateData['delivered_at'] = date('Y-m-d H:i:s');
        } elseif ($data['status'] === 'installed') {
            $updateData['installed_at'] = date('Y-m-d H:i:s');
        }
        
        Database::update('equipment_orders', $updateData, 'id = ?', [$id]);
        
        Response::success(null, 200, 'Order status updated');
    }
    
    // ========== TRIALS ==========
    
    /**
     * List equipment trials for a case
     * GET /api/cases/{caseId}/trials
     */
    public static function listTrials(string $caseId): void
    {
        $user = Auth::require();
        
        $trials = Database::query("
            SELECT et.*, ei.name as equipment_name, ei.product_code,
                   u.first_name as conducted_by_first, u.last_name as conducted_by_last
            FROM equipment_trials et
            LEFT JOIN equipment_items ei ON et.equipment_item_id = ei.id
            LEFT JOIN users u ON et.conducted_by = u.id
            WHERE et.case_id = ?
            ORDER BY et.trial_date DESC
        ", [$caseId]);
        
        Response::success($trials);
    }
    
    /**
     * Record equipment trial
     * POST /api/cases/{caseId}/trials
     */
    public static function storeTrial(string $caseId): void
    {
        $user = Auth::requireRole(['therapist', 'org_admin', 'system_admin']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = Validator::make($data)
            ->required('equipment_item_id', 'Equipment item is required')
            ->uuid('equipment_item_id')
            ->required('trial_date', 'Trial date is required')
            ->date('trial_date')
            ->required('outcome', 'Outcome is required')
            ->in('outcome', ['successful', 'partially_successful', 'unsuccessful', 'inconclusive']);
        
        if ($validator->fails()) {
            Response::validationError($validator->errors());
        }
        
        $id = Database::insert('equipment_trials', [
            'case_id' => $caseId,
            'equipment_item_id' => $data['equipment_item_id'],
            'trial_date' => $data['trial_date'],
            'duration_minutes' => $data['duration_minutes'] ?? null,
            'location' => $data['location'] ?? null,
            'outcome' => $data['outcome'],
            'client_feedback' => $data['client_feedback'] ?? null,
            'therapist_notes' => $data['therapist_notes'] ?? null,
            'measurements_taken' => json_encode($data['measurements_taken'] ?? []),
            'photos' => json_encode($data['photos'] ?? []),
            'recommended' => $data['recommended'] ?? null,
            'follow_up_required' => $data['follow_up_required'] ?? false,
            'conducted_by' => $user['id']
        ]);
        
        Response::success(['id' => $id], 201, 'Trial recorded');
    }
}
