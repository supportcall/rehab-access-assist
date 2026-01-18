# Rehab Source - OT Home Modifications Assessment Portal

**Australia's Premier Home Modifications Assessment Platform for Occupational Therapists & Physiotherapists**

**Production Domain:** https://rehabsource.com.au  
**Version:** 1.0.0  
**Status:** Production Ready

---

## Overview

Rehab Source is a comprehensive, tablet-first Progressive Web Application (PWA) designed for Australian healthcare professionals conducting home modification assessments. The platform streamlines the entire assessment workflow from client intake through to NDIS funding applications.

### Who Is This For?

- **Occupational Therapists** - Conduct structured assessments, capture measurements, generate compliant reports
- **Physiotherapists** - Assess mobility and transfer requirements, document recommendations
- **Clients & Carers** - Prepare for assessments, access reports, manage consent
- **Case Managers** - Track assessments, request services, review reports
- **Support Coordinators** - Facilitate NDIS funding applications

---

## Key Features

### Assessment Workflow
- ✅ 11-stage comprehensive assessment wizard
- ✅ Photo documentation with measurement stick scaling
- ✅ Technical drawing generation (AI-assisted)
- ✅ Compliance checking (AS 1428.1, NCC, LHDS)
- ✅ Options analysis with cost estimates
- ✅ Risk register and controls documentation

### Clinical Tools
- ✅ Anthropometric measurements capture
- ✅ Environmental area assessments
- ✅ ADL (Activities of Daily Living) documentation
- ✅ Home FAST, SAFER Home, Westmead scoring
- ✅ AT (Assistive Technology) audit integration

### Administration
- ✅ Multi-role user management (OT, Admin, Client)
- ✅ OT signup approval workflow
- ✅ Client management with system IDs (PT-XXXXXX)
- ✅ Therapist profiles with system IDs (OT-XXXXXX)
- ✅ Referral system between therapists

### Compliance & Security
- ✅ NDIS Practice Standards aligned
- ✅ Australian Premises Standards referenced
- ✅ Argon2id password hashing
- ✅ JWT authentication with refresh tokens
- ✅ Role-based access control (RBAC)
- ✅ Clinical data encryption at rest

---

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** with shadcn/ui components
- **React Query** for data management
- **PWA** capabilities for offline use

### Backend (Self-Hosted Option)
- **PHP 8.2+** with custom API framework
- **MySQL 8.0+** database
- **JWT** authentication
- **RESTful API** design

### Cloud Backend (Development)
- **Lovable Cloud** (Supabase-based)
- **Edge Functions** for serverless logic
- **PostgreSQL** with Row Level Security

---

## Quick Links

| Document | Description |
|----------|-------------|
| [DEPLOYMENT.md](DEPLOYMENT.md) | Complete server deployment guide |
| [MYSQL_SCHEMA.sql](MYSQL_SCHEMA.sql) | Database schema for MySQL setup |
| [SEO_AND_MARKETING.md](SEO_AND_MARKETING.md) | SEO optimization and Google Business guide |
| [php-backend/README.md](php-backend/README.md) | PHP API backend documentation |

---

## Development

### Prerequisites
- Node.js 18+
- npm or bun

### Local Development
```bash
# Clone repository
git clone https://github.com/supportcall/rehab-access-assist.git
cd rehab-access-assist

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
npm run build
# Output: dist/ folder
```

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete step-by-step deployment instructions for cPanel VPS environments.

### Quick Summary
1. Build frontend: `npm run build`
2. Create MySQL database and import schema
3. Upload frontend (dist/) and backend (php-backend/) to server
4. Configure `config.local.php` with database credentials
5. Create first admin user via signup

---

## Support

- **Email:** support@rehab-source.com
- **Documentation:** See /docs folder

---

## License

Proprietary - All Rights Reserved  
© 2025 Rehab Source Pty Ltd

---

**Built with ❤️ for Australian Healthcare Professionals**
