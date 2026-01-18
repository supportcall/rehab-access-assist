# Rehab Source Portal - Complete Deployment Guide
## Step-by-Step Idiot's Guide for cPanel VPS Setup

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Domain:** rehabsource.com.au

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#1-prerequisites)
2. [Database Setup](#2-database-setup)
3. [Backend Installation](#3-backend-installation)
4. [Frontend Build](#4-frontend-build)
5. [Environment Configuration](#5-environment-configuration)
6. [First Admin User](#6-first-admin-user)
7. [Post-Deployment Checklist](#7-post-deployment-checklist)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. PREREQUISITES

### Required Software
- **cPanel VPS** with SSH access
- **PHP 8.2+** with extensions: pdo, pdo_mysql, mbstring, openssl, gd, curl, json, zip
- **MySQL 8.0+**
- **Composer** (PHP package manager)
- **Node.js 18+** (for building frontend)
- **SSL Certificate** (Let's Encrypt or commercial)

### Verify PHP Extensions
```bash
php -m | grep -E "pdo|mbstring|openssl|gd|curl|json|zip"
```

If any are missing, enable them in cPanel → Select PHP Version.

---

## 2. DATABASE SETUP

### Step 2.1: Create MySQL Database in cPanel

1. Log into cPanel
2. Go to **MySQL® Databases**
3. Create a new database:
   - Database Name: `rehabsource` (or your preference)
   - Click **Create Database**

4. Create a database user:
   - Username: `rehabuser` (or your preference)
   - Password: Generate a **strong password** (save this!)
   - Click **Create User**

5. Add user to database:
   - Select user and database
   - Check **ALL PRIVILEGES**
   - Click **Make Changes**

### Step 2.2: Import the MySQL Schema

**Option A: Via phpMyAdmin (Easy)**
1. Go to **phpMyAdmin** in cPanel
2. Select your database (`rehabsource`)
3. Click **Import** tab
4. Choose file: `FULL_MYSQL_SCHEMA.sql`
5. Click **Go**

**Option B: Via SSH (Recommended)**
```bash
# Connect via SSH
ssh username@your-server.com

# Navigate to your files
cd ~/public_html/rehabsource-portal

# Import the schema
mysql -u rehabuser -p rehabsource < FULL_MYSQL_SCHEMA.sql
# Enter your password when prompted
```

### Step 2.3: Verify Import
```sql
-- In phpMyAdmin, run:
SHOW TABLES;
-- Should list 60+ tables

SELECT COUNT(*) FROM roles;
-- Should return 7 (default roles)

SELECT COUNT(*) FROM permissions;
-- Should return 18+ (default permissions)
```

---

## 3. BACKEND INSTALLATION

### Step 3.1: Upload Files

**Option A: Via cPanel File Manager**
1. Upload the entire `rehabsource-portal` folder to `public_html/`
2. Or create a subdomain pointing to `public_html/rehabsource-portal/public/`

**Option B: Via SFTP (Recommended)**
```bash
# Using FileZilla or similar
# Connect and upload to: /home/username/public_html/
```

**Option C: Via Git (Best for updates)**
```bash
cd ~/public_html
git clone https://your-repo-url.git rehabsource-portal
cd rehabsource-portal
```

### Step 3.2: Install PHP Dependencies

```bash
cd ~/public_html/rehabsource-portal

# Install Composer if not available
curl -sS https://getcomposer.org/installer | php

# Install dependencies (production mode)
php composer.phar install --no-dev --optimize-autoloader
```

### Step 3.3: Set File Permissions

```bash
# Set directory permissions
find . -type d -exec chmod 755 {} \;

# Set file permissions
find . -type f -exec chmod 644 {} \;

# Make storage directories writable
chmod -R 755 storage/
chmod 644 storage/.gitkeep

# Protect sensitive files
chmod 600 .env
chmod 600 config/app.php
```

### Step 3.4: Create Storage Directories

```bash
mkdir -p storage/{uploads,reports,logs,cache,keys}
chmod 755 storage
chmod 755 storage/*
```

### Step 3.5: Configure Document Root

In cPanel, set the document root for your domain to:
```
/home/username/public_html/rehabsource-portal/public
```

---

## 4. FRONTEND BUILD

### Step 4.1: Build on Local Machine

On your **local development machine** (not the server):

```bash
# In the main project root (not rehabsource-portal)
cd /path/to/project-root

# Install Node dependencies
npm install

# Build for production
npm run build

# This creates a 'dist' folder with compiled assets
```

### Step 4.2: Upload Built Assets

```bash
# Copy dist contents to server's public folder
scp -r dist/* username@server:/home/username/public_html/rehabsource-portal/public/
```

Or via SFTP, upload contents of `dist/` to the server's `public/` folder.

---

## 5. ENVIRONMENT CONFIGURATION

### Step 5.1: Create Environment File

```bash
cd ~/public_html/rehabsource-portal

# Copy example file
cp .env.example .env

# Edit with your values
nano .env
```

### Step 5.2: Configure .env File

```bash
# ===========================================
# APPLICATION SETTINGS
# ===========================================
APP_NAME="Rehab Source"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://rehabsource.com.au
APP_KEY=your-64-character-random-string-here
APP_TIMEZONE=Australia/Sydney

# ===========================================
# DATABASE (from Step 2)
# ===========================================
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=rehabsource
DB_USERNAME=rehabuser
DB_PASSWORD=your-secure-password-from-step-2

# ===========================================
# SECURITY
# ===========================================
JWT_SECRET=generate-a-64-char-hex-string
JWT_EXPIRY_MINUTES=60
JWT_REFRESH_EXPIRY_DAYS=30
PASSWORD_MIN_LENGTH=12
LOCKOUT_THRESHOLD=5
LOCKOUT_DURATION_MINUTES=15

# ===========================================
# EMAIL (SMTP)
# ===========================================
SMTP_HOST=mail.rehabsource.com.au
SMTP_PORT=465
SMTP_ENCRYPTION=ssl
SMTP_USERNAME=noreply@rehabsource.com.au
SMTP_PASSWORD=your-email-password
SMTP_FROM_ADDRESS=noreply@rehabsource.com.au
SMTP_FROM_NAME="Rehab Source"

# ===========================================
# FEATURES
# ===========================================
FEATURE_TELEHEALTH=false
FEATURE_MHR_INTEGRATION=false
FEATURE_MULTI_CLINIC=true
FEATURE_EQUIPMENT_MODULE=true
```

### Step 5.3: Generate Secrets

```bash
# Generate APP_KEY (64 chars)
php -r "echo 'APP_KEY: ' . bin2hex(random_bytes(32)) . PHP_EOL;"

# Generate JWT_SECRET (64 chars)
php -r "echo 'JWT_SECRET: ' . bin2hex(random_bytes(32)) . PHP_EOL;"
```

Copy these values to your `.env` file.

---

## 6. FIRST ADMIN USER

### Step 6.1: Create Admin via SQL

Run in phpMyAdmin or MySQL CLI:

```sql
-- First, get the admin role ID
SELECT id FROM roles WHERE name = 'admin';
-- Copy this UUID for the next step

-- Create admin user (replace values!)
SET @user_id = UUID();
SET @admin_role_id = 'paste-admin-role-id-here';

-- Insert user with Argon2id password
-- Password: "Admin123!@#" (change this!)
INSERT INTO users (id, email, password_hash, email_verified_at, is_active)
VALUES (
    @user_id,
    'admin@rehabsource.com.au',
    '$argon2id$v=19$m=65536,t=4,p=1$c29tZXNhbHQ$RdescudvJCsgt3ub+b+dWRWJTmaaJObG',
    NOW(),
    1
);

-- Assign admin role
INSERT INTO user_roles (id, user_id, role_id, granted_at)
VALUES (UUID(), @user_id, @admin_role_id, NOW());

-- Create therapist profile for admin (so they can access therapist features)
INSERT INTO therapist_profiles (id, user_id, first_name, last_name, profession, is_active, is_verified)
VALUES (
    UUID(),
    @user_id,
    'System',
    'Administrator',
    'occupational_therapist',
    1,
    1
);
```

### Step 6.2: Generate Password Hash (Alternative)

If you need to create a specific password:

```php
<?php
// save as generate_hash.php and run: php generate_hash.php
$password = 'YourSecurePassword123!@#';
$hash = password_hash($password, PASSWORD_ARGON2ID, [
    'memory_cost' => 65536,
    'time_cost' => 4,
    'threads' => 1
]);
echo $hash . PHP_EOL;
```

---

## 7. POST-DEPLOYMENT CHECKLIST

### ✅ Security Checks

- [ ] HTTPS is working (SSL certificate active)
- [ ] `.env` file is not accessible via browser
- [ ] `storage/` directory is not accessible via browser
- [ ] `composer.json` and `composer.lock` are not accessible
- [ ] phpMyAdmin is IP-restricted or password-protected
- [ ] SSH root login is disabled
- [ ] Firewall allows only ports 80, 443, and your SSH port

### ✅ Functionality Tests

- [ ] Homepage loads without errors
- [ ] Login page displays correctly
- [ ] Admin can log in with created credentials
- [ ] Registration form works (new user signup)
- [ ] Password reset emails are sent
- [ ] File upload works (test with an image)
- [ ] No console errors in browser developer tools

### ✅ Performance Checks

- [ ] GZIP compression is enabled
- [ ] Static assets are cached (check response headers)
- [ ] Database queries are fast (< 100ms)
- [ ] Page load time < 3 seconds

### ✅ Test API Endpoints

```bash
# Health check
curl https://rehabsource.com.au/api/v1/health

# Should return:
# {"status":"ok","timestamp":"..."}

# Test login
curl -X POST https://rehabsource.com.au/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rehabsource.com.au","password":"YourPassword"}'
```

---

## 8. TROUBLESHOOTING

### Common Issues

**1. 500 Internal Server Error**
```bash
# Check PHP error log
tail -f ~/public_html/rehabsource-portal/storage/logs/php-errors.log

# Check Apache error log
tail -f /var/log/apache2/error.log
```

**2. Database Connection Failed**
```bash
# Test MySQL connection
mysql -u rehabuser -p -h localhost rehabsource -e "SELECT 1"

# Check .env credentials match exactly
```

**3. Composer Dependencies Missing**
```bash
cd ~/public_html/rehabsource-portal
php composer.phar install --no-dev
```

**4. Permission Denied Errors**
```bash
chmod -R 755 storage/
chown -R www-data:www-data storage/  # or your web server user
```

**5. Routes Not Working (404 on all pages)**
```bash
# Ensure .htaccess is being processed
# In Apache config, ensure AllowOverride All

# Or verify mod_rewrite is enabled
a2enmod rewrite
systemctl restart apache2
```

**6. JWT Token Errors**
```bash
# Ensure JWT_SECRET is set in .env
# Must be exactly 64 hex characters

php -r "echo bin2hex(random_bytes(32));"
```

---

## 📝 MAINTENANCE

### Regular Tasks

**Daily:**
- Monitor error logs

**Weekly:**
- Review audit logs for suspicious activity
- Check disk space usage

**Monthly:**
- Update PHP dependencies: `composer update --no-dev`
- Review and rotate logs
- Database backup

### Backup Commands

```bash
# Backup database
mysqldump -u rehabuser -p rehabsource > backup_$(date +%Y%m%d).sql

# Backup uploads
tar -czf uploads_$(date +%Y%m%d).tar.gz storage/uploads/

# Store backups off-server!
```

---

## 📞 SUPPORT

For issues not covered in this guide:
- Email: support@rehab-source.com
- Documentation: [Internal Wiki]

---

## ✅ SUMMARY: QUICK START

```bash
# 1. Create MySQL database in cPanel
# 2. Import schema
mysql -u USER -p DATABASE < FULL_MYSQL_SCHEMA.sql

# 3. Upload files and install dependencies
cd ~/public_html/rehabsource-portal
composer install --no-dev

# 4. Create .env file from .env.example
cp .env.example .env
nano .env  # Fill in your values

# 5. Set permissions
chmod -R 755 storage/
chmod 600 .env

# 6. Build and upload frontend
# (on local machine)
npm run build
# Upload dist/ contents to public/

# 7. Create admin user via SQL

# 8. Test at https://yourdomain.com
```

**Done! Your Rehab Source Portal is now live.** 🎉
