# Rehab Source Portal

**Australian OT + Physio All-in-One Portal**

Version: 1.0.0  
Domain: rehab-source.com  
Stack: PHP 8.2+ / MySQL 8 / HTML5+CSS+JS (PWA)

## Overview

Rehab Source is a production-ready, self-hosted healthcare portal for:
- **Clients/Carers** - Access assessments, reports, manage consent
- **Therapists (OT/Physio)** - Conduct assessments, generate reports, manage caseload
- **Case Managers** - Track clients, request assessments, receive reports
- **Funders** - View-only access to shared report packs
- **Org Managers** - Multi-clinic administration
- **Admins** - System configuration and moderation

## Features

### Core Modules
- ✅ Authentication & Identity (MFA optional TOTP)
- ✅ Multi-role profiles (Client/Therapist/Case Manager/Funder)
- ✅ Therapist matching & search (profession, location, availability)
- ✅ Secure messaging with file attachments
- ✅ Case management workspace
- ✅ Guided assessment wizard engine
- ✅ Home modifications assessment module
- ✅ Photo guidance with measurement stick scaling
- ✅ Reports & letters with versioning
- ✅ Equipment sourcing workflow
- ✅ Two-way ratings & reviews
- ✅ Knowledge base with change detection
- ✅ Share packs with secure email delivery

### Security Features
- Prepared statements (SQL injection prevention)
- CSRF protection on all state changes
- Argon2id password hashing
- Role-based access control (RBAC)
- Rate limiting (auth + uploads)
- Strict CSP headers
- File upload validation + EXIF stripping
- Encryption at rest for sensitive data
- Immutable audit logs
- Consent-first access model

### PWA Features
- Offline draft assessments
- Local encrypted storage
- Background sync
- Conflict resolution

## Quick Start

### Prerequisites
- Ubuntu 22.04/24.04 LTS
- PHP 8.2+ with extensions: pdo_mysql, mbstring, openssl, gd, curl, zip, json
- MySQL 8.0+
- Composer
- Apache/Nginx with mod_rewrite
- wkhtmltopdf or Chromium (for PDF generation)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/your-org/rehabsource-portal.git
cd rehabsource-portal

# 2. Install dependencies
composer install --no-dev --optimize-autoloader

# 3. Create environment file
cp .env.example .env
nano .env  # Configure database, SMTP, app settings

# 4. Set permissions
chmod 600 .env
chmod -R 755 public/
chmod -R 700 storage/

# 5. Run migrations
php scripts/migrate.php

# 6. Seed initial data
php scripts/seed.php

# 7. Create admin user
php scripts/create-admin.php admin@rehab-source.com

# 8. Set up cron jobs
crontab -e
# Add: * * * * * php /path/to/rehabsource-portal/scripts/cron.php >> /var/log/rehabsource-cron.log 2>&1
```

### cPanel Deployment

See [docs/CPANEL_DEPLOYMENT.md](docs/CPANEL_DEPLOYMENT.md) for detailed cPanel setup instructions.

## Directory Structure

```
rehabsource-portal/
├── app/                    # Application code
│   ├── Controllers/        # Request handlers
│   ├── Services/           # Business logic
│   ├── Models/             # Data models
│   ├── Policies/           # Authorization policies
│   ├── Middleware/         # Request middleware
│   └── Helpers/            # Utility functions
├── config/                 # Configuration files
├── docs/                   # Documentation
│   ├── architecture.md
│   ├── erd.md
│   ├── threat-model.md
│   ├── consent-model.md
│   └── compliance-mapping.md
├── migrations/             # Database migrations
├── public/                 # Web root (document root)
│   ├── index.php           # Front controller
│   ├── assets/             # Static assets
│   ├── js/                 # JavaScript files
│   ├── css/                # Stylesheets
│   └── .htaccess           # Apache rewrites
├── scripts/                # CLI scripts
│   ├── migrate.php
│   ├── seed.php
│   ├── backup.php
│   ├── restore.php
│   ├── cron.php
│   └── create-admin.php
├── storage/                # File storage (outside web root in production)
│   ├── uploads/
│   ├── reports/
│   ├── cache/
│   ├── logs/
│   └── keys/
├── templates/              # HTML templates
├── tests/                  # Test files
├── vendor/                 # Composer dependencies
├── .env.example            # Environment template
├── composer.json           # PHP dependencies
└── README.md
```

## Configuration

### Environment Variables (.env)

```env
# Application
APP_NAME="Rehab Source"
APP_URL="https://rehab-source.com"
APP_ENV=production
APP_DEBUG=false
APP_KEY=your-32-char-random-key

# Database
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=rehabsource
DB_USERNAME=rehabsource_user
DB_PASSWORD=your-secure-password

# SMTP
SMTP_HOST=mail.rehab-source.com
SMTP_PORT=465
SMTP_USERNAME=sendserver@rehab-source.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=no-reply@rehab-source.com
SMTP_FROM_NAME="Rehab Source"

# Security
SESSION_LIFETIME=120
RATE_LIMIT_AUTH=5
RATE_LIMIT_UPLOAD=20

# Storage
STORAGE_PATH=/home/cpaneluser/rehabsource_storage
MAX_UPLOAD_MB=5

# Features
TELEHEALTH_ENABLED=false
MHR_INTEGRATION_ENABLED=false
```

## Compliance

### Australian Standards Referenced
- NDIS Practice Standards
- NDIA Home Modifications Guidance
- Premises Standards (Disability Access)
- ABCB Livable Housing Design Standard
- AS 1428.1 (referenced only, not reproduced)

### Data Retention
- Clinical records: 5 years minimum
- Audit logs: 7 years
- User accounts: Until deletion requested + 30 days

## License

Proprietary - All Rights Reserved

## Support

Contact: support@rehab-source.com
