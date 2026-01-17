-- ============================================================================
-- REHAB SOURCE PORTAL - COMPLETE DATABASE SCHEMA
-- Version: 1.0.0
-- MySQL 8.0+
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- ============================================================================
-- CORE IDENTITY & ACCESS
-- ============================================================================

-- Users table (core identity)
CREATE TABLE IF NOT EXISTS `users` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `email_verified_at` TIMESTAMP NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `totp_secret` VARCHAR(64) NULL,
    `totp_enabled` TINYINT(1) NOT NULL DEFAULT 0,
    `status` ENUM('pending', 'active', 'suspended', 'deactivated') NOT NULL DEFAULT 'pending',
    `last_login_at` TIMESTAMP NULL,
    `last_login_ip` VARCHAR(45) NULL,
    `failed_login_attempts` INT NOT NULL DEFAULT 0,
    `locked_until` TIMESTAMP NULL,
    `password_changed_at` TIMESTAMP NULL,
    `must_change_password` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Roles table
CREATE TABLE IF NOT EXISTS `roles` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `display_name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `is_system` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User roles (many-to-many)
CREATE TABLE IF NOT EXISTS `user_roles` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `user_id` CHAR(36) NOT NULL,
    `role_id` CHAR(36) NOT NULL,
    `granted_by` CHAR(36) NULL,
    `granted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` TIMESTAMP NULL,
    UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`granted_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_user_roles_user` (`user_id`),
    INDEX `idx_user_roles_role` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions table
CREATE TABLE IF NOT EXISTS `permissions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `display_name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `module` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_permissions_name` (`name`),
    INDEX `idx_permissions_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role permissions (many-to-many)
CREATE TABLE IF NOT EXISTS `role_permissions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `role_id` CHAR(36) NOT NULL,
    `permission_id` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`),
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table
CREATE TABLE IF NOT EXISTS `sessions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `user_id` CHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `refresh_token_hash` VARCHAR(255) NULL,
    `ip_address` VARCHAR(45) NOT NULL,
    `user_agent` TEXT NULL,
    `device_fingerprint` VARCHAR(255) NULL,
    `last_activity` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` TIMESTAMP NOT NULL,
    `revoked` TINYINT(1) NOT NULL DEFAULT 0,
    `revoked_at` TIMESTAMP NULL,
    `revoked_reason` VARCHAR(100) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_sessions_user` (`user_id`),
    INDEX `idx_sessions_token` (`token_hash`),
    INDEX `idx_sessions_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ORGANIZATIONS (MULTI-CLINIC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `orgs` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `abn` VARCHAR(11) NULL,
    `logo_path` VARCHAR(500) NULL,
    `primary_color` VARCHAR(7) NULL DEFAULT '#00C090',
    `address_line1` VARCHAR(255) NULL,
    `address_line2` VARCHAR(255) NULL,
    `suburb` VARCHAR(100) NULL,
    `state` VARCHAR(50) NULL,
    `postcode` VARCHAR(10) NULL,
    `country` VARCHAR(50) NOT NULL DEFAULT 'Australia',
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(255) NULL,
    `website` VARCHAR(255) NULL,
    `status` ENUM('active', 'suspended', 'deactivated') NOT NULL DEFAULT 'active',
    `subscription_tier` ENUM('free', 'starter', 'professional', 'enterprise') NOT NULL DEFAULT 'free',
    `subscription_expires_at` TIMESTAMP NULL,
    `settings` JSON NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_orgs_slug` (`slug`),
    INDEX `idx_orgs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `org_memberships` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `org_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `role` ENUM('member', 'manager', 'owner') NOT NULL DEFAULT 'member',
    `department` VARCHAR(100) NULL,
    `job_title` VARCHAR(100) NULL,
    `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
    `joined_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `invited_by` CHAR(36) NULL,
    `status` ENUM('pending', 'active', 'suspended') NOT NULL DEFAULT 'pending',
    UNIQUE KEY `uk_org_user` (`org_id`, `user_id`),
    FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_org_memberships_user` (`user_id`),
    INDEX `idx_org_memberships_org` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `org_settings` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `org_id` CHAR(36) NOT NULL,
    `setting_key` VARCHAR(100) NOT NULL,
    `setting_value` JSON NULL,
    `updated_by` CHAR(36) NULL,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_org_setting` (`org_id`, `setting_key`),
    FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PROFILES
-- ============================================================================

-- Client profiles
CREATE TABLE IF NOT EXISTS `client_profiles` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `user_id` CHAR(36) NOT NULL UNIQUE,
    `system_id` VARCHAR(20) NOT NULL UNIQUE,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `preferred_name` VARCHAR(100) NULL,
    `date_of_birth` DATE NULL,
    `gender` ENUM('male', 'female', 'non_binary', 'prefer_not_to_say', 'other') NULL,
    `gender_other` VARCHAR(50) NULL,
    `phone_mobile` VARCHAR(20) NULL,
    `phone_home` VARCHAR(20) NULL,
    `address_line1` VARCHAR(255) NULL,
    `address_line2` VARCHAR(255) NULL,
    `suburb` VARCHAR(100) NULL,
    `state` VARCHAR(50) NULL,
    `postcode` VARCHAR(10) NULL,
    `country` VARCHAR(50) NOT NULL DEFAULT 'Australia',
    `ndis_number` VARCHAR(20) NULL,
    `ndis_plan_start` DATE NULL,
    `ndis_plan_end` DATE NULL,
    `medicare_number` VARCHAR(20) NULL,
    `dva_number` VARCHAR(20) NULL,
    `funding_type` ENUM('ndis_self', 'ndis_plan', 'ndis_agency', 'dva', 'private', 'tac', 'workcover', 'other') NULL,
    `funding_notes` TEXT NULL,
    `primary_diagnosis` TEXT NULL,
    `secondary_diagnoses` JSON NULL,
    `primary_mobility_aid` ENUM('independent', 'walking_stick', 'walking_frame', 'rollator', 'manual_wheelchair', 'power_wheelchair', 'scooter', 'other') NULL,
    `emergency_contact_name` VARCHAR(200) NULL,
    `emergency_contact_phone` VARCHAR(20) NULL,
    `emergency_contact_relationship` VARCHAR(50) NULL,
    `languages_spoken` JSON NULL,
    `interpreter_required` TINYINT(1) NOT NULL DEFAULT 0,
    `cultural_considerations` TEXT NULL,
    `avatar_path` VARCHAR(500) NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_client_system_id` (`system_id`),
    INDEX `idx_client_name` (`last_name`, `first_name`),
    INDEX `idx_client_postcode` (`postcode`),
    INDEX `idx_client_ndis` (`ndis_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Therapist profiles
CREATE TABLE IF NOT EXISTS `therapist_profiles` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `user_id` CHAR(36) NOT NULL UNIQUE,
    `org_id` CHAR(36) NULL,
    `system_id` VARCHAR(20) NOT NULL UNIQUE,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `profession` ENUM('ot', 'physio', 'speech', 'psychology', 'nursing', 'other') NOT NULL,
    `profession_other` VARCHAR(100) NULL,
    `ahpra_number` VARCHAR(20) NULL,
    `ahpra_verified` TINYINT(1) NOT NULL DEFAULT 0,
    `ahpra_verified_at` TIMESTAMP NULL,
    `qualifications` JSON NULL,
    `years_experience` INT NULL,
    `bio` TEXT NULL,
    `specialisations` JSON NULL,
    `phone_mobile` VARCHAR(20) NULL,
    `phone_office` VARCHAR(20) NULL,
    `address_line1` VARCHAR(255) NULL,
    `address_line2` VARCHAR(255) NULL,
    `suburb` VARCHAR(100) NULL,
    `state` VARCHAR(50) NULL,
    `postcode` VARCHAR(10) NULL,
    `country` VARCHAR(50) NOT NULL DEFAULT 'Australia',
    `service_area_type` ENUM('postcode', 'radius', 'state', 'national') NOT NULL DEFAULT 'postcode',
    `service_area_postcodes` JSON NULL,
    `service_radius_km` INT NULL DEFAULT 50,
    `service_latitude` DECIMAL(10, 8) NULL,
    `service_longitude` DECIMAL(11, 8) NULL,
    `telehealth_available` TINYINT(1) NOT NULL DEFAULT 0,
    `home_visits_available` TINYINT(1) NOT NULL DEFAULT 1,
    `clinic_visits_available` TINYINT(1) NOT NULL DEFAULT 0,
    `availability_status` ENUM('available', 'limited', 'unavailable') NOT NULL DEFAULT 'available',
    `availability_notes` TEXT NULL,
    `funding_types_accepted` JSON NULL,
    `languages_spoken` JSON NULL,
    `hourly_rate` DECIMAL(10, 2) NULL,
    `travel_rate_per_km` DECIMAL(10, 2) NULL,
    `disabilities_supported` JSON NULL,
    `equipment_experience` JSON NULL,
    `avatar_path` VARCHAR(500) NULL,
    `verified` TINYINT(1) NOT NULL DEFAULT 0,
    `verified_at` TIMESTAMP NULL,
    `verified_by` CHAR(36) NULL,
    `rating_average` DECIMAL(3, 2) NULL DEFAULT 0.00,
    `rating_count` INT NOT NULL DEFAULT 0,
    `profile_completeness` INT NOT NULL DEFAULT 0,
    `accepting_new_clients` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_therapist_system_id` (`system_id`),
    INDEX `idx_therapist_profession` (`profession`),
    INDEX `idx_therapist_postcode` (`postcode`),
    INDEX `idx_therapist_availability` (`availability_status`),
    INDEX `idx_therapist_verified` (`verified`),
    INDEX `idx_therapist_rating` (`rating_average`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Case Manager profiles
CREATE TABLE IF NOT EXISTS `case_manager_profiles` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `user_id` CHAR(36) NOT NULL UNIQUE,
    `org_id` CHAR(36) NULL,
    `system_id` VARCHAR(20) NOT NULL UNIQUE,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `role_type` ENUM('support_coordinator', 'plan_manager', 'recovery_coach', 'case_manager', 'lac', 'other') NOT NULL,
    `role_type_other` VARCHAR(100) NULL,
    `phone_mobile` VARCHAR(20) NULL,
    `phone_office` VARCHAR(20) NULL,
    `organisation_name` VARCHAR(255) NULL,
    `address_line1` VARCHAR(255) NULL,
    `address_line2` VARCHAR(255) NULL,
    `suburb` VARCHAR(100) NULL,
    `state` VARCHAR(50) NULL,
    `postcode` VARCHAR(10) NULL,
    `country` VARCHAR(50) NOT NULL DEFAULT 'Australia',
    `service_regions` JSON NULL,
    `max_caseload` INT NULL DEFAULT 50,
    `current_caseload` INT NOT NULL DEFAULT 0,
    `avatar_path` VARCHAR(500) NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE SET NULL,
    INDEX `idx_cm_system_id` (`system_id`),
    INDEX `idx_cm_role_type` (`role_type`),
    INDEX `idx_cm_postcode` (`postcode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Funder profiles (view-only access)
CREATE TABLE IF NOT EXISTS `funder_profiles` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `user_id` CHAR(36) NOT NULL UNIQUE,
    `org_id` CHAR(36) NULL,
    `system_id` VARCHAR(20) NOT NULL UNIQUE,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `funder_type` ENUM('ndis', 'dva', 'private_insurer', 'tac', 'workcover', 'other') NOT NULL,
    `organisation_name` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE SET NULL,
    INDEX `idx_funder_system_id` (`system_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CREDENTIALS & VERIFICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS `credentials` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `user_id` CHAR(36) NOT NULL,
    `credential_type` ENUM('ahpra', 'ndis_worker_screening', 'police_check', 'working_with_children', 'first_aid', 'degree', 'certification', 'insurance', 'other') NOT NULL,
    `credential_name` VARCHAR(255) NOT NULL,
    `issuing_body` VARCHAR(255) NULL,
    `credential_number` VARCHAR(100) NULL,
    `issue_date` DATE NULL,
    `expiry_date` DATE NULL,
    `document_path` VARCHAR(500) NULL,
    `verification_status` ENUM('pending', 'verified', 'rejected', 'expired') NOT NULL DEFAULT 'pending',
    `verified_by` CHAR(36) NULL,
    `verified_at` TIMESTAMP NULL,
    `rejection_reason` TEXT NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_credentials_user` (`user_id`),
    INDEX `idx_credentials_type` (`credential_type`),
    INDEX `idx_credentials_status` (`verification_status`),
    INDEX `idx_credentials_expiry` (`expiry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `verification_requests` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `user_id` CHAR(36) NOT NULL,
    `request_type` ENUM('identity', 'credential', 'organisation', 'other') NOT NULL,
    `status` ENUM('pending', 'in_review', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `documents` JSON NULL,
    `notes` TEXT NULL,
    `reviewed_by` CHAR(36) NULL,
    `reviewed_at` TIMESTAMP NULL,
    `review_notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_verification_user` (`user_id`),
    INDEX `idx_verification_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CASES & CASE MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS `cases` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `case_number` VARCHAR(20) NOT NULL UNIQUE,
    `client_id` CHAR(36) NOT NULL,
    `primary_therapist_id` CHAR(36) NULL,
    `org_id` CHAR(36) NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `case_type` ENUM('assessment', 'treatment', 'equipment', 'home_mod', 'review', 'other') NOT NULL,
    `status` ENUM('draft', 'open', 'in_progress', 'on_hold', 'completed', 'closed', 'cancelled') NOT NULL DEFAULT 'draft',
    `priority` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
    `funding_type` ENUM('ndis_self', 'ndis_plan', 'ndis_agency', 'dva', 'private', 'tac', 'workcover', 'other') NULL,
    `funding_reference` VARCHAR(100) NULL,
    `budget_approved` DECIMAL(12, 2) NULL,
    `budget_used` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `start_date` DATE NULL,
    `due_date` DATE NULL,
    `completed_at` TIMESTAMP NULL,
    `closed_at` TIMESTAMP NULL,
    `closed_reason` VARCHAR(255) NULL,
    `created_by` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`client_id`) REFERENCES `client_profiles`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`primary_therapist_id`) REFERENCES `therapist_profiles`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_cases_number` (`case_number`),
    INDEX `idx_cases_client` (`client_id`),
    INDEX `idx_cases_therapist` (`primary_therapist_id`),
    INDEX `idx_cases_status` (`status`),
    INDEX `idx_cases_type` (`case_type`),
    INDEX `idx_cases_due` (`due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `case_members` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `case_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `role` ENUM('client', 'therapist', 'case_manager', 'funder', 'carer', 'other') NOT NULL,
    `permissions` JSON NULL,
    `added_by` CHAR(36) NULL,
    `added_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `removed_at` TIMESTAMP NULL,
    `removed_by` CHAR(36) NULL,
    UNIQUE KEY `uk_case_member` (`case_id`, `user_id`),
    FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`removed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_case_members_case` (`case_id`),
    INDEX `idx_case_members_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CONSENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `consents` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `client_id` CHAR(36) NOT NULL,
    `case_id` CHAR(36) NULL,
    `consent_type` ENUM('data_collection', 'data_sharing', 'report_sharing', 'photo_consent', 'telehealth', 'marketing', 'third_party_access', 'other') NOT NULL,
    `granted_to_user_id` CHAR(36) NULL,
    `granted_to_org_id` CHAR(36) NULL,
    `purpose` TEXT NOT NULL,
    `scope` TEXT NULL,
    `status` ENUM('pending', 'granted', 'declined', 'revoked', 'expired') NOT NULL DEFAULT 'pending',
    `granted_at` TIMESTAMP NULL,
    `expires_at` TIMESTAMP NULL,
    `revoked_at` TIMESTAMP NULL,
    `revoked_reason` TEXT NULL,
    `signature_path` VARCHAR(500) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `document_version` VARCHAR(20) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`client_id`) REFERENCES `client_profiles`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`granted_to_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`granted_to_org_id`) REFERENCES `orgs`(`id`) ON DELETE CASCADE,
    INDEX `idx_consents_client` (`client_id`),
    INDEX `idx_consents_case` (`case_id`),
    INDEX `idx_consents_status` (`status`),
    INDEX `idx_consents_type` (`consent_type`),
    INDEX `idx_consents_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VISITS & NOTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS `visits` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `case_id` CHAR(36) NOT NULL,
    `therapist_id` CHAR(36) NOT NULL,
    `visit_type` ENUM('initial_assessment', 'follow_up', 'home_visit', 'clinic', 'telehealth', 'phone', 'report_writing', 'other') NOT NULL,
    `status` ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'scheduled',
    `scheduled_start` TIMESTAMP NOT NULL,
    `scheduled_end` TIMESTAMP NULL,
    `actual_start` TIMESTAMP NULL,
    `actual_end` TIMESTAMP NULL,
    `location_type` ENUM('home', 'clinic', 'telehealth', 'other') NOT NULL DEFAULT 'home',
    `location_address` TEXT NULL,
    `location_notes` TEXT NULL,
    `travel_time_minutes` INT NULL,
    `travel_distance_km` DECIMAL(10, 2) NULL,
    `cancellation_reason` TEXT NULL,
    `cancelled_by` CHAR(36) NULL,
    `cancelled_at` TIMESTAMP NULL,
    `billable` TINYINT(1) NOT NULL DEFAULT 1,
    `billing_code` VARCHAR(50) NULL,
    `billing_amount` DECIMAL(10, 2) NULL,
    `notes` TEXT NULL,
    `created_by` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`therapist_id`) REFERENCES `therapist_profiles`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`cancelled_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_visits_case` (`case_id`),
    INDEX `idx_visits_therapist` (`therapist_id`),
    INDEX `idx_visits_scheduled` (`scheduled_start`),
    INDEX `idx_visits_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notes` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `case_id` CHAR(36) NOT NULL,
    `visit_id` CHAR(36) NULL,
    `author_id` CHAR(36) NOT NULL,
    `note_type` ENUM('clinical', 'progress', 'soap', 'phone', 'email', 'internal', 'other') NOT NULL DEFAULT 'progress',
    `title` VARCHAR(255) NULL,
    `content` TEXT NOT NULL,
    `content_encrypted` TINYINT(1) NOT NULL DEFAULT 0,
    `subjective` TEXT NULL,
    `objective` TEXT NULL,
    `assessment` TEXT NULL,
    `plan` TEXT NULL,
    `visibility` ENUM('private', 'case_team', 'client_visible') NOT NULL DEFAULT 'case_team',
    `is_significant` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_notes_case` (`case_id`),
    INDEX `idx_notes_visit` (`visit_id`),
    INDEX `idx_notes_author` (`author_id`),
    INDEX `idx_notes_type` (`note_type`),
    INDEX `idx_notes_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tasks` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `case_id` CHAR(36) NULL,
    `assigned_to` CHAR(36) NULL,
    `created_by` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `priority` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
    `status` ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    `due_date` DATE NULL,
    `due_time` TIME NULL,
    `completed_at` TIMESTAMP NULL,
    `completed_by` CHAR(36) NULL,
    `reminder_at` TIMESTAMP NULL,
    `reminder_sent` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`completed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_tasks_case` (`case_id`),
    INDEX `idx_tasks_assigned` (`assigned_to`),
    INDEX `idx_tasks_status` (`status`),
    INDEX `idx_tasks_due` (`due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- WIZARD ASSESSMENT ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS `wizard_templates` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `org_id` CHAR(36) NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `category` ENUM('intake', 'ot_functional', 'falls_risk', 'home_mods', 'mobility', 'physio_msk', 'progress_note', 'discharge', 'letter', 'ndis', 'custom') NOT NULL,
    `version` VARCHAR(20) NOT NULL DEFAULT '1.0',
    `is_system` TINYINT(1) NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `estimated_duration_minutes` INT NULL,
    `requires_consent` TINYINT(1) NOT NULL DEFAULT 1,
    `allows_offline` TINYINT(1) NOT NULL DEFAULT 1,
    `settings` JSON NULL,
    `created_by` CHAR(36) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_template_slug_org` (`slug`, `org_id`),
    FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_templates_category` (`category`),
    INDEX `idx_templates_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wizard_steps` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `template_id` CHAR(36) NOT NULL,
    `step_number` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(50) NULL,
    `is_required` TINYINT(1) NOT NULL DEFAULT 1,
    `is_repeatable` TINYINT(1) NOT NULL DEFAULT 0,
    `settings` JSON NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_step_order` (`template_id`, `step_number`),
    FOREIGN KEY (`template_id`) REFERENCES `wizard_templates`(`id`) ON DELETE CASCADE,
    INDEX `idx_steps_template` (`template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wizard_questions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `step_id` CHAR(36) NOT NULL,
    `question_order` INT NOT NULL,
    `field_name` VARCHAR(100) NOT NULL,
    `question_text` TEXT NOT NULL,
    `help_text` TEXT NULL,
    `question_type` ENUM('text', 'textarea', 'number', 'decimal', 'select', 'multiselect', 'radio', 'checkbox', 'date', 'time', 'datetime', 'file', 'photo', 'signature', 'measurement', 'scale', 'matrix', 'section_header', 'info_text') NOT NULL,
    `options` JSON NULL,
    `validation_rules` JSON NULL,
    `default_value` TEXT NULL,
    `placeholder` VARCHAR(255) NULL,
    `is_required` TINYINT(1) NOT NULL DEFAULT 0,
    `is_sensitive` TINYINT(1) NOT NULL DEFAULT 0,
    `show_in_summary` TINYINT(1) NOT NULL DEFAULT 0,
    `conditional_logic` JSON NULL,
    `settings` JSON NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`step_id`) REFERENCES `wizard_steps`(`id`) ON DELETE CASCADE,
    INDEX `idx_questions_step` (`step_id`),
    INDEX `idx_questions_field` (`field_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wizard_logic` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `template_id` CHAR(36) NOT NULL,
    `source_question_id` CHAR(36) NULL,
    `logic_type` ENUM('show_hide', 'skip_step', 'validate', 'calculate', 'set_value') NOT NULL,
    `conditions` JSON NOT NULL,
    `actions` JSON NOT NULL,
    `priority` INT NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`template_id`) REFERENCES `wizard_templates`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`source_question_id`) REFERENCES `wizard_questions`(`id`) ON DELETE CASCADE,
    INDEX `idx_logic_template` (`template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wizard_runs` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `template_id` CHAR(36) NOT NULL,
    `case_id` CHAR(36) NULL,
    `visit_id` CHAR(36) NULL,
    `client_id` CHAR(36) NOT NULL,
    `therapist_id` CHAR(36) NOT NULL,
    `status` ENUM('draft', 'in_progress', 'paused', 'completed', 'abandoned') NOT NULL DEFAULT 'draft',
    `current_step` INT NOT NULL DEFAULT 1,
    `progress_percentage` INT NOT NULL DEFAULT 0,
    `started_at` TIMESTAMP NULL,
    `completed_at` TIMESTAMP NULL,
    `last_saved_at` TIMESTAMP NULL,
    `time_spent_seconds` INT NOT NULL DEFAULT 0,
    `is_offline` TINYINT(1) NOT NULL DEFAULT 0,
    `offline_synced_at` TIMESTAMP NULL,
    `device_info` JSON NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`template_id`) REFERENCES `wizard_templates`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`client_id`) REFERENCES `client_profiles`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`therapist_id`) REFERENCES `therapist_profiles`(`id`) ON DELETE CASCADE,
    INDEX `idx_runs_template` (`template_id`),
    INDEX `idx_runs_case` (`case_id`),
    INDEX `idx_runs_client` (`client_id`),
    INDEX `idx_runs_therapist` (`therapist_id`),
    INDEX `idx_runs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wizard_answers` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `run_id` CHAR(36) NOT NULL,
    `question_id` CHAR(36) NOT NULL,
    `step_id` CHAR(36) NOT NULL,
    `answer_text` TEXT NULL,
    `answer_number` DECIMAL(20, 6) NULL,
    `answer_json` JSON NULL,
    `answer_encrypted` TINYINT(1) NOT NULL DEFAULT 0,
    `file_paths` JSON NULL,
    `answered_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_run_question` (`run_id`, `question_id`),
    FOREIGN KEY (`run_id`) REFERENCES `wizard_runs`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`question_id`) REFERENCES `wizard_questions`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`step_id`) REFERENCES `wizard_steps`(`id`) ON DELETE CASCADE,
    INDEX `idx_answers_run` (`run_id`),
    INDEX `idx_answers_question` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- MEDIA & FILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS `media_files` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `uploaded_by` CHAR(36) NOT NULL,
    `org_id` CHAR(36) NULL,
    `original_filename` VARCHAR(255) NOT NULL,
    `stored_filename` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_size` BIGINT NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `file_extension` VARCHAR(20) NOT NULL,
    `file_hash` VARCHAR(64) NOT NULL,
    `media_type` ENUM('photo', 'document', 'video', 'audio', 'signature', 'other') NOT NULL,
    `purpose` ENUM('assessment', 'report', 'consent', 'credential', 'avatar', 'logo', 'attachment', 'other') NOT NULL DEFAULT 'attachment',
    `is_encrypted` TINYINT(1) NOT NULL DEFAULT 0,
    `encryption_key_id` VARCHAR(100) NULL,
    `exif_stripped` TINYINT(1) NOT NULL DEFAULT 0,
    `virus_scanned` TINYINT(1) NOT NULL DEFAULT 0,
    `virus_scan_result` VARCHAR(100) NULL,
    `metadata` JSON NULL,
    `thumbnail_path` VARCHAR(500) NULL,
    `access_count` INT NOT NULL DEFAULT 0,
    `last_accessed_at` TIMESTAMP NULL,
    `expires_at` TIMESTAMP NULL,
    `deleted_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE SET NULL,
    INDEX `idx_media_uploaded_by` (`uploaded_by`),
    INDEX `idx_media_type` (`media_type`),
    INDEX `idx_media_purpose` (`purpose`),
    INDEX `idx_media_hash` (`file_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media_links` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `media_id` CHAR(36) NOT NULL,
    `linkable_type` VARCHAR(100) NOT NULL,
    `linkable_id` CHAR(36) NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    `caption` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`media_id`) REFERENCES `media_files`(`id`) ON DELETE CASCADE,
    INDEX `idx_media_links_media` (`media_id`),
    INDEX `idx_media_links_linkable` (`linkable_type`, `linkable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `annotations` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `media_id` CHAR(36) NOT NULL,
    `created_by` CHAR(36) NOT NULL,
    `annotation_type` ENUM('arrow', 'circle', 'rectangle', 'line', 'text', 'measurement', 'freehand', 'marker') NOT NULL,
    `data` JSON NOT NULL,
    `color` VARCHAR(20) NULL DEFAULT '#FF0000',
    `stroke_width` INT NULL DEFAULT 2,
    `label` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`media_id`) REFERENCES `media_files`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_annotations_media` (`media_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `measurement_calibrations` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `media_id` CHAR(36) NOT NULL,
    `created_by` CHAR(36) NOT NULL,
    `reference_type` ENUM('30cm_stick', 'ruler', 'known_object', 'manual') NOT NULL DEFAULT '30cm_stick',
    `reference_length_mm` INT NOT NULL DEFAULT 300,
    `pixel_start_x` INT NOT NULL,
    `pixel_start_y` INT NOT NULL,
    `pixel_end_x` INT NOT NULL,
    `pixel_end_y` INT NOT NULL,
    `pixels_per_mm` DECIMAL(10, 6) NOT NULL,
    `confidence_score` DECIMAL(3, 2) NULL,
    `verified` TINYINT(1) NOT NULL DEFAULT 0,
    `verified_by` CHAR(36) NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`media_id`) REFERENCES `media_files`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_calibrations_media` (`media_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- REPORTS & LETTERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `reports` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `case_id` CHAR(36) NOT NULL,
    `wizard_run_id` CHAR(36) NULL,
    `author_id` CHAR(36) NOT NULL,
    `org_id` CHAR(36) NULL,
    `report_type` ENUM('assessment', 'progress', 'discharge', 'letter_gp', 'letter_specialist', 'ndis_recommendation', 'home_mod', 'equipment', 'custom') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `reference_number` VARCHAR(50) NULL,
    `status` ENUM('draft', 'pending_review', 'approved', 'sent', 'archived') NOT NULL DEFAULT 'draft',
    `current_version` INT NOT NULL DEFAULT 1,
    `is_locked` TINYINT(1) NOT NULL DEFAULT 0,
    `locked_at` TIMESTAMP NULL,
    `locked_by` CHAR(36) NULL,
    `approved_by` CHAR(36) NULL,
    `approved_at` TIMESTAMP NULL,
    `settings` JSON NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`wizard_run_id`) REFERENCES `wizard_runs`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`locked_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_reports_case` (`case_id`),
    INDEX `idx_reports_author` (`author_id`),
    INDEX `idx_reports_type` (`report_type`),
    INDEX `idx_reports_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `report_versions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `report_id` CHAR(36) NOT NULL,
    `version_number` INT NOT NULL,
    `created_by` CHAR(36) NOT NULL,
    `change_summary` TEXT NULL,
    `content` JSON NULL,
    `pdf_path` VARCHAR(500) NULL,
    `word_path` VARCHAR(500) NULL,
    `budget_total` DECIMAL(12, 2) NULL,
    `budget_breakdown` JSON NULL,
    `is_current` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_report_version` (`report_id`, `version_number`),
    FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_report_versions_report` (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `report_sections` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `report_version_id` CHAR(36) NOT NULL,
    `section_order` INT NOT NULL,
    `section_type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NULL,
    `content` TEXT NULL,
    `data` JSON NULL,
    `include_in_output` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`report_version_id`) REFERENCES `report_versions`(`id`) ON DELETE CASCADE,
    INDEX `idx_report_sections_version` (`report_version_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- EQUIPMENT & SUPPLIERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `equipment_items` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `org_id` CHAR(36) NULL,
    `name` VARCHAR(255) NOT NULL,
    `category` ENUM('mobility', 'bathroom', 'bedroom', 'kitchen', 'communication', 'pressure_care', 'transfers', 'ramps', 'rails', 'other') NOT NULL,
    `subcategory` VARCHAR(100) NULL,
    `brand` VARCHAR(100) NULL,
    `model` VARCHAR(100) NULL,
    `sku` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `specifications` JSON NULL,
    `typical_price` DECIMAL(10, 2) NULL,
    `ndis_category` VARCHAR(100) NULL,
    `ndis_support_item_number` VARCHAR(50) NULL,
    `image_path` VARCHAR(500) NULL,
    `supplier_ids` JSON NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_by` CHAR(36) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_equipment_category` (`category`),
    INDEX `idx_equipment_name` (`name`),
    INDEX `idx_equipment_ndis` (`ndis_support_item_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `suppliers` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `org_id` CHAR(36) NULL,
    `name` VARCHAR(255) NOT NULL,
    `abn` VARCHAR(11) NULL,
    `contact_name` VARCHAR(200) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `address_line1` VARCHAR(255) NULL,
    `address_line2` VARCHAR(255) NULL,
    `suburb` VARCHAR(100) NULL,
    `state` VARCHAR(50) NULL,
    `postcode` VARCHAR(10) NULL,
    `country` VARCHAR(50) NOT NULL DEFAULT 'Australia',
    `website` VARCHAR(255) NULL,
    `categories` JSON NULL,
    `service_regions` JSON NULL,
    `lead_time_days` INT NULL,
    `notes` TEXT NULL,
    `rating_average` DECIMAL(3, 2) NULL,
    `rating_count` INT NOT NULL DEFAULT 0,
    `is_preferred` TINYINT(1) NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE SET NULL,
    INDEX `idx_suppliers_name` (`name`),
    INDEX `idx_suppliers_preferred` (`is_preferred`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quotes` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `case_id` CHAR(36) NOT NULL,
    `supplier_id` CHAR(36) NOT NULL,
    `requested_by` CHAR(36) NOT NULL,
    `quote_number` VARCHAR(50) NULL,
    `status` ENUM('requested', 'received', 'under_review', 'approved', 'rejected', 'expired') NOT NULL DEFAULT 'requested',
    `requested_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `received_at` TIMESTAMP NULL,
    `expires_at` TIMESTAMP NULL,
    `items` JSON NOT NULL,
    `subtotal` DECIMAL(12, 2) NULL,
    `gst` DECIMAL(12, 2) NULL,
    `total` DECIMAL(12, 2) NULL,
    `delivery_cost` DECIMAL(10, 2) NULL,
    `installation_cost` DECIMAL(10, 2) NULL,
    `document_path` VARCHAR(500) NULL,
    `notes` TEXT NULL,
    `reviewed_by` CHAR(36) NULL,
    `reviewed_at` TIMESTAMP NULL,
    `review_notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_quotes_case` (`case_id`),
    INDEX `idx_quotes_supplier` (`supplier_id`),
    INDEX `idx_quotes_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `case_id` CHAR(36) NOT NULL,
    `quote_id` CHAR(36) NULL,
    `supplier_id` CHAR(36) NOT NULL,
    `ordered_by` CHAR(36) NOT NULL,
    `order_number` VARCHAR(50) NOT NULL,
    `po_number` VARCHAR(50) NULL,
    `status` ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned') NOT NULL DEFAULT 'pending',
    `items` JSON NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `gst` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(12, 2) NOT NULL,
    `delivery_address` TEXT NULL,
    `delivery_instructions` TEXT NULL,
    `expected_delivery_date` DATE NULL,
    `actual_delivery_date` DATE NULL,
    `tracking_number` VARCHAR(100) NULL,
    `invoice_path` VARCHAR(500) NULL,
    `notes` TEXT NULL,
    `ordered_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `confirmed_at` TIMESTAMP NULL,
    `shipped_at` TIMESTAMP NULL,
    `delivered_at` TIMESTAMP NULL,
    `cancelled_at` TIMESTAMP NULL,
    `cancellation_reason` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`ordered_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_orders_case` (`case_id`),
    INDEX `idx_orders_supplier` (`supplier_id`),
    INDEX `idx_orders_status` (`status`),
    INDEX `idx_orders_number` (`order_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `deliveries` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `order_id` CHAR(36) NOT NULL,
    `delivery_date` DATE NOT NULL,
    `received_by` VARCHAR(200) NULL,
    `signature_path` VARCHAR(500) NULL,
    `condition` ENUM('good', 'damaged', 'partial', 'wrong_item') NOT NULL DEFAULT 'good',
    `condition_notes` TEXT NULL,
    `photo_paths` JSON NULL,
    `notes` TEXT NULL,
    `recorded_by` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_deliveries_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `trials` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `case_id` CHAR(36) NOT NULL,
    `equipment_id` CHAR(36) NULL,
    `equipment_name` VARCHAR(255) NOT NULL,
    `trial_type` ENUM('in_clinic', 'home', 'supplier_demo', 'telehealth') NOT NULL,
    `status` ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
    `scheduled_date` DATE NULL,
    `completed_date` DATE NULL,
    `therapist_id` CHAR(36) NOT NULL,
    `outcome` ENUM('successful', 'unsuccessful', 'modifications_needed', 'alternative_required') NULL,
    `client_feedback` TEXT NULL,
    `therapist_notes` TEXT NULL,
    `recommendations` TEXT NULL,
    `photo_paths` JSON NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`equipment_id`) REFERENCES `equipment_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`therapist_id`) REFERENCES `therapist_profiles`(`id`) ON DELETE CASCADE,
    INDEX `idx_trials_case` (`case_id`),
    INDEX `idx_trials_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- REVIEWS & RATINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `reviews` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `case_id` CHAR(36) NOT NULL,
    `reviewer_id` CHAR(36) NOT NULL,
    `reviewee_id` CHAR(36) NOT NULL,
    `review_type` ENUM('client_to_therapist', 'therapist_to_client', 'supplier_review') NOT NULL,
    `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
    `title` VARCHAR(255) NULL,
    `content` TEXT NULL,
    `is_anonymous` TINYINT(1) NOT NULL DEFAULT 0,
    `status` ENUM('pending', 'published', 'hidden', 'flagged', 'removed') NOT NULL DEFAULT 'pending',
    `published_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reviewee_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_reviews_case` (`case_id`),
    INDEX `idx_reviews_reviewee` (`reviewee_id`),
    INDEX `idx_reviews_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `review_flags` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `review_id` CHAR(36) NOT NULL,
    `flagged_by` CHAR(36) NOT NULL,
    `reason` ENUM('inappropriate', 'spam', 'false', 'harassment', 'privacy', 'other') NOT NULL,
    `details` TEXT NULL,
    `status` ENUM('pending', 'reviewed', 'upheld', 'dismissed') NOT NULL DEFAULT 'pending',
    `reviewed_by` CHAR(36) NULL,
    `reviewed_at` TIMESTAMP NULL,
    `action_taken` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`flagged_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_review_flags_review` (`review_id`),
    INDEX `idx_review_flags_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `moderation_actions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `moderator_id` CHAR(36) NOT NULL,
    `action_type` ENUM('review_hide', 'review_remove', 'review_restore', 'flag_dismiss', 'flag_uphold', 'user_warn', 'user_suspend', 'other') NOT NULL,
    `target_type` VARCHAR(50) NOT NULL,
    `target_id` CHAR(36) NOT NULL,
    `reason` TEXT NOT NULL,
    `notes` TEXT NULL,
    `is_reversible` TINYINT(1) NOT NULL DEFAULT 1,
    `reversed_at` TIMESTAMP NULL,
    `reversed_by` CHAR(36) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`moderator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reversed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_moderation_target` (`target_type`, `target_id`),
    INDEX `idx_moderation_moderator` (`moderator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SHARE PACKS & EMAIL DELIVERY
-- ============================================================================

CREATE TABLE IF NOT EXISTS `share_packs` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `case_id` CHAR(36) NOT NULL,
    `report_version_id` CHAR(36) NOT NULL,
    `created_by` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `access_token` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NULL,
    `requires_consent` TINYINT(1) NOT NULL DEFAULT 1,
    `consent_id` CHAR(36) NULL,
    `expires_at` TIMESTAMP NULL,
    `max_access_count` INT NULL,
    `access_count` INT NOT NULL DEFAULT 0,
    `status` ENUM('active', 'expired', 'revoked') NOT NULL DEFAULT 'active',
    `revoked_at` TIMESTAMP NULL,
    `revoked_by` CHAR(36) NULL,
    `revoke_reason` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`report_version_id`) REFERENCES `report_versions`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`consent_id`) REFERENCES `consents`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`revoked_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_share_packs_case` (`case_id`),
    INDEX `idx_share_packs_token` (`access_token`),
    INDEX `idx_share_packs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `share_pack_items` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `share_pack_id` CHAR(36) NOT NULL,
    `item_type` ENUM('report_pdf', 'report_word', 'photo', 'document', 'consent_form') NOT NULL,
    `media_id` CHAR(36) NULL,
    `file_path` VARCHAR(500) NULL,
    `item_name` VARCHAR(255) NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`share_pack_id`) REFERENCES `share_packs`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`media_id`) REFERENCES `media_files`(`id`) ON DELETE SET NULL,
    INDEX `idx_share_pack_items_pack` (`share_pack_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `share_pack_recipients` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `share_pack_id` CHAR(36) NOT NULL,
    `recipient_type` ENUM('client', 'case_manager', 'funder', 'therapist', 'other') NOT NULL,
    `user_id` CHAR(36) NULL,
    `email` VARCHAR(255) NOT NULL,
    `name` VARCHAR(200) NULL,
    `email_sent_at` TIMESTAMP NULL,
    `email_status` ENUM('pending', 'sent', 'delivered', 'bounced', 'failed') NOT NULL DEFAULT 'pending',
    `first_accessed_at` TIMESTAMP NULL,
    `access_count` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`share_pack_id`) REFERENCES `share_packs`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_share_pack_recipients_pack` (`share_pack_id`),
    INDEX `idx_share_pack_recipients_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `share_pack_access_logs` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `share_pack_id` CHAR(36) NOT NULL,
    `recipient_id` CHAR(36) NULL,
    `accessed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `ip_address` VARCHAR(45) NOT NULL,
    `user_agent` TEXT NULL,
    `items_viewed` JSON NULL,
    `items_downloaded` JSON NULL,
    FOREIGN KEY (`share_pack_id`) REFERENCES `share_packs`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`recipient_id`) REFERENCES `share_pack_recipients`(`id`) ON DELETE SET NULL,
    INDEX `idx_share_pack_access_pack` (`share_pack_id`),
    INDEX `idx_share_pack_access_time` (`accessed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- EMAIL QUEUE
-- ============================================================================

CREATE TABLE IF NOT EXISTS `outbound_emails` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `org_id` CHAR(36) NULL,
    `template_name` VARCHAR(100) NULL,
    `to_email` VARCHAR(255) NOT NULL,
    `to_name` VARCHAR(200) NULL,
    `cc_emails` JSON NULL,
    `bcc_emails` JSON NULL,
    `reply_to` VARCHAR(255) NULL,
    `subject` VARCHAR(255) NOT NULL,
    `body_html` TEXT NOT NULL,
    `body_text` TEXT NULL,
    `attachments` JSON NULL,
    `priority` ENUM('low', 'normal', 'high') NOT NULL DEFAULT 'normal',
    `status` ENUM('queued', 'sending', 'sent', 'delivered', 'bounced', 'failed') NOT NULL DEFAULT 'queued',
    `attempts` INT NOT NULL DEFAULT 0,
    `max_attempts` INT NOT NULL DEFAULT 3,
    `last_attempt_at` TIMESTAMP NULL,
    `sent_at` TIMESTAMP NULL,
    `delivered_at` TIMESTAMP NULL,
    `bounced_at` TIMESTAMP NULL,
    `bounce_type` VARCHAR(50) NULL,
    `bounce_message` TEXT NULL,
    `error_message` TEXT NULL,
    `message_id` VARCHAR(255) NULL,
    `metadata` JSON NULL,
    `scheduled_for` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE SET NULL,
    INDEX `idx_emails_status` (`status`),
    INDEX `idx_emails_priority` (`priority`),
    INDEX `idx_emails_scheduled` (`scheduled_for`),
    INDEX `idx_emails_to` (`to_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_events` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `email_id` CHAR(36) NOT NULL,
    `event_type` ENUM('queued', 'sending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed', 'failed') NOT NULL,
    `event_data` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `occurred_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`email_id`) REFERENCES `outbound_emails`(`id`) ON DELETE CASCADE,
    INDEX `idx_email_events_email` (`email_id`),
    INDEX `idx_email_events_type` (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- KNOWLEDGE BASE
-- ============================================================================

CREATE TABLE IF NOT EXISTS `knowledge_sources` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `publisher` VARCHAR(255) NULL,
    `source_type` ENUM('government', 'standard', 'guideline', 'legislation', 'research', 'internal', 'other') NOT NULL,
    `url` VARCHAR(500) NULL,
    `document_path` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `categories` JSON NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `requires_approval` TINYINT(1) NOT NULL DEFAULT 1,
    `check_frequency_days` INT NOT NULL DEFAULT 30,
    `last_checked_at` TIMESTAMP NULL,
    `last_changed_at` TIMESTAMP NULL,
    `current_hash` VARCHAR(64) NULL,
    `created_by` CHAR(36) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_knowledge_sources_type` (`source_type`),
    INDEX `idx_knowledge_sources_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `knowledge_snapshots` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `source_id` CHAR(36) NOT NULL,
    `snapshot_hash` VARCHAR(64) NOT NULL,
    `content_summary` TEXT NULL,
    `captured_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `document_path` VARCHAR(500) NULL,
    FOREIGN KEY (`source_id`) REFERENCES `knowledge_sources`(`id`) ON DELETE CASCADE,
    INDEX `idx_knowledge_snapshots_source` (`source_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `change_reports` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `source_id` CHAR(36) NOT NULL,
    `previous_snapshot_id` CHAR(36) NULL,
    `new_snapshot_id` CHAR(36) NOT NULL,
    `change_type` ENUM('content', 'url', 'unavailable', 'restored') NOT NULL,
    `change_summary` TEXT NULL,
    `detected_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('pending', 'reviewed', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `reviewed_by` CHAR(36) NULL,
    `reviewed_at` TIMESTAMP NULL,
    `review_notes` TEXT NULL,
    `action_required` TEXT NULL,
    FOREIGN KEY (`source_id`) REFERENCES `knowledge_sources`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`previous_snapshot_id`) REFERENCES `knowledge_snapshots`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`new_snapshot_id`) REFERENCES `knowledge_snapshots`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_change_reports_source` (`source_id`),
    INDEX `idx_change_reports_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECURE MESSAGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS `conversations` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `case_id` CHAR(36) NULL,
    `subject` VARCHAR(255) NULL,
    `conversation_type` ENUM('direct', 'case_team', 'support') NOT NULL DEFAULT 'direct',
    `status` ENUM('active', 'archived', 'closed') NOT NULL DEFAULT 'active',
    `last_message_at` TIMESTAMP NULL,
    `created_by` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_conversations_case` (`case_id`),
    INDEX `idx_conversations_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `conversation_participants` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `conversation_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `role` ENUM('owner', 'participant') NOT NULL DEFAULT 'participant',
    `last_read_at` TIMESTAMP NULL,
    `muted` TINYINT(1) NOT NULL DEFAULT 0,
    `left_at` TIMESTAMP NULL,
    `joined_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_conversation_user` (`conversation_id`, `user_id`),
    FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_conv_participants_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `messages` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `conversation_id` CHAR(36) NOT NULL,
    `sender_id` CHAR(36) NOT NULL,
    `content` TEXT NOT NULL,
    `content_encrypted` TINYINT(1) NOT NULL DEFAULT 0,
    `message_type` ENUM('text', 'file', 'system') NOT NULL DEFAULT 'text',
    `attachments` JSON NULL,
    `is_edited` TINYINT(1) NOT NULL DEFAULT 0,
    `edited_at` TIMESTAMP NULL,
    `deleted_at` TIMESTAMP NULL,
    `deleted_by` CHAR(36) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_messages_conversation` (`conversation_id`),
    INDEX `idx_messages_sender` (`sender_id`),
    INDEX `idx_messages_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- AUDIT & SECURITY LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `user_id` CHAR(36) NULL,
    `org_id` CHAR(36) NULL,
    `action` VARCHAR(100) NOT NULL,
    `resource_type` VARCHAR(100) NOT NULL,
    `resource_id` CHAR(36) NULL,
    `description` TEXT NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `session_id` CHAR(36) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_audit_user` (`user_id`),
    INDEX `idx_audit_org` (`org_id`),
    INDEX `idx_audit_action` (`action`),
    INDEX `idx_audit_resource` (`resource_type`, `resource_id`),
    INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `security_events` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `event_type` ENUM('login_success', 'login_failed', 'logout', 'password_change', 'password_reset', 'mfa_enabled', 'mfa_disabled', 'session_expired', 'account_locked', 'account_unlocked', 'suspicious_activity', 'permission_denied', 'rate_limited', 'csrf_failed', 'other') NOT NULL,
    `user_id` CHAR(36) NULL,
    `email` VARCHAR(255) NULL,
    `ip_address` VARCHAR(45) NOT NULL,
    `user_agent` TEXT NULL,
    `details` JSON NULL,
    `severity` ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'info',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_security_type` (`event_type`),
    INDEX `idx_security_user` (`user_id`),
    INDEX `idx_security_ip` (`ip_address`),
    INDEX `idx_security_severity` (`severity`),
    INDEX `idx_security_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SYSTEM SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `system_settings` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `setting_key` VARCHAR(100) NOT NULL UNIQUE,
    `setting_value` JSON NULL,
    `setting_type` ENUM('string', 'number', 'boolean', 'json', 'encrypted') NOT NULL DEFAULT 'string',
    `description` TEXT NULL,
    `is_public` TINYINT(1) NOT NULL DEFAULT 0,
    `updated_by` CHAR(36) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_settings_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TELEHEALTH (Optional Module)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `telehealth_sessions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `visit_id` CHAR(36) NOT NULL,
    `room_name` VARCHAR(100) NOT NULL UNIQUE,
    `provider` ENUM('jitsi', 'webrtc_custom', 'other') NOT NULL DEFAULT 'jitsi',
    `status` ENUM('scheduled', 'waiting', 'active', 'ended', 'cancelled') NOT NULL DEFAULT 'scheduled',
    `scheduled_start` TIMESTAMP NOT NULL,
    `scheduled_end` TIMESTAMP NULL,
    `actual_start` TIMESTAMP NULL,
    `actual_end` TIMESTAMP NULL,
    `host_id` CHAR(36) NOT NULL,
    `participant_ids` JSON NULL,
    `settings` JSON NULL,
    `recording_enabled` TINYINT(1) NOT NULL DEFAULT 0,
    `recording_path` VARCHAR(500) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`host_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_telehealth_visit` (`visit_id`),
    INDEX `idx_telehealth_room` (`room_name`),
    INDEX `idx_telehealth_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- MY HEALTH RECORD INTEGRATION STUBS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `mhr_consent_registry` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `client_id` CHAR(36) NOT NULL,
    `ihi_number` VARCHAR(16) NULL,
    `consent_type` ENUM('upload', 'view', 'full') NOT NULL,
    `consent_status` ENUM('pending', 'granted', 'declined', 'revoked') NOT NULL DEFAULT 'pending',
    `granted_at` TIMESTAMP NULL,
    `expires_at` TIMESTAMP NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`client_id`) REFERENCES `client_profiles`(`id`) ON DELETE CASCADE,
    INDEX `idx_mhr_consent_client` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mhr_certificate_store` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `org_id` CHAR(36) NULL,
    `certificate_type` ENUM('organisation', 'provider', 'encryption') NOT NULL,
    `certificate_name` VARCHAR(255) NOT NULL,
    `certificate_path` VARCHAR(500) NOT NULL,
    `private_key_path` VARCHAR(500) NULL,
    `issued_at` TIMESTAMP NULL,
    `expires_at` TIMESTAMP NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mhr_data_mappings` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `internal_field` VARCHAR(100) NOT NULL,
    `internal_table` VARCHAR(100) NOT NULL,
    `mhr_document_type` VARCHAR(100) NOT NULL,
    `mhr_field_path` VARCHAR(255) NOT NULL,
    `transform_rules` JSON NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_mhr_mapping_internal` (`internal_table`, `internal_field`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- Auto-generate system IDs for clients
CREATE TRIGGER `trg_client_system_id` BEFORE INSERT ON `client_profiles`
FOR EACH ROW
BEGIN
    IF NEW.system_id IS NULL OR NEW.system_id = '' THEN
        SET NEW.system_id = CONCAT('PT-', LPAD(FLOOR(RAND() * 999999), 6, '0'));
    END IF;
END//

-- Auto-generate system IDs for therapists
CREATE TRIGGER `trg_therapist_system_id` BEFORE INSERT ON `therapist_profiles`
FOR EACH ROW
BEGIN
    IF NEW.system_id IS NULL OR NEW.system_id = '' THEN
        SET NEW.system_id = CONCAT('TH-', LPAD(FLOOR(RAND() * 999999), 6, '0'));
    END IF;
END//

-- Auto-generate system IDs for case managers
CREATE TRIGGER `trg_case_manager_system_id` BEFORE INSERT ON `case_manager_profiles`
FOR EACH ROW
BEGIN
    IF NEW.system_id IS NULL OR NEW.system_id = '' THEN
        SET NEW.system_id = CONCAT('CM-', LPAD(FLOOR(RAND() * 999999), 6, '0'));
    END IF;
END//

-- Auto-generate system IDs for funders
CREATE TRIGGER `trg_funder_system_id` BEFORE INSERT ON `funder_profiles`
FOR EACH ROW
BEGIN
    IF NEW.system_id IS NULL OR NEW.system_id = '' THEN
        SET NEW.system_id = CONCAT('FN-', LPAD(FLOOR(RAND() * 999999), 6, '0'));
    END IF;
END//

-- Auto-generate case numbers
CREATE TRIGGER `trg_case_number` BEFORE INSERT ON `cases`
FOR EACH ROW
BEGIN
    DECLARE next_num INT;
    IF NEW.case_number IS NULL OR NEW.case_number = '' THEN
        SELECT COALESCE(MAX(CAST(SUBSTRING(case_number, 3) AS UNSIGNED)), 0) + 1 INTO next_num FROM cases;
        SET NEW.case_number = CONCAT('C-', LPAD(next_num, 8, '0'));
    END IF;
END//

-- Auto-generate order numbers
CREATE TRIGGER `trg_order_number` BEFORE INSERT ON `orders`
FOR EACH ROW
BEGIN
    DECLARE next_num INT;
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        SELECT COALESCE(MAX(CAST(SUBSTRING(order_number, 4) AS UNSIGNED)), 0) + 1 INTO next_num FROM orders;
        SET NEW.order_number = CONCAT('ORD-', LPAD(next_num, 8, '0'));
    END IF;
END//

-- Update therapist rating average
CREATE TRIGGER `trg_update_therapist_rating` AFTER INSERT ON `reviews`
FOR EACH ROW
BEGIN
    IF NEW.review_type = 'client_to_therapist' AND NEW.status = 'published' THEN
        UPDATE therapist_profiles tp
        SET 
            rating_average = (
                SELECT AVG(r.rating) 
                FROM reviews r 
                JOIN users u ON r.reviewee_id = u.id
                WHERE u.id = (SELECT user_id FROM therapist_profiles WHERE id = tp.id)
                AND r.status = 'published'
            ),
            rating_count = (
                SELECT COUNT(*) 
                FROM reviews r 
                JOIN users u ON r.reviewee_id = u.id
                WHERE u.id = (SELECT user_id FROM therapist_profiles WHERE id = tp.id)
                AND r.status = 'published'
            )
        WHERE tp.user_id = NEW.reviewee_id;
    END IF;
END//

-- Update conversation last_message_at
CREATE TRIGGER `trg_update_conversation_last_message` AFTER INSERT ON `messages`
FOR EACH ROW
BEGIN
    UPDATE conversations 
    SET last_message_at = NEW.created_at 
    WHERE id = NEW.conversation_id;
END//

DELIMITER ;

-- ============================================================================
-- INITIAL DATA - ROLES
-- ============================================================================

INSERT INTO `roles` (`id`, `name`, `display_name`, `description`, `is_system`) VALUES
(UUID(), 'admin', 'System Administrator', 'Full system access', 1),
(UUID(), 'org_manager', 'Organisation Manager', 'Multi-clinic administration', 1),
(UUID(), 'therapist', 'Therapist', 'OT/Physio professional', 1),
(UUID(), 'case_manager', 'Case Manager', 'Support coordinator / case manager', 1),
(UUID(), 'funder', 'Funder', 'View-only funder access', 1),
(UUID(), 'client', 'Client', 'Client / participant', 1),
(UUID(), 'carer', 'Carer', 'Carer / family member', 1);

-- ============================================================================
-- INITIAL DATA - PERMISSIONS
-- ============================================================================

INSERT INTO `permissions` (`id`, `name`, `display_name`, `description`, `module`) VALUES
-- User management
(UUID(), 'users.view', 'View Users', 'View user list and profiles', 'users'),
(UUID(), 'users.create', 'Create Users', 'Create new user accounts', 'users'),
(UUID(), 'users.edit', 'Edit Users', 'Edit user accounts', 'users'),
(UUID(), 'users.delete', 'Delete Users', 'Delete user accounts', 'users'),
(UUID(), 'users.roles', 'Manage User Roles', 'Assign and revoke roles', 'users'),

-- Organisations
(UUID(), 'orgs.view', 'View Organisations', 'View organisation list', 'orgs'),
(UUID(), 'orgs.create', 'Create Organisations', 'Create new organisations', 'orgs'),
(UUID(), 'orgs.edit', 'Edit Organisations', 'Edit organisation details', 'orgs'),
(UUID(), 'orgs.delete', 'Delete Organisations', 'Delete organisations', 'orgs'),
(UUID(), 'orgs.members', 'Manage Members', 'Add/remove organisation members', 'orgs'),

-- Clients
(UUID(), 'clients.view', 'View Clients', 'View client profiles', 'clients'),
(UUID(), 'clients.create', 'Create Clients', 'Create new clients', 'clients'),
(UUID(), 'clients.edit', 'Edit Clients', 'Edit client profiles', 'clients'),
(UUID(), 'clients.delete', 'Delete Clients', 'Delete client records', 'clients'),

-- Cases
(UUID(), 'cases.view', 'View Cases', 'View case details', 'cases'),
(UUID(), 'cases.create', 'Create Cases', 'Create new cases', 'cases'),
(UUID(), 'cases.edit', 'Edit Cases', 'Edit case details', 'cases'),
(UUID(), 'cases.delete', 'Delete Cases', 'Delete cases', 'cases'),
(UUID(), 'cases.assign', 'Assign Cases', 'Assign cases to therapists', 'cases'),

-- Assessments
(UUID(), 'assessments.view', 'View Assessments', 'View assessment records', 'assessments'),
(UUID(), 'assessments.create', 'Create Assessments', 'Conduct assessments', 'assessments'),
(UUID(), 'assessments.edit', 'Edit Assessments', 'Edit assessment data', 'assessments'),
(UUID(), 'assessments.delete', 'Delete Assessments', 'Delete assessments', 'assessments'),

-- Reports
(UUID(), 'reports.view', 'View Reports', 'View reports', 'reports'),
(UUID(), 'reports.create', 'Create Reports', 'Generate reports', 'reports'),
(UUID(), 'reports.edit', 'Edit Reports', 'Edit reports', 'reports'),
(UUID(), 'reports.approve', 'Approve Reports', 'Approve and lock reports', 'reports'),
(UUID(), 'reports.share', 'Share Reports', 'Create and send share packs', 'reports'),

-- Equipment
(UUID(), 'equipment.view', 'View Equipment', 'View equipment catalogue', 'equipment'),
(UUID(), 'equipment.create', 'Create Equipment', 'Add equipment items', 'equipment'),
(UUID(), 'equipment.edit', 'Edit Equipment', 'Edit equipment details', 'equipment'),
(UUID(), 'equipment.order', 'Order Equipment', 'Create orders', 'equipment'),

-- Admin
(UUID(), 'admin.settings', 'System Settings', 'Manage system settings', 'admin'),
(UUID(), 'admin.audit', 'View Audit Logs', 'Access audit logs', 'admin'),
(UUID(), 'admin.moderation', 'Moderation', 'Moderate reviews and content', 'admin'),
(UUID(), 'admin.knowledge', 'Knowledge Base', 'Manage knowledge sources', 'admin');

-- ============================================================================
-- INITIAL DATA - KNOWLEDGE SOURCES
-- ============================================================================

INSERT INTO `knowledge_sources` (`id`, `title`, `publisher`, `source_type`, `url`, `description`, `categories`, `is_active`) VALUES
(UUID(), 'NDIS Practice Standards', 'NDIS Quality and Safeguards Commission', 'government', 'https://www.ndiscommission.gov.au/providers/ndis-practice-standards', 'Core module and supplementary modules for NDIS providers', '["compliance", "ndis", "practice_standards"]', 1),
(UUID(), 'NDIA Home Modifications Explained', 'National Disability Insurance Agency', 'guideline', 'https://www.ndis.gov.au/participants/home-modifications-explained', 'Guide to home modifications under NDIS', '["home_mods", "ndis", "participants"]', 1),
(UUID(), 'NDIA Provider Guidance - Home Modifications', 'National Disability Insurance Agency', 'guideline', 'https://www.ndis.gov.au/providers/housing-and-living-supports-and-services/home-modifications', 'Provider guidance for home modifications', '["home_mods", "ndis", "providers"]', 1),
(UUID(), 'Premises Standards', 'Federal Register of Legislation', 'legislation', 'https://www.legislation.gov.au/Series/F2010L00668', 'Disability (Access to Premises – Buildings) Standards 2010', '["compliance", "access", "building"]', 1),
(UUID(), 'Livable Housing Design Standard', 'Australian Building Codes Board', 'standard', 'https://www.abcb.gov.au/livable-housing-design', 'ABCB Livable Housing Design Standard', '["home_mods", "access", "design"]', 1);

-- ============================================================================
-- INITIAL DATA - SYSTEM SETTINGS
-- ============================================================================

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `is_public`) VALUES
(UUID(), 'portal_name', '"Rehab Source"', 'string', 'Portal display name', 1),
(UUID(), 'max_upload_mb', '5', 'number', 'Maximum file upload size in MB', 0),
(UUID(), 'data_retention_years', '5', 'number', 'Data retention period in years', 0),
(UUID(), 'email_attachments_enabled', 'true', 'boolean', 'Allow PDF attachments in emails', 0),
(UUID(), 'email_attachment_max_mb', '10', 'number', 'Maximum email attachment size in MB', 0),
(UUID(), 'telehealth_enabled', 'false', 'boolean', 'Enable telehealth module', 0),
(UUID(), 'mhr_integration_enabled', 'false', 'boolean', 'Enable My Health Record integration', 0),
(UUID(), 'session_timeout_minutes', '120', 'number', 'Session timeout in minutes', 0),
(UUID(), 'mfa_required', 'false', 'boolean', 'Require MFA for all users', 0),
(UUID(), 'password_min_length', '12', 'number', 'Minimum password length', 0),
(UUID(), 'rate_limit_auth_attempts', '5', 'number', 'Max auth attempts before lockout', 0),
(UUID(), 'rate_limit_lockout_minutes', '15', 'number', 'Account lockout duration', 0);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
