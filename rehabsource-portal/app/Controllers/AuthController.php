<?php
/**
 * Authentication Controller
 * Handles login, registration, logout, and password management
 */

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;
use App\Core\Validator;
use App\Core\CSRF;

class AuthController
{
    /**
     * Login endpoint
     * POST /api/auth/login
     */
    public function login(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = Validator::make($input)
            ->required('email')
            ->email('email')
            ->required('password')
            ->minLength('password', 8);
        
        if ($validator->fails()) {
            Response::validationError($validator->firstErrors());
        }
        
        $result = Auth::login($input['email'], $input['password']);
        
        if (!$result) {
            Response::error('Invalid email or password', 401);
        }
        
        // Check if MFA is required
        if ($result['user']['mfa_enabled']) {
            Response::success([
                'requires_mfa' => true,
                'mfa_token' => $this->createMfaToken($result['user']['id'])
            ], 'MFA verification required');
            return;
        }
        
        Response::success($result, 'Login successful');
    }

    /**
     * Register endpoint
     * POST /api/auth/register
     */
    public function register(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = Validator::make($input)
            ->required('email')
            ->email('email')
            ->maxLength('email', 255)
            ->required('password')
            ->password('password')
            ->confirmed('password', 'password_confirmation')
            ->required('first_name')
            ->maxLength('first_name', 100)
            ->required('last_name')
            ->maxLength('last_name', 100)
            ->in('role_type', ['client', 'carer', 'therapist', 'case_manager']);
        
        // Additional validation for therapist
        if (($input['role_type'] ?? '') === 'therapist') {
            $validator
                ->required('profession')
                ->in('profession', ['occupational_therapist', 'physiotherapist', 'speech_pathologist', 'psychologist', 'other']);
        }
        
        // Additional validation for case manager
        if (($input['role_type'] ?? '') === 'case_manager') {
            $validator
                ->required('case_manager_type')
                ->in('case_manager_type', ['case_manager', 'support_coordinator', 'recovery_coach', 'plan_manager', 'lac']);
        }
        
        if ($validator->fails()) {
            Response::validationError($validator->firstErrors());
        }
        
        $result = Auth::register($validator->validated([
            'email', 'password', 'first_name', 'last_name', 'role_type',
            'profession', 'ahpra_number', 'case_manager_type', 'organization',
            'phone', 'suburb', 'state', 'postcode'
        ]));
        
        Response::success($result, 'Registration successful', 201);
    }

    /**
     * Logout endpoint
     * POST /api/auth/logout
     */
    public function logout(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $refreshToken = $input['refresh_token'] ?? null;
        
        Auth::logout($refreshToken);
        
        Response::success(null, 'Logged out successfully');
    }

    /**
     * Refresh token endpoint
     * POST /api/auth/refresh
     */
    public function refresh(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = Validator::make($input)
            ->required('refresh_token');
        
        if ($validator->fails()) {
            Response::validationError($validator->firstErrors());
        }
        
        $userId = Auth::validateRefreshToken($input['refresh_token']);
        
        if (!$userId) {
            Response::error('Invalid or expired refresh token', 401);
        }
        
        // Revoke old token
        Auth::revokeRefreshToken($input['refresh_token']);
        
        // Generate new tokens
        $accessToken = Auth::createAccessToken($userId);
        $refreshToken = Auth::createRefreshToken($userId);
        
        // Get user data
        $user = Database::queryOne(
            "SELECT id, email, is_active, created_at FROM users WHERE id = ?",
            [$userId]
        );
        
        Response::success([
            'user' => $user,
            'roles' => Auth::roles($userId),
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'expires_in' => 3600
        ], 'Token refreshed');
    }

    /**
     * Get current user endpoint
     * GET /api/auth/me
     */
    public function me(): void
    {
        $user = Auth::require();
        $roles = Auth::roles();
        
        // Get profile based on role
        $profile = null;
        
        if (in_array('therapist', $roles)) {
            $profile = Database::queryOne(
                "SELECT * FROM therapist_profiles WHERE user_id = ?",
                [$user['id']]
            );
            $profile['type'] = 'therapist';
        } elseif (in_array('case_manager', $roles)) {
            $profile = Database::queryOne(
                "SELECT * FROM case_manager_profiles WHERE user_id = ?",
                [$user['id']]
            );
            $profile['type'] = 'case_manager';
        } else {
            $profile = Database::queryOne(
                "SELECT * FROM client_profiles WHERE user_id = ?",
                [$user['id']]
            );
            $profile['type'] = 'client';
        }
        
        Response::success([
            'user' => $user,
            'roles' => $roles,
            'profile' => $profile
        ]);
    }

    /**
     * Request password reset
     * POST /api/auth/forgot-password
     */
    public function forgotPassword(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = Validator::make($input)
            ->required('email')
            ->email('email');
        
        if ($validator->fails()) {
            Response::validationError($validator->firstErrors());
        }
        
        Auth::requestPasswordReset($input['email']);
        
        // Always return success to prevent email enumeration
        Response::success(null, 'If the email exists, a reset link has been sent');
    }

    /**
     * Reset password with token
     * POST /api/auth/reset-password
     */
    public function resetPassword(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = Validator::make($input)
            ->required('token')
            ->required('password')
            ->password('password')
            ->confirmed('password', 'password_confirmation');
        
        if ($validator->fails()) {
            Response::validationError($validator->firstErrors());
        }
        
        $success = Auth::resetPassword($input['token'], $input['password']);
        
        if (!$success) {
            Response::error('Invalid or expired reset token', 400);
        }
        
        Response::success(null, 'Password reset successfully');
    }

    /**
     * Change password (authenticated)
     * POST /api/auth/change-password
     */
    public function changePassword(): void
    {
        $user = Auth::require();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $validator = Validator::make($input)
            ->required('current_password')
            ->required('new_password')
            ->password('new_password')
            ->confirmed('new_password', 'new_password_confirmation');
        
        if ($validator->fails()) {
            Response::validationError($validator->firstErrors());
        }
        
        // Verify current password
        $userData = Database::queryOne(
            "SELECT password_hash FROM users WHERE id = ?",
            [$user['id']]
        );
        
        if (!Auth::verifyPassword($input['current_password'], $userData['password_hash'])) {
            Response::error('Current password is incorrect', 400);
        }
        
        // Update password
        Database::execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            [Auth::hashPassword($input['new_password']), $user['id']]
        );
        
        // Revoke all sessions except current
        Auth::revokeAllSessions($user['id']);
        
        Auth::logSecurityEvent('password_changed', $user['id']);
        
        Response::success(null, 'Password changed successfully');
    }

    /**
     * Verify email
     * GET /api/auth/verify-email
     */
    public function verifyEmail(): void
    {
        $token = $_GET['token'] ?? null;
        
        if (!$token) {
            Response::error('Verification token required', 400);
        }
        
        $user = Database::queryOne(
            "SELECT id FROM users WHERE email_verification_token = ? AND email_verified_at IS NULL",
            [$token]
        );
        
        if (!$user) {
            Response::error('Invalid or expired verification token', 400);
        }
        
        Database::execute(
            "UPDATE users SET email_verified_at = NOW(), email_verification_token = NULL WHERE id = ?",
            [$user['id']]
        );
        
        Response::success(null, 'Email verified successfully');
    }

    /**
     * Resend verification email
     * POST /api/auth/resend-verification
     */
    public function resendVerification(): void
    {
        $user = Auth::require();
        
        if ($user['email_verified_at']) {
            Response::error('Email already verified', 400);
        }
        
        $token = bin2hex(random_bytes(32));
        
        Database::execute(
            "UPDATE users SET email_verification_token = ? WHERE id = ?",
            [$token, $user['id']]
        );
        
        // Queue verification email
        Database::insert('outbound_emails', [
            'recipient_email' => $user['email'],
            'subject' => 'Verify Your Email',
            'body_html' => $this->getVerificationEmailHtml($token),
            'body_text' => 'Verify your email: ' . APP_URL . '/verify-email?token=' . $token,
            'priority' => 'high'
        ]);
        
        Response::success(null, 'Verification email sent');
    }

    /**
     * Get CSRF token
     * GET /api/auth/csrf
     */
    public function csrf(): void
    {
        $token = CSRF::generate();
        Response::success(['token' => $token]);
    }

    /**
     * Create MFA token for second step
     */
    private function createMfaToken(string $userId): string
    {
        $token = bin2hex(random_bytes(32));
        
        // Store temporarily (5 minutes expiry)
        Database::insert('sessions', [
            'user_id' => $userId,
            'token_hash' => hash('sha256', 'mfa_' . $token),
            'ip_address' => Auth::getClientIP(),
            'expires_at' => date('Y-m-d H:i:s', time() + 300)
        ]);
        
        return $token;
    }

    /**
     * Get verification email HTML
     */
    private function getVerificationEmailHtml(string $token): string
    {
        $url = APP_URL . "/verify-email?token=" . $token;
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Welcome to Rehab Source</h2>
    <p>Please verify your email address by clicking the button below:</p>
    <p style="text-align: center;">
        <a href="{$url}" style="display: inline-block; padding: 12px 24px; background-color: #00C090; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a>
    </p>
    <p>If you did not create an account, please ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="color: #666; font-size: 12px;">Rehab Source - Australian OT + Physio Portal</p>
</body>
</html>
HTML;
    }
}
