<?php
/**
 * Application Routes
 * 
 * @package RehabSource
 */

use RehabSource\Core\Router;

// Get router instance
$router = $app->getRouter();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

// Health check
$router->get('/health', 'HealthController@check');

// Authentication
$router->group('/auth', function (Router $router) {
    $router->post('/register', 'AuthController@register');
    $router->post('/login', 'AuthController@login');
    $router->post('/logout', 'AuthController@logout');
    $router->post('/refresh', 'AuthController@refresh');
    $router->post('/forgot-password', 'AuthController@forgotPassword');
    $router->post('/reset-password', 'AuthController@resetPassword');
    $router->post('/verify-email', 'AuthController@verifyEmail');
    $router->post('/resend-verification', 'AuthController@resendVerification');
    $router->post('/verify-totp', 'AuthController@verifyTotp');
});

// Public share pack access
$router->get('/share/{token}', 'SharePackController@view');
$router->post('/share/{token}/verify', 'SharePackController@verifyPassword');

// PWA manifest and service worker
$router->get('/manifest.json', 'PwaController@manifest');
$router->get('/sw.js', 'PwaController@serviceWorker');

// ============================================================================
// API ROUTES (Authentication required)
// ============================================================================

$router->group('/api/v1', function (Router $router) {
    
    // Current user
    $router->get('/me', 'UserController@me');
    $router->put('/me', 'UserController@updateMe');
    $router->post('/me/avatar', 'UserController@uploadAvatar');
    $router->post('/me/change-password', 'UserController@changePassword');
    $router->post('/me/enable-totp', 'UserController@enableTotp');
    $router->post('/me/disable-totp', 'UserController@disableTotp');
    
    // Profiles
    $router->group('/profiles', function (Router $router) {
        $router->get('/client', 'ClientProfileController@show');
        $router->put('/client', 'ClientProfileController@update');
        $router->get('/therapist', 'TherapistProfileController@show');
        $router->put('/therapist', 'TherapistProfileController@update');
        $router->get('/case-manager', 'CaseManagerProfileController@show');
        $router->put('/case-manager', 'CaseManagerProfileController@update');
    });
    
    // Therapist search/matching
    $router->get('/therapists/search', 'TherapistSearchController@search');
    $router->get('/therapists/{id}', 'TherapistSearchController@show');
    
    // Clients
    $router->group('/clients', function (Router $router) {
        $router->get('/', 'ClientController@index');
        $router->post('/', 'ClientController@store');
        $router->get('/{id}', 'ClientController@show');
        $router->put('/{id}', 'ClientController@update');
        $router->delete('/{id}', 'ClientController@destroy');
    });
    
    // Cases
    $router->group('/cases', function (Router $router) {
        $router->get('/', 'CaseController@index');
        $router->post('/', 'CaseController@store');
        $router->get('/{id}', 'CaseController@show');
        $router->put('/{id}', 'CaseController@update');
        $router->delete('/{id}', 'CaseController@destroy');
        $router->post('/{id}/members', 'CaseController@addMember');
        $router->delete('/{id}/members/{userId}', 'CaseController@removeMember');
    });
    
    // Visits
    $router->group('/visits', function (Router $router) {
        $router->get('/', 'VisitController@index');
        $router->post('/', 'VisitController@store');
        $router->get('/{id}', 'VisitController@show');
        $router->put('/{id}', 'VisitController@update');
        $router->delete('/{id}', 'VisitController@destroy');
        $router->post('/{id}/start', 'VisitController@start');
        $router->post('/{id}/complete', 'VisitController@complete');
        $router->post('/{id}/cancel', 'VisitController@cancel');
    });
    
    // Notes
    $router->group('/notes', function (Router $router) {
        $router->get('/', 'NoteController@index');
        $router->post('/', 'NoteController@store');
        $router->get('/{id}', 'NoteController@show');
        $router->put('/{id}', 'NoteController@update');
        $router->delete('/{id}', 'NoteController@destroy');
    });
    
    // Tasks
    $router->group('/tasks', function (Router $router) {
        $router->get('/', 'TaskController@index');
        $router->post('/', 'TaskController@store');
        $router->get('/{id}', 'TaskController@show');
        $router->put('/{id}', 'TaskController@update');
        $router->delete('/{id}', 'TaskController@destroy');
        $router->post('/{id}/complete', 'TaskController@complete');
    });
    
    // Consents
    $router->group('/consents', function (Router $router) {
        $router->get('/', 'ConsentController@index');
        $router->post('/', 'ConsentController@store');
        $router->get('/{id}', 'ConsentController@show');
        $router->post('/{id}/grant', 'ConsentController@grant');
        $router->post('/{id}/revoke', 'ConsentController@revoke');
    });
    
    // Assessments (Wizard)
    $router->group('/assessments', function (Router $router) {
        // Templates
        $router->get('/templates', 'AssessmentTemplateController@index');
        $router->get('/templates/{id}', 'AssessmentTemplateController@show');
        
        // Runs
        $router->get('/runs', 'AssessmentRunController@index');
        $router->post('/runs', 'AssessmentRunController@store');
        $router->get('/runs/{id}', 'AssessmentRunController@show');
        $router->put('/runs/{id}', 'AssessmentRunController@update');
        $router->post('/runs/{id}/submit', 'AssessmentRunController@submit');
        $router->delete('/runs/{id}', 'AssessmentRunController@destroy');
        
        // Answers
        $router->post('/runs/{id}/answers', 'AssessmentAnswerController@save');
        $router->get('/runs/{id}/answers', 'AssessmentAnswerController@index');
        
        // Offline sync
        $router->post('/runs/{id}/sync', 'AssessmentSyncController@sync');
    });
    
    // Reports
    $router->group('/reports', function (Router $router) {
        $router->get('/', 'ReportController@index');
        $router->post('/', 'ReportController@store');
        $router->get('/{id}', 'ReportController@show');
        $router->put('/{id}', 'ReportController@update');
        $router->delete('/{id}', 'ReportController@destroy');
        $router->post('/{id}/approve', 'ReportController@approve');
        $router->post('/{id}/versions', 'ReportController@createVersion');
        $router->get('/{id}/versions', 'ReportController@listVersions');
        $router->get('/{id}/pdf', 'ReportController@generatePdf');
    });
    
    // Share Packs
    $router->group('/share-packs', function (Router $router) {
        $router->get('/', 'SharePackController@index');
        $router->post('/', 'SharePackController@store');
        $router->get('/{id}', 'SharePackController@show');
        $router->post('/{id}/send', 'SharePackController@send');
        $router->post('/{id}/revoke', 'SharePackController@revoke');
    });
    
    // Equipment
    $router->group('/equipment', function (Router $router) {
        $router->get('/', 'EquipmentController@index');
        $router->post('/', 'EquipmentController@store');
        $router->get('/{id}', 'EquipmentController@show');
        $router->put('/{id}', 'EquipmentController@update');
        $router->delete('/{id}', 'EquipmentController@destroy');
    });
    
    // Suppliers
    $router->group('/suppliers', function (Router $router) {
        $router->get('/', 'SupplierController@index');
        $router->post('/', 'SupplierController@store');
        $router->get('/{id}', 'SupplierController@show');
        $router->put('/{id}', 'SupplierController@update');
        $router->delete('/{id}', 'SupplierController@destroy');
    });
    
    // Quotes
    $router->group('/quotes', function (Router $router) {
        $router->get('/', 'QuoteController@index');
        $router->post('/', 'QuoteController@store');
        $router->get('/{id}', 'QuoteController@show');
        $router->put('/{id}', 'QuoteController@update');
        $router->post('/{id}/approve', 'QuoteController@approve');
        $router->post('/{id}/reject', 'QuoteController@reject');
    });
    
    // Orders
    $router->group('/orders', function (Router $router) {
        $router->get('/', 'OrderController@index');
        $router->post('/', 'OrderController@store');
        $router->get('/{id}', 'OrderController@show');
        $router->put('/{id}', 'OrderController@update');
        $router->post('/{id}/confirm', 'OrderController@confirm');
        $router->post('/{id}/ship', 'OrderController@ship');
        $router->post('/{id}/deliver', 'OrderController@deliver');
        $router->post('/{id}/cancel', 'OrderController@cancel');
    });
    
    // Trials
    $router->group('/trials', function (Router $router) {
        $router->get('/', 'TrialController@index');
        $router->post('/', 'TrialController@store');
        $router->get('/{id}', 'TrialController@show');
        $router->put('/{id}', 'TrialController@update');
        $router->post('/{id}/complete', 'TrialController@complete');
    });
    
    // Reviews
    $router->group('/reviews', function (Router $router) {
        $router->get('/', 'ReviewController@index');
        $router->post('/', 'ReviewController@store');
        $router->get('/{id}', 'ReviewController@show');
        $router->post('/{id}/flag', 'ReviewController@flag');
    });
    
    // Messaging
    $router->group('/conversations', function (Router $router) {
        $router->get('/', 'ConversationController@index');
        $router->post('/', 'ConversationController@store');
        $router->get('/{id}', 'ConversationController@show');
        $router->get('/{id}/messages', 'MessageController@index');
        $router->post('/{id}/messages', 'MessageController@store');
        $router->post('/{id}/read', 'ConversationController@markAsRead');
    });
    
    // Media/Files
    $router->group('/media', function (Router $router) {
        $router->post('/upload', 'MediaController@upload');
        $router->get('/{id}', 'MediaController@show');
        $router->get('/{id}/download', 'MediaController@download');
        $router->delete('/{id}', 'MediaController@destroy');
        $router->post('/{id}/annotations', 'AnnotationController@store');
        $router->post('/{id}/calibrate', 'CalibrationController@store');
    });
    
    // Credentials
    $router->group('/credentials', function (Router $router) {
        $router->get('/', 'CredentialController@index');
        $router->post('/', 'CredentialController@store');
        $router->get('/{id}', 'CredentialController@show');
        $router->put('/{id}', 'CredentialController@update');
        $router->delete('/{id}', 'CredentialController@destroy');
    });
    
    // Knowledge base
    $router->group('/knowledge', function (Router $router) {
        $router->get('/', 'KnowledgeController@index');
        $router->get('/{id}', 'KnowledgeController@show');
    });
    
});

// ============================================================================
// ADMIN ROUTES (Admin role required)
// ============================================================================

$router->group('/api/v1/admin', function (Router $router) {
    
    // Dashboard
    $router->get('/dashboard', 'Admin\\DashboardController@index');
    
    // Users
    $router->group('/users', function (Router $router) {
        $router->get('/', 'Admin\\UserController@index');
        $router->post('/', 'Admin\\UserController@store');
        $router->get('/{id}', 'Admin\\UserController@show');
        $router->put('/{id}', 'Admin\\UserController@update');
        $router->delete('/{id}', 'Admin\\UserController@destroy');
        $router->post('/{id}/roles', 'Admin\\UserController@assignRole');
        $router->delete('/{id}/roles/{roleId}', 'Admin\\UserController@revokeRole');
        $router->post('/{id}/suspend', 'Admin\\UserController@suspend');
        $router->post('/{id}/activate', 'Admin\\UserController@activate');
    });
    
    // Organisations
    $router->group('/orgs', function (Router $router) {
        $router->get('/', 'Admin\\OrgController@index');
        $router->post('/', 'Admin\\OrgController@store');
        $router->get('/{id}', 'Admin\\OrgController@show');
        $router->put('/{id}', 'Admin\\OrgController@update');
        $router->delete('/{id}', 'Admin\\OrgController@destroy');
    });
    
    // Verification requests
    $router->group('/verifications', function (Router $router) {
        $router->get('/', 'Admin\\VerificationController@index');
        $router->get('/{id}', 'Admin\\VerificationController@show');
        $router->post('/{id}/approve', 'Admin\\VerificationController@approve');
        $router->post('/{id}/reject', 'Admin\\VerificationController@reject');
    });
    
    // Assessment templates
    $router->group('/templates', function (Router $router) {
        $router->get('/', 'Admin\\TemplateController@index');
        $router->post('/', 'Admin\\TemplateController@store');
        $router->get('/{id}', 'Admin\\TemplateController@show');
        $router->put('/{id}', 'Admin\\TemplateController@update');
        $router->delete('/{id}', 'Admin\\TemplateController@destroy');
        $router->post('/{id}/duplicate', 'Admin\\TemplateController@duplicate');
    });
    
    // Moderation
    $router->group('/moderation', function (Router $router) {
        $router->get('/reviews', 'Admin\\ModerationController@reviews');
        $router->get('/flags', 'Admin\\ModerationController@flags');
        $router->post('/reviews/{id}/hide', 'Admin\\ModerationController@hideReview');
        $router->post('/reviews/{id}/restore', 'Admin\\ModerationController@restoreReview');
        $router->post('/flags/{id}/dismiss', 'Admin\\ModerationController@dismissFlag');
        $router->post('/flags/{id}/uphold', 'Admin\\ModerationController@upholdFlag');
    });
    
    // Knowledge base management
    $router->group('/knowledge', function (Router $router) {
        $router->get('/', 'Admin\\KnowledgeController@index');
        $router->post('/', 'Admin\\KnowledgeController@store');
        $router->get('/{id}', 'Admin\\KnowledgeController@show');
        $router->put('/{id}', 'Admin\\KnowledgeController@update');
        $router->delete('/{id}', 'Admin\\KnowledgeController@destroy');
        $router->post('/{id}/check', 'Admin\\KnowledgeController@checkForChanges');
        $router->get('/changes', 'Admin\\KnowledgeController@pendingChanges');
        $router->post('/changes/{id}/approve', 'Admin\\KnowledgeController@approveChange');
        $router->post('/changes/{id}/reject', 'Admin\\KnowledgeController@rejectChange');
    });
    
    // Settings
    $router->group('/settings', function (Router $router) {
        $router->get('/', 'Admin\\SettingsController@index');
        $router->put('/', 'Admin\\SettingsController@update');
    });
    
    // Audit logs
    $router->get('/audit-logs', 'Admin\\AuditController@index');
    $router->get('/security-events', 'Admin\\AuditController@securityEvents');
    
    // Reports
    $router->group('/reports', function (Router $router) {
        $router->get('/usage', 'Admin\\ReportController@usage');
        $router->get('/activity', 'Admin\\ReportController@activity');
        $router->get('/assessments', 'Admin\\ReportController@assessments');
    });
    
})->middleware('admin');

// ============================================================================
// FRONTEND ROUTES (SPA catch-all)
// ============================================================================

// Serve the SPA for all other routes
$router->get('/{path:.*}', 'SpaController@index');
