# 🤖 AI ASSISTANT PROJECT CONTEXT

> **FOR AI ASSISTANTS**: This file contains the current state of the project, completed tasks, and active work. Update this file whenever you make changes or complete tasks. This helps all team members' AI assistants stay synchronized.

**Last Updated**: February 19, 2026 8:20 AM UTC  
**Project**: Company Ratings Platform (Glassdoor-like)  
**Team Size**: 4 developers  
**Sprint**: Day 0 - Infrastructure Setup (10-day sprint)  
**Tech Lead**: @baraa

---

## 📊 PROJECT STATUS: INFRASTRUCTURE COMPLETE ✅

**Server Status**: ✅ Running on `localhost:5000`  
**Database Status**: ✅ Deployed and verified  
**Team Status**: ✅ UNBLOCKED - All developers can start working

---

## ✅ COMPLETED TASKS

### Day 0: Backend Infrastructure Setup
- [x] Created `backend/package.json` with all dependencies (11 production, 1 dev)
- [x] Installed 133 npm packages successfully
- [x] Created `.env` file with Supabase credentials
- [x] Generated secure JWT secrets (ACCESS + REFRESH)
- [x] Created configuration files:
  - [x] `src/config/database.js` - Supabase client connection
  - [x] `src/config/env.js` - Environment validation
  - [x] `src/config/email.js` - Nodemailer setup (credentials pending)
- [x] Created utility files:
  - [x] `src/utils/jwt.js` - Token generation/verification functions
  - [x] `src/utils/validators.js` - Express-validator rules for all endpoints
- [x] Created middleware:
  - [x] `src/middlewares/authMiddleware.js` - **STUB MODE** (allows all requests with mock user)
  - [x] `src/middlewares/roleMiddleware.js` - **STUB MODE** (allows all requests)
  - [x] `src/middlewares/errorHandler.js` - Global error handling
  - [x] `src/middlewares/rateLimiter.js` - Rate limiting configs
  - [x] `src/middlewares/validateMiddleware.js` - Validation result checker
- [x] Created Express app (`src/app.js`) and server (`src/server.js`)
- [x] Created route aggregator (`src/routes/index.js`) - routes commented out, ready for implementation
- [x] Started development server successfully
- [x] Created production-grade database schema:
  - [x] 9 core tables (users, companies, employees, employments, reviews, feedback, reports, audit_logs, refresh_tokens)
  - [x] 1 reference table (industries with 20 entries)
  - [x] 4 ENUM types (user_role, verification_status, report_status, feedback_category)
  - [x] 6 smart triggers (auto-timestamps, rating calculations, deadlines, anonymous hashes)
  - [x] 3 views (public_company_profiles, public_company_reviews, employee_feedback_summary)
  - [x] 3 utility functions (can_submit_review, can_submit_feedback, get_company_stats)
- [x] Deployed schema to Supabase
- [x] Created helper scripts:
  - [x] `backend/disable-rls.sql` - Disable Row Level Security for custom JWT
  - [x] `backend/verify-database.sql` - Database verification queries
  - [x] `backend/test-database.js` - Node.js connection test
  - [x] `backend/test-api.ps1` - PowerShell API test script
- [x] Verified database connection: ALL TESTS PASSED ✅
- [x] Created comprehensive documentation:
  - [x] `backend/README.md` - Complete backend documentation
  - [x] `backend/DATABASE_DEPLOYMENT.md` - Deployment guide
  - [x] `backend/QUICK_START.md` - Quick reference

### Day 0: Companies & Reviews Module (Aya)
- [x] Created `src/services/companyService.js` (empty template)
- [x] Created `src/services/reviewService.js` (empty template)
- [x] Created `src/controllers/companyController.js` (empty template)
- [x] Created `src/controllers/reviewController.js` (empty template)
- [x] Created `src/routes/companyRoutes.js` (empty template)
- [x] Created `src/routes/reviewRoutes.js` (empty template)

---

## 🚧 CURRENT TASKS

### IN PROGRESS
- [ ] **Auth Service Implementation** (Tech Lead @baraa)
  - Status: Starting now
  - Files to create:
    - `backend/src/services/authService.js`
    - `backend/src/controllers/authController.js`
    - `backend/src/routes/authRoutes.js`
  - Tasks:
    - Implement `registerUser()` function
    - Implement `loginUser()` function
    - Implement `refreshToken()` function
    - Create register/login controllers
    - Define auth routes (POST /auth/register, POST /auth/login, POST /auth/refresh)
    - Update `routes/index.js` to mount auth routes
    - Test endpoints with `test-api.ps1`

### READY TO START
- [ ] **Frontend Integration** (Frontend developers)
  - Replace mock data with real API calls
  - Connect to `localhost:5000`
  - Implement auth context/state management

- [ ] **Company Features** (Backend developer assigned)
  - After auth complete, create:
    - `services/companyService.js`
    - `controllers/companyController.js`
    - `routes/companyRoutes.js`
  - Endpoints needed:
    - GET /companies (list with filters)
    - GET /companies/:id (single company profile)
    - POST /companies (admin only)
    - PUT /companies/:id (admin only)

- [ ] **Review Features** (Backend developer assigned)
  - After auth complete, create:
    - `services/reviewService.js`
    - `controllers/reviewController.js`
    - `routes/reviewRoutes.js`
  - Endpoints needed:
    - POST /reviews (create review)
    - GET /reviews/company/:id (company reviews)
    - PUT /reviews/:id (edit within 48hrs)
    - DELETE /reviews/:id (soft delete)
    - POST /reviews/:id/report (report review)

### BLOCKED (Dependencies)
- [ ] **Activate Production Middleware** - BLOCKED until auth endpoints working
  - Uncomment production code in `authMiddleware.js`
  - Uncomment production code in `roleMiddleware.js`
  - Remove stub/mock code
  
- [ ] **Email Verification** - BLOCKED until email credentials configured (Day 3)
  - Configure Gmail SMTP credentials in `.env`
  - Test email sending with Nodemailer

---

## 🏗️ TECHNICAL ARCHITECTURE

### Backend Stack
```
Node.js + Express
├── Database: Supabase (PostgreSQL)
├── Auth: Custom JWT (not Supabase Auth)
│   ├── Access Token: 15 minutes
│   └── Refresh Token: 7 days
├── Password Hashing: bcrypt (12 rounds)
├── Email: Nodemailer (Gmail SMTP - pending config)
├── Validation: express-validator
├── Security: helmet, cors, rate-limiting
└── Environment: Development (nodemon hot reload)
```

### Database Connection
```
Supabase URL: https://nfpeazirwxuwpjryvcny.supabase.co
Credentials: Stored in backend/.env (DO NOT COMMIT)
Tables: 10 total (9 core + 1 reference)
Status: VERIFIED WORKING ✅
```

### Server Status
```
URL: http://localhost:5000
Port: 5000
Mode: Development
Health Check: GET /health → 200 OK ✅
API Root: GET / → Returns endpoint list ✅
```

### Middleware Chain (Current)
```
1. helmet() - Security headers
2. cors() - CORS configuration
3. express.json() - Body parsing
4. Rate limiters - DDoS protection
5. authMiddleware - **STUB MODE** (sets req.user = mock data)
6. roleMiddleware - **STUB MODE** (allows all)
7. Routes - Empty (ready for implementation)
8. errorHandler - Global error handling
```

---

## 📁 PROJECT STRUCTURE

```
backend/
├── .env                          # ✅ Configured (DO NOT COMMIT)
├── .env.example                  # ✅ Template for team
├── package.json                  # ✅ All dependencies
├── database-schema.sql           # ✅ Production schema
├── disable-rls.sql               # ⚠️ Run this in Supabase if using RLS
├── verify-database.sql           # ✅ Verification queries
├── test-database.js              # ✅ Connection test (PASSED)
├── test-api.ps1                  # ✅ API test script
├── README.md                     # ✅ Documentation
├── DATABASE_DEPLOYMENT.md        # ✅ Deployment guide
├── QUICK_START.md                # ✅ Quick reference
└── src/
    ├── server.js                 # ✅ Server entry point
    ├── app.js                    # ✅ Express app setup
    ├── config/
    │   ├── database.js           # ✅ Supabase connection
    │   ├── env.js                # ✅ Environment validation
    │   └── email.js              # ✅ Nodemailer setup
    ├── utils/
    │   ├── jwt.js                # ✅ Token generation/verification
    │   └── validators.js         # ✅ Validation rules
    ├── middlewares/
    │   ├── authMiddleware.js     # ✅ STUB MODE (production code commented)
    │   ├── roleMiddleware.js     # ✅ STUB MODE (production code commented)
    │   ├── errorHandler.js       # ✅ Global error handling
    │   ├── rateLimiter.js        # ✅ Rate limiting
    │   └── validateMiddleware.js # ✅ Validation checker
    ├── routes/
    │   └── index.js              # ✅ Route aggregator (routes commented)
    ├── controllers/              # ❌ EMPTY - Ready for implementation
    └── services/                 # ❌ EMPTY - Ready for implementation
```

---

## 🎯 TEAM ASSIGNMENTS

### Tech Lead (@baraa)
**Current Task**: Implement authentication system  
**Files to Create**:
- `backend/src/services/authService.js`
- `backend/src/controllers/authController.js`
- `backend/src/routes/authRoutes.js`

**Available Tools**:
- JWT utils: `utils/jwt.js` (generateAccessToken, verifyAccessToken, etc.)
- Validators: `utils/validators.js` (validateRegister, validateLogin)
- Database client: `config/database.js` (supabase)
- Error handling: `middlewares/errorHandler.js` (AppError class)

**Next Steps**:
1. Create authService with registerUser() and loginUser()
2. Hash passwords with bcrypt (12 rounds)
3. Generate JWT tokens for successful login
4. Store refresh tokens in database
5. Create controllers to handle req/res
6. Define routes and apply validators
7. Test with `test-api.ps1`

### Frontend Developer 1
**Current Task**: Can start frontend work  
**Status**: Frontend complete with mock data, ready for API integration  
**Blocked By**: None (can work with mock data until auth endpoints ready)

### Backend Developer 2
**Current Task**: Ready to start company/review features  
**Status**: Waiting for auth completion  
**Can Start**: Planning services/controllers structure

### Backend Developer 3
**Current Task**: Ready to start employee/feedback features  
**Status**: Waiting for auth completion  
**Can Start**: Planning services/controllers structure

---

## 📝 IMPORTANT NOTES

### For All Team Members
1. **DO NOT commit `.env` file** - It contains secrets
2. **Server must run from backend folder**: `cd backend && npm run dev`
3. **Database test**: Run `cd backend && node test-database.js` to verify connection
4. **Middleware is in STUB MODE**: Auth checks are disabled until production auth is implemented
5. **All requests currently allowed**: Team can develop features without auth blocking them

### For Backend Developers
- Use `utils/validators.js` for all endpoint validation
- Use `middlewares/errorHandler.js` AppError class for errors
- Follow REST conventions: GET (list/get), POST (create), PUT (update), DELETE (delete)
- All services should interact with Supabase using `config/database.js`
- Rate limiters already configured: Import from `middlewares/rateLimiter.js`

### For Frontend Developers
- API Base URL: `http://localhost:5000`
- All endpoints will be under `/api/v1/` prefix (not implemented yet)
- CORS enabled for `http://localhost:5173`
- Standard response format (will be documented when endpoints created)

---

## 🔄 RECENT CHANGES LOG

### 2026-02-19 08:20 AM - Database Verified
- Ran `node test-database.js` successfully
- All tests passed: tables, views, functions, insert/delete operations
- Database confirmed ready for auth development

### 2026-02-19 08:05 AM - Infrastructure Complete
- Created all backend configuration files
- Installed dependencies
- Started development server
- Deployed database schema to Supabase
- Created test and documentation files
- Tech Lead confirmed database working with test data
- Removed any pre-built auth code (Tech Lead will implement from scratch)

### 2026-02-19 09:00 AM - Aya Day 0 Complete (Companies & Reviews)
- Created empty templates for company/review services, controllers, and routes
- Confirmed all Day 0 files present for Aya's module
- Ready to start Day 1 implementation
- Files affected: src/services/companyService.js, src/services/reviewService.js, src/controllers/companyController.js, src/controllers/reviewController.js, src/routes/companyRoutes.js, src/routes/reviewRoutes.js

---

## 🚀 QUICK START COMMANDS

### Start Development Server
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

### Test Database Connection
```bash
cd backend
node test-database.js
# Should show all green checkmarks
```

### Install Dependencies (if pulling fresh)
```bash
cd backend
npm install
```

### Test API Endpoints (when auth ready)
```bash
cd backend
.\test-api.ps1
```

---

## 📋 NEXT SPRINT TASKS (Days 1-3)

### Day 1: Core Auth (IN PROGRESS)
- [ ] Register endpoint
- [ ] Login endpoint  
- [ ] Refresh token endpoint
- [ ] Activate production middleware

### Day 1: Companies & Reviews Implementation (Aya)
- [ ] Implement companyService.js functions (getCompanies, getCompanyById, createCompany, updateCompany)
- [ ] Implement companyController.js handlers
- [ ] Define companyRoutes.js endpoints
- [ ] Connect routes in routes/index.js
- [ ] Test endpoints with Postman
- [ ] Implement search/filter functionality
- [ ] Add pagination logic

### Day 2: Protected Routes
- [ ] Email verification system
- [ ] Password reset flow
- [ ] Profile endpoints (GET/PUT /profile)

### Day 3: Company & Review Foundation
- [ ] Company CRUD endpoints
- [ ] Review submission endpoint
- [ ] Employment verification system

---

## 🤖 INSTRUCTIONS FOR AI ASSISTANTS

**CRITICAL**: When you make changes to this project:

1. **Update This File**:
   - Move tasks from "READY TO START" to "IN PROGRESS" when starting
   - Move tasks from "IN PROGRESS" to "COMPLETED TASKS" when done
   - Add new files created to the appropriate section
   - Update "Last Updated" timestamp
   - Add entry to "RECENT CHANGES LOG"

2. **What to Document**:
   - New files created (with purpose/status)
   - Completed features/endpoints
   - Breaking changes
   - New dependencies added
   - Configuration changes
   - Bugs fixed
   - Tests added/passing

3. **Format for Updates**:
   ```markdown
   ### YYYY-MM-DD HH:MM AM/PM - Brief Description
   - Bullet point of change 1
   - Bullet point of change 2
   - Files affected: path/to/file.js
   ```

4. **Before Starting Work**:
   - Read this entire file to understand current state
   - Check "CURRENT TASKS" to see what's in progress
   - Check "COMPLETED TASKS" to avoid duplicate work
   - Verify your assigned tasks in "TEAM ASSIGNMENTS"

5. **Commit Message Template**:
   ```
   feat: Brief description
   
   - Detail 1
   - Detail 2
   
   Updated AI_CONTEXT.md
   ```

**Remember**: This file is the source of truth for all AI assistants on this project. Keep it accurate and up-to-date!

---

## 🆘 TROUBLESHOOTING

### Server won't start
- Check if port 5000 is already in use
- Verify `.env` file exists in `backend/` folder
- Run `npm install` to ensure dependencies are installed

### Database connection fails
- Verify Supabase credentials in `.env`
- Check internet connection
- Run `node test-database.js` for detailed error

### Middleware rejecting requests
- Confirm middleware is in STUB MODE (check `authMiddleware.js`)
- Production middleware should remain commented until auth complete

### Tests failing
- Ensure database schema is deployed
- Check if RLS needs to be disabled (run `disable-rls.sql`)
- Verify test data doesn't conflict with existing data

---

**PROJECT GOAL**: Build a production-ready company rating platform (Glassdoor-like) where employees can anonymously review companies and provide internal feedback.

**Current Focus**: Complete authentication system, then unblock team for parallel feature development.

**Expected Completion**: Day 10 of sprint (February 29, 2026)
