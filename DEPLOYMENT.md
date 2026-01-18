# Rehab Source - Production Deployment Guide

**Complete step-by-step guide for deploying to cPanel VPS**

**Version:** 2.0.0  
**Last Updated:** January 2025  
**Target Domain:** rehabsource.com.au

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#1-prerequisites)
2. [Local Build](#2-local-build)
3. [Server Setup](#3-server-setup)
4. [Database Setup](#4-database-setup)
5. [File Upload](#5-file-upload)
6. [Configuration](#6-configuration)
7. [First Admin User](#7-first-admin-user)
8. [Post-Deployment](#8-post-deployment)
9. [Troubleshooting](#9-troubleshooting)
10. [Maintenance](#10-maintenance)

---

## 1. PREREQUISITES

### Server Requirements
- **cPanel VPS** with SSH access
- **PHP 8.2+** with extensions: pdo_mysql, mbstring, openssl, gd, curl, json, zip
- **MySQL 8.0+** or MariaDB 10.5+
- **SSL Certificate** (Let's Encrypt recommended)

### Local Requirements
- **Node.js 18+** and npm
- **Git** (optional)

### Verify PHP Extensions
```bash
php -m | grep -E "pdo|mbstring|openssl|gd|curl|json|zip"
```

---

## 2. LOCAL BUILD

### Step 2.1: Get the Code
```bash
# Clone or download the repository
git clone https://github.com/supportcall/rehab-access-assist.git
cd rehab-access-assist
```

### Step 2.2: Install Dependencies
```bash
npm install
```

### Step 2.3: Build for Production
```bash
npm run build
```

This creates a `dist/` folder containing the production-ready frontend.

### Step 2.4: Prepare Deployment Package
```bash
# Create deployment directory
mkdir -p deployment-package

# Copy frontend build
cp -r dist/* deployment-package/

# Copy PHP backend
mkdir -p deployment-package/api/v1
cp -r php-backend/* deployment-package/api/v1/

# Copy htaccess
cp public/.htaccess deployment-package/.htaccess

# Create uploads directory
mkdir -p deployment-package/uploads/assessment-photos

# Create zip (optional)
cd deployment-package
zip -r ../rehabsource-deploy-$(date +%Y%m%d).zip .
cd ..
```

---

## 3. SERVER SETUP

### Step 3.1: Create Directory Structure
```bash
# SSH into your server
ssh username@yourserver.com

# Navigate to web root
cd ~/public_html

# Create directories
mkdir -p uploads/assessment-photos
mkdir -p api/v1/logs
```

### Step 3.2: Set PHP Version
In cPanel → Select PHP Version:
- Set PHP version to **8.2** or higher
- Enable extensions: pdo_mysql, mbstring, openssl, gd, curl, json, zip

---

## 4. DATABASE SETUP

### Step 4.1: Create Database in cPanel

1. Go to **cPanel → MySQL Databases**
2. Create database: `rehabsource_db`
3. Create user: `rehabsource_user` with strong password
4. Add user to database with **ALL PRIVILEGES**

Note full names (cPanel prefixes with username):
- Database: `cpaneluser_rehabsource_db`
- User: `cpaneluser_rehabsource_user`

### Step 4.2: Import Schema

**Option A: phpMyAdmin (Easy)**
1. Go to **cPanel → phpMyAdmin**
2. Select your database
3. Click **Import** tab
4. Upload `MYSQL_SCHEMA.sql`
5. Click **Go**

**Option B: SSH (Recommended)**
```bash
mysql -u cpaneluser_rehabsource_user -p cpaneluser_rehabsource_db < MYSQL_SCHEMA.sql
```

### Step 4.3: Verify Import
```sql
-- Run in phpMyAdmin
SHOW TABLES;
-- Should show 22+ tables

SELECT COUNT(*) FROM system_settings;
-- Should return 4 (default settings)
```

---

## 5. FILE UPLOAD

### Step 5.1: Upload Files

**Option A: cPanel File Manager**
1. Upload `rehabsource-deploy-XXXXXXXX.zip` to `public_html/`
2. Right-click → Extract
3. Delete the zip after extraction

**Option B: SFTP**
Use FileZilla or similar to upload the `deployment-package/` contents to `public_html/`

### Step 5.2: Verify Structure
```
public_html/
├── index.html          ← React SPA entry point
├── assets/             ← JS, CSS, images
├── .htaccess           ← Apache URL rewriting
├── robots.txt
├── sitemap.xml
├── uploads/
│   └── assessment-photos/
└── api/
    └── v1/
        ├── index.php
        ├── .htaccess
        ├── config/
        ├── endpoints/
        └── lib/
```

---

## 6. CONFIGURATION

### Step 6.1: Create Production Config

Create `public_html/api/v1/config/config.local.php`:

```php
<?php
/**
 * PRODUCTION CONFIGURATION
 * This file contains sensitive credentials - NEVER commit to Git!
 */

// ===== DATABASE CONFIGURATION =====
define('DB_HOST', 'localhost');
define('DB_NAME', 'cpaneluser_rehabsource_db');     // Your full database name
define('DB_USER', 'cpaneluser_rehabsource_user');   // Your full database user
define('DB_PASS', 'YOUR_DATABASE_PASSWORD_HERE');   // Your database password
define('DB_CHARSET', 'utf8mb4');

// ===== JWT CONFIGURATION =====
// Generate with: openssl rand -base64 64
define('JWT_SECRET', 'PASTE_YOUR_64_CHAR_SECRET_HERE');
define('JWT_ALGORITHM', 'HS256');
define('JWT_ACCESS_EXPIRY', 3600);      // 1 hour
define('JWT_REFRESH_EXPIRY', 604800);   // 7 days

// ===== APPLICATION SETTINGS =====
define('APP_NAME', 'Rehab Source');
define('APP_URL', 'https://rehabsource.com.au');    // Your domain
define('APP_DEBUG', false);                          // MUST be false in production!
define('APP_TIMEZONE', 'Australia/Sydney');

// ===== FILE UPLOAD SETTINGS =====
define('UPLOAD_DIR', __DIR__ . '/../../uploads');
define('MAX_UPLOAD_SIZE', 20 * 1024 * 1024);        // 20MB
define('ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

// ===== CORS SETTINGS =====
define('CORS_ALLOWED_ORIGINS', ['https://rehabsource.com.au']); // Your domain
define('CORS_ALLOWED_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
define('CORS_ALLOWED_HEADERS', ['Authorization', 'Content-Type', 'X-Requested-With']);

// ===== LOGGING =====
define('LOG_ENABLED', true);
define('LOG_PATH', __DIR__ . '/../../logs');
define('LOG_LEVEL', 'warning');     // debug, info, warning, error
```

### Step 6.2: Generate Secrets

```bash
# Generate JWT secret (64 characters)
openssl rand -base64 64

# Or using PHP
php -r "echo bin2hex(random_bytes(32)) . PHP_EOL;"
```

### Step 6.3: Set File Permissions

```bash
cd ~/public_html

# Protect config file
chmod 640 api/v1/config/config.local.php

# Protect directories
chmod 750 api/v1/config
chmod 750 api/v1/lib

# Make uploads writable
chmod 755 uploads
chmod 755 uploads/assessment-photos

# Create and protect logs
mkdir -p api/v1/logs
chmod 755 api/v1/logs
```

---

## 7. FIRST ADMIN USER

### Step 7.1: Create via Signup

1. Visit: `https://yourdomain.com/auth`
2. Click **Sign Up**
3. Enter your admin details
4. **The FIRST user automatically becomes `system_admin`**

### Step 7.2: Verify Admin Access

1. Log in with your credentials
2. Navigate to **Admin Dashboard**
3. Verify you can see:
   - Dashboard statistics
   - Signup Requests tab
   - System Settings

---

## 8. POST-DEPLOYMENT

### Security Checklist

- [ ] `APP_DEBUG` is `false` in config.local.php
- [ ] JWT_SECRET is unique 64+ character string
- [ ] config.local.php has 640 permissions
- [ ] HTTPS is enforced (SSL certificate active)
- [ ] CORS origins match your domain exactly

### Functionality Tests

- [ ] Homepage loads without errors
- [ ] Login works correctly
- [ ] Signup creates pending_ot account
- [ ] Admin can approve OT signups
- [ ] Can create clients
- [ ] Can start and save assessments
- [ ] Photo uploads work
- [ ] All assessment stages save correctly

### Performance Checks

- [ ] Pages load within 3 seconds
- [ ] API responses return within 1 second
- [ ] Lighthouse performance score ≥90

---

## 9. TROUBLESHOOTING

### 500 Internal Server Error

**Check PHP logs:**
```bash
tail -f ~/public_html/api/v1/logs/error.log
# Or in cPanel → Errors
```

**Common causes:**
- Database credentials incorrect in config.local.php
- PHP version too low (need 8.2+)
- Missing PHP extensions

### 404 API Not Found

**Check .htaccess:**
- Verify both `.htaccess` files are uploaded
- Ensure `mod_rewrite` is enabled

**Test rewrite:**
Create `api/v1/test.php`:
```php
<?php echo "API reachable!";
```
Visit: `https://yourdomain.com/api/v1/test.php`

### CORS Errors

- Verify `CORS_ALLOWED_ORIGINS` includes your exact domain
- Must include `https://`
- Check browser console for specific error

### Login Not Working

**Test database connection:**
```bash
mysql -u cpaneluser_rehabsource_user -p cpaneluser_rehabsource_db -e "SELECT 1"
```

**Check JWT_SECRET** is set in config.local.php

---

## 10. MAINTENANCE

### Backup Strategy

**Daily (automated via cPanel):**
- Full account backup

**Weekly manual:**
```bash
# Database backup
mysqldump -u USER -p DATABASE > backup_$(date +%Y%m%d).sql

# Uploads backup
tar -czf uploads_$(date +%Y%m%d).tar.gz ~/public_html/uploads/
```

### Updating the Application

```bash
# On local machine
git pull
npm run build

# Upload new dist/ contents to server
# API updates: upload changed PHP files
```

### Regular Tasks

| Frequency | Task |
|-----------|------|
| Daily | Monitor error logs |
| Weekly | Review audit logs |
| Monthly | Check disk space, update dependencies |
| Quarterly | Rotate JWT secret, security audit |

---

## QUICK START SUMMARY

```bash
# 1. Build locally
npm run build

# 2. Create MySQL database in cPanel

# 3. Import schema
mysql -u USER -p DATABASE < MYSQL_SCHEMA.sql

# 4. Upload files to public_html/

# 5. Create config.local.php with credentials

# 6. Set permissions
chmod 640 api/v1/config/config.local.php
chmod 755 uploads/

# 7. Visit https://yourdomain.com/auth and sign up

# 8. First user becomes admin!
```

---

**Document Version:** 2.0.0  
**For:** Rehab Source OT Assessment Portal
