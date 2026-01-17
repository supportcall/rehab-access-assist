-- =====================================================
-- REHAB SOURCE PORTAL - COMPLETE MYSQL SCHEMA
-- Version: 1.0.0
-- Database: MySQL 8.0+
-- =====================================================
-- This schema creates the complete database structure for
-- a multi-role Australian OT + Physio healthcare portal
-- =====================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- =====================================================
-- SECTION 1: ENUM TYPES (Stored as VARCHAR in MySQL)
-- =====================================================

-- Note: MySQL doesn't have native ENUM types like PostgreSQL
-- We use VARCHAR with CHECK constraints or application-level validation

-- =====================================================
-- SECTION 2: CORE USER & AUTHENTICATION TABLES
-- =====================================================

-- Users table: Core authentication
CREATE TABLE IF NOT EXISTS `users` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Argon2id hashed',
    `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
    `email_verification_token` VARCHAR(255) NULL DEFAULT NULL,
    `password_reset_token` VARCHAR(255) NULL DEFAULT NULL,
    `password_reset_expires` TIMESTAMP NULL DEFAULT NULL,
    `mfa_enabled` TINYINT(1) NOT NULL DEFAULT 0,
    `mfa_secret` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Encrypted TOTP secret',
    `mfa_recovery_codes` TEXT NULL DEFAULT NULL COMMENT 'Encrypted JSON array',
    `failed_login_attempts` INT NOT NULL DEFAULT 0,
    `locked_until` TIMESTAMP NULL DEFAULT NULL,
    `last_login_at` TIMESTAMP NULL DEFAULT NULL,
    `last_login_ip` VARCHAR(45) NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `users_email_unique` (`email`),
    KEY `users_email_verified_idx` (`email_verified_at`),
    KEY `users_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Roles table: Defines available roles
CREATE TABLE IF NOT EXISTS `roles` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `name` VARCHAR(50) NOT NULL,
    `display_name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL DEFAULT NULL,
    `is_system` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'System roles cannot be deleted',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `roles_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Roles: Many-to-many relationship (CRITICAL: Roles separate from users!)
CREATE TABLE IF NOT EXISTS `user_roles` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `user_id` CHAR(36) NOT NULL,
    `role_id` CHAR(36) NOT NULL,
    `granted_by` CHAR(36) NULL DEFAULT NULL,
    `granted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `user_roles_unique` (`user_id`, `role_id`),
    KEY `user_roles_role_idx` (`role_id`),
    CONSTRAINT `user_roles_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `user_roles_role_fk` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `user_roles_granted_by_fk` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions table
CREATE TABLE IF NOT EXISTS `permissions` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `name` VARCHAR(100) NOT NULL,
    `display_name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL DEFAULT NULL,
    `module` VARCHAR(50) NOT NULL DEFAULT 'core',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `permissions_name_unique` (`name`),
    KEY `permissions_module_idx` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role Permissions: Many-to-many
CREATE TABLE IF NOT EXISTS `role_permissions` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `role_id` CHAR(36) NOT NULL,
    `permission_id` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `role_permissions_unique` (`role_id`, `permission_id`),
    CONSTRAINT `role_permissions_role_fk` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `role_permissions_permission_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table: Secure session management
CREATE TABLE IF NOT EXISTS `sessions` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `user_id` CHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL COMMENT 'Hashed session token',
    `ip_address` VARCHAR(45) NOT NULL,
    `user_agent` TEXT NULL DEFAULT NULL,
    `device_fingerprint` VARCHAR(255) NULL DEFAULT NULL,
    `last_activity` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` TIMESTAMP NOT NULL,
    `is_revoked` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `sessions_user_idx` (`user_id`),
    KEY `sessions_token_idx` (`token_hash`),
    KEY `sessions_expires_idx` (`expires_at`),
    CONSTRAINT `sessions_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 3: ORGANIZATION & MULTI-CLINIC TABLES
-- =====================================================

-- Organizations (Clinics)
CREATE TABLE IF NOT EXISTS `organizations` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `name` VARCHAR(255) NOT NULL,
    `legal_name` VARCHAR(255) NULL DEFAULT NULL,
    `abn` VARCHAR(11) NULL DEFAULT NULL,
    `email` VARCHAR(255) NULL DEFAULT NULL,
    `phone` VARCHAR(20) NULL DEFAULT NULL,
    `website` VARCHAR(255) NULL DEFAULT NULL,
    `logo_file_id` CHAR(36) NULL DEFAULT NULL,
    `address_line1` VARCHAR(255) NULL DEFAULT NULL,
    `address_line2` VARCHAR(255) NULL DEFAULT NULL,
    `suburb` VARCHAR(100) NULL DEFAULT NULL,
    `state` VARCHAR(3) NULL DEFAULT NULL,
    `postcode` VARCHAR(4) NULL DEFAULT NULL,
    `country` VARCHAR(2) NOT NULL DEFAULT 'AU',
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'Australia/Sydney',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `settings` JSON NULL DEFAULT NULL COMMENT 'Organization-specific settings',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `organizations_active_idx` (`is_active`),
    KEY `organizations_abn_idx` (`abn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Organization Memberships
CREATE TABLE IF NOT EXISTS `organization_memberships` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `organization_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `role` ENUM('owner', 'manager', 'staff', 'contractor') NOT NULL DEFAULT 'staff',
    `title` VARCHAR(100) NULL DEFAULT NULL,
    `is_primary` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Primary organization for user',
    `joined_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `left_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `org_membership_unique` (`organization_id`, `user_id`),
    KEY `org_membership_user_idx` (`user_id`),
    CONSTRAINT `org_membership_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `org_membership_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 4: PROFILE TABLES
-- =====================================================

-- Client Profiles
CREATE TABLE IF NOT EXISTS `client_profiles` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `user_id` CHAR(36) NOT NULL,
    `system_id` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Auto-generated PT-XXXXXX',
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `preferred_name` VARCHAR(100) NULL DEFAULT NULL,
    `date_of_birth` DATE NULL DEFAULT NULL,
    `gender` ENUM('male', 'female', 'other', 'prefer_not_to_say') NULL DEFAULT NULL,
    `phone_mobile` VARCHAR(20) NULL DEFAULT NULL,
    `phone_home` VARCHAR(20) NULL DEFAULT NULL,
    `address_line1` VARCHAR(255) NULL DEFAULT NULL,
    `address_line2` VARCHAR(255) NULL DEFAULT NULL,
    `suburb` VARCHAR(100) NULL DEFAULT NULL,
    `state` VARCHAR(3) NULL DEFAULT NULL,
    `postcode` VARCHAR(4) NULL DEFAULT NULL,
    `country` VARCHAR(2) NOT NULL DEFAULT 'AU',
    `ndis_number` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Encrypted',
    `medicare_number` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Encrypted',
    `funding_type` ENUM('ndis', 'my_aged_care', 'dva', 'private', 'tac', 'workcover', 'other') NULL DEFAULT NULL,
    `plan_manager_name` VARCHAR(255) NULL DEFAULT NULL,
    `plan_manager_email` VARCHAR(255) NULL DEFAULT NULL,
    `plan_manager_phone` VARCHAR(20) NULL DEFAULT NULL,
    `support_coordinator_name` VARCHAR(255) NULL DEFAULT NULL,
    `support_coordinator_email` VARCHAR(255) NULL DEFAULT NULL,
    `support_coordinator_phone` VARCHAR(20) NULL DEFAULT NULL,
    `emergency_contact_name` VARCHAR(255) NULL DEFAULT NULL,
    `emergency_contact_phone` VARCHAR(20) NULL DEFAULT NULL,
    `emergency_contact_relationship` VARCHAR(100) NULL DEFAULT NULL,
    `primary_diagnosis` TEXT NULL DEFAULT NULL,
    `secondary_diagnoses` JSON NULL DEFAULT NULL,
    `allergies` TEXT NULL DEFAULT NULL,
    `medications` TEXT NULL DEFAULT NULL,
    `communication_preferences` JSON NULL DEFAULT NULL,
    `accessibility_needs` TEXT NULL DEFAULT NULL,
    `avatar_file_id` CHAR(36) NULL DEFAULT NULL,
    `notes` TEXT NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `client_profiles_user_unique` (`user_id`),
    UNIQUE KEY `client_profiles_system_id_unique` (`system_id`),
    KEY `client_profiles_name_idx` (`last_name`, `first_name`),
    KEY `client_profiles_ndis_idx` (`ndis_number`),
    KEY `client_profiles_postcode_idx` (`postcode`),
    CONSTRAINT `client_profiles_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Therapist Profiles
CREATE TABLE IF NOT EXISTS `therapist_profiles` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `user_id` CHAR(36) NOT NULL,
    `system_id` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Auto-generated OT-XXXXXX or PT-XXXXXX',
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `profession` ENUM('occupational_therapist', 'physiotherapist', 'speech_pathologist', 'psychologist', 'other') NOT NULL,
    `ahpra_number` VARCHAR(20) NULL DEFAULT NULL,
    `ahpra_verified` TINYINT(1) NOT NULL DEFAULT 0,
    `ahpra_verified_at` TIMESTAMP NULL DEFAULT NULL,
    `qualifications` JSON NULL DEFAULT NULL,
    `specializations` JSON NULL DEFAULT NULL,
    `experience_years` INT NULL DEFAULT NULL,
    `bio` TEXT NULL DEFAULT NULL,
    `phone_mobile` VARCHAR(20) NULL DEFAULT NULL,
    `phone_work` VARCHAR(20) NULL DEFAULT NULL,
    `address_line1` VARCHAR(255) NULL DEFAULT NULL,
    `address_line2` VARCHAR(255) NULL DEFAULT NULL,
    `suburb` VARCHAR(100) NULL DEFAULT NULL,
    `state` VARCHAR(3) NULL DEFAULT NULL,
    `postcode` VARCHAR(4) NULL DEFAULT NULL,
    `country` VARCHAR(2) NOT NULL DEFAULT 'AU',
    `service_radius_km` INT NOT NULL DEFAULT 50,
    `service_areas` JSON NULL DEFAULT NULL COMMENT 'Array of postcodes or regions',
    `accepted_funding_types` JSON NULL DEFAULT NULL,
    `languages` JSON NULL DEFAULT NULL,
    `availability` JSON NULL DEFAULT NULL COMMENT 'Weekly availability schedule',
    `hourly_rate` DECIMAL(10,2) NULL DEFAULT NULL,
    `accepts_new_clients` TINYINT(1) NOT NULL DEFAULT 1,
    `telehealth_available` TINYINT(1) NOT NULL DEFAULT 0,
    `home_visits_available` TINYINT(1) NOT NULL DEFAULT 1,
    `clinic_visits_available` TINYINT(1) NOT NULL DEFAULT 1,
    `avatar_file_id` CHAR(36) NULL DEFAULT NULL,
    `rating_average` DECIMAL(3,2) NULL DEFAULT NULL,
    `rating_count` INT NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
    `verified_at` TIMESTAMP NULL DEFAULT NULL,
    `verified_by` CHAR(36) NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `therapist_profiles_user_unique` (`user_id`),
    UNIQUE KEY `therapist_profiles_system_id_unique` (`system_id`),
    KEY `therapist_profiles_name_idx` (`last_name`, `first_name`),
    KEY `therapist_profiles_profession_idx` (`profession`),
    KEY `therapist_profiles_postcode_idx` (`postcode`),
    KEY `therapist_profiles_rating_idx` (`rating_average`),
    KEY `therapist_profiles_active_idx` (`is_active`, `is_verified`),
    CONSTRAINT `therapist_profiles_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Case Manager Profiles
CREATE TABLE IF NOT EXISTS `case_manager_profiles` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `user_id` CHAR(36) NOT NULL,
    `system_id` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Auto-generated CM-XXXXXX',
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `role_type` ENUM('case_manager', 'support_coordinator', 'recovery_coach', 'plan_manager', 'lac') NOT NULL,
    `organization_name` VARCHAR(255) NULL DEFAULT NULL,
    `phone_mobile` VARCHAR(20) NULL DEFAULT NULL,
    `phone_work` VARCHAR(20) NULL DEFAULT NULL,
    `address_line1` VARCHAR(255) NULL DEFAULT NULL,
    `suburb` VARCHAR(100) NULL DEFAULT NULL,
    `state` VARCHAR(3) NULL DEFAULT NULL,
    `postcode` VARCHAR(4) NULL DEFAULT NULL,
    `service_regions` JSON NULL DEFAULT NULL,
    `caseload_capacity` INT NULL DEFAULT NULL,
    `current_caseload` INT NOT NULL DEFAULT 0,
    `avatar_file_id` CHAR(36) NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `case_manager_profiles_user_unique` (`user_id`),
    UNIQUE KEY `case_manager_profiles_system_id_unique` (`system_id`),
    KEY `case_manager_profiles_name_idx` (`last_name`, `first_name`),
    KEY `case_manager_profiles_role_idx` (`role_type`),
    CONSTRAINT `case_manager_profiles_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 5: CASE MANAGEMENT TABLES
-- =====================================================

-- Cases (Core entity linking clients, therapists, case managers)
CREATE TABLE IF NOT EXISTS `cases` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `case_number` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Auto-generated CASE-XXXXXX',
    `client_id` CHAR(36) NOT NULL,
    `primary_therapist_id` CHAR(36) NULL DEFAULT NULL,
    `organization_id` CHAR(36) NULL DEFAULT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL DEFAULT NULL,
    `case_type` ENUM('home_modification', 'equipment', 'functional_assessment', 'therapy', 'combined') NOT NULL,
    `status` ENUM('intake', 'active', 'on_hold', 'pending_approval', 'completed', 'cancelled', 'archived') NOT NULL DEFAULT 'intake',
    `priority` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
    `funding_type` ENUM('ndis', 'my_aged_care', 'dva', 'private', 'tac', 'workcover', 'other') NULL DEFAULT NULL,
    `funding_reference` VARCHAR(100) NULL DEFAULT NULL,
    `budget_approved` DECIMAL(12,2) NULL DEFAULT NULL,
    `budget_spent` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `start_date` DATE NULL DEFAULT NULL,
    `target_completion_date` DATE NULL DEFAULT NULL,
    `actual_completion_date` DATE NULL DEFAULT NULL,
    `metadata` JSON NULL DEFAULT NULL,
    `created_by` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `cases_number_unique` (`case_number`),
    KEY `cases_client_idx` (`client_id`),
    KEY `cases_therapist_idx` (`primary_therapist_id`),
    KEY `cases_status_idx` (`status`),
    KEY `cases_type_idx` (`case_type`),
    CONSTRAINT `cases_client_fk` FOREIGN KEY (`client_id`) REFERENCES `client_profiles` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `cases_therapist_fk` FOREIGN KEY (`primary_therapist_id`) REFERENCES `therapist_profiles` (`id`) ON DELETE SET NULL,
    CONSTRAINT `cases_org_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL,
    CONSTRAINT `cases_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Case Members (All users involved in a case)
CREATE TABLE IF NOT EXISTS `case_members` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `case_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `role` ENUM('client', 'carer', 'therapist', 'case_manager', 'support_coordinator', 'funder', 'builder', 'supplier', 'other') NOT NULL,
    `permissions` JSON NULL DEFAULT NULL COMMENT 'Specific permissions for this member',
    `added_by` CHAR(36) NOT NULL,
    `added_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `removed_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `case_members_unique` (`case_id`, `user_id`, `role`),
    KEY `case_members_user_idx` (`user_id`),
    CONSTRAINT `case_members_case_fk` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE,
    CONSTRAINT `case_members_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `case_members_added_by_fk` FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Consents (Granular consent management)
CREATE TABLE IF NOT EXISTS `consents` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `case_id` CHAR(36) NULL DEFAULT NULL,
    `client_id` CHAR(36) NOT NULL,
    `granted_to_user_id` CHAR(36) NULL DEFAULT NULL,
    `granted_to_role` VARCHAR(50) NULL DEFAULT NULL,
    `consent_type` ENUM('case_access', 'document_share', 'data_collection', 'communication', 'third_party_share', 'marketing') NOT NULL,
    `scope` JSON NOT NULL COMMENT 'What is being consented to',
    `purpose` TEXT NOT NULL,
    `granted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` TIMESTAMP NOT NULL,
    `revoked_at` TIMESTAMP NULL DEFAULT NULL,
    `revoked_by` CHAR(36) NULL DEFAULT NULL,
    `revocation_reason` TEXT NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `metadata` JSON NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `consents_case_idx` (`case_id`),
    KEY `consents_client_idx` (`client_id`),
    KEY `consents_granted_to_idx` (`granted_to_user_id`),
    KEY `consents_type_idx` (`consent_type`),
    KEY `consents_active_idx` (`is_active`, `expires_at`),
    CONSTRAINT `consents_case_fk` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE,
    CONSTRAINT `consents_client_fk` FOREIGN KEY (`client_id`) REFERENCES `client_profiles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `consents_granted_to_fk` FOREIGN KEY (`granted_to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Visits
CREATE TABLE IF NOT EXISTS `visits` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `case_id` CHAR(36) NOT NULL,
    `therapist_id` CHAR(36) NOT NULL,
    `visit_type` ENUM('initial_assessment', 'follow_up', 'home_visit', 'clinic', 'telehealth', 'equipment_trial', 'handover') NOT NULL,
    `status` ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'scheduled',
    `scheduled_start` TIMESTAMP NOT NULL,
    `scheduled_end` TIMESTAMP NOT NULL,
    `actual_start` TIMESTAMP NULL DEFAULT NULL,
    `actual_end` TIMESTAMP NULL DEFAULT NULL,
    `location_type` ENUM('client_home', 'clinic', 'telehealth', 'other') NOT NULL,
    `location_address` TEXT NULL DEFAULT NULL,
    `telehealth_link` VARCHAR(500) NULL DEFAULT NULL,
    `notes` TEXT NULL DEFAULT NULL,
    `cancellation_reason` TEXT NULL DEFAULT NULL,
    `created_by` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `visits_case_idx` (`case_id`),
    KEY `visits_therapist_idx` (`therapist_id`),
    KEY `visits_scheduled_idx` (`scheduled_start`),
    KEY `visits_status_idx` (`status`),
    CONSTRAINT `visits_case_fk` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE,
    CONSTRAINT `visits_therapist_fk` FOREIGN KEY (`therapist_id`) REFERENCES `therapist_profiles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Case Notes
CREATE TABLE IF NOT EXISTS `case_notes` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `case_id` CHAR(36) NOT NULL,
    `visit_id` CHAR(36) NULL DEFAULT NULL,
    `author_id` CHAR(36) NOT NULL,
    `note_type` ENUM('progress', 'clinical', 'soap', 'phone_call', 'email', 'internal', 'handover') NOT NULL DEFAULT 'progress',
    `title` VARCHAR(255) NULL DEFAULT NULL,
    `content` TEXT NOT NULL COMMENT 'Encrypted',
    `is_confidential` TINYINT(1) NOT NULL DEFAULT 0,
    `is_billable` TINYINT(1) NOT NULL DEFAULT 0,
    `duration_minutes` INT NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `case_notes_case_idx` (`case_id`),
    KEY `case_notes_visit_idx` (`visit_id`),
    KEY `case_notes_author_idx` (`author_id`),
    KEY `case_notes_type_idx` (`note_type`),
    CONSTRAINT `case_notes_case_fk` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE,
    CONSTRAINT `case_notes_visit_fk` FOREIGN KEY (`visit_id`) REFERENCES `visits` (`id`) ON DELETE SET NULL,
    CONSTRAINT `case_notes_author_fk` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tasks
CREATE TABLE IF NOT EXISTS `tasks` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `case_id` CHAR(36) NULL DEFAULT NULL,
    `assigned_to` CHAR(36) NULL DEFAULT NULL,
    `created_by` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL DEFAULT NULL,
    `status` ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    `priority` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
    `due_date` TIMESTAMP NULL DEFAULT NULL,
    `completed_at` TIMESTAMP NULL DEFAULT NULL,
    `completed_by` CHAR(36) NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `tasks_case_idx` (`case_id`),
    KEY `tasks_assigned_idx` (`assigned_to`),
    KEY `tasks_status_idx` (`status`),
    KEY `tasks_due_idx` (`due_date`),
    CONSTRAINT `tasks_case_fk` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE,
    CONSTRAINT `tasks_assigned_fk` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 6: ASSESSMENT WIZARD ENGINE
-- =====================================================

-- Wizard Templates
CREATE TABLE IF NOT EXISTS `wizard_templates` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL DEFAULT NULL,
    `category` ENUM('intake', 'assessment', 'home_mods', 'equipment', 'progress', 'discharge', 'letter', 'other') NOT NULL,
    `profession` ENUM('all', 'occupational_therapist', 'physiotherapist', 'speech_pathologist') NOT NULL DEFAULT 'all',
    `version` INT NOT NULL DEFAULT 1,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `is_system` TINYINT(1) NOT NULL DEFAULT 0,
    `settings` JSON NULL DEFAULT NULL,
    `created_by` CHAR(36) NULL DEFAULT NULL,
    `organization_id` CHAR(36) NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `wizard_templates_slug_version` (`slug`, `version`),
    KEY `wizard_templates_category_idx` (`category`),
    KEY `wizard_templates_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wizard Steps
CREATE TABLE IF NOT EXISTS `wizard_steps` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `template_id` CHAR(36) NOT NULL,
    `step_number` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL DEFAULT NULL,
    `help_text` TEXT NULL DEFAULT NULL,
    `is_optional` TINYINT(1) NOT NULL DEFAULT 0,
    `conditions` JSON NULL DEFAULT NULL COMMENT 'Show/hide logic',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `wizard_steps_template_order` (`template_id`, `step_number`),
    CONSTRAINT `wizard_steps_template_fk` FOREIGN KEY (`template_id`) REFERENCES `wizard_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wizard Questions
CREATE TABLE IF NOT EXISTS `wizard_questions` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `step_id` CHAR(36) NOT NULL,
    `question_order` INT NOT NULL,
    `question_key` VARCHAR(100) NOT NULL,
    `question_type` ENUM('text', 'textarea', 'number', 'select', 'multiselect', 'checkbox', 'radio', 'date', 'time', 'datetime', 'file', 'photo', 'signature', 'measurement', 'scale', 'matrix', 'address', 'calculated') NOT NULL,
    `label` VARCHAR(500) NOT NULL,
    `placeholder` VARCHAR(255) NULL DEFAULT NULL,
    `help_text` TEXT NULL DEFAULT NULL,
    `options` JSON NULL DEFAULT NULL COMMENT 'For select/radio/checkbox types',
    `validation_rules` JSON NULL DEFAULT NULL,
    `default_value` TEXT NULL DEFAULT NULL,
    `is_required` TINYINT(1) NOT NULL DEFAULT 0,
    `conditions` JSON NULL DEFAULT NULL COMMENT 'Show/hide based on other answers',
    `metadata` JSON NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `wizard_questions_step_key` (`step_id`, `question_key`),
    KEY `wizard_questions_order_idx` (`step_id`, `question_order`),
    CONSTRAINT `wizard_questions_step_fk` FOREIGN KEY (`step_id`) REFERENCES `wizard_steps` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wizard Runs (Assessment instances)
CREATE TABLE IF NOT EXISTS `wizard_runs` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `template_id` CHAR(36) NOT NULL,
    `case_id` CHAR(36) NULL DEFAULT NULL,
    `visit_id` CHAR(36) NULL DEFAULT NULL,
    `client_id` CHAR(36) NOT NULL,
    `therapist_id` CHAR(36) NOT NULL,
    `status` ENUM('draft', 'in_progress', 'paused', 'completed', 'cancelled') NOT NULL DEFAULT 'draft',
    `current_step` INT NOT NULL DEFAULT 1,
    `started_at` TIMESTAMP NULL DEFAULT NULL,
    `completed_at` TIMESTAMP NULL DEFAULT NULL,
    `last_saved_at` TIMESTAMP NULL DEFAULT NULL,
    `metadata` JSON NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `wizard_runs_template_idx` (`template_id`),
    KEY `wizard_runs_case_idx` (`case_id`),
    KEY `wizard_runs_client_idx` (`client_id`),
    KEY `wizard_runs_status_idx` (`status`),
    CONSTRAINT `wizard_runs_template_fk` FOREIGN KEY (`template_id`) REFERENCES `wizard_templates` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `wizard_runs_case_fk` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE SET NULL,
    CONSTRAINT `wizard_runs_client_fk` FOREIGN KEY (`client_id`) REFERENCES `client_profiles` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `wizard_runs_therapist_fk` FOREIGN KEY (`therapist_id`) REFERENCES `therapist_profiles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wizard Answers
CREATE TABLE IF NOT EXISTS `wizard_answers` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `run_id` CHAR(36) NOT NULL,
    `question_id` CHAR(36) NOT NULL,
    `answer_value` TEXT NULL DEFAULT NULL COMMENT 'Encrypted for sensitive data',
    `answer_json` JSON NULL DEFAULT NULL COMMENT 'For complex answers',
    `file_ids` JSON NULL DEFAULT NULL COMMENT 'Array of file IDs for file/photo questions',
    `is_encrypted` TINYINT(1) NOT NULL DEFAULT 0,
    `answered_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `wizard_answers_run_question` (`run_id`, `question_id`),
    CONSTRAINT `wizard_answers_run_fk` FOREIGN KEY (`run_id`) REFERENCES `wizard_runs` (`id`) ON DELETE CASCADE,
    CONSTRAINT `wizard_answers_question_fk` FOREIGN KEY (`question_id`) REFERENCES `wizard_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 7: FILE MANAGEMENT
-- =====================================================

-- Media Files (Secure file storage metadata)
CREATE TABLE IF NOT EXISTS `media_files` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `uploader_id` CHAR(36) NOT NULL,
    `original_filename` VARCHAR(255) NOT NULL,
    `stored_filename` VARCHAR(255) NOT NULL COMMENT 'UUID-based filename',
    `mime_type` VARCHAR(100) NOT NULL,
    `file_size` BIGINT NOT NULL,
    `file_hash` VARCHAR(64) NOT NULL COMMENT 'SHA-256 hash',
    `storage_path` VARCHAR(500) NOT NULL COMMENT 'Relative path outside webroot',
    `encryption_key_id` CHAR(36) NULL DEFAULT NULL COMMENT 'Reference to encryption key',
    `is_encrypted` TINYINT(1) NOT NULL DEFAULT 1,
    `exif_stripped` TINYINT(1) NOT NULL DEFAULT 0,
    `virus_scanned` TINYINT(1) NOT NULL DEFAULT 0,
    `virus_scan_result` VARCHAR(50) NULL DEFAULT NULL,
    `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `media_files_uploader_idx` (`uploader_id`),
    KEY `media_files_hash_idx` (`file_hash`),
    KEY `media_files_deleted_idx` (`is_deleted`),
    CONSTRAINT `media_files_uploader_fk` FOREIGN KEY (`uploader_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media Links (Associates files with entities)
CREATE TABLE IF NOT EXISTS `media_links` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `file_id` CHAR(36) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL COMMENT 'case, assessment, report, etc.',
    `entity_id` CHAR(36) NOT NULL,
    `link_type` VARCHAR(50) NOT NULL DEFAULT 'attachment' COMMENT 'attachment, photo, document, etc.',
    `display_order` INT NOT NULL DEFAULT 0,
    `caption` VARCHAR(500) NULL DEFAULT NULL,
    `metadata` JSON NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `media_links_file_idx` (`file_id`),
    KEY `media_links_entity_idx` (`entity_type`, `entity_id`),
    CONSTRAINT `media_links_file_fk` FOREIGN KEY (`file_id`) REFERENCES `media_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Photo Annotations
CREATE TABLE IF NOT EXISTS `photo_annotations` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `file_id` CHAR(36) NOT NULL,
    `annotation_type` ENUM('arrow', 'circle', 'rectangle', 'text', 'measurement', 'freehand') NOT NULL,
    `coordinates` JSON NOT NULL COMMENT 'SVG path or coordinates',
    `label` VARCHAR(255) NULL DEFAULT NULL,
    `color` VARCHAR(7) NOT NULL DEFAULT '#FF0000',
    `stroke_width` INT NOT NULL DEFAULT 2,
    `created_by` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `photo_annotations_file_idx` (`file_id`),
    CONSTRAINT `photo_annotations_file_fk` FOREIGN KEY (`file_id`) REFERENCES `media_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Measurement Calibrations (30cm stick scaling)
CREATE TABLE IF NOT EXISTS `measurement_calibrations` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `file_id` CHAR(36) NOT NULL,
    `calibration_type` ENUM('stick_30cm', 'known_dimension', 'manual') NOT NULL,
    `reference_pixels` DECIMAL(10,2) NOT NULL COMMENT 'Pixels representing known measurement',
    `reference_mm` DECIMAL(10,2) NOT NULL COMMENT 'Known measurement in mm',
    `pixels_per_mm` DECIMAL(10,4) NOT NULL,
    `confidence_score` DECIMAL(3,2) NULL DEFAULT NULL COMMENT '0.00 to 1.00',
    `calibrated_by` CHAR(36) NOT NULL,
    `verified_by` CHAR(36) NULL DEFAULT NULL,
    `verified_at` TIMESTAMP NULL DEFAULT NULL,
    `notes` TEXT NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `measurement_calibrations_file_idx` (`file_id`),
    CONSTRAINT `measurement_calibrations_file_fk` FOREIGN KEY (`file_id`) REFERENCES `media_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 8: REPORTS & DOCUMENTS
-- =====================================================

-- Reports
CREATE TABLE IF NOT EXISTS `reports` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `case_id` CHAR(36) NOT NULL,
    `wizard_run_id` CHAR(36) NULL DEFAULT NULL,
    `report_type` ENUM('assessment', 'home_modification', 'equipment', 'progress', 'discharge', 'letter', 'quote_analysis', 'custom') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `status` ENUM('draft', 'pending_review', 'approved', 'sent', 'archived') NOT NULL DEFAULT 'draft',
    `created_by` CHAR(36) NOT NULL,
    `reviewed_by` CHAR(36) NULL DEFAULT NULL,
    `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
    `approved_by` CHAR(36) NULL DEFAULT NULL,
    `approved_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `reports_case_idx` (`case_id`),
    KEY `reports_type_idx` (`report_type`),
    KEY `reports_status_idx` (`status`),
    CONSTRAINT `reports_case_fk` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE,
    CONSTRAINT `reports_wizard_run_fk` FOREIGN KEY (`wizard_run_id`) REFERENCES `wizard_runs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report Versions
CREATE TABLE IF NOT EXISTS `report_versions` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `report_id` CHAR(36) NOT NULL,
    `version_number` INT NOT NULL,
    `content` JSON NOT NULL COMMENT 'Structured report content',
    `pdf_file_id` CHAR(36) NULL DEFAULT NULL,
    `change_summary` TEXT NULL DEFAULT NULL,
    `created_by` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `report_versions_unique` (`report_id`, `version_number`),
    CONSTRAINT `report_versions_report_fk` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE,
    CONSTRAINT `report_versions_pdf_fk` FOREIGN KEY (`pdf_file_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report Sections
CREATE TABLE IF NOT EXISTS `report_sections` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `version_id` CHAR(36) NOT NULL,
    `section_order` INT NOT NULL,
    `section_type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NULL DEFAULT NULL,
    `content` TEXT NULL DEFAULT NULL,
    `content_json` JSON NULL DEFAULT NULL,
    `is_included` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `report_sections_version_idx` (`version_id`),
    CONSTRAINT `report_sections_version_fk` FOREIGN KEY (`version_id`) REFERENCES `report_versions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Budget Adjustment Trail
CREATE TABLE IF NOT EXISTS `budget_adjustments` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `case_id` CHAR(36) NOT NULL,
    `report_version_id` CHAR(36) NULL DEFAULT NULL,
    `adjustment_type` ENUM('initial', 'increase', 'decrease', 'reallocation') NOT NULL,
    `previous_amount` DECIMAL(12,2) NULL DEFAULT NULL,
    `new_amount` DECIMAL(12,2) NOT NULL,
    `reason` TEXT NOT NULL,
    `approved_by` CHAR(36) NULL DEFAULT NULL,
    `approved_at` TIMESTAMP NULL DEFAULT NULL,
    `created_by` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `budget_adjustments_case_idx` (`case_id`),
    CONSTRAINT `budget_adjustments_case_fk` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 9: EQUIPMENT MANAGEMENT
-- =====================================================

-- Equipment Catalogue
CREATE TABLE IF NOT EXISTS `equipment_items` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `subcategory` VARCHAR(100) NULL DEFAULT NULL,
    `description` TEXT NULL DEFAULT NULL,
    `specifications` JSON NULL DEFAULT NULL,
    `ndis_support_item_number` VARCHAR(20) NULL DEFAULT NULL,
    `typical_price_range_min` DECIMAL(10,2) NULL DEFAULT NULL,
    `typical_price_range_max` DECIMAL(10,2) NULL DEFAULT NULL,
    `image_file_id` CHAR(36) NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `equipment_items_category_idx` (`category`),
    KEY `equipment_items_ndis_idx` (`ndis_support_item_number`),
    FULLTEXT KEY `equipment_items_search` (`name`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Suppliers
CREATE TABLE IF NOT EXISTS `suppliers` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `name` VARCHAR(255) NOT NULL,
    `contact_name` VARCHAR(255) NULL DEFAULT NULL,
    `email` VARCHAR(255) NULL DEFAULT NULL,
    `phone` VARCHAR(20) NULL DEFAULT NULL,
    `website` VARCHAR(255) NULL DEFAULT NULL,
    `address` TEXT NULL DEFAULT NULL,
    `service_areas` JSON NULL DEFAULT NULL,
    `categories` JSON NULL DEFAULT NULL,
    `is_preferred` TINYINT(1) NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `notes` TEXT NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `suppliers_name_idx` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Equipment Quotes
CREATE TABLE IF NOT EXISTS `equipment_quotes` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `case_id` CHAR(36) NOT NULL,
    `equipment_item_id` CHAR(36) NULL DEFAULT NULL,
    `supplier_id` CHAR(36) NOT NULL,
    `custom_item_description` TEXT NULL DEFAULT NULL,
    `quoted_price` DECIMAL(10,2) NOT NULL,
    `gst_inclusive` TINYINT(1) NOT NULL DEFAULT 1,
    `quote_reference` VARCHAR(100) NULL DEFAULT NULL,
    `quote_date` DATE NOT NULL,
    `valid_until` DATE NULL DEFAULT NULL,
    `quote_file_id` CHAR(36) NULL DEFAULT NULL,
    `status` ENUM('requested', 'received', 'approved', 'rejected', 'expired') NOT NULL DEFAULT 'requested',
    `notes` TEXT NULL DEFAULT NULL,
    `created_by` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `equipment_quotes_case_idx` (`case_id`),
    KEY `equipment_quotes_supplier_idx` (`supplier_id`),
    KEY `equipment_quotes_status_idx` (`status`),
    CONSTRAINT `equipment_quotes_case_fk` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE,
    CONSTRAINT `equipment_quotes_item_fk` FOREIGN KEY (`equipment_item_id`) REFERENCES `equipment_items` (`id`) ON DELETE SET NULL,
    CONSTRAINT `equipment_quotes_supplier_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Equipment Orders
CREATE TABLE IF NOT EXISTS `equipment_orders` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `case_id` CHAR(36) NOT NULL,
    `quote_id` CHAR(36) NULL DEFAULT NULL,
    `supplier_id` CHAR(36) NOT NULL,
    `order_reference` VARCHAR(100) NULL DEFAULT NULL,
    `order_date` DATE NOT NULL,
    `expected_delivery_date` DATE NULL DEFAULT NULL,
    `actual_delivery_date` DATE NULL DEFAULT NULL,
    `total_amount` DECIMAL(10,2) NOT NULL,
    `status` ENUM('pending', 'ordered', 'shipped', 'delivered', 'cancelled', 'returned') NOT NULL DEFAULT 'pending',
    `tracking_number` VARCHAR(100) NULL DEFAULT NULL,
    `notes` TEXT NULL DEFAULT NULL,
    `created_by` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `equipment_orders_case_idx` (`case_id`),
    KEY `equipment_orders_status_idx` (`status`),
    CONSTRAINT `equipment_orders_case_fk` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE,
    CONSTRAINT `equipment_orders_quote_fk` FOREIGN KEY (`quote_id`) REFERENCES `equipment_quotes` (`id`) ON DELETE SET NULL,
    CONSTRAINT `equipment_orders_supplier_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Equipment Trials
CREATE TABLE IF NOT EXISTS `equipment_trials` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `case_id` CHAR(36) NOT NULL,
    `equipment_item_id` CHAR(36) NULL DEFAULT NULL,
    `custom_item_description` TEXT NULL DEFAULT NULL,
    `trial_start_date` DATE NOT NULL,
    `trial_end_date` DATE NULL DEFAULT NULL,
    `supplier_id` CHAR(36) NULL DEFAULT NULL,
    `outcome` ENUM('successful', 'unsuccessful', 'partial', 'ongoing') NULL DEFAULT NULL,
    `client_feedback` TEXT NULL DEFAULT NULL,
    `therapist_notes` TEXT NULL DEFAULT NULL,
    `recommend_purchase` TINYINT(1) NULL DEFAULT NULL,
    `created_by` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `equipment_trials_case_idx` (`case_id`),
    CONSTRAINT `equipment_trials_case_fk` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE,
    CONSTRAINT `equipment_trials_item_fk` FOREIGN KEY (`equipment_item_id`) REFERENCES `equipment_items` (`id`) ON DELETE SET NULL,
    CONSTRAINT `equipment_trials_supplier_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 10: REVIEWS & RATINGS
-- =====================================================

-- Reviews
CREATE TABLE IF NOT EXISTS `reviews` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `case_id` CHAR(36) NOT NULL,
    `reviewer_id` CHAR(36) NOT NULL,
    `reviewee_id` CHAR(36) NOT NULL,
    `review_type` ENUM('client_to_therapist', 'therapist_to_client') NOT NULL,
    `rating` TINYINT NOT NULL COMMENT '1-5 stars',
    `title` VARCHAR(255) NULL DEFAULT NULL,
    `content` TEXT NULL DEFAULT NULL,
    `is_public` TINYINT(1) NOT NULL DEFAULT 1,
    `is_moderated` TINYINT(1) NOT NULL DEFAULT 0,
    `moderated_by` CHAR(36) NULL DEFAULT NULL,
    `moderated_at` TIMESTAMP NULL DEFAULT NULL,
    `moderation_notes` TEXT NULL DEFAULT NULL,
    `is_hidden` TINYINT(1) NOT NULL DEFAULT 0,
    `hidden_reason` TEXT NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `reviews_case_idx` (`case_id`),
    KEY `reviews_reviewer_idx` (`reviewer_id`),
    KEY `reviews_reviewee_idx` (`reviewee_id`),
    KEY `reviews_rating_idx` (`rating`),
    CONSTRAINT `reviews_case_fk` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE,
    CONSTRAINT `reviews_reviewer_fk` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `reviews_reviewee_fk` FOREIGN KEY (`reviewee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `reviews_rating_check` CHECK (`rating` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Review Flags
CREATE TABLE IF NOT EXISTS `review_flags` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `review_id` CHAR(36) NOT NULL,
    `flagged_by` CHAR(36) NOT NULL,
    `reason` ENUM('inappropriate', 'spam', 'fake', 'harassment', 'privacy_violation', 'other') NOT NULL,
    `description` TEXT NULL DEFAULT NULL,
    `status` ENUM('pending', 'reviewed', 'actioned', 'dismissed') NOT NULL DEFAULT 'pending',
    `reviewed_by` CHAR(36) NULL DEFAULT NULL,
    `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
    `action_taken` TEXT NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `review_flags_review_idx` (`review_id`),
    KEY `review_flags_status_idx` (`status`),
    CONSTRAINT `review_flags_review_fk` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE,
    CONSTRAINT `review_flags_flagged_by_fk` FOREIGN KEY (`flagged_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 11: SHARE PACKS & DOCUMENT SHARING
-- =====================================================

-- Share Packs
CREATE TABLE IF NOT EXISTS `share_packs` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `case_id` CHAR(36) NOT NULL,
    `report_version_id` CHAR(36) NULL DEFAULT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL DEFAULT NULL,
    `created_by` CHAR(36) NOT NULL,
    `expires_at` TIMESTAMP NULL DEFAULT NULL,
    `access_password_hash` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Optional password protection',
    `max_downloads` INT NULL DEFAULT NULL,
    `is_revoked` TINYINT(1) NOT NULL DEFAULT 0,
    `revoked_at` TIMESTAMP NULL DEFAULT NULL,
    `revoked_by` CHAR(36) NULL DEFAULT NULL,
    `revoke_reason` TEXT NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `share_packs_case_idx` (`case_id`),
    KEY `share_packs_report_idx` (`report_version_id`),
    KEY `share_packs_expires_idx` (`expires_at`),
    CONSTRAINT `share_packs_case_fk` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE,
    CONSTRAINT `share_packs_report_fk` FOREIGN KEY (`report_version_id`) REFERENCES `report_versions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Share Pack Items
CREATE TABLE IF NOT EXISTS `share_pack_items` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `share_pack_id` CHAR(36) NOT NULL,
    `item_type` ENUM('report_pdf', 'photo', 'document', 'drawing', 'other') NOT NULL,
    `file_id` CHAR(36) NULL DEFAULT NULL,
    `report_version_id` CHAR(36) NULL DEFAULT NULL,
    `display_order` INT NOT NULL DEFAULT 0,
    `display_name` VARCHAR(255) NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `share_pack_items_pack_idx` (`share_pack_id`),
    CONSTRAINT `share_pack_items_pack_fk` FOREIGN KEY (`share_pack_id`) REFERENCES `share_packs` (`id`) ON DELETE CASCADE,
    CONSTRAINT `share_pack_items_file_fk` FOREIGN KEY (`file_id`) REFERENCES `media_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Share Pack Recipients
CREATE TABLE IF NOT EXISTS `share_pack_recipients` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `share_pack_id` CHAR(36) NOT NULL,
    `recipient_type` ENUM('user', 'email') NOT NULL,
    `user_id` CHAR(36) NULL DEFAULT NULL,
    `email` VARCHAR(255) NULL DEFAULT NULL,
    `name` VARCHAR(255) NULL DEFAULT NULL,
    `access_token` VARCHAR(255) NOT NULL COMMENT 'Unique secure token for access',
    `first_accessed_at` TIMESTAMP NULL DEFAULT NULL,
    `last_accessed_at` TIMESTAMP NULL DEFAULT NULL,
    `access_count` INT NOT NULL DEFAULT 0,
    `download_count` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `share_pack_recipients_token` (`access_token`),
    KEY `share_pack_recipients_pack_idx` (`share_pack_id`),
    KEY `share_pack_recipients_user_idx` (`user_id`),
    CONSTRAINT `share_pack_recipients_pack_fk` FOREIGN KEY (`share_pack_id`) REFERENCES `share_packs` (`id`) ON DELETE CASCADE,
    CONSTRAINT `share_pack_recipients_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Share Pack Access Logs
CREATE TABLE IF NOT EXISTS `share_pack_access_logs` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `share_pack_id` CHAR(36) NOT NULL,
    `recipient_id` CHAR(36) NULL DEFAULT NULL,
    `action` ENUM('view', 'download', 'download_item', 'print') NOT NULL,
    `item_id` CHAR(36) NULL DEFAULT NULL,
    `ip_address` VARCHAR(45) NOT NULL,
    `user_agent` TEXT NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `share_pack_access_logs_pack_idx` (`share_pack_id`),
    KEY `share_pack_access_logs_recipient_idx` (`recipient_id`),
    KEY `share_pack_access_logs_created_idx` (`created_at`),
    CONSTRAINT `share_pack_access_logs_pack_fk` FOREIGN KEY (`share_pack_id`) REFERENCES `share_packs` (`id`) ON DELETE CASCADE,
    CONSTRAINT `share_pack_access_logs_recipient_fk` FOREIGN KEY (`recipient_id`) REFERENCES `share_pack_recipients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 12: KNOWLEDGE BASE & COMPLIANCE SOURCES
-- =====================================================

-- Knowledge Sources
CREATE TABLE IF NOT EXISTS `knowledge_sources` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `title` VARCHAR(500) NOT NULL,
    `publisher` VARCHAR(255) NOT NULL,
    `source_type` ENUM('legislation', 'standard', 'guideline', 'policy', 'resource', 'form') NOT NULL,
    `url` VARCHAR(1000) NOT NULL,
    `description` TEXT NULL DEFAULT NULL,
    `category` VARCHAR(100) NULL DEFAULT NULL,
    `last_checked_at` TIMESTAMP NULL DEFAULT NULL,
    `last_changed_at` TIMESTAMP NULL DEFAULT NULL,
    `content_hash` VARCHAR(64) NULL DEFAULT NULL COMMENT 'SHA-256 of content for change detection',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `check_frequency_days` INT NOT NULL DEFAULT 30,
    `requires_approval` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `knowledge_sources_type_idx` (`source_type`),
    KEY `knowledge_sources_category_idx` (`category`),
    FULLTEXT KEY `knowledge_sources_search` (`title`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Knowledge Snapshots
CREATE TABLE IF NOT EXISTS `knowledge_snapshots` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `source_id` CHAR(36) NOT NULL,
    `content_hash` VARCHAR(64) NOT NULL,
    `metadata` JSON NULL DEFAULT NULL COMMENT 'Page title, headers, etc.',
    `snapshot_file_id` CHAR(36) NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `knowledge_snapshots_source_idx` (`source_id`),
    KEY `knowledge_snapshots_created_idx` (`created_at`),
    CONSTRAINT `knowledge_snapshots_source_fk` FOREIGN KEY (`source_id`) REFERENCES `knowledge_sources` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Knowledge Change Reports
CREATE TABLE IF NOT EXISTS `knowledge_change_reports` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `source_id` CHAR(36) NOT NULL,
    `previous_snapshot_id` CHAR(36) NULL DEFAULT NULL,
    `new_snapshot_id` CHAR(36) NOT NULL,
    `change_summary` TEXT NULL DEFAULT NULL,
    `change_type` ENUM('content', 'url', 'unavailable', 'restored') NOT NULL,
    `requires_review` TINYINT(1) NOT NULL DEFAULT 1,
    `reviewed_by` CHAR(36) NULL DEFAULT NULL,
    `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
    `review_notes` TEXT NULL DEFAULT NULL,
    `is_approved` TINYINT(1) NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `knowledge_change_reports_source_idx` (`source_id`),
    KEY `knowledge_change_reports_review_idx` (`requires_review`, `reviewed_at`),
    CONSTRAINT `knowledge_change_reports_source_fk` FOREIGN KEY (`source_id`) REFERENCES `knowledge_sources` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 13: MESSAGING
-- =====================================================

-- Conversations
CREATE TABLE IF NOT EXISTS `conversations` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `case_id` CHAR(36) NULL DEFAULT NULL,
    `subject` VARCHAR(255) NULL DEFAULT NULL,
    `conversation_type` ENUM('direct', 'case', 'group') NOT NULL DEFAULT 'direct',
    `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `conversations_case_idx` (`case_id`),
    CONSTRAINT `conversations_case_fk` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversation Participants
CREATE TABLE IF NOT EXISTS `conversation_participants` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `conversation_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `joined_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `left_at` TIMESTAMP NULL DEFAULT NULL,
    `last_read_at` TIMESTAMP NULL DEFAULT NULL,
    `is_muted` TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `conversation_participants_unique` (`conversation_id`, `user_id`),
    KEY `conversation_participants_user_idx` (`user_id`),
    CONSTRAINT `conversation_participants_conversation_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `conversation_participants_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages
CREATE TABLE IF NOT EXISTS `messages` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `conversation_id` CHAR(36) NOT NULL,
    `sender_id` CHAR(36) NOT NULL,
    `content` TEXT NOT NULL COMMENT 'Encrypted',
    `is_encrypted` TINYINT(1) NOT NULL DEFAULT 1,
    `is_system_message` TINYINT(1) NOT NULL DEFAULT 0,
    `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `messages_conversation_idx` (`conversation_id`),
    KEY `messages_sender_idx` (`sender_id`),
    KEY `messages_created_idx` (`created_at`),
    CONSTRAINT `messages_conversation_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `messages_sender_fk` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Message Attachments
CREATE TABLE IF NOT EXISTS `message_attachments` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `message_id` CHAR(36) NOT NULL,
    `file_id` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `message_attachments_message_idx` (`message_id`),
    CONSTRAINT `message_attachments_message_fk` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
    CONSTRAINT `message_attachments_file_fk` FOREIGN KEY (`file_id`) REFERENCES `media_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 14: EMAIL QUEUE & NOTIFICATIONS
-- =====================================================

-- Outbound Email Queue
CREATE TABLE IF NOT EXISTS `outbound_emails` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `recipient_email` VARCHAR(255) NOT NULL,
    `recipient_name` VARCHAR(255) NULL DEFAULT NULL,
    `from_email` VARCHAR(255) NOT NULL,
    `from_name` VARCHAR(255) NULL DEFAULT NULL,
    `reply_to` VARCHAR(255) NULL DEFAULT NULL,
    `subject` VARCHAR(500) NOT NULL,
    `body_html` TEXT NOT NULL,
    `body_text` TEXT NULL DEFAULT NULL,
    `attachments` JSON NULL DEFAULT NULL COMMENT 'Array of file IDs',
    `priority` ENUM('low', 'normal', 'high') NOT NULL DEFAULT 'normal',
    `status` ENUM('pending', 'sending', 'sent', 'failed', 'bounced') NOT NULL DEFAULT 'pending',
    `attempts` INT NOT NULL DEFAULT 0,
    `max_attempts` INT NOT NULL DEFAULT 3,
    `last_attempt_at` TIMESTAMP NULL DEFAULT NULL,
    `sent_at` TIMESTAMP NULL DEFAULT NULL,
    `error_message` TEXT NULL DEFAULT NULL,
    `message_id` VARCHAR(255) NULL DEFAULT NULL COMMENT 'SMTP message ID',
    `metadata` JSON NULL DEFAULT NULL,
    `scheduled_for` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `outbound_emails_status_idx` (`status`),
    KEY `outbound_emails_scheduled_idx` (`scheduled_for`),
    KEY `outbound_emails_recipient_idx` (`recipient_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email Events (Delivery tracking)
CREATE TABLE IF NOT EXISTS `email_events` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `email_id` CHAR(36) NOT NULL,
    `event_type` ENUM('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed') NOT NULL,
    `event_data` JSON NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `email_events_email_idx` (`email_id`),
    KEY `email_events_type_idx` (`event_type`),
    CONSTRAINT `email_events_email_fk` FOREIGN KEY (`email_id`) REFERENCES `outbound_emails` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `user_id` CHAR(36) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `action_url` VARCHAR(500) NULL DEFAULT NULL,
    `data` JSON NULL DEFAULT NULL,
    `is_read` TINYINT(1) NOT NULL DEFAULT 0,
    `read_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `notifications_user_idx` (`user_id`),
    KEY `notifications_read_idx` (`is_read`),
    KEY `notifications_created_idx` (`created_at`),
    CONSTRAINT `notifications_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 15: AUDIT & SECURITY LOGS
-- =====================================================

-- Audit Logs (Immutable clinical record actions)
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `user_id` CHAR(36) NULL DEFAULT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` CHAR(36) NULL DEFAULT NULL,
    `old_values` JSON NULL DEFAULT NULL,
    `new_values` JSON NULL DEFAULT NULL,
    `ip_address` VARCHAR(45) NULL DEFAULT NULL,
    `user_agent` TEXT NULL DEFAULT NULL,
    `session_id` CHAR(36) NULL DEFAULT NULL,
    `metadata` JSON NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `audit_logs_user_idx` (`user_id`),
    KEY `audit_logs_action_idx` (`action`),
    KEY `audit_logs_entity_idx` (`entity_type`, `entity_id`),
    KEY `audit_logs_created_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Security Events
CREATE TABLE IF NOT EXISTS `security_events` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `event_type` ENUM('login_success', 'login_failed', 'logout', 'password_reset', 'mfa_enabled', 'mfa_disabled', 'account_locked', 'suspicious_activity', 'unauthorized_access', 'rate_limit_exceeded', 'csrf_violation') NOT NULL,
    `user_id` CHAR(36) NULL DEFAULT NULL,
    `ip_address` VARCHAR(45) NOT NULL,
    `user_agent` TEXT NULL DEFAULT NULL,
    `details` JSON NULL DEFAULT NULL,
    `severity` ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'info',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `security_events_type_idx` (`event_type`),
    KEY `security_events_user_idx` (`user_id`),
    KEY `security_events_ip_idx` (`ip_address`),
    KEY `security_events_created_idx` (`created_at`),
    KEY `security_events_severity_idx` (`severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rate Limiting
CREATE TABLE IF NOT EXISTS `rate_limits` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `identifier` VARCHAR(255) NOT NULL COMMENT 'IP address or user ID',
    `action` VARCHAR(100) NOT NULL,
    `attempts` INT NOT NULL DEFAULT 1,
    `window_start` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `blocked_until` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `rate_limits_identifier_action` (`identifier`, `action`),
    KEY `rate_limits_blocked_idx` (`blocked_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CSRF Tokens
CREATE TABLE IF NOT EXISTS `csrf_tokens` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `session_id` CHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` TIMESTAMP NOT NULL,
    `used_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `csrf_tokens_session_idx` (`session_id`),
    KEY `csrf_tokens_expires_idx` (`expires_at`),
    CONSTRAINT `csrf_tokens_session_fk` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 16: TELEHEALTH (OPTIONAL MODULE)
-- =====================================================

-- Telehealth Sessions
CREATE TABLE IF NOT EXISTS `telehealth_sessions` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `visit_id` CHAR(36) NOT NULL,
    `room_id` VARCHAR(255) NOT NULL COMMENT 'Jitsi room ID',
    `room_password` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Encrypted',
    `scheduled_start` TIMESTAMP NOT NULL,
    `scheduled_duration_minutes` INT NOT NULL DEFAULT 60,
    `actual_start` TIMESTAMP NULL DEFAULT NULL,
    `actual_end` TIMESTAMP NULL DEFAULT NULL,
    `recording_enabled` TINYINT(1) NOT NULL DEFAULT 0,
    `recording_file_id` CHAR(36) NULL DEFAULT NULL,
    `status` ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'scheduled',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `telehealth_sessions_visit_idx` (`visit_id`),
    KEY `telehealth_sessions_room_idx` (`room_id`),
    CONSTRAINT `telehealth_sessions_visit_fk` FOREIGN KEY (`visit_id`) REFERENCES `visits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Telehealth Participants
CREATE TABLE IF NOT EXISTS `telehealth_participants` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `session_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `join_token` VARCHAR(255) NOT NULL COMMENT 'Unique join token',
    `joined_at` TIMESTAMP NULL DEFAULT NULL,
    `left_at` TIMESTAMP NULL DEFAULT NULL,
    `duration_seconds` INT NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `telehealth_participants_token` (`join_token`),
    KEY `telehealth_participants_session_idx` (`session_id`),
    KEY `telehealth_participants_user_idx` (`user_id`),
    CONSTRAINT `telehealth_participants_session_fk` FOREIGN KEY (`session_id`) REFERENCES `telehealth_sessions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `telehealth_participants_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 17: MY HEALTH RECORD STUBS (INTEGRATION-READY)
-- =====================================================

-- MHR Consent Registry (Placeholder)
CREATE TABLE IF NOT EXISTS `mhr_consent_registry` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `client_id` CHAR(36) NOT NULL,
    `consent_type` ENUM('upload', 'view', 'full') NOT NULL,
    `ihi_number` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Individual Healthcare Identifier - Encrypted',
    `consent_given_at` TIMESTAMP NULL DEFAULT NULL,
    `consent_expires_at` TIMESTAMP NULL DEFAULT NULL,
    `consent_revoked_at` TIMESTAMP NULL DEFAULT NULL,
    `verification_status` ENUM('pending', 'verified', 'failed') NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `mhr_consent_registry_client_idx` (`client_id`),
    CONSTRAINT `mhr_consent_registry_client_fk` FOREIGN KEY (`client_id`) REFERENCES `client_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MHR Document Mappings (Placeholder)
CREATE TABLE IF NOT EXISTS `mhr_document_mappings` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `report_version_id` CHAR(36) NOT NULL,
    `mhr_document_type` VARCHAR(100) NOT NULL COMMENT 'CDA document type',
    `mhr_document_id` VARCHAR(255) NULL DEFAULT NULL COMMENT 'MHR document reference',
    `upload_status` ENUM('pending', 'uploaded', 'failed', 'rejected') NOT NULL DEFAULT 'pending',
    `upload_attempted_at` TIMESTAMP NULL DEFAULT NULL,
    `upload_completed_at` TIMESTAMP NULL DEFAULT NULL,
    `error_message` TEXT NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `mhr_document_mappings_report_idx` (`report_version_id`),
    CONSTRAINT `mhr_document_mappings_report_fk` FOREIGN KEY (`report_version_id`) REFERENCES `report_versions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MHR Certificate Store (Placeholder)
CREATE TABLE IF NOT EXISTS `mhr_certificates` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `organization_id` CHAR(36) NULL DEFAULT NULL,
    `certificate_type` ENUM('hpi_o', 'nash', 'site') NOT NULL,
    `certificate_data` BLOB NULL DEFAULT NULL COMMENT 'Encrypted certificate',
    `certificate_password` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Encrypted',
    `issued_at` TIMESTAMP NULL DEFAULT NULL,
    `expires_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `mhr_certificates_org_idx` (`organization_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 18: SYSTEM SETTINGS & FEATURE FLAGS
-- =====================================================

-- System Settings
CREATE TABLE IF NOT EXISTS `system_settings` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `setting_key` VARCHAR(100) NOT NULL,
    `setting_value` JSON NULL DEFAULT NULL,
    `description` TEXT NULL DEFAULT NULL,
    `is_public` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `system_settings_key_unique` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feature Flags
CREATE TABLE IF NOT EXISTS `feature_flags` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `flag_key` VARCHAR(100) NOT NULL,
    `is_enabled` TINYINT(1) NOT NULL DEFAULT 0,
    `description` TEXT NULL DEFAULT NULL,
    `rollout_percentage` INT NOT NULL DEFAULT 100,
    `user_whitelist` JSON NULL DEFAULT NULL,
    `organization_whitelist` JSON NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `feature_flags_key_unique` (`flag_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 19: TRIGGERS
-- =====================================================

-- Trigger: Auto-generate client system_id
DELIMITER //
CREATE TRIGGER `before_insert_client_profile` 
BEFORE INSERT ON `client_profiles` 
FOR EACH ROW 
BEGIN
    IF NEW.system_id IS NULL THEN
        SET NEW.system_id = CONCAT('PT-', LPAD(FLOOR(RAND() * 999999), 6, '0'));
        WHILE EXISTS (SELECT 1 FROM client_profiles WHERE system_id = NEW.system_id) DO
            SET NEW.system_id = CONCAT('PT-', LPAD(FLOOR(RAND() * 999999), 6, '0'));
        END WHILE;
    END IF;
END//
DELIMITER ;

-- Trigger: Auto-generate therapist system_id
DELIMITER //
CREATE TRIGGER `before_insert_therapist_profile` 
BEFORE INSERT ON `therapist_profiles` 
FOR EACH ROW 
BEGIN
    DECLARE prefix VARCHAR(3);
    IF NEW.system_id IS NULL THEN
        IF NEW.profession = 'occupational_therapist' THEN
            SET prefix = 'OT-';
        ELSEIF NEW.profession = 'physiotherapist' THEN
            SET prefix = 'PT-';
        ELSE
            SET prefix = 'TH-';
        END IF;
        SET NEW.system_id = CONCAT(prefix, LPAD(FLOOR(RAND() * 999999), 6, '0'));
        WHILE EXISTS (SELECT 1 FROM therapist_profiles WHERE system_id = NEW.system_id) DO
            SET NEW.system_id = CONCAT(prefix, LPAD(FLOOR(RAND() * 999999), 6, '0'));
        END WHILE;
    END IF;
END//
DELIMITER ;

-- Trigger: Auto-generate case manager system_id
DELIMITER //
CREATE TRIGGER `before_insert_case_manager_profile` 
BEFORE INSERT ON `case_manager_profiles` 
FOR EACH ROW 
BEGIN
    IF NEW.system_id IS NULL THEN
        SET NEW.system_id = CONCAT('CM-', LPAD(FLOOR(RAND() * 999999), 6, '0'));
        WHILE EXISTS (SELECT 1 FROM case_manager_profiles WHERE system_id = NEW.system_id) DO
            SET NEW.system_id = CONCAT('CM-', LPAD(FLOOR(RAND() * 999999), 6, '0'));
        END WHILE;
    END IF;
END//
DELIMITER ;

-- Trigger: Auto-generate case number
DELIMITER //
CREATE TRIGGER `before_insert_case` 
BEFORE INSERT ON `cases` 
FOR EACH ROW 
BEGIN
    IF NEW.case_number IS NULL THEN
        SET NEW.case_number = CONCAT('CASE-', LPAD(FLOOR(RAND() * 999999), 6, '0'));
        WHILE EXISTS (SELECT 1 FROM cases WHERE case_number = NEW.case_number) DO
            SET NEW.case_number = CONCAT('CASE-', LPAD(FLOOR(RAND() * 999999), 6, '0'));
        END WHILE;
    END IF;
END//
DELIMITER ;

-- Trigger: Prevent audit log modification
DELIMITER //
CREATE TRIGGER `prevent_audit_log_update` 
BEFORE UPDATE ON `audit_logs` 
FOR EACH ROW 
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Audit logs cannot be modified';
END//
DELIMITER ;

-- Trigger: Prevent audit log deletion
DELIMITER //
CREATE TRIGGER `prevent_audit_log_delete` 
BEFORE DELETE ON `audit_logs` 
FOR EACH ROW 
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Audit logs cannot be deleted';
END//
DELIMITER ;

-- =====================================================
-- SECTION 20: INITIAL DATA
-- =====================================================

-- Insert default roles
INSERT INTO `roles` (`id`, `name`, `display_name`, `description`, `is_system`) VALUES
(UUID(), 'admin', 'System Administrator', 'Full system access', 1),
(UUID(), 'org_manager', 'Organization Manager', 'Manages organization settings and staff', 1),
(UUID(), 'therapist', 'Therapist', 'OT, Physio, or other allied health professional', 1),
(UUID(), 'case_manager', 'Case Manager', 'Support coordinator, recovery coach, or case manager', 1),
(UUID(), 'client', 'Client', 'Service recipient', 1),
(UUID(), 'carer', 'Carer', 'Family member or informal carer', 1),
(UUID(), 'funder', 'Funder Contact', 'View-only access to shared documents', 1);

-- Insert default permissions
INSERT INTO `permissions` (`id`, `name`, `display_name`, `module`) VALUES
-- Core permissions
(UUID(), 'users.view', 'View Users', 'core'),
(UUID(), 'users.create', 'Create Users', 'core'),
(UUID(), 'users.edit', 'Edit Users', 'core'),
(UUID(), 'users.delete', 'Delete Users', 'core'),
-- Case permissions
(UUID(), 'cases.view', 'View Cases', 'cases'),
(UUID(), 'cases.create', 'Create Cases', 'cases'),
(UUID(), 'cases.edit', 'Edit Cases', 'cases'),
(UUID(), 'cases.delete', 'Delete Cases', 'cases'),
(UUID(), 'cases.assign', 'Assign Cases', 'cases'),
-- Assessment permissions
(UUID(), 'assessments.view', 'View Assessments', 'assessments'),
(UUID(), 'assessments.create', 'Create Assessments', 'assessments'),
(UUID(), 'assessments.edit', 'Edit Assessments', 'assessments'),
(UUID(), 'assessments.delete', 'Delete Assessments', 'assessments'),
-- Report permissions
(UUID(), 'reports.view', 'View Reports', 'reports'),
(UUID(), 'reports.create', 'Create Reports', 'reports'),
(UUID(), 'reports.edit', 'Edit Reports', 'reports'),
(UUID(), 'reports.approve', 'Approve Reports', 'reports'),
(UUID(), 'reports.share', 'Share Reports', 'reports'),
-- Admin permissions
(UUID(), 'admin.settings', 'Manage System Settings', 'admin'),
(UUID(), 'admin.users', 'Manage All Users', 'admin'),
(UUID(), 'admin.audit', 'View Audit Logs', 'admin'),
(UUID(), 'admin.moderation', 'Moderate Reviews', 'admin');

-- Insert default system settings
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`, `is_public`) VALUES
('site_name', '"Rehab Source"', 'Portal name', 1),
('site_tagline', '"Australian OT + Physio All-in-One Portal"', 'Site tagline', 1),
('max_upload_mb', '5', 'Maximum file upload size in MB', 0),
('session_timeout_minutes', '60', 'Session timeout in minutes', 0),
('require_mfa', 'false', 'Require MFA for all users', 0),
('email_attach_pdf', 'true', 'Allow PDF attachments in emails', 0),
('email_max_attachment_mb', '10', 'Maximum email attachment size in MB', 0),
('data_retention_years', '5', 'Data retention period in years', 0);

-- Insert default feature flags
INSERT INTO `feature_flags` (`flag_key`, `is_enabled`, `description`) VALUES
('telehealth', 0, 'Enable telehealth video calls'),
('mhr_integration', 0, 'Enable My Health Record integration (requires certificates)'),
('equipment_module', 1, 'Enable equipment sourcing and trials'),
('reviews_enabled', 1, 'Enable two-way ratings and reviews'),
('pwa_offline', 1, 'Enable PWA offline mode');

-- Insert knowledge sources (compliance references)
INSERT INTO `knowledge_sources` (`title`, `publisher`, `source_type`, `url`, `category`) VALUES
('NDIS Practice Standards', 'NDIS Quality and Safeguards Commission', 'standard', 'https://www.ndiscommission.gov.au/providers/ndis-practice-standards', 'NDIS'),
('NDIS Home Modifications Explained', 'NDIA', 'guideline', 'https://www.ndis.gov.au/participants/home-equipment-and-supports/home-modifications-explained', 'Home Modifications'),
('NDIS Home Modifications Provider Guidance', 'NDIA', 'guideline', 'https://www.ndis.gov.au/providers/housing-and-living-supports-and-services/home-modifications', 'Home Modifications'),
('Disability (Access to Premises) Standards 2010', 'Federal Register of Legislation', 'legislation', 'https://www.legislation.gov.au/Details/F2010L00668', 'Accessibility'),
('Livable Housing Design Guidelines', 'ABCB', 'standard', 'https://www.abcb.gov.au/resources/livable-housing-design', 'Accessibility'),
('AS 1428.1 Design for Access and Mobility', 'Standards Australia', 'standard', 'https://www.standards.org.au/', 'Accessibility');

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
