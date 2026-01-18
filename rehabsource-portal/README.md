# Rehab Source Portal - PHP Backend Architecture

**Production-ready PHP backend for Australian healthcare portal**

**Version:** 1.0.0  
**Domain:** rehabsource.com.au  
**Stack:** PHP 8.2+ / MySQL 8 / React PWA

---

## Overview

This directory contains the complete PHP/MySQL backend architecture designed to replace the cloud-based backend. It provides a self-hosted, HIPAA-style compliant solution for Australian healthcare data.

> **Note:** This architecture is for the full-featured portal. For the simplified PHP API used with the React frontend, see [../php-backend/](../php-backend/).

---

## User Roles

| Role | Description |
|------|-------------|
| **Clients/Carers** | Access assessments, reports, manage consent |
| **Therapists (OT/Physio)** | Conduct assessments, generate reports |
| **Case Managers** | Track clients, request assessments |
| **Funders** | View-only access to shared report packs |
| **Org Managers** | Multi-clinic administration |
| **Admins** | System configuration and moderation |

---

## Features

### Core Modules
- ✅ Multi-role authentication with MFA (optional TOTP)
- ✅ Therapist matching by location and availability
- ✅ Secure messaging with file attachments
- ✅ Case management workspace
- ✅ Guided assessment wizard engine
- ✅ Home modifications assessment module
- ✅ Photo guidance with measurement stick scaling
- ✅ Reports & letters with versioning
- ✅ Equipment sourcing workflow
- ✅ Two-way ratings & reviews
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

---

## Directory Structure

```
rehabsource-portal/
├── app/                    # Application code
│   ├── Controllers/        # Request handlers
│   ├── Core/               # Database, Auth, Response, CSRF
│   └── Helpers/            # Utility functions
├── config/                 # Configuration files
├── migrations/             # Database migrations
├── public/                 # Web root (document root)
│   ├── index.php           # Front controller
│   └── .htaccess           # Apache rewrites
├── .env.example            # Environment template
├── FULL_MYSQL_SCHEMA.sql   # Complete database schema
├── composer.json           # PHP dependencies
└── README.md               # This file
```

---

## Quick Start

See [../DEPLOYMENT.md](../DEPLOYMENT.md) for complete deployment instructions.

### Prerequisites
- PHP 8.2+ with extensions: pdo_mysql, mbstring, openssl, gd, curl, json, zip
- MySQL 8.0+
- Composer
- Apache with mod_rewrite

### Basic Setup
```bash
# Install dependencies
composer install --no-dev --optimize-autoloader

# Create environment file
cp .env.example .env

# Import database schema
mysql -u USER -p DATABASE < FULL_MYSQL_SCHEMA.sql
```

---

## Compliance

### Australian Standards Referenced
- NDIS Practice Standards
- NDIA Home Modifications Guidance
- Premises Standards (Disability Access)
- ABCB Livable Housing Design Standard
- AS 1428.1 (referenced, not reproduced)

### Data Retention
- Clinical records: 5 years minimum
- Audit logs: 7 years
- User accounts: Until deletion requested + 30 days

---

## License

Proprietary - All Rights Reserved

---

## Support

- **Email:** support@rehab-source.com
- **Main Deployment Guide:** [../DEPLOYMENT.md](../DEPLOYMENT.md)
- **SEO Guide:** [../SEO_AND_MARKETING.md](../SEO_AND_MARKETING.md)
