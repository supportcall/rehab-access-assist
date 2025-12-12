# RehabSource OT Assessment Portal - Complete Deployment Guide

## Prerequisites

- cPanel VPS with SSH access
- PHP 7.4+ (PHP 8.x recommended)
- MySQL 5.7+ or MariaDB 10.3+
- Domain with SSL certificate (Let's Encrypt)
- Node.js 18+ (for building frontend locally)

---

## PART 1: LOCAL BUILD (On Your Development Machine)

### Step 1.1: Clone and Build Frontend

```bash
# Create workspace
ts=$(date +%Y%m%d-%H%M)
WORKDIR="$HOME/${ts}deploy"
mkdir -p "$WORKDIR" && cd "$WORKDIR"

# Clone repository
REPO_URL="https://github.com/supportcall/rehab-access-assist.git"
git clone "$REPO_URL" rehab-access-assist
cd rehab-access-assist

# Create production vite config
cat > vite.config.ts <<'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
EOF

# Install dependencies and build
npm ci || npm install
npm run build
```

### Step 1.2: Create Deployment Package

```bash
# Create deployment zip with frontend + backend
mkdir -p deployment-package
cp -r dist/* deployment-package/
mkdir -p deployment-package/api/v1
cp -r php-backend/* deployment-package/api/v1/
cp public/.htaccess deployment-package/.htaccess

# Create uploads directory structure
mkdir -p deployment-package/uploads/assessment-photos

# Create the zip
cd deployment-package
zip -r "../$(date +%Y%m%d-%H%M)-rehabsource-complete.zip" .
cd ..
ls -lh *rehabsource-complete.zip
```

---

## PART 2: SERVER SETUP (On Your cPanel VPS)

### Step 2.1: Create MySQL Database

**Via cPanel → MySQL Databases:**

1. **Create Database:**
   - Database Name: `rehabsource_db` (cPanel will prefix with your username)
   - Note the full name: `username_rehabsource_db`

2. **Create Database User:**
   - Username: `rehabsource_user` (cPanel will prefix)
   - Password: Generate a strong password (32+ characters)
   - Note the full username: `username_rehabsource_user`

3. **Add User to Database:**
   - Select the user and database
   - Grant **ALL PRIVILEGES**
   - Click "Make Changes"

### Step 2.2: Import Database Schema

**Via cPanel → phpMyAdmin:**

1. Select your database (`username_rehabsource_db`)
2. Click "Import" tab
3. Upload and run this SQL:

```sql
-- =====================================================
-- RehabSource OT Assessment Portal - MySQL Schema
-- Version: 1.0.0
-- =====================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- -----------------------------------------------------
-- Users Table (Authentication)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` TIMESTAMP NULL,
  `email_verified` BOOLEAN DEFAULT FALSE,
  `raw_user_meta_data` JSON,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- User Roles Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `role` ENUM('system_admin', 'ot_admin', 'pending_ot') NOT NULL DEFAULT 'pending_ot',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_roles_user_id_idx` (`user_id`),
  CONSTRAINT `user_roles_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Profiles Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` CHAR(36) NOT NULL,
  `system_id` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `first_name` VARCHAR(100) DEFAULT NULL,
  `last_name` VARCHAR(100) DEFAULT NULL,
  `mobile_number` VARCHAR(20) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `aphra_registration_number` VARCHAR(50) DEFAULT NULL,
  `suburb` VARCHAR(100) DEFAULT NULL,
  `state` VARCHAR(50) DEFAULT NULL,
  `postal_code` VARCHAR(10) DEFAULT NULL,
  `country` VARCHAR(100) DEFAULT 'Australia',
  `service_area_type` VARCHAR(50) DEFAULT NULL,
  `service_area_value` VARCHAR(255) DEFAULT NULL,
  `service_radius_km` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `profiles_system_id_unique` (`system_id`),
  CONSTRAINT `profiles_user_id_fk` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- OT Signup Requests Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ot_signup_requests` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100) DEFAULT NULL,
  `last_name` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `requested_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` TIMESTAMP NULL,
  `reviewed_by` CHAR(36) DEFAULT NULL,
  `rejection_reason` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ot_signup_requests_user_id_idx` (`user_id`),
  KEY `ot_signup_requests_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- System Settings Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` JSON DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `system_settings_key_unique` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Clients Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `clients` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `system_id` VARCHAR(20) DEFAULT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `date_of_birth` DATE DEFAULT NULL,
  `mobile_number` VARCHAR(20) DEFAULT NULL,
  `diagnosis` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `funding_body` ENUM('NDIS', 'DVA', 'Private', 'Insurance', 'Other') DEFAULT NULL,
  `primary_mobility_aid` ENUM('None', 'Walking Stick', 'Crutches', 'Walking Frame', 'Rollator', 'Manual Wheelchair', 'Power Wheelchair', 'Mobility Scooter', 'Other') DEFAULT NULL,
  `suburb` VARCHAR(100) DEFAULT NULL,
  `state` VARCHAR(50) DEFAULT NULL,
  `postal_code` VARCHAR(10) DEFAULT NULL,
  `country` VARCHAR(100) DEFAULT 'Australia',
  `assigned_ot_id` CHAR(36) DEFAULT NULL,
  `created_by` CHAR(36) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clients_system_id_unique` (`system_id`),
  KEY `clients_assigned_ot_idx` (`assigned_ot_id`),
  KEY `clients_created_by_idx` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Assessments Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `assessments` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `client_id` CHAR(36) NOT NULL,
  `assigned_ot_id` CHAR(36) DEFAULT NULL,
  `created_by` CHAR(36) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'draft',
  `assessment_date` DATE DEFAULT NULL,
  `primary_goal` TEXT DEFAULT NULL,
  `fall_history` TEXT DEFAULT NULL,
  `near_miss_locations` TEXT DEFAULT NULL,
  `difficulty_showering` INT DEFAULT NULL,
  `difficulty_toileting` INT DEFAULT NULL,
  `difficulty_transfers` INT DEFAULT NULL,
  `difficulty_steps` INT DEFAULT NULL,
  `completed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `assessments_client_id_idx` (`client_id`),
  KEY `assessments_assigned_ot_idx` (`assigned_ot_id`),
  KEY `assessments_created_by_idx` (`created_by`),
  CONSTRAINT `assessments_client_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Environmental Areas Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `environmental_areas` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assessment_id` CHAR(36) NOT NULL,
  `area_location` ENUM('entrance', 'hallway', 'living_room', 'kitchen', 'bathroom', 'bedroom', 'laundry', 'outdoor', 'garage', 'stairs', 'other') NOT NULL,
  `area_name` VARCHAR(100) DEFAULT NULL,
  `door_clear_width` INT DEFAULT NULL,
  `threshold_height` INT DEFAULT NULL,
  `ramp_gradient_riser` DECIMAL(5,2) DEFAULT NULL,
  `ramp_gradient_going` DECIMAL(5,2) DEFAULT NULL,
  `toilet_centerline_left` INT DEFAULT NULL,
  `toilet_centerline_right` INT DEFAULT NULL,
  `wall_construction` ENUM('timber_stud', 'steel_stud', 'brick', 'concrete', 'unknown') DEFAULT NULL,
  `barriers` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `photo_urls` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `environmental_areas_assessment_id_idx` (`assessment_id`),
  CONSTRAINT `environmental_areas_assessment_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Clinical Assessment Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `clinical_assessment` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assessment_id` CHAR(36) NOT NULL,
  `mobility_status` TEXT DEFAULT NULL,
  `transfer_methods` TEXT DEFAULT NULL,
  `cognition_status` TEXT DEFAULT NULL,
  `vision_status` TEXT DEFAULT NULL,
  `perception_status` TEXT DEFAULT NULL,
  `communication_needs` TEXT DEFAULT NULL,
  `skin_integrity` TEXT DEFAULT NULL,
  `continence` TEXT DEFAULT NULL,
  `fatigue_pain` TEXT DEFAULT NULL,
  `thermoregulation` TEXT DEFAULT NULL,
  `sensory_sensitivities` TEXT DEFAULT NULL,
  `gait_endurance` TEXT DEFAULT NULL,
  `carer_capacity` TEXT DEFAULT NULL,
  `manual_handling_risk` TEXT DEFAULT NULL,
  `special_population` TEXT DEFAULT NULL,
  `special_considerations` TEXT DEFAULT NULL,
  `standing_height` INT DEFAULT NULL,
  `sitting_height` INT DEFAULT NULL,
  `shoulder_height` INT DEFAULT NULL,
  `reach_measurement` INT DEFAULT NULL,
  `knee_clearance` INT DEFAULT NULL,
  `toe_clearance` INT DEFAULT NULL,
  `wheelchair_type` VARCHAR(100) DEFAULT NULL,
  `wheelchair_width` INT DEFAULT NULL,
  `wheelchair_length` INT DEFAULT NULL,
  `wheelchair_height` INT DEFAULT NULL,
  `wheelchair_turning_radius` INT DEFAULT NULL,
  `hoist_needed` BOOLEAN DEFAULT FALSE,
  `pressure_care_needed` BOOLEAN DEFAULT FALSE,
  `single_carer` BOOLEAN DEFAULT FALSE,
  `two_carer_needed` BOOLEAN DEFAULT FALSE,
  `home_fast_score` VARCHAR(50) DEFAULT NULL,
  `safer_home_score` VARCHAR(50) DEFAULT NULL,
  `westmead_score` VARCHAR(50) DEFAULT NULL,
  `copm_score` VARCHAR(50) DEFAULT NULL,
  `adl_bathing` TEXT DEFAULT NULL,
  `adl_toileting` TEXT DEFAULT NULL,
  `adl_dressing` TEXT DEFAULT NULL,
  `adl_kitchen` TEXT DEFAULT NULL,
  `adl_laundry` TEXT DEFAULT NULL,
  `adl_entry_egress` TEXT DEFAULT NULL,
  `adl_vehicle_transfers` TEXT DEFAULT NULL,
  `adl_community_access` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clinical_assessment_assessment_id_unique` (`assessment_id`),
  CONSTRAINT `clinical_assessment_assessment_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Pre-Visit Details Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pre_visit_details` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assessment_id` CHAR(36) NOT NULL,
  `referral_reason` TEXT DEFAULT NULL,
  `diagnoses_prognosis` TEXT DEFAULT NULL,
  `participant_goals` TEXT DEFAULT NULL,
  `current_at_list` TEXT DEFAULT NULL,
  `previous_modifications` TEXT DEFAULT NULL,
  `prior_falls_incidents` TEXT DEFAULT NULL,
  `tenancy_ownership_details` TEXT DEFAULT NULL,
  `landlord_strata_contacts` TEXT DEFAULT NULL,
  `floor_plans_available` BOOLEAN DEFAULT FALSE,
  `consent_obtained` BOOLEAN DEFAULT FALSE,
  `ndia_template_used` VARCHAR(100) DEFAULT NULL,
  `approval_pathway` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pre_visit_details_assessment_id_unique` (`assessment_id`),
  CONSTRAINT `pre_visit_details_assessment_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Funding Pathway Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `funding_pathway` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assessment_id` CHAR(36) NOT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `classification` VARCHAR(100) DEFAULT NULL,
  `estimated_cost` DECIMAL(12,2) DEFAULT NULL,
  `structural_works` BOOLEAN DEFAULT FALSE,
  `multi_area_works` BOOLEAN DEFAULT FALSE,
  `permits_required` BOOLEAN DEFAULT FALSE,
  `quotes_required` INT DEFAULT NULL,
  `ndia_criteria_goals` TEXT DEFAULT NULL,
  `ndia_criteria_safety` TEXT DEFAULT NULL,
  `ndia_criteria_effectiveness` TEXT DEFAULT NULL,
  `ndia_criteria_alternatives` TEXT DEFAULT NULL,
  `ndia_criteria_value` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `funding_pathway_assessment_id_unique` (`assessment_id`),
  CONSTRAINT `funding_pathway_assessment_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- AT Audit Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `at_audit` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assessment_id` CHAR(36) NOT NULL,
  `current_at_type` VARCHAR(255) DEFAULT NULL,
  `at_condition` TEXT DEFAULT NULL,
  `at_compliance` BOOLEAN DEFAULT NULL,
  `at_maintenance` TEXT DEFAULT NULL,
  `trials_conducted` TEXT DEFAULT NULL,
  `trial_outcomes` TEXT DEFAULT NULL,
  `maneuvering_envelopes` TEXT DEFAULT NULL,
  `power_requirements` TEXT DEFAULT NULL,
  `charging_requirements` TEXT DEFAULT NULL,
  `storage_requirements` TEXT DEFAULT NULL,
  `structural_works_still_required` BOOLEAN DEFAULT FALSE,
  `structural_works_justification` TEXT DEFAULT NULL,
  `photo_urls` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `at_audit_assessment_id_unique` (`assessment_id`),
  CONSTRAINT `at_audit_assessment_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Site Survey Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `site_survey` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assessment_id` CHAR(36) NOT NULL,
  -- Access & Parking
  `parking_bay_dimensions` VARCHAR(100) DEFAULT NULL,
  `set_down_area` BOOLEAN DEFAULT NULL,
  `kerb_driveway_gradients` TEXT DEFAULT NULL,
  `gate_clear_opening` INT DEFAULT NULL,
  `path_width` INT DEFAULT NULL,
  `path_gradient` VARCHAR(100) DEFAULT NULL,
  `path_crossfall` VARCHAR(100) DEFAULT NULL,
  `step_ramp_feasible` BOOLEAN DEFAULT NULL,
  `weather_protection` BOOLEAN DEFAULT NULL,
  `site_lighting` TEXT DEFAULT NULL,
  -- Entrance
  `entrance_door_clear_opening` INT DEFAULT NULL,
  `entrance_threshold_height` INT DEFAULT NULL,
  `entrance_landing_area` TEXT DEFAULT NULL,
  -- Internal Circulation
  `corridors_width` INT DEFAULT NULL,
  `doors_compliant` BOOLEAN DEFAULT NULL,
  `turning_spaces_adequate` BOOLEAN DEFAULT NULL,
  -- Stairs (if applicable)
  `stairs_treads_risers` TEXT DEFAULT NULL,
  `stairs_handrail_config` TEXT DEFAULT NULL,
  `stairs_nosings` TEXT DEFAULT NULL,
  `stairs_lighting` TEXT DEFAULT NULL,
  `stairs_landings` TEXT DEFAULT NULL,
  `stairs_headroom` INT DEFAULT NULL,
  `stairs_photo_urls` JSON DEFAULT NULL,
  -- Bathroom
  `bathroom_hobless_shower_feasible` BOOLEAN DEFAULT NULL,
  `bathroom_falls_to_waste` TEXT DEFAULT NULL,
  `bathroom_slip_resistance` TEXT DEFAULT NULL,
  `bathroom_wall_reinforcement` BOOLEAN DEFAULT NULL,
  `bathroom_toilet_setout` TEXT DEFAULT NULL,
  `bathroom_toilet_height` INT DEFAULT NULL,
  `bathroom_basin_approach` TEXT DEFAULT NULL,
  `bathroom_screen_type` TEXT DEFAULT NULL,
  `bathroom_ventilation` TEXT DEFAULT NULL,
  `bathroom_ip_ratings` TEXT DEFAULT NULL,
  `bathroom_photo_urls` JSON DEFAULT NULL,
  -- Bedroom
  `bedroom_transfer_sides` TEXT DEFAULT NULL,
  `bedroom_bed_height` INT DEFAULT NULL,
  `bedroom_hoist_space` BOOLEAN DEFAULT NULL,
  `bedroom_commode_space` BOOLEAN DEFAULT NULL,
  `bedroom_wardrobe_reach` TEXT DEFAULT NULL,
  `bedroom_emergency_egress` BOOLEAN DEFAULT NULL,
  `bedroom_photo_urls` JSON DEFAULT NULL,
  -- Kitchen
  `kitchen_bench_heights` INT DEFAULT NULL,
  `kitchen_aisle_widths` INT DEFAULT NULL,
  `kitchen_knee_clearances` INT DEFAULT NULL,
  `kitchen_sink_access` TEXT DEFAULT NULL,
  `kitchen_hob_access` TEXT DEFAULT NULL,
  `kitchen_oven_access` TEXT DEFAULT NULL,
  `kitchen_storage_access` TEXT DEFAULT NULL,
  `kitchen_task_lighting` TEXT DEFAULT NULL,
  `kitchen_scald_risk` TEXT DEFAULT NULL,
  `kitchen_photo_urls` JSON DEFAULT NULL,
  -- Living Areas
  `living_furniture_layout` TEXT DEFAULT NULL,
  `living_seating_heights` TEXT DEFAULT NULL,
  `living_control_reaches` TEXT DEFAULT NULL,
  `living_trip_risks` TEXT DEFAULT NULL,
  `living_photo_urls` JSON DEFAULT NULL,
  -- Laundry
  `laundry_machine_access` TEXT DEFAULT NULL,
  `laundry_circulation` TEXT DEFAULT NULL,
  `laundry_drainage` TEXT DEFAULT NULL,
  `laundry_photo_urls` JSON DEFAULT NULL,
  -- Outdoor Areas
  `outdoor_patio_levels` TEXT DEFAULT NULL,
  `outdoor_thresholds` TEXT DEFAULT NULL,
  `outdoor_hardstand` BOOLEAN DEFAULT NULL,
  `outdoor_weather_drainage` TEXT DEFAULT NULL,
  `outdoor_clothesline_access` TEXT DEFAULT NULL,
  `outdoor_bin_access` TEXT DEFAULT NULL,
  `outdoor_photo_urls` JSON DEFAULT NULL,
  -- Electrical & Services
  `switches_gpos_heights` TEXT DEFAULT NULL,
  `board_capacity` TEXT DEFAULT NULL,
  `rcds_present` BOOLEAN DEFAULT NULL,
  `hot_water_temp_compliant` BOOLEAN DEFAULT NULL,
  `tmv_present` BOOLEAN DEFAULT NULL,
  `heating_cooling_controls` TEXT DEFAULT NULL,
  `smoke_alarms_compliant` BOOLEAN DEFAULT NULL,
  `smoke_alarms_interconnected` BOOLEAN DEFAULT NULL,
  `comms_intercom` TEXT DEFAULT NULL,
  `drainage_adequate` BOOLEAN DEFAULT NULL,
  `stormwater_impacts` TEXT DEFAULT NULL,
  `ventilation_wet_areas` TEXT DEFAULT NULL,
  -- Hazardous Materials
  `asbestos_likelihood` TEXT DEFAULT NULL,
  `asbestos_locations` TEXT DEFAULT NULL,
  `asbestos_testing_required` BOOLEAN DEFAULT NULL,
  `lead_paint_risk` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_survey_assessment_id_unique` (`assessment_id`),
  CONSTRAINT `site_survey_assessment_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Structural Reconnaissance Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `structural_reconnaissance` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assessment_id` CHAR(36) NOT NULL,
  `wall_construction` TEXT DEFAULT NULL,
  `stud_layout` TEXT DEFAULT NULL,
  `slab_joist_details` TEXT DEFAULT NULL,
  `ceiling_roof_framing` TEXT DEFAULT NULL,
  `hoist_load_paths` TEXT DEFAULT NULL,
  `deflection_tolerances` TEXT DEFAULT NULL,
  `engineer_required` BOOLEAN DEFAULT FALSE,
  `engineer_notes` TEXT DEFAULT NULL,
  `photo_urls` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `structural_reconnaissance_assessment_id_unique` (`assessment_id`),
  CONSTRAINT `structural_reconnaissance_assessment_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Measurements Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `measurements` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assessment_id` CHAR(36) NOT NULL,
  `location` VARCHAR(100) NOT NULL,
  `measurement_type` VARCHAR(100) NOT NULL,
  `value_mm` INT DEFAULT NULL,
  `required_value_mm` INT DEFAULT NULL,
  `compliant` BOOLEAN DEFAULT NULL,
  `standard_reference` VARCHAR(100) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `photo_urls` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `measurements_assessment_id_idx` (`assessment_id`),
  CONSTRAINT `measurements_assessment_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Risks Controls Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `risks_controls` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assessment_id` CHAR(36) NOT NULL,
  `risk_type` VARCHAR(100) NOT NULL,
  `risk_description` TEXT DEFAULT NULL,
  `severity` ENUM('low', 'medium', 'high', 'critical') DEFAULT NULL,
  `control_measure` TEXT DEFAULT NULL,
  `home_fast_item` VARCHAR(100) DEFAULT NULL,
  `safer_home_item` VARCHAR(100) DEFAULT NULL,
  `wehsa_item` VARCHAR(100) DEFAULT NULL,
  `lighting_contrast` TEXT DEFAULT NULL,
  `infection_control` TEXT DEFAULT NULL,
  `site_security` TEXT DEFAULT NULL,
  `construction_phase_risks` TEXT DEFAULT NULL,
  `decanting_plan` TEXT DEFAULT NULL,
  `photo_urls` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `risks_controls_assessment_id_idx` (`assessment_id`),
  CONSTRAINT `risks_controls_assessment_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Options Analysis Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `options_analysis` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assessment_id` CHAR(36) NOT NULL,
  `goal_area` VARCHAR(100) NOT NULL,
  `option_type` VARCHAR(100) NOT NULL,
  `option_description` TEXT DEFAULT NULL,
  `estimated_cost` DECIMAL(12,2) DEFAULT NULL,
  `clinical_impact` TEXT DEFAULT NULL,
  `buildability` TEXT DEFAULT NULL,
  `compliance_notes` TEXT DEFAULT NULL,
  `risks` TEXT DEFAULT NULL,
  `ndia_alignment` TEXT DEFAULT NULL,
  `value_for_money_justification` TEXT DEFAULT NULL,
  `program_estimate` VARCHAR(100) DEFAULT NULL,
  `recommended` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `options_analysis_assessment_id_idx` (`assessment_id`),
  CONSTRAINT `options_analysis_assessment_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Compliance Checklist Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `compliance_checklist` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assessment_id` CHAR(36) NOT NULL,
  `standard_reference` VARCHAR(100) NOT NULL,
  `provision_number` VARCHAR(50) DEFAULT NULL,
  `requirement_description` TEXT DEFAULT NULL,
  `compliant` BOOLEAN DEFAULT NULL,
  `non_compliance_notes` TEXT DEFAULT NULL,
  `remediation_required` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `compliance_checklist_assessment_id_idx` (`assessment_id`),
  CONSTRAINT `compliance_checklist_assessment_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Builder Collaboration Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `builder_collaboration` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assessment_id` CHAR(36) NOT NULL,
  `bcp_name` VARCHAR(255) DEFAULT NULL,
  `bcp_license_number` VARCHAR(100) DEFAULT NULL,
  `bcp_engaged_early` BOOLEAN DEFAULT FALSE,
  `scope_of_works` TEXT DEFAULT NULL,
  `disability_specific_scope` TEXT DEFAULT NULL,
  `general_finishes_scope` TEXT DEFAULT NULL,
  `construction_sequence` TEXT DEFAULT NULL,
  `decant_plan` TEXT DEFAULT NULL,
  `quote_1_provider` VARCHAR(255) DEFAULT NULL,
  `quote_1_amount` DECIMAL(12,2) DEFAULT NULL,
  `quote_1_gst_inclusive` BOOLEAN DEFAULT NULL,
  `quote_1_breakdown` TEXT DEFAULT NULL,
  `quote_1_fixtures` TEXT DEFAULT NULL,
  `quote_1_document_url` VARCHAR(500) DEFAULT NULL,
  `quote_2_provider` VARCHAR(255) DEFAULT NULL,
  `quote_2_amount` DECIMAL(12,2) DEFAULT NULL,
  `quote_2_gst_inclusive` BOOLEAN DEFAULT NULL,
  `quote_2_breakdown` TEXT DEFAULT NULL,
  `quote_2_fixtures` TEXT DEFAULT NULL,
  `quote_2_document_url` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `builder_collaboration_assessment_id_unique` (`assessment_id`),
  CONSTRAINT `builder_collaboration_assessment_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Deliverables Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `deliverables` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assessment_id` CHAR(36) NOT NULL,
  `executive_summary` TEXT DEFAULT NULL,
  `clinical_findings` TEXT DEFAULT NULL,
  `outcome_measures_results` TEXT DEFAULT NULL,
  `compliance_statement` TEXT DEFAULT NULL,
  `vfm_justification` TEXT DEFAULT NULL,
  `quotes_analysis` TEXT DEFAULT NULL,
  `construction_sequencing` TEXT DEFAULT NULL,
  `post_build_fit_check` TEXT DEFAULT NULL,
  `at_refit_plan` TEXT DEFAULT NULL,
  `post_occupancy_measurement_plan` TEXT DEFAULT NULL,
  `client_carer_training_plan` TEXT DEFAULT NULL,
  `handover_plan` TEXT DEFAULT NULL,
  `maintenance_notes` TEXT DEFAULT NULL,
  `consent_signed` BOOLEAN DEFAULT FALSE,
  `photos_annotated` BOOLEAN DEFAULT FALSE,
  `measured_drawings_completed` BOOLEAN DEFAULT FALSE,
  `ndia_template_completed` BOOLEAN DEFAULT FALSE,
  `risk_register_completed` BOOLEAN DEFAULT FALSE,
  `scope_of_works_completed` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `deliverables_assessment_id_unique` (`assessment_id`),
  CONSTRAINT `deliverables_assessment_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Technical Drawings Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `technical_drawings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assessment_id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `drawing_type` VARCHAR(100) NOT NULL,
  `room_area` VARCHAR(100) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `svg_content` LONGTEXT DEFAULT NULL,
  `annotations` JSON DEFAULT NULL,
  `measurements_used` JSON DEFAULT NULL,
  `photo_references` JSON DEFAULT NULL,
  `ai_generated` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `technical_drawings_assessment_id_idx` (`assessment_id`),
  CONSTRAINT `technical_drawings_assessment_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Referrals Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `referrals` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `client_id` CHAR(36) NOT NULL,
  `requesting_ot_id` CHAR(36) DEFAULT NULL,
  `target_ot_id` CHAR(36) NOT NULL,
  `referred_to_ot_id` CHAR(36) DEFAULT NULL,
  `status` ENUM('pending', 'accepted', 'rejected', 'referred') DEFAULT 'pending',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `referrals_client_id_idx` (`client_id`),
  KEY `referrals_target_ot_idx` (`target_ot_id`),
  CONSTRAINT `referrals_client_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Uploaded Files Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `uploaded_files` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assessment_id` CHAR(36) DEFAULT NULL,
  `client_id` CHAR(36) DEFAULT NULL,
  `uploaded_by` CHAR(36) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_type` VARCHAR(100) DEFAULT NULL,
  `file_size` INT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `uploaded_files_assessment_id_idx` (`assessment_id`),
  KEY `uploaded_files_client_id_idx` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Sessions Table (for JWT refresh tokens)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `refresh_token` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_idx` (`user_id`),
  KEY `sessions_refresh_token_idx` (`refresh_token`),
  CONSTRAINT `sessions_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Stakeholders Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `stakeholders` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assessment_id` CHAR(36) NOT NULL,
  `participant_name` VARCHAR(255) DEFAULT NULL,
  `decision_makers` TEXT DEFAULT NULL,
  `informal_carers` TEXT DEFAULT NULL,
  `support_coordinator` TEXT DEFAULT NULL,
  `plan_manager` TEXT DEFAULT NULL,
  `ot_assessor` TEXT DEFAULT NULL,
  `builder_bcp` TEXT DEFAULT NULL,
  `project_manager` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stakeholders_assessment_id_unique` (`assessment_id`),
  CONSTRAINT `stakeholders_assessment_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Assessment Tokens Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `assessment_tokens` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assessment_id` CHAR(36) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `used` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assessment_tokens_token_unique` (`token`),
  KEY `assessment_tokens_assessment_id_idx` (`assessment_id`),
  CONSTRAINT `assessment_tokens_assessment_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Triggers for Auto-Generated System IDs
-- -----------------------------------------------------

DELIMITER //

-- Generate profile system ID (OT-XXXXXX)
CREATE TRIGGER before_insert_profile
BEFORE INSERT ON profiles
FOR EACH ROW
BEGIN
  DECLARE new_id VARCHAR(20);
  DECLARE id_exists INT DEFAULT 1;
  
  IF NEW.system_id IS NULL THEN
    WHILE id_exists > 0 DO
      SET new_id = CONCAT('OT-', LPAD(FLOOR(RAND() * 1000000), 6, '0'));
      SELECT COUNT(*) INTO id_exists FROM profiles WHERE system_id = new_id;
    END WHILE;
    SET NEW.system_id = new_id;
  END IF;
END//

-- Generate client system ID (PT-XXXXXX)
CREATE TRIGGER before_insert_client
BEFORE INSERT ON clients
FOR EACH ROW
BEGIN
  DECLARE new_id VARCHAR(20);
  DECLARE id_exists INT DEFAULT 1;
  
  IF NEW.system_id IS NULL THEN
    WHILE id_exists > 0 DO
      SET new_id = CONCAT('PT-', LPAD(FLOOR(RAND() * 1000000), 6, '0'));
      SELECT COUNT(*) INTO id_exists FROM clients WHERE system_id = new_id;
    END WHILE;
    SET NEW.system_id = new_id;
  END IF;
END//

DELIMITER ;

-- -----------------------------------------------------
-- Initial System Settings
-- -----------------------------------------------------
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('site_name', '"RehabSource OT Assessment Portal"', 'The name of the application'),
('require_ot_approval', 'true', 'Whether new OT signups require admin approval'),
('max_upload_size_mb', '20', 'Maximum file upload size in megabytes'),
('session_timeout_hours', '24', 'Session timeout in hours');

-- =====================================================
-- Schema Complete
-- Note: First user to sign up becomes system_admin
-- =====================================================
```

### Step 2.3: Upload Files to Server

**Via cPanel File Manager or SFTP:**

```
Target: /home/<cpaneluser>/public_html/
```

1. Upload `*-rehabsource-complete.zip` to `public_html/`
2. Extract (right-click → Extract)
3. Delete the zip file after extraction

**Final structure should be:**
```
public_html/
├── index.html
├── assets/
│   ├── index-*.js
│   └── index-*.css
├── .htaccess
├── robots.txt
├── sitemap.xml
├── uploads/
│   └── assessment-photos/
└── api/
    └── v1/
        ├── index.php
        ├── .htaccess
        ├── config/
        │   ├── config.php
        │   ├── database.php
        │   └── production.php
        ├── endpoints/
        │   ├── auth/
        │   ├── clients/
        │   ├── assessments/
        │   └── admin/
        └── lib/
            ├── Auth.php
            ├── JWT.php
            ├── Logger.php
            ├── Response.php
            └── Validator.php
```

---

## PART 3: CONFIGURATION

### Step 3.1: Create Production Configuration File

Create `/home/<cpaneluser>/public_html/api/v1/config/config.local.php`:

```php
<?php
/**
 * PRODUCTION CONFIGURATION
 * This file contains sensitive credentials - NEVER commit to Git!
 */

// ===== DATABASE CONFIGURATION =====
define('DB_HOST', 'localhost');
define('DB_NAME', 'cpaneluser_rehabsource_db');  // Your full database name
define('DB_USER', 'cpaneluser_rehabsource_user'); // Your full database username
define('DB_PASS', 'YOUR_STRONG_DATABASE_PASSWORD_HERE'); // The password you created
define('DB_CHARSET', 'utf8mb4');

// ===== JWT CONFIGURATION =====
// Generate with: openssl rand -base64 64
define('JWT_SECRET', 'PASTE_YOUR_64_CHAR_RANDOM_STRING_HERE');
define('JWT_ALGORITHM', 'HS256');
define('JWT_ACCESS_EXPIRY', 3600);      // 1 hour
define('JWT_REFRESH_EXPIRY', 604800);   // 7 days

// ===== APPLICATION SETTINGS =====
define('APP_NAME', 'RehabSource OT Assessment Portal');
define('APP_URL', 'https://yourdomain.com');  // Your actual domain
define('APP_DEBUG', false);  // MUST be false in production!
define('APP_TIMEZONE', 'Australia/Sydney');

// ===== FILE UPLOAD SETTINGS =====
define('UPLOAD_DIR', __DIR__ . '/../../uploads');
define('MAX_UPLOAD_SIZE', 20 * 1024 * 1024); // 20MB
define('ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

// ===== CORS SETTINGS =====
define('CORS_ALLOWED_ORIGINS', ['https://yourdomain.com']); // Your domain
define('CORS_ALLOWED_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
define('CORS_ALLOWED_HEADERS', ['Authorization', 'Content-Type', 'X-Requested-With']);

// ===== LOGGING =====
define('LOG_ENABLED', true);
define('LOG_PATH', __DIR__ . '/../../logs');
define('LOG_LEVEL', 'warning'); // debug, info, warning, error
```

### Step 3.2: Generate JWT Secret

On your server (via SSH) or locally:

```bash
openssl rand -base64 64
```

Copy the output and paste it as the `JWT_SECRET` value in `config.local.php`.

### Step 3.3: Set File Permissions

**Via SSH:**

```bash
cd /home/cpaneluser/public_html

# Protect configuration files
chmod 640 api/v1/config/config.local.php
chmod 750 api/v1/config
chmod 750 api/v1/lib

# Make uploads writable
chmod 755 uploads
chmod 755 uploads/assessment-photos

# Create logs directory
mkdir -p api/v1/logs
chmod 755 api/v1/logs
```

**Or via cPanel File Manager:**
- Right-click each file/folder → Change Permissions
- config.local.php: 640
- config folder: 750
- uploads folder: 755

---

## PART 4: VERIFY HTACCESS FILES

### Step 4.1: Main .htaccess (public_html/.htaccess)

```apache
# React SPA .htaccess
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Handle API requests - proxy to api subdirectory
    RewriteRule ^api/v1/(.*)$ /api/v1/$1 [L,PT]

    # Don't rewrite files or directories
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]

    # Rewrite everything else to index.html for SPA routing
    RewriteRule ^ index.html [L]
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Prevent directory listing
Options -Indexes

# Error documents
ErrorDocument 404 /index.html
```

### Step 4.2: API .htaccess (public_html/api/v1/.htaccess)

```apache
# PHP API Router
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /api/v1/

    # Handle CORS preflight
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ index.php [L]

    # Route all requests to index.php
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>

# PHP settings
<IfModule mod_php.c>
    php_value upload_max_filesize 20M
    php_value post_max_size 25M
    php_value max_execution_time 60
</IfModule>

# Deny access to sensitive files
<FilesMatch "\.(sql|log|md|gitignore)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>

# Protect config directory
<IfModule mod_authz_core.c>
    <Directory "config">
        Require all denied
    </Directory>
</IfModule>
```

---

## PART 5: FIRST-TIME SETUP

### Step 5.1: Test API Connection

Visit in browser:
```
https://yourdomain.com/api/v1/
```

You should see a JSON response like:
```json
{
  "success": true,
  "message": "RehabSource API v1.0",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Step 5.2: Create First Admin User

1. Visit: `https://yourdomain.com/auth`
2. Click "Sign Up"
3. Enter your admin details:
   - Email: `saintsthesaint@gmail.com` (or your admin email)
   - Password: Strong password (12+ characters)
   - First Name, Last Name
4. **The FIRST user is automatically assigned `system_admin` role**

### Step 5.3: Verify Admin Access

1. Log in with your admin credentials
2. Navigate to Admin Dashboard
3. Verify you can see:
   - Dashboard statistics
   - Signup Requests tab
   - Settings tab

---

## PART 6: POST-DEPLOYMENT CHECKLIST

### Security Checks

- [ ] `APP_DEBUG` is set to `false` in config.local.php
- [ ] JWT_SECRET is a unique 64+ character string
- [ ] config.local.php has 640 permissions
- [ ] SSL certificate is active (HTTPS only)
- [ ] CORS_ALLOWED_ORIGINS matches your domain exactly

### Functionality Tests

- [ ] Homepage loads correctly
- [ ] Login works
- [ ] Signup works (new users get pending_ot role)
- [ ] Admin can approve OT signups
- [ ] Can create clients
- [ ] Can start assessments
- [ ] Photo uploads work
- [ ] All assessment stages save correctly

### Performance Checks

- [ ] Pages load within 3 seconds
- [ ] API responses return within 1 second
- [ ] Images are compressed and load quickly

---

## TROUBLESHOOTING

### Issue: 500 Internal Server Error

**Check:**
1. PHP error logs: cPanel → Errors → View logs
2. Verify database credentials in config.local.php
3. Check PHP version is 7.4+

**Fix common causes:**
```bash
# Check PHP version
php -v

# Test database connection
php -r "new PDO('mysql:host=localhost;dbname=yourdb', 'user', 'pass');"
```

### Issue: API 404 Not Found

**Check:**
1. `.htaccess` files are uploaded
2. `mod_rewrite` is enabled

**Verify mod_rewrite:**
Create `/home/cpaneluser/public_html/api/v1/test.php`:
```php
<?php
echo "API is reachable!";
```
Visit: `https://yourdomain.com/api/v1/test.php`

### Issue: CORS Errors

**Check:**
1. `CORS_ALLOWED_ORIGINS` in config.local.php matches your domain
2. Include `https://` in the origin

### Issue: File Upload Fails

**Check:**
1. uploads directory permissions (755)
2. PHP upload_max_filesize setting
3. Disk space available

```bash
# Check disk space
df -h

# Check PHP settings
php -i | grep upload_max_filesize
```

### Issue: Login Not Working

**Check:**
1. Database connection
2. JWT_SECRET is set
3. Browser console for errors

**Test database:**
```bash
mysql -u cpaneluser_rehabsource_user -p cpaneluser_rehabsource_db
# Enter password when prompted
# If successful, you'll see mysql> prompt
```

---

## MAINTENANCE

### Regular Tasks

1. **Weekly:** Check error logs
2. **Monthly:** Update SSL certificate (auto-renew with Let's Encrypt)
3. **Monthly:** Review and clean old sessions from database
4. **Quarterly:** Update PHP if security patches available

### Backup Strategy

```bash
# Database backup (run via cron)
mysqldump -u user -p database_name > backup_$(date +%Y%m%d).sql

# Files backup
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /home/cpaneluser/public_html/uploads/
```

### Updating the Application

```bash
# On development machine
git pull
npm run build

# Create new deployment package
cd dist
zip -r ../update-$(date +%Y%m%d).zip .

# Upload to server and extract (backup first!)
```

---

## SUPPORT CONTACTS

For issues:
1. Check PHP error logs in cPanel
2. Check browser console (F12)
3. Review this guide's Troubleshooting section

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-01-15  
**For:** RehabSource OT Assessment Portal
