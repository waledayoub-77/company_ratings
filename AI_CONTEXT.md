# 🤖 AI ASSISTANT PROJECT CONTEXT

> **FOR AI ASSISTANTS**: This file contains the current state of the project, completed tasks, and active work. Update this file whenever you make changes or complete tasks. This helps all team members' AI assistants stay synchronized.

**Last Updated**: February 19, 2026 06:00 PM UTC  
**Project**: Company Ratings Platform (Glassdoor-like)  
**Team Size**: 4 developers  
**Sprint**: Day 2 - Auth Complete, Moving to Middleware Activation (10-day sprint)  
**Tech Lead**: @baraa

---

## 📊 PROJECT STATUS: AUTH ENDPOINTS LIVE ✅

**Server Status**: ✅ Running on `localhost:5000`  
**Database Status**: ✅ Deployed and verified  
**Auth Status**: ✅ Register + Login endpoints working and tested  
**Team Status**: ✅ UNBLOCKED - All developers can continue working

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

### Day 1 Afternoon: Auth Register & Login (Tech Lead @baraa) ✅
- [x] Created `src/services/authService.js`
  - `registerUser()` — checks email exists → bcrypt.hash (12 rounds) → insert users → insert employees/companies based on role → return user object
  - `loginUser()` — find user → bcrypt.compare → check is_active → generate tokens → store refresh token in DB → return `{ user, accessToken, refreshToken }`
  - Email verified check **temporarily disabled** — will re-enable in Day 2 after email verification flow is implemented
- [x] Created `src/controllers/authController.js`
  - `register` — calls `registerUser`, returns `201` with user + success message
  - `login` — calls `loginUser`, returns `200` with `{ user, accessToken, refreshToken }`
- [x] Created `src/routes/authRoutes.js`
  - `POST /auth/register` — authLimiter + validateRegister + validate + register
  - `POST /auth/login` — authLimiter + validateLogin + validate + login
- [x] Updated `src/routes/index.js` — mounted auth routes at `/auth`
- [x] Installed missing `express-validator` package (was missing from node_modules)
- [x] Tested both endpoints with Postman — ✅ Working
  - Register returns `201` with user object
  - Login returns `200` with `{ user, accessToken, refreshToken }`

### Day 0 & Day 2: Companies & Reviews Module (Aya) ✅
- [x] Created `src/services/companyService.js` - Full CRUD implementation
  - `getCompanies()` - List with filters, search, pagination
  - `getCompanyById()` - Single company retrieval
  - `createCompany()` - Create new company
  - `updateCompany()` - Update company details
  - `deleteCompany()` - Soft delete
  - `getCompanyStats()` - Company statistics
- [x] Created `src/services/reviewService.js` - Full review implementation
  - `createReview()` - Submit review (with employment verification)
  - `updateReview()` - Edit within 48hr window
  - `deleteReview()` - Soft delete
  - `getCompanyReviews()` - Reviews for a company
  - `getMyReviews()` - User's own reviews
  - `getReviewById()` - Single review
  - `checkVerifiedEmployment()` - Verify employment before review
  - `checkDuplicateReview()` - Prevent duplicate reviews
  - `recalculateCompanyRating()` - Update company average
  - `reportReview()` - Report inappropriate review
- [x] Created `src/controllers/companyController.js` - HTTP handlers
- [x] Created `src/controllers/reviewController.js` - HTTP handlers
- [x] Created `src/routes/companyRoutes.js` - API endpoints
- [x] Created `src/routes/reviewRoutes.js` - API endpoints
- [x] Updated `src/routes/index.js` - Mounted company and review routes
- [x] Fixed package.json (CommonJS mode, server.js entry)
- [x] Fixed database.js (CommonJS exports)
- [x] Fixed app.js (CommonJS, added helmet)
- [x] Server tested and working ✅

---

## 🚧 CURRENT TASKS

### IN PROGRESS
- [ ] **Auth Day 2** (Tech Lead @baraa)
  - Status: Register + Login done ✅, starting Day 2
  - Files to update:
    - `backend/src/services/authService.js` — add logout, refreshToken, verifyEmail, forgotPassword, resetPassword, getMe
    - `backend/src/controllers/authController.js` — add corresponding controllers
    - `backend/src/routes/authRoutes.js` — add new routes
  - Files to activate:
    - `backend/src/middlewares/authMiddleware.js` — remove stub, enable real JWT verification
    - `backend/src/middlewares/roleMiddleware.js` — remove stub, enable real role checking
  - Remaining tasks:
    - [ ] Activate `requireAuth` middleware (real JWT verification)
    - [ ] Activate `roleMiddleware` (real role checking)
    - [ ] Implement `POST /auth/logout` — revoke refresh token
    - [ ] Implement `POST /auth/refresh-token` — issue new access token
    - [ ] Implement `GET /auth/verify-email/:token` — mark email_verified = true
    - [ ] Implement `POST /auth/forgot-password` — generate reset token
    - [ ] Implement `POST /auth/reset-password/:token` — reset password
    - [ ] Implement `GET /auth/me` — return current user data
    - [ ] Re-enable email_verified check in loginUser (after verify-email works)

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
- [ ] **Activate Production Middleware** - UNBLOCKED ✅ (auth endpoints done)
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
    │   ├── index.js              # ✅ Route aggregator (auth + company + review mounted)
    │   ├── authRoutes.js         # ✅ POST /register, POST /login
    │   ├── companyRoutes.js      # ✅ Aya's work
    │   └── reviewRoutes.js       # ✅ Aya's work
    ├── controllers/
    │   ├── authController.js     # ✅ register, login
    │   ├── companyController.js  # ✅ Aya's work
    │   └── reviewController.js   # ✅ Aya's work
    └── services/
        ├── authService.js        # ✅ registerUser, loginUser (email verify check disabled until Day 2)
        ├── companyService.js     # ✅ Aya's work
        └── reviewService.js      # ✅ Aya's work
```

---

## 🎯 TEAM ASSIGNMENTS

### Tech Lead (@baraa)
**Current Task**: Auth Day 2 — activate middleware + remaining auth endpoints  
**Completed**:
- ✅ `backend/src/services/authService.js` — registerUser, loginUser
- ✅ `backend/src/controllers/authController.js` — register, login
- ✅ `backend/src/routes/authRoutes.js` — POST /register, POST /login
- ✅ Tested with Postman — working

**Next Steps**:
1. Activate `authMiddleware.js` (remove stub, real JWT verification)
2. Activate `roleMiddleware.js` (remove stub, real role checking)
3. Add to authService: logout, refreshToken, verifyEmail, forgotPassword, resetPassword, getMe
4. Add corresponding controllers and routes
5. Re-enable email_verified check in loginUser after verify-email flow works

**Available Tools**:
- JWT utils: `utils/jwt.js` (generateAccessToken, verifyAccessToken, generateRefreshToken, verifyRefreshToken)
- Validators: `utils/validators.js` (validateRegister, validateLogin)
- Database client: `config/database.js` (supabase)
- Error handling: `middlewares/errorHandler.js` (AppError class)

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

### 2026-02-19 06:00 PM - Baraa Day 1 Afternoon Complete (Auth Register & Login)
- Implemented `registerUser()` in authService — email check, bcrypt hash, insert user + profile row
- Implemented `loginUser()` in authService — credential check, token generation, refresh token stored in DB
- Created `authController.js` with `register` (201) and `login` (200) handlers
- Created `authRoutes.js` — POST /register and POST /login with rate limiting + validation
- Updated `routes/index.js` to mount auth routes at `/auth`
- Installed missing `express-validator` package
- Temporarily disabled email_verified check in loginUser (re-enable Day 2 when verify-email is built)
- Tested both endpoints with Postman — ✅ working
- Files created/modified:
  - `backend/src/services/authService.js` (new)
  - `backend/src/controllers/authController.js` (new)
  - `backend/src/routes/authRoutes.js` (new)
  - `backend/src/routes/index.js` (updated — auth routes mounted)

### 2026-02-19 10:30 AM - Aya Day 0 & Day 2 Complete (Companies & Reviews)
- Created full company CRUD service with filters, search, pagination
- Created full review service with employment verification, 48hr edit window, reporting
- Created controllers for both modules
- Created routes with proper middleware (auth + role checks)
- Fixed package.json to use CommonJS and correct entry point
- Fixed all configuration files for CommonJS compatibility
- Server tested: All endpoints working ✅
- Files created:
  - `src/services/companyService.js`
  - `src/services/reviewService.js`
  - `src/controllers/companyController.js`
  - `src/controllers/reviewController.js`
  - `src/routes/companyRoutes.js`
  - `src/routes/reviewRoutes.js`

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

### Day 1: Core Auth
- [x] Register endpoint ✅
- [x] Login endpoint ✅
- [ ] Refresh token endpoint
- [ ] Activate production middleware

### Day 2: Protected Routes (NEXT UP)
- [ ] Activate authMiddleware (real JWT) — **highest priority, unblocks team**
- [ ] Activate roleMiddleware (real role checking)
- [ ] logout endpoint
- [ ] refresh-token endpoint
- [ ] Email verification flow (verify-email endpoint)
- [ ] Password reset flow (forgot-password + reset-password)
- [ ] getMe endpoint (GET /auth/me)

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
