# 🤖 AI ASSISTANT PROJECT CONTEXT

> **FOR AI ASSISTANTS**: This file contains the current state of the project, completed tasks, and active work. Update this file whenever you make changes or complete tasks. This helps all team members' AI assistants stay synchronized.

**Last Updated**: February 19, 2026 08:00 PM UTC  
**Project**: Company Ratings Platform (Glassdoor-like)  
**Team Size**: 4 developers  
**Sprint**: Days 1–2 - Auth ✅, Aya ✅, Raneem ⚠️ not started, Walid ⚠️ not started (10-day sprint)  
**Tech Lead**: @baraa

---

## 📊 PROJECT STATUS: AUTH ENDPOINTS LIVE ✅

**Server Status**: ✅ Running on `localhost:5000`  
**Database Status**: ✅ Deployed and verified  
**Auth Status**: ✅ Register + Login + Real Middleware all working and tested  
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
- [ ] **Raneem** — Start Days 1–2 tasks immediately (employment + feedback module)
  - Branch: `feature/employment-feedback`
  - First task: Pull from dev to get Baraa's middleware stubs
  - Critical export needed by Aya: `checkVerifiedEmployment()` helper

- [ ] **Walid** — Start Days 1–2 tasks immediately (admin + reporting module)
  - Branch: `feature/admin-reports`
  - First task: Pull from dev to get Baraa's middleware stubs
  - Independent module — fewest dependencies, can move fast

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
5. Routes - mounted at /api
   └── requireAuth - REAL JWT verification (active)
   └── requireRole - REAL role checking (active)
6. errorHandler - Global error handling
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
    ├── authMiddleware.js     # ✅ REAL JWT verification (activated Day 2)
    │   ├── roleMiddleware.js     # ✅ REAL role checking (activated Day 2)
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

| Member | Role | Focus Area | Branch |
|---|---|---|---|
| **Baraa** | Tech Lead | Auth & User Management | `feature/auth-system` |
| **Aya** | Developer | Companies & Reviews | `feature/companies-reviews` |
| **Raneem** | Developer | Employment & Feedback | `feature/employment-feedback` |
| **Walid** | Developer | Admin Panel & Reporting | `feature/admin-reports` |

---

### @baraa — Tech Lead (Auth & User Management)
**Branch**: `feature/auth-system`  
**Current Task**: Day 2 — activate real middleware + remaining auth endpoints

**Days 1–2 Status**:
- ✅ Create JWT utility (generate/verify tokens)
- ✅ Create bcrypt password functions
- ✅ Create requireAuth middleware (STUB)
- ✅ Create requireRole middleware (STUB)
- ✅ Push stubs — team has them
- ✅ Build POST /auth/register
- ✅ Build POST /auth/login (returns JWT tokens)
- ✅ Implement REAL requireAuth (verify JWT) — tested, working
- ✅ Implement REAL requireRole (role checking) — tested, working
- ❌ Build POST /auth/refresh-token ← **NEXT**
- ❌ Build POST /auth/logout
- ❌ Build GET /auth/me
- ❌ Build email verification endpoints
- ❌ Build password reset endpoints
- ✅ Merge to develop

**Available Tools**:
- `utils/jwt.js` — generateAccessToken, verifyAccessToken, generateRefreshToken, verifyRefreshToken
- `utils/validators.js` — validateRegister, validateLogin
- `config/database.js` — supabase client
- `middlewares/errorHandler.js` — AppError class

---

### @aya — Developer (Companies & Reviews)
**Branch**: `feature/companies-reviews`  
**Current Task**: Day 2 complete — waiting for real middleware from Baraa

**Days 1–2 Status**:
- ✅ Import middleware stubs
- ✅ Build GET /companies (list all)
- ✅ Build GET /companies/:id (single)
- ✅ Build POST /companies (create)
- ✅ Build PATCH /companies/:id (update)
- ✅ Build search/filter (industry, location, rating)
- ✅ Build pagination (LIMIT, OFFSET)
- ✅ Build POST /reviews (submit review)
- ✅ Validate: min 50 chars, max 2000 chars
- ✅ Validate: rating 1–5
- ✅ Check: no duplicate review
- ❌ Replace mock auth with real middleware (blocked — waiting for Baraa Day 2)
- ✅ Merge to develop

---

### @raneem — Developer (Employment & Feedback)
**Branch**: `feature/employment-feedback`  
**Current Task**: Days 1–2 — NOT STARTED ⚠️

**Days 1–2 Status**:
- ❌ Import Baraa's middleware stubs
- ❌ Build POST /employments/request
- ❌ Build GET /employments (list mine)
- ❌ Build PATCH /employments/:id/approve
- ❌ Build PATCH /employments/:id/reject
- ❌ Create checkVerifiedEmployment() helper — **AYA NEEDS THIS EXPORT**
- ❌ Replace mock auth with real middleware
- ❌ Build POST /feedback (peer feedback)
- ❌ Validate: no self-feedback
- ❌ Validate: same company only
- ❌ Validate: one per quarter
- ❌ Merge to develop

---

### @walid — Developer (Admin Panel & Reporting)
**Branch**: `feature/admin-reports`  
**Current Task**: Days 1–2 — NOT STARTED ⚠️

**Days 1–2 Status**:
- ❌ Import Baraa's middleware stubs
- ❌ Build POST /reports (submit report)
- ❌ Build rate limiting (5 reports/day)
- ❌ Build GET /admin/reports (list all)
- ❌ Build PATCH /admin/reports/:id/resolve
- ❌ Create audit logging function
- ❌ Replace mock auth with real middleware
- ❌ Build GET /admin/users (list users)
- ❌ Build PATCH /admin/users/:id/suspend
- ❌ Build DELETE /admin/users/:id (soft)
- ❌ Build GET /admin/companies
- ❌ Build GET /admin/analytics
- ❌ Merge to develop

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

### 2026-02-19 08:00 PM - Baraa Day 2 Middleware Complete
- Activated real `requireAuth` middleware — real JWT verification replacing stub
  - Reads `Authorization: Bearer <token>` header
  - Verifies with `verifyAccessToken()`, sets `req.user = { userId, email, role }`
  - Returns 401 UNAUTHORIZED (no token), 401 TOKEN_EXPIRED, 401 INVALID_TOKEN
- Activated real `requireRole` middleware — role checking replacing stub
  - Returns 401 if req.user missing
  - Returns 403 FORBIDDEN if role not in allowed list
- Activated `requireEmployee`, `requireCompanyAdmin`, `requireSystemAdmin` shortcuts
- Tested with Postman: 401 on no token ✅, 403 on wrong role ✅
- Aya's routes are now UNBLOCKED — she can replace mock auth with real middleware
- Files modified:
  - `backend/src/middlewares/authMiddleware.js` (stub removed, real implementation)
  - `backend/src/middlewares/roleMiddleware.js` (stub removed, real implementation)

### 2026-02-19 07:00 PM - AI_CONTEXT Major Update (Full Sprint Plan Added)
- Added real team member names: Baraa, Aya, Raneem, Walid
- Added branch names for each member
- Added complete Days 1–2 task checklist for all 4 members with current status
- Added Days 3–4 tasks for all members
- Added Day 5 Integration Day plan
- Added Days 6–7 Polish & Edge Cases for all members
- Added Days 8–10 Final Stretch plan
- Identified: Raneem and Walid have NOT started Days 1–2 tasks
- Identified: Aya is blocked on replacing mock auth (waiting for Baraa's real middleware)
- Files modified: `AI_CONTEXT.md`

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

## 📋 FULL SPRINT PLAN (Days 0–10)

### Day 0: Setup ✅ COMPLETE (All Together)
- ✅ Lead setup, explain architecture (Baraa)
- ✅ Install packages (express, supabase, jwt, bcrypt)
- ✅ Create folder structure
- ✅ Setup .env with credentials
- ✅ Run SQL schema in Supabase
- ✅ Create app.js and server.js
- ✅ Test server starts successfully
- Branches created: `feature/auth-system`, `feature/companies-reviews`, `feature/employment-feedback`, `feature/admin-reports`

---

### Days 1–2: Critical Foundation — Auth is PRIORITY
> Team depends on Baraa's middleware stubs

#### Baraa (Auth Foundation)
- ✅ Create JWT utility (generate/verify tokens)
- ✅ Create bcrypt password functions
- ✅ Create requireAuth middleware (STUB)
- ✅ Create requireRole middleware (STUB)
- ✅ Push stubs immediately
- ✅ Build POST /auth/register
- ✅ Build POST /auth/login (return JWT tokens)
- ✅ Implement REAL requireAuth (verify JWT)
- ✅ Implement REAL requireRole (role checking)
- ❌ Build POST /auth/refresh-token ← **NEXT**
- ❌ Build email verification endpoints
- ❌ Build password reset endpoints
- ✅ Merge to develop

#### Aya (Companies & Reviews)
- ✅ Import middleware stubs
- ✅ Build GET /companies (list all)
- ✅ Build GET /companies/:id (single)
- ✅ Build POST /companies (create)
- ✅ Build PATCH /companies/:id (update)
- ✅ Build search/filter (industry, location, rating)
- ✅ Build pagination (LIMIT, OFFSET)
- ✅ Build POST /reviews (submit review)
- ✅ Validate: min 50 chars, max 2000 chars / rating 1–5 / no duplicates
- ❌ Replace mock auth with real middleware (UNBLOCKED ✅ — Baraa's real middleware is ready, pull from dev)
- ✅ Merge to develop

#### Raneem (Employment & Feedback) ⚠️ NOT STARTED
- ❌ Import middleware stubs
- ❌ Build POST /employments/request
- ❌ Build GET /employments (list mine)
- ❌ Build PATCH /employments/:id/approve
- ❌ Build PATCH /employments/:id/reject
- ❌ Create `checkVerifiedEmployment()` helper — **Aya needs this export!**
- ❌ Replace mock auth with real middleware
- ❌ Build POST /feedback (peer feedback)
- ❌ Validate: no self-feedback / same company / one per quarter
- ❌ Merge to develop

#### Walid (Admin & Reporting) ⚠️ NOT STARTED
- ❌ Import middleware stubs
- ❌ Build POST /reports (submit report)
- ❌ Build rate limiting (5 reports/day)
- ❌ Build GET /admin/reports (list all)
- ❌ Build PATCH /admin/reports/:id/resolve
- ❌ Create audit logging function
- ❌ Replace mock auth with real middleware
- ❌ Build GET /admin/users (list users)
- ❌ Build PATCH /admin/users/:id/suspend
- ❌ Build DELETE /admin/users/:id (soft)
- ❌ Build GET /admin/companies
- ❌ Build GET /admin/analytics
- ❌ Merge to develop

---

### Days 3–4: Advanced Features
> Email system · Analytics · Notifications · Moderation

#### Baraa (Email & Security)
- [ ] Setup Nodemailer (Gmail SMTP)
- [ ] Create email templates (verification, reset, approvals)
- [ ] Send welcome email on register
- [ ] Help Raneem integrate approval emails
- [ ] Build GET /auth/me (current user)
- [ ] Add rate limiting to login (5 per 15 min)
- [ ] Add input validation (email, password strength)
- [ ] Add security headers (helmet.js)
- [ ] Handle edge cases (expired/invalid tokens)
- [ ] Review everyone's code for security
- [ ] Merge to develop

#### Aya (Review Features)
- [ ] Build PATCH /reviews/:id (edit in 48h)
- [ ] Build GET /reviews/my-reviews
- [ ] Build GET /companies/:id/reviews (paginated)
- [ ] Build anonymous review logic (hash author)
- [ ] Test anonymous vs public reviews
- [ ] Build GET /companies/:id/analytics
- [ ] Calculate rating distribution (per star)
- [ ] Calculate reviews over time (monthly)
- [ ] Build review sorting (newest/highest/lowest)
- [ ] Test with large dataset
- [ ] Merge to develop

#### Raneem (Profiles & Notifications)
- [ ] Build GET /employees/:id (profile)
- [ ] Build PATCH /employees/:id (update profile)
- [ ] Build profile privacy (public/private)
- [ ] Build PATCH /employments/:id/end
- [ ] Work with Baraa on email notifications
- [ ] Build GET /employments/pending (admin view)
- [ ] Send email: employment request sent
- [ ] Send email: employment approved/rejected
- [ ] Build feedback quota check (one/quarter)
- [ ] Merge to develop

#### Walid (Advanced Admin)
- [ ] Build review removal (soft delete + recalculate)
- [ ] Build user suspension logic
- [ ] Build company verification
- [ ] Build employment override (admin force approve)
- [ ] Test all moderation actions
- [ ] Build audit log filtering
- [ ] Build detailed platform analytics
- [ ] Build recent activity feed
- [ ] Build report statistics
- [ ] Merge to develop

---

### Day 5: Integration Day 🔗
> All together · Merge everything · Full end-to-end test

**Morning (All Together)**:
- [ ] Baraa: Lead the merge session
- [ ] ALL: Merge all features to develop
- [ ] ALL: Resolve merge conflicts together
- [ ] Baraa: Review final merged code
- [ ] ALL: Test server starts, no errors

**Afternoon Split Testing**:
- [ ] Baraa + Aya: Register → Login → Create Company → Search → Review submission flow
- [ ] Raneem + Walid: Employment request → Approve → Review → Internal feedback → Report → Admin resolves

---

### Days 6–7: Polish & Edge Cases
> Security hardening · Validation · Bug squashing

#### Baraa (Security & Errors)
- [ ] Add input validation everywhere
- [ ] Add XSS protection (sanitize inputs)
- [ ] Add SQL injection protection
- [ ] Add request logging
- [ ] Review codebase for security holes
- [ ] Add comprehensive error handling
- [ ] User-friendly error messages
- [ ] Test malicious inputs
- [ ] Add CORS configuration
- [ ] Code review for team
- [ ] Merge to develop

#### Aya (Review System Polish)
- [ ] Test: Cannot review without employment
- [ ] Test: Cannot duplicate review
- [ ] Test: Cannot edit after 48 hours
- [ ] Test: Anonymous review hides identity
- [ ] Fix all edge cases
- [ ] Optimize search queries (add indexes)
- [ ] Test pagination with 1000+ companies
- [ ] Verify rating calculation accuracy
- [ ] Test company update permissions
- [ ] Merge to develop

#### Raneem (Employment Polish)
- [ ] Test: Cannot self-feedback
- [ ] Test: Cannot feedback different company
- [ ] Test: Quarterly limit works
- [ ] Test: Former employee restrictions
- [ ] Fix all edge cases
- [ ] Test: All emails send correctly
- [ ] Test: Feedback visibility rules
- [ ] Test: Profile privacy works
- [ ] Test: Multi-company employment history
- [ ] Merge to develop

#### Walid (Admin Polish)
- [ ] Test: Only admin can access admin routes
- [ ] Test: Report rate limiting works
- [ ] Test: Review removal recalculates rating
- [ ] Test: Suspension prevents login
- [ ] Fix all edge cases
- [ ] Test: Deleted user shows as 'Deleted User'
- [ ] Test: Audit logs capture everything
- [ ] Test: Analytics calculations correct
- [ ] Test: Cannot delete system admin
- [ ] Merge to develop

---

### Days 8–10: Final Stretch
> Staging deploy · Performance · Production launch 🚀

#### Day 8: Frontend Integration
- [ ] Deploy backend to staging
- [ ] Connect frontend to staging
- [ ] Test frontend-backend integration
- [ ] Baraa + Aya: Test company/review pages
- [ ] Raneem + Walid: Test employment/admin
- [ ] Fix critical integration bugs

#### Day 9: Performance & Docs
- [ ] Baraa: Load test auth endpoints
- [ ] ALL: Code search (1000 companies)
- [ ] Raneem: Test employment at scale
- [ ] Walid: Combine all docs into one file
- [ ] Add database indexes if needed
- [ ] Write API documentation

#### Day 10: Production Deploy 🎉
- [ ] Baraa: Final security review
- [ ] ALL: Code review together
- [ ] Baraa: Lead production deployment
- [ ] ALL: Deploy to production server
- [ ] ALL: Update frontend to prod API
- [ ] ALL: Monitor logs, test thoroughly
- [ ] Baraa: Final smoke tests
- [ ] 🎉 Celebrate — Backend is LIVE!

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
