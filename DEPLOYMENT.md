# Production Deployment Guide

## Pre-Deployment Checklist

- [ ] cPanel VPS with PHP 7.4+ and MySQL 5.7+
- [ ] Domain name configured and pointing to VPS
- [ ] SSL certificate installed (Let's Encrypt recommended)
- [ ] MySQL database created in cPanel

---

## Step 1: Build React Frontend

```bash
# In your local project directory
npm run build
```

This creates the `dist/` folder with production-ready files.

---

## Step 2: Prepare PHP Backend

1. **Copy production config:**
   ```bash
   cp php-backend/config/production.php php-backend/config/config.local.php
   ```

2. **Edit config.local.php** with your actual values:
   - Database credentials
   - JWT secret (generate a secure random string)
   - Your domain URL
   - Email settings (if needed)

---

## Step 3: Upload Files to cPanel

### Directory Structure on VPS:

```
public_html/
├── index.html          (from dist/)
├── assets/             (from dist/assets/)
├── .htaccess           (from public/.htaccess)
├── favicon.ico
├── robots.txt
├── sitemap.xml
├── uploads/            (create this - for file uploads)
│   └── assessment-photos/
└── api/
    └── v1/
        ├── index.php        (from php-backend/)
        ├── .htaccess        (from php-backend/)
        ├── config/
        ├── database/
        ├── endpoints/
        └── lib/
```

### Upload Process:

1. **Upload React build:**
   - Upload all files from `dist/` to `public_html/`
   - Upload `public/.htaccess` to `public_html/.htaccess`

2. **Upload PHP backend:**
   - Create `public_html/api/v1/` directory
   - Upload entire `php-backend/` contents to `public_html/api/v1/`

3. **Create uploads directory:**
   - Create `public_html/uploads/assessment-photos/`
   - Set permissions: `chmod 755 uploads/`

---

## Step 4: Database Setup

1. **Create database in cPanel:**
   - Go to MySQL Databases
   - Create database (e.g., `rehabsource_db`)
   - Create user with full privileges

2. **Import schema:**
   - Go to phpMyAdmin
   - Select your database
   - Import `php-backend/database/schema.sql`

---

## Step 5: Configure Environment

1. **Update config.local.php** in `public_html/api/v1/config/`:
   ```php
   'db' => [
       'host' => 'localhost',
       'name' => 'your_cpanel_user_rehabsource_db',
       'user' => 'your_cpanel_user_dbuser',
       'pass' => 'your_secure_password',
   ],
   ```

2. **Generate JWT secret:**
   ```bash
   openssl rand -base64 32
   ```
   Use this as your `jwt.secret` value.

---

## Step 6: Set Permissions

Via SSH or cPanel File Manager:

```bash
# Make config readable only by PHP
chmod 640 public_html/api/v1/config/config.local.php

# Make uploads writable
chmod 755 public_html/uploads
chmod 755 public_html/uploads/assessment-photos

# Protect sensitive directories
chmod 750 public_html/api/v1/config
chmod 750 public_html/api/v1/lib
chmod 750 public_html/api/v1/database
```

---

## Step 7: Create First Admin User

1. Visit `https://yourdomain.com/auth`
2. Sign up with your admin email
3. The first user automatically becomes `system_admin`

---

## Step 8: Test Everything

- [ ] Homepage loads correctly
- [ ] Login/signup works
- [ ] Dashboard loads after login
- [ ] Can create clients
- [ ] Can start assessments
- [ ] Can upload photos
- [ ] Admin dashboard accessible (for system_admin)

---

## Troubleshooting

### 500 Internal Server Error
- Check `public_html/api/v1/logs/` for error logs
- Verify PHP version is 7.4+
- Check database credentials in config

### API Not Found (404)
- Verify `.htaccess` files are uploaded
- Check `mod_rewrite` is enabled in Apache
- Verify API path is `/api/v1/`

### CORS Errors
- Check `cors.allowed_origins` in config matches your domain
- Ensure preflight OPTIONS requests are handled

### File Upload Fails
- Check `uploads/` directory permissions (755)
- Verify PHP `upload_max_filesize` is sufficient
- Check disk space on VPS

---

## Security Reminders

1. **NEVER** set `app.debug = true` in production
2. **ALWAYS** use HTTPS
3. **CHANGE** the JWT secret from the default
4. **RESTRICT** database user privileges to minimum needed
5. **BACKUP** database regularly
6. **UPDATE** PHP and dependencies periodically

---

## Support

For issues, check:
1. PHP error logs in cPanel
2. Browser console for JavaScript errors
3. Network tab for API response errors
