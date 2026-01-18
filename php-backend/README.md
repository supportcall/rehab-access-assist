# Rehab Source - PHP Backend API

**REST API backend for the OT Home Modifications Assessment Portal**

**Version:** 1.0.0  
**PHP Version:** 8.2+  
**Database:** MySQL 8.0+

---

## Overview

This is the self-hosted PHP/MySQL backend that powers the Rehab Source assessment portal. It provides a complete REST API for authentication, user management, client records, and assessment data.

---

## Directory Structure

```
php-backend/
├── index.php              # Main API entry point & router
├── .htaccess              # Apache URL rewriting
├── config/
│   ├── config.php         # Default configuration
│   ├── database.php       # Database connection class
│   └── production.php     # Production settings template
├── lib/
│   ├── Auth.php           # Authentication & authorization
│   ├── JWT.php            # JWT token handling
│   ├── Logger.php         # Application logging
│   ├── Response.php       # API response helpers
│   └── Validator.php      # Input validation
├── endpoints/
│   ├── auth/              # Authentication endpoints
│   │   ├── login.php
│   │   ├── signup.php
│   │   ├── logout.php
│   │   ├── me.php
│   │   └── refresh.php
│   ├── clients/           # Client management
│   │   ├── index.php
│   │   └── single.php
│   ├── assessments/       # Assessment CRUD
│   │   ├── index.php
│   │   ├── single.php
│   │   └── subtable.php
│   ├── profiles/          # User profiles
│   │   ├── me.php
│   │   └── lookup.php
│   ├── referrals/         # Referral system
│   │   └── index.php
│   ├── uploads/           # File uploads
│   │   └── index.php
│   └── admin/             # Admin functions
│       ├── settings.php
│       └── signup-requests.php
├── database/
│   └── schema.sql         # MySQL database schema
├── uploads/               # Uploaded files (gitignored)
└── logs/                  # Application logs (gitignored)
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | User login, returns JWT tokens |
| POST | `/api/v1/auth/signup` | Register new user |
| POST | `/api/v1/auth/logout` | Invalidate session |
| GET | `/api/v1/auth/me` | Get current user info |
| POST | `/api/v1/auth/refresh` | Refresh access token |

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/clients` | List all clients |
| POST | `/api/v1/clients` | Create new client |
| GET | `/api/v1/clients/{id}` | Get client by ID |
| PUT | `/api/v1/clients/{id}` | Update client |
| DELETE | `/api/v1/clients/{id}` | Delete client |

### Assessments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/assessments` | List assessments |
| POST | `/api/v1/assessments` | Create assessment |
| GET | `/api/v1/assessments/{id}` | Get assessment |
| PUT | `/api/v1/assessments/{id}` | Update assessment |
| DELETE | `/api/v1/assessments/{id}` | Delete assessment |

### Admin (system_admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/signup-requests` | List pending OT signups |
| POST | `/api/v1/admin/signup-requests/{id}/approve` | Approve OT |
| POST | `/api/v1/admin/signup-requests/{id}/reject` | Reject OT |
| GET | `/api/v1/admin/settings` | Get system settings |
| PUT | `/api/v1/admin/settings` | Update settings |

---

## Setup

### 1. Database Setup
```sql
CREATE DATABASE rehabsource_db 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
```

### 2. Import Schema
```bash
mysql -u username -p rehabsource_db < database/schema.sql
```

### 3. Create Configuration

Copy `config/production.php` to `config/config.local.php` and update:

```php
<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_database_user');
define('DB_PASS', 'your_secure_password');
define('JWT_SECRET', 'your-64-char-secret');
define('APP_URL', 'https://yourdomain.com');
define('APP_DEBUG', false);
```

### 4. Set Permissions
```bash
chmod 640 config/config.local.php
chmod 755 uploads/
chmod 755 logs/
```

### 5. Configure Apache
Ensure `.htaccess` is processed:
```apache
<Directory "/path/to/api/v1">
    AllowOverride All
</Directory>
```

---

## Authentication Flow

1. User logs in via `/auth/login` with email/password
2. Server returns:
   - `access_token` (1 hour expiry)
   - `refresh_token` (7 days expiry)
3. Client stores tokens (httpOnly cookies recommended)
4. Include `Authorization: Bearer {access_token}` in API requests
5. When access token expires, use `/auth/refresh` with refresh token
6. On logout, call `/auth/logout` to invalidate session

---

## Role-Based Access Control (RBAC)

| Role | Description | Permissions |
|------|-------------|-------------|
| `system_admin` | Full system access | All operations |
| `ot_admin` | Approved OT | Manage own clients, assessments |
| `pending_ot` | Awaiting approval | View only, limited access |

---

## Security Features

- **Password Hashing:** Argon2id with secure parameters
- **JWT Tokens:** HS256 signed, with expiration
- **Input Validation:** All inputs sanitized and validated
- **SQL Injection:** Prepared statements only
- **CORS:** Configurable allowed origins
- **Rate Limiting:** Built into authentication endpoints
- **HTTPS Required:** Enforced in production

---

## Logging

Logs are written to `logs/` directory:
- `app.log` - General application logs
- `error.log` - Error logs
- `auth.log` - Authentication events

Log levels: `debug`, `info`, `warning`, `error`

---

## Database Schema

The `database/schema.sql` file creates 22+ tables:

**Core Tables:**
- `users` - Authentication credentials
- `user_roles` - User role assignments
- `profiles` - Therapist profile data
- `clients` - Client/patient records
- `assessments` - Assessment headers

**Assessment Sub-tables:**
- `environmental_areas`
- `clinical_assessment`
- `pre_visit_details`
- `funding_pathway`
- `at_audit`
- `site_survey`
- `structural_reconnaissance`
- `measurements`
- `risks_controls`
- `options_analysis`
- `compliance_checklist`
- `builder_collaboration`
- `deliverables`
- `technical_drawings`

**Supporting Tables:**
- `referrals`
- `ot_signup_requests`
- `system_settings`
- `assessment_tokens`

---

## Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) in the project root for complete deployment instructions.

---

**Built for Australian Healthcare Professionals**
