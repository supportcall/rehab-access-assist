# PHP Backend for OT & Physio Assessment Portal

## Phase 1 Complete ✅

This is the PHP/MySQL backend replacement for the Lovable Cloud backend.

### Structure Created:

```
php-backend/
├── index.php              # Main API entry point
├── config/
│   ├── config.php         # Configuration settings
│   └── database.php       # Database connection class
├── lib/
│   ├── Auth.php           # Authentication helpers
│   ├── JWT.php            # JWT token handling
│   ├── Logger.php         # Logging utility
│   ├── Response.php       # API response helpers
│   └── Validator.php      # Input validation
├── database/
│   └── schema.sql         # Complete MySQL schema (22 tables)
├── endpoints/             # API endpoints (Phase 2+)
├── uploads/               # File uploads directory
└── logs/                  # Application logs
```

### Setup Instructions:

1. **Create MySQL Database:**
   ```sql
   CREATE DATABASE ot_assessment_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Import Schema:**
   ```bash
   mysql -u username -p ot_assessment_portal < database/schema.sql
   ```

3. **Configure:**
   - Copy `config/config.php` settings
   - Update DB_HOST, DB_NAME, DB_USER, DB_PASS
   - Set a secure JWT_SECRET (64+ random characters)
   - Update APP_URL to your domain

4. **Create directories:**
   ```bash
   mkdir -p uploads logs
   chmod 755 uploads logs
   ```

5. **Apache .htaccess** (for URL rewriting):
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^api/v1/(.*)$ index.php [QSA,L]
   ```

### Remaining Phases:

- **Phase 2:** Authentication endpoints (login, signup, logout)
- **Phase 3:** Core API (profiles, clients, assessments)
- **Phase 4:** Assessment sub-tables API
- **Phase 5:** Referrals, file uploads, settings
- **Phase 6:** Frontend migration to use PHP API

### MySQL Schema Includes:

All 22 tables matching Supabase schema:
- users, user_roles, profiles
- ot_signup_requests, system_settings
- clients, assessments, assessment_tokens
- environmental_areas, clinical_assessment
- pre_visit_details, funding_pathway, at_audit
- site_survey, structural_reconnaissance
- measurements, risks_controls, options_analysis
- compliance_checklist, builder_collaboration
- deliverables, technical_drawings, referrals
- uploaded_files, sessions
