Aya Mansour
ayamansour0034
Invisible

Raneem Bikai — 9:54 AM
.
Attachment file type: document
sprint_plan (3).docx
15.32 KB
Raneem Bikai — 10:15 AM
# 🤖 AI ASSISTANT PROJECT CONTEXT

> **FOR AI ASSISTANTS**: This file contains the current state of the project, completed tasks, and active work. Update this file whenever you make changes or complete tasks. This helps all team members' AI assistants stay synchronized.

**Last Updated**: February 24, 2026 — Raneem Days 6–7 complete ✅  
**Project**: Company Ratings Platform (Glassdoor-like)  ... (10 KB left)

message.txt
60 KB
﻿
Raneem Bikai
raneembikai
# 🤖 AI ASSISTANT PROJECT CONTEXT

> **FOR AI ASSISTANTS**: This file contains the current state of the project, completed tasks, and active work. Update this file whenever you make changes or complete tasks. This helps all team members' AI assistants stay synchronized.

**Last Updated**: February 24, 2026 — Raneem Days 6–7 complete ✅  
**Project**: Company Ratings Platform (Glassdoor-like)  
**Team Size**: 4 developers  
**Sprint**: Days 3–4 - Baraa ✅ complete, Aya ✅ complete, Raneem ✅ complete, Walid ✅ Days 1-4 complete (10-day sprint)  
**Tech Lead**: @baraa

---

## 📊 PROJECT STATUS: AUTH + EMAIL SYSTEM LIVE ✅

**Server Status**: ✅ Running on `localhost:5000`  
**Database Status**: ✅ Deployed and verified  
**Auth Status**: ✅ Full auth system working — register, login, verify-email, forgot/reset-password, refresh, logout, getMe  
**Email Status**: ✅ Resend SDK configured — verification + reset emails sending  
**Company & Review Status**: ✅ Full CRUD + analytics working
**Admin & Reports Status**: ✅ Full admin panel — reports, users, companies, analytics, audit logs, employment override
**Team Status**: ✅ Baraa Days 0-4 complete, Aya Days 0-6 complete, Raneem Days 0-4 complete, Walid ✅ Days 1-4 complete

---

## ✅ COMPLETED TASKS

### Days 3–4: Email Verification & Password Reset (Baraa) ✅
- [x] Replaced Nodemailer with Resend SDK
  - [x] `config/email.js` — rewritten, wraps Resend API, single `sendEmail()` function
  - [x] `RESEND_API_KEY` added to `.env`
- [x] Created `services/emailService.js`
  - [x] `sendWelcomeEmail({ to, name })` — welcome message on register
  - [x] `sendVerifyEmail({ to, name, token })` — link to `FRONTEND_URL/verify-email/:token`
  - [x] `sendResetPasswordEmail({ to, name, token })` — link to `FRONTEND_URL/reset-password/:token`
  - [x] `sendEmploymentApprovedEmail({ to, name, companyName })` — for Raneem to call
  - [x] `sendEmploymentRejectedEmail({ to, name, companyName, reason })` — for Raneem to call
- [x] Created DB tables in Supabase:
  - [x] `email_verification_tokens` — token, user_id, expires_at (24h), used_at
  - [x] `password_reset_tokens` — token, user_id, expires_at (1h), used_at
- [x] Added `verifyEmail(token)` to authService
  - validates token exists, not used, not expired
  - sets `email_verified = true` on user
  - stamps `used_at` (one-time use)
- [x] Added `forgotPassword(email)` to authService
  - always returns 200 (security — don't reveal if email exists)
  - invalidates any previous unused tokens
  - generates new token, stores in DB, sends reset email
- [x] Added `resetPassword(token, newPassword)` to authService
  - validates token, bcrypt hashes new password
  - revokes ALL refresh tokens (forces re-login on all devices)
- [x] Re-enabled `email_verified` check in `loginUser` (was commented out since Day 1)
- [x] Register now automatically sends welcome + verification email
- [x] New routes added to `authRoutes.js`:
  - `GET /auth/verify-email/:token` (public)
  - `POST /auth/forgot-password` (public, authLimiter)
  - `POST /auth/reset-password/:token` (public)
- [x] Full flow tested end-to-end with Postman ✅
- [x] Merged to dev

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

### Days 0-4: Companies & Reviews Module (Aya) ✅ COMPLETE
- [x] **Days 0-2**: Full CRUD for companies and reviews
- [x] **Days 3-4**: Advanced review features and analytics
- [x] Created `src/services/companyService.js` - Full CRUD implementation
  - `getCompanies()` - List with filters (industry, location, minRating), search, pagination, sorting
  - `getCompanyById()` - Single company retrieval
  - `createCompany()` - Create new company (company_admin only)
  - `updateCompany()` - Update company details (creator or admin)
  - `deleteCompany()` - Soft delete (sets deleted_at)
  - `getCompanyStats()` - Company statistics (uses DB function)
  - `getCompanyAnalytics()` - **Days 3-4**: Rating distribution & reviews over time (monthly breakdown)
- [x] Created `src/services/reviewService.js` - Full review implementation
  - `createReview()` - Submit review with employment verification & duplicate prevention
  - `updateReview()` - **Days 3-4**: Edit within 48hr window (checks can_edit_until)
  - `deleteReview()` - Soft delete + recalculate company rating
  - `getCompanyReviews()` - **Days 3-4**: Paginated reviews with sorting (newest/highest/lowest)
  - `getMyReviews()` - **Days 3-4**: Current user's reviews with company info
  - `getReviewById()` - Single review retrieval
  - `reportReview()` - Report inappropriate review
  - `checkVerifiedEmployment()` - Helper: Check approved employment
  - `checkDuplicateReview()` - Helper: Prevent duplicate reviews
  - `recalculateCompanyRating()` - Helper: Update company average after review changes
- [x] Created `src/controllers/companyController.js` - HTTP handlers (7 endpoints)
- [x] Created `src/controllers/reviewController.js` - HTTP handlers (7 endpoints)
- [x] Created `src/routes/companyRoutes.js` - API endpoints
  - Public: GET /companies, GET /companies/:id, GET /companies/:id/analytics, GET /companies/:id/stats, GET /companies/:companyId/reviews
  - Protected: POST /companies (company_admin), PATCH /companies/:id, DELETE /companies/:id
- [x] Created `src/routes/reviewRoutes.js` - API endpoints
  - POST /reviews (employee only), GET /reviews/my-reviews, GET /reviews/:id, PATCH /reviews/:id, DELETE /reviews/:id, POST /reviews/:id/report
- [x] Updated `src/routes/index.js` - Mounted company and review routes
- [x] Fixed database schema compatibility (deleted_at instead of is_deleted)
- [x] Fixed database column names (user_id instead of created_by, industry instead of industry_id)
- [x] Anonymous reviews - Uses public_company_reviews view for safe access
- [x] **Days 3-4 Features Implemented**:
  - ✅ Review editing within 48 hours
  - ✅ My reviews page (GET /reviews/my-reviews)
  - ✅ Company reviews with sorting (newest, highest rating, lowest rating)
  - ✅ Anonymous review logic (hashes generated by DB trigger)
  - ✅ Company analytics (rating distribution 1-5 stars, monthly review trends)
- [x] All endpoints tested and working ✅
- [x] Installed resend package for email compatibility

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
    │   ├── index.js              # ✅ Route aggregator (auth + company + review + employment + feedback mounted)
    │   ├── authRoutes.js         # ✅ POST /register, POST /login, POST /refresh-token, POST /logout, GET /me, GET /verify-email/:token, POST /forgot-password, POST /reset-password/:token
    │   ├── companyRoutes.js      # ✅ Aya's work
    │   ├── reviewRoutes.js       # ✅ Aya's work
    │   ├── employmentRoutes.js   # ✅ Raneem's work
    │   ├── feedbackRoutes.js     # ✅ Raneem's work
    │   └── adminRoutes.js        # ✅ Walid's work — POST /reports, GET/PATCH /admin/reports, GET/PATCH/DELETE /admin/users, GET/PATCH /admin/companies, PATCH /admin/employments, GET /admin/analytics, GET /admin/audit-logs
    ├── controllers/
    │   ├── authController.js     # ✅ register, login, refresh, logout, getMe, verifyEmail, forgotPassword, resetPassword
    │   ├── companyController.js  # ✅ Aya's work
    │   ├── reviewController.js   # ✅ Aya's work
    │   ├── employmentController.js # ✅ Raneem's work
    │   ├── feedbackController.js # ✅ Raneem's work
    │   ├── reportController.js   # ✅ Walid — createReport
    │   └── adminController.js    # ✅ Walid — getReports, resolveReport, getUsers, suspendUser, unsuspendUser, deleteUser, getCompanies, verifyCompany, overrideEmployment, getAnalytics, getAuditLogs
    └── services/
        ├── authService.js        # ✅ registerUser, loginUser, refreshToken, logout, getMe, verifyEmail, forgotPassword, resetPassword
        ├── emailService.js       # ✅ sendWelcomeEmail, sendVerifyEmail, sendResetPasswordEmail, sendEmploymentApproved/RejectedEmail, sendAccountSuspended/UnsuspendedEmail, sendReportResolutionEmail
        ├── companyService.js     # ✅ Aya's work
        ├── reviewService.js      # ✅ Aya's work
        ├── employmentService.js  # ✅ Raneem's work
        ├── feedbackService.js    # ✅ Raneem's work
        ├── reportService.js      # ✅ Walid — createReport, getReports, resolveReport (with rating recalc + audit log)
        └── adminService.js       # ✅ Walid — getUsers, suspendUser, unsuspendUser, deleteUser, getCompanies, verifyCompany, overrideEmployment, getAnalytics, getAuditLogs
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
**Branch**: `baraa`  
**Current Task**: Days 3–4 complete ✅ — ready for Days 6–7 security hardening

**Days 1–2 Status**:
- ✅ Create JWT utility (generate/verify tokens)
- ✅ Create bcrypt password functions
- ✅ Create requireAuth middleware (STUB → REAL)
- ✅ Create requireRole middleware (STUB → REAL)
- ✅ Push stubs — team has them
- ✅ Build POST /auth/register
- ✅ Build POST /auth/login (returns JWT tokens)
- ✅ Implement REAL requireAuth (verify JWT) — tested, working
- ✅ Implement REAL requireRole (role checking) — tested, working
- ✅ Build POST /auth/refresh-token — tested, working
- ✅ Build POST /auth/logout — tested, working
- ✅ Build GET /auth/me — tested, working
- ✅ Merge to dev

**Days 3–4 Status**:
- ✅ Replace Nodemailer with Resend SDK (`config/email.js`)
- ✅ Create `services/emailService.js` — 5 send functions:
  - `sendWelcomeEmail` — sent on register
  - `sendVerifyEmail` — sent on register with 24h token
  - `sendResetPasswordEmail` — sent on forgot-password with 1h token
  - `sendEmploymentApprovedEmail` — ready for Raneem to call
  - `sendEmploymentRejectedEmail` — ready for Raneem to call
- ✅ Create DB tables in Supabase: `email_verification_tokens`, `password_reset_tokens`
- ✅ Build GET /auth/verify-email/:token — marks email_verified=true, one-time use
- ✅ Build POST /auth/forgot-password — generates token, sends email (always returns 200)
- ✅ Build POST /auth/reset-password/:token — updates password, revokes all refresh tokens
- ✅ Re-enabled email_verified check in loginUser
- ✅ Full flow tested end-to-end with Postman ✅
- ✅ Pushed to baraa, merging to dev now

**Available Tools for team**:
- `utils/jwt.js` — generateAccessToken, verifyAccessToken, generateRefreshToken, verifyRefreshToken
- `utils/validators.js` — validateRegister, validateLogin
- `config/database.js` — supabase client
- `config/email.js` — sendEmail (low-level, use emailService instead)
- `services/emailService.js` — sendWelcomeEmail, sendVerifyEmail, sendResetPasswordEmail, sendEmploymentApprovedEmail, sendEmploymentRejectedEmail
- `middlewares/errorHandler.js` — AppError class
- `middlewares/authMiddleware.js` — requireAuth
- `middlewares/roleMiddleware.js` — requireRole, requireEmployee, requireCompanyAdmin, requireSystemAdmin

---

### @aya — Developer (Companies & Reviews)
**Branch**: `feature/companies-reviews`  
**Current Task**: Days 0-4 ✅ COMPLETE — Ready for Days 6-7 polish

**Days 0-2 Status**: ✅ COMPLETE
- ✅ Import middleware stubs
- ✅ Build GET /companies (list all with filters)
- ✅ Build GET /companies/:id (single)
- ✅ Build POST /companies (create)
- ✅ Build PATCH /companies/:id (update)
- ✅ Build search/filter (industry, location, rating)
- ✅ Build pagination (LIMIT, OFFSET)
- ✅ Build POST /reviews (submit review)
- ✅ Validate: content length 50-2000 chars (DB constraint)
- ✅ Validate: rating 1–5
- ✅ Check: verified employment required
- ✅ Check: no duplicate review
- ✅ Real middleware integrated

**Days 3-4 Status**: ✅ COMPLETE
- ✅ Build PATCH /reviews/:id (edit in 48h window)
- ✅ Build GET /reviews/my-reviews (user's reviews)
- ✅ Build GET /companies/:companyId/reviews (paginated with sorting)
- ✅ Anonymous review logic (uses public_company_reviews view)
- ✅ Tested anonymous vs public reviews
- ✅ Build GET /companies/:id/analytics (rating distribution + monthly trends)
- ✅ Calculate rating distribution (1-5 stars)
- ✅ Calculate reviews over time (monthly breakdown)
- ✅ Review sorting (newest/highest/lowest)
- ✅ All endpoints tested ✅

---

### @raneem — Developer (Employment & Feedback)
**Branch**: `feature/employment-feedback`  
**Current Task**: Days 3–4 ✅ COMPLETE (bugs fixed by Baraa)

**Days 1–2 Status**:
- ✅ Import Baraa's real middleware
- ✅ Build POST /employments/request
- ✅ Build GET /employments (list mine)
- ✅ Build PATCH /employments/:id/approve
- ✅ Build PATCH /employments/:id/reject
- ✅ Create `checkVerifiedEmployment()` helper — delivered to Aya on dev
- ✅ Use real requireAuth middleware
- ✅ Build POST /feedback (peer feedback)
- ✅ Validate: no self-feedback
- ✅ Validate: same company only (both must have approved employment)
- ✅ Validate: one per quarter
- ✅ Merge to develop
- ✅ Merged into baraa branch (Feb 21)

**Days 3–4 Status**: ✅ COMPLETE
- ✅ BUG-001 fixed: ratings 1-5, year min 2020 (commit `93054f7`)
- ✅ GET /employees/:id — profile with privacy (public/private/system_admin)
- ✅ PATCH /employees/:id — update own profile, owner + system_admin only
- ✅ optionalAuth middleware added for guest-readable endpoints
- ✅ PATCH /employments/:id/end — end employment (sets is_current=false)
- ✅ GET /employments/pending — company_admin view of pending requests
- ✅ Email: sendEmploymentRequestEmail called in requestEmployment (Baraa fixed)
- ✅ Email: sendEmploymentApprovedEmail called in approveEmployment (Baraa fixed)
- ✅ Email: sendEmploymentRejectedEmail called in rejectEmployment (Baraa fixed)
- ✅ Feedback quota (one/quarter) — confirmed in feedbackService
- ✅ BUG-004 fixed: removed dead controller code from feedbackService.js (Baraa)
- ✅ BUG-006 fixed: removed @sendgrid/mail from package.json (Baraa)

> ✅ All tasks complete. Use the Postman guide below to test your work.

**🧪 Postman Testing Guide — Raneem Days 3–4**

> **Prerequisites**: Run `cd backend && npm run dev`. Have 2 accounts ready — one regular user (employee) and one `company_admin`. Get their tokens via `POST /api/auth/login`.

**Test 1 — Employee profile (GET)**
```
GET http://localhost:5000/api/employees/:id
# No token needed — public profile
# If profileVisibility = "private" → should return 404 for non-owners
```

**Test 2 — Update profile (PATCH)**
```
PATCH http://localhost:5000/api/employees/:id
Authorization: Bearer <employeeToken>
Body (JSON): { "fullName": "Raneem Test", "bio": "hello", "profileVisibility": "private" }

# Test wrong user's token → expect 403 Forbidden
# Test invalid profileVisibility value → expect 400
```

**Test 3 — Submit employment request + email**
```
POST http://localhost:5000/api/employments/request
Authorization: Bearer <employeeToken>
Body (JSON): { "companyId": "<uuid>", "position": "Engineer", "startDate": "2024-01-01" }

# Expect 201 — company admin should receive email notification
# Submit again for same company → expect 400 "already exists"
```

**Test 4 — Admin views pending requests**
```
GET http://localhost:5000/api/employments/pending
Authorization: Bearer <adminToken>

# Expect list containing the request above
# Try with employee token → expect 403
```

**Test 5 — Approve employment + email**
```
PATCH http://localhost:5000/api/employments/<id>/approve
Authorization: Bearer <adminToken>

# Expect 200 — employee should receive approval email
```

**Test 6 — End employment**
```
PATCH http://localhost:5000/api/employments/<id>/end
Authorization: Bearer <employeeToken>
Body (JSON): { "endDate": "2025-12-31" }

# Expect 200 with is_current: false
# Call again → expect 400 "Employment already ended"
```

**Test 7 — Reject employment (create a new request first)**
```
PATCH http://localhost:5000/api/employments/<id>/reject
Authorization: Bearer <adminToken>
Body (JSON): { "rejectionNote": "Could not verify employment" }

# Expect 200 — employee should receive rejection email with reason
```

**Test 8 — Feedback rating validation (BUG-001 fix)**
```
POST http://localhost:5000/api/feedback
Authorization: Bearer <employeeToken>
Body (JSON): { "professionalism": 6, ... }

# Expect 400 — must be 1–5 (previously this would crash with DB error)
```

---

### @walid — Developer (Admin Panel & Reporting)
**Branch**: `feature/admin-reports`  
**Current Task**: Days 1–4 ✅ COMPLETE

**Days 1–2 Status**: ✅ COMPLETE
- ✅ Import Baraa's real middleware (requireAuth, requireSystemAdmin)
- ✅ Build POST /reports (submit report) — was already done
- ✅ Build rate limiting (5 reports/day) — reportLimiter was already done
- ✅ Build GET /admin/reports (list all) — was already done
- ✅ Build PATCH /admin/reports/:id/resolve — was already done
- ✅ Create audit logging function (auditLogger.js) — was already done
- ✅ Real auth middleware used (not stubs)
- ✅ Build GET /admin/users (list users with search, role filter, pagination)
- ✅ Build PATCH /admin/users/:id/suspend (with token revocation + audit log + email)
- ✅ Build PATCH /admin/users/:id/unsuspend (with audit log + email)
- ✅ Build DELETE /admin/users/:id (soft delete, BR-018 compliant, cannot delete system_admin)
- ✅ Build GET /admin/companies (search + pagination)
- ✅ Build GET /admin/analytics (users, companies, reviews, ratings, by-role, this-month, pending reports, recent activity)

**Days 3–4 Status**: ✅ COMPLETE
- ✅ Build review removal logic (soft delete + recalculate rating) — in reportService.resolveReport
- ✅ Build PATCH /admin/companies/:id/verify (company verification + audit log)
- ✅ Build PATCH /admin/employments/:id/override (admin force-approve employment + audit log)
- ✅ Build GET /admin/audit-logs (filter by adminId, action, pagination)
- ✅ Added email templates: accountSuspended, accountUnsuspended, reportResolution
- ✅ Added sendAccountSuspendedEmail, sendAccountUnsuspendedEmail, sendReportResolutionEmail to emailService
- ✅ Added validateSuspendUser validator
- ✅ All endpoints tested — server starts clean, no errors
- ✅ Merged to develop

---

---

## ⚠️ KNOWN BUGS

### ✅ BUG-007 — Walid: suspend/unsuspend email uses email as name
**File**: `backend/src/services/adminService.js`  
**Status**: ✅ FIXED — Baraa (code review)  
**Owner**: Walid  
**Problem**: `sendAccountSuspendedEmail({ to: user.email, name: user.email, reason })` — passes `user.email` as the `name` field. Email greeting shows "Hi john@example.com" instead of "Hi John".  
**Fix**: Added `full_name` to both select queries, passing `user.full_name || user.email` as name.

### ✅ BUG-001 — Raneem: Feedback rating validation 1-10 vs DB constraint 1-5
**File**: `backend/src/controllers/feedbackController.js`  
**Status**: ✅ FIXED — commit `93054f7`  
**Owner**: Raneem  
**Problem**: Controller validates professionalism, communication, teamwork, reliability as integers `1–10`. But the DB schema has hard CHECK constraints: `CHECK (professionalism >= 1 AND professionalism <= 5)`. Any value 6–10 passes controller validation but gets **rejected by Supabase with a constraint error** (no helpful error message to user).  
**Also**: year min is `2000` in controller but `2020` in schema — minor mismatch.  
**Fix**:
```js
// In feedbackController.js — change all 4:
!isIntInRange(professionalism, 1, 5)  // was 1, 10
!isIntInRange(communication, 1, 5)    // was 1, 10
!isIntInRange(teamwork, 1, 5)         // was 1, 10
!isIntInRange(reliability, 1, 5)      // was 1, 10
// Also: year < 2020  (was 2000)
```

### ✅ BUG-002 — Aya: reportReview missing reason validation
**File**: `backend/src/services/reviewService.js` → `reportReview()`  
**Status**: ✅ FIXED — commit `e42f767`  
**Owner**: Aya  
**Problem**: DB has constraint `reason IN ('false_info', 'spam', 'harassment', 'other')`. The service inserts `reason` directly without validating the value. An invalid reason string causes a raw Supabase constraint error instead of a clean 400 response.  
**Fix**: Add before the insert:
```js
const validReasons = ['false_info', 'spam', 'harassment', 'other'];
if (!validReasons.includes(reason)) {
  throw new AppError('Invalid reason. Must be one of: false_info, spam, harassment, other', 400);
}
```

### ✅ BUG-003 — Aya: duplicate checkVerifiedEmployment (not using Raneem's helper)
**File**: `backend/src/services/reviewService.js`  
**Status**: ✅ FIXED — commit `e42f767`  
**Owner**: Aya  
**Problem**: Aya has her own inline copy of `checkVerifiedEmployment()` instead of using `helpers/checkVerifiedEmployment.js` that Raneem built for her. Two copies of the same logic — if one is updated the other won't be.  
**Fix**: Replace inline function with `const checkVerifiedEmployment = require('../helpers/checkVerifiedEmployment');`

### ✅ BUG-004 — Raneem: Controller code accidentally placed in feedbackService.js
**File**: `backend/src/services/feedbackService.js`  
**Status**: ✅ FIXED — Baraa (code review)  
**Problem**: `exports.createFeedback = async (req, res) => {...}` — a full controller function with `req/res` was sitting at the top of the service file. It called `feedbackService.createFeedback()` on itself causing infinite recursion. Harmless only because `module.exports` at the bottom overrode it.
**Fix**: Removed the dead controller block (lines 3–72). Real `createFeedback` service function at the bottom is correct.

### ✅ BUG-005 — Raneem: Employment email notifications not called
**File**: `backend/src/controllers/employmentController.js`  
**Status**: ✅ FIXED — Baraa (code review)  
**Problem**: `requestEmployment`, `approveEmployment`, `rejectEmployment` never called any email functions despite being a Days 3-4 requirement.
**Fix**: Baraa added non-blocking email calls in all 3 functions using `sendEmploymentRequestEmail`, `sendEmploymentApprovedEmail`, `sendEmploymentRejectedEmail` from `emailService.js`.

### ✅ BUG-006 — Raneem: Wrong email package added to package.json
**File**: `backend/package.json`  
**Status**: ✅ FIXED — Baraa (code review)  
**Problem**: Raneem added `@sendgrid/mail` — we use Resend SDK, not SendGrid. Unused dependency.
**Fix**: Removed `@sendgrid/mail` from `package.json`.

---

## 📝 IMPORTANT NOTES

### For All Team Members
1. **DO NOT commit `.env` file** - It contains secrets
2. **Server must run from backend folder**: `cd backend && npm run dev`
3. **Database test**: Run `cd backend && node test-database.js` to verify connection
4. **Middleware is REAL** (not stub): Auth is active — all protected routes require `Authorization: Bearer <token>`
5. **Email**: Resend SDK configured — set `RESEND_API_KEY` in `.env` to send real emails

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

### 2026-02-24 — Raneem: Days 6–7 Employment & Feedback Polish ✅
- **feedbackService.js**:
  - `bothApprovedInCompany`: added `is_current = true` filter — former employees blocked from giving/receiving feedback
  - `bothApprovedInCompany`: separate error messages for reviewer vs rated employee restriction
  - Added `getFeedbackReceived({ employeeId, isSystemAdmin, page, limit })` — paginated, employees see own, admins see all
  - Added `getFeedbackGiven({ employeeId, isSystemAdmin, page, limit })` — same visibility rules
- **feedbackController.js**: Full rewrite of `createFeedback` with hardened edge cases:
  - UUID format validation for `ratedEmployeeId` and `companyId`
  - `writtenFeedback` type + max 1000 chars validation (matches DB constraint)
  - Future quarter/year guard — cannot submit feedback for Q3 2026 when it's Q1 2026
  - Improved error message: "Feedback already submitted for Q{n} {year}"
  - Added `getFeedbackReceived` controller
  - Added `getFeedbackGiven` controller (admin can pass `?employeeId=` to filter)
- **feedbackRoutes.js**: Added `GET /api/feedback/received` and `GET /api/feedback/given`
- **employmentService.js**:
  - `requestEmployment`: smarter duplicate check — allows re-apply after ended employment or rejection; blocks only pending+current-approved
  - `updateEmploymentStatus`: enhanced to include `employee_id` in select; auto soft-deletes prior ended approved records before approving new request (avoids DB unique constraint violation on re-hire)
- All modified files pass `node --check` ✅
- Files modified: feedbackService.js, feedbackController.js, feedbackRoutes.js, employmentService.js

### 2026-02-23 12:00 PM - Walid: Days 1–4 Admin & Reports Module Complete ✅
- Expanded `adminService.js` from 2 thin wrappers to full admin module (13 functions)
  - getUsers (search by email + employee name, role filter, pagination)
  - suspendUser (prevents suspending system_admin, revokes tokens, audit log, email)
  - unsuspendUser (reactivate + audit log + email)
  - deleteUser (soft delete, prevents deleting system_admin, BR-018, audit log)
  - getCompanies (search name/industry/location, pagination)
  - verifyCompany (set is_verified=true, audit log)
  - overrideEmployment (admin force-approve, audit log)
  - getAnalytics (users, companies, reviews, avg rating, by-role, this-month, pending reports, recent activity)
  - getAuditLogs (filter by adminId, action, pagination, join admin email)
- Expanded `adminController.js` from 2 handlers to 11 handlers
- Expanded `adminRoutes.js` from 3 routes to 11 routes:
  - POST   /reports (existing)
  - GET    /admin/reports (existing)
  - PATCH  /admin/reports/:id/resolve (existing)
  - GET    /admin/users (NEW)
  - PATCH  /admin/users/:id/suspend (NEW)
  - PATCH  /admin/users/:id/unsuspend (NEW)
  - DELETE /admin/users/:id (NEW)
  - GET    /admin/companies (NEW)
  - PATCH  /admin/companies/:id/verify (NEW)
  - PATCH  /admin/employments/:id/override (NEW)
  - GET    /admin/analytics (NEW)
  - GET    /admin/audit-logs (NEW)
- Added 3 email templates + send functions to emailService.js:
  - sendAccountSuspendedEmail, sendAccountUnsuspendedEmail, sendReportResolutionEmail
- Added `validateSuspendUser` to validators.js
- All routes protected with requireAuth + requireSystemAdmin
- Server tested — loads clean, health check OK
- Files modified: adminService.js, adminController.js, adminRoutes.js, emailService.js, validators.js

### 2026-02-23 - Baraa: Code review Walid Days 1-4 ✅
- Reviewed commits `e7e188d` + `e69d8cb` — all endpoints correct
- `requireSystemAdmin` used on all admin routes ✅
- `system_admin` suspension/deletion blocked in service ✅
- Rate limiting (5 reports/day) in `reportService` ✅
- Audit logging on all moderation actions ✅
- Email functions follow correct Resend pattern ✅
- **BUG-007 (Minor)**: ✅ FIXED — added `full_name` to user select in `suspendUser`/`unsuspendUser`, passes `user.full_name || user.email` as name
- Walid self-updated AI_CONTEXT — verified accurate ✅
- ✅ All 4 members Days 0-4 complete — Day 5 integration unblocked

### 2026-02-21 11:30 PM - Baraa: Code review Raneem Days 3-4 + fixed BUG-004/005/006
- Reviewed Raneem's commit `93054f7` merged into dev
- **BUG-001** ✅ confirmed fixed by Raneem (ratings 1-5, year 2020)
- **BUG-004** ✅ FIXED: removed dead `exports.createFeedback = async (req,res)` block from `feedbackService.js`
- **BUG-005** ✅ FIXED: added `sendEmploymentRequestEmail`, `sendEmploymentApprovedEmail`, `sendEmploymentRejectedEmail` calls in `employmentController.js` (non-blocking try/catch)
- **BUG-006** ✅ FIXED: removed `@sendgrid/mail` from `package.json` (we use Resend)
- Raneem Days 3-4 now fully complete ✅
- ✅ All 4 team members (Baraa, Aya, Raneem, Walid) Days 0-4 complete — ready for Day 5 integration

### 2026-02-21 10:30 PM - Aya: Fixed BUG-002 + BUG-003
- Commit `e42f767 fix(Aya): validate report reason + use shared checkVerifiedEmployment helper`
- `reviewService.js`: Added `VALID_REPORT_REASONS` constant + validation guard in `reportReview()` ✅
- `reviewService.js`: Replaced inline `checkVerifiedEmployment` with `require('../helpers/checkVerifiedEmployment')` ✅
- BUG-001 (Raneem/Critical) still open — Raneem must fix before Day 5

### 2026-02-21 09:00 PM - Baraa: Full Code Review (Aya + Raneem)
- Reviewed all pushed code against DB schema
- Found 3 issues (2 bugs, 1 low-priority duplicate)
- **BUG-001 (Raneem/Critical)**: feedbackController validates ratings 1-10, DB constraint is 1-5 → will crash on values 6-10
- **BUG-002 (Aya/Medium)**: ✅ FIXED in `e42f767` — added `VALID_REPORT_REASONS` array + validation before insert
- **BUG-003 (Aya/Low)**: ✅ FIXED in `e42f767` — replaced inline function with `require('../helpers/checkVerifiedEmployment')`
- All bugs documented in KNOWN BUGS section above
- Everything else verified correct: table names, column names, employment_id in review insert, auth middleware, route protection, anonymous review via view
- Aya confirmed: AI_CONTEXT updated correctly after her push ✅

### 2026-02-25 (Day 6) - Aya Day 6 Polish Complete ✅
- **Cascade soft-delete in `deleteCompany()`** — when a company is deleted, all associated reviews are soft-deleted first (same timestamp), then the company
- **Pagination edge case fix (count-first pattern)** applied to 3 functions:
  - `companyService.getCompanies()` — count query first, check `page > totalPages`, return empty `{ data: [], pagination: { message: "Page X exceeds total pages (Y)" } }` if exceeded, THEN fetch data
  - `reviewService.getCompanyReviews()` — same count-first pattern
  - `reviewService.getMyReviews()` — same count-first pattern
  - **Why**: Supabase throws 500 error if `.range(huge_offset, ...)` is called — must count first
- **Search performance**: created `backend/day6-search-index.sql` — GIN trigram indexes on `name`, `description`, `location` + B-Tree on `industry`, `overall_rating` (all partial with `WHERE deleted_at IS NULL`) — needs to be run manually in Supabase SQL Editor
- **Live tests passed**:
  - ✅ GET /api/companies?page=1&limit=5 → total=8, page=1, totalPages=2, 5 results
  - ✅ GET /api/companies?page=9999 → empty array, message: "Page 9999 exceeds total pages (1)"
  - ✅ GET /api/companies?search=tech → 2 matching results
  - ✅ POST /api/companies (employee token) → 403 Forbidden (role check)
  - ✅ GET /api/reviews/my-reviews (no token) → 401 Unauthorized
  - ✅ POST /api/reviews (employee, no employment) → 403 employment verification
  - ✅ GET /api/companies/:id/reviews?page=9999 → empty array with message
- Files changed: `companyService.js`, `reviewService.js`, `day6-search-index.sql`

### 2026-02-21 08:00 PM - Aya Days 0-4 Complete ✅
- Implemented full company & review system (Days 0-2 + Days 3-4)
- Created companyService.js (7 functions): CRUD + stats + analytics
- Created reviewService.js (10 functions): CRUD + helpers + analytics
- Created controllers: companyController (7 endpoints), reviewController (7 endpoints)
- Created routes: companyRoutes (8 routes), reviewRoutes (6 routes)
- Fixed database schema compatibility: deleted_at (not is_deleted), user_id (not created_by)
- Installed resend package for email compatibility
- All Days 3-4 features implemented:
  - Review editing within 48hr window
  - My reviews page with company join
  - Company reviews with sorting (newest, highest, lowest)
  - Anonymous review safe handling via public_company_reviews view
  - Company analytics: rating distribution (1-5 stars) + monthly trends
- All endpoints tested and working ✅
- Files: companyService.js, reviewService.js, companyController.js, reviewController.js, companyRoutes.js, reviewRoutes.js

### 2026-02-21 05:00 PM - Baraa Days 3–4 Email & Security Complete
- Replaced Nodemailer with Resend SDK (`config/email.js` rewritten)
- Created `emailService.js` — 5 send functions: welcome, verify-email, reset-password, employment approved/rejected
- Created 2 DB tables in Supabase: `email_verification_tokens` (24h expiry), `password_reset_tokens` (1h expiry)
- `verifyEmail()` — validates token, marks email_verified=true, stamps used_at (one-time use)
- `forgotPassword()` — invalidates existing tokens, generates new, sends reset email
- `resetPassword()` — validates token, bcrypt hashes new password, revokes ALL refresh tokens (security)
- Re-enabled email_verified check in loginUser (was TODO since Day 1)
- Register now sends welcome + verification email automatically
- New routes: GET /verify-email/:token, POST /forgot-password, POST /reset-password/:token
- Files: authService.js, authController.js, authRoutes.js, config/email.js, services/emailService.js

### 2026-02-21 03:00 PM - Raneem Days 1–2 Complete + Merged to baraa
- All employment + feedback code reviewed and verified correct
- `POST /employments/request` — validates company exists, prevents duplicates, inserts with `pending` status
- `GET /employments` — lists employee's employments with company join
- `PATCH /employments/:id/approve` — company_admin only, sets approved + verified_by + verified_at
- `PATCH /employments/:id/reject` — company_admin only, sets rejected + rejection_note
- `POST /feedback` — full validation: no self-feedback, same company (both approved), one per quarter
- `checkVerifiedEmployment()` helper — returns boolean, ready for Aya's reviewService
- Bugs fixed: duplicate `rejectEmployment` export in controller, unused `supabase` import in routes
- Merged `origin/dev` → `baraa` branch (clean auto-merge, no conflicts)
- Pushed to remote baraa
- Files: employmentService.js, employmentController.js, employmentRoutes.js, feedbackService.js, feedbackController.js, feedbackRoutes.js, helpers/checkVerifiedEmployment.js

### 2026-02-21 10:00 AM - Baraa Days 1–2 Auth Complete
- Implemented `refreshToken()` — verify in DB, revoke old token, issue new pair (rotation)
- Implemented `logout()` — revoke refresh token in DB
- Implemented `getMe()` — return current user profile from DB
- Added controllers: `refresh`, `logout`, `getMe`
- Added routes: POST /auth/refresh-token, POST /auth/logout, GET /auth/me
- Tested all with Postman — ✅ all working
- Days 1–2 auth tasks are now 100% complete
- Remaining auth work moved to Days 3–4: email verification + password reset
- Files modified:
  - `backend/src/services/authService.js`
  - `backend/src/controllers/authController.js`
  - `backend/src/routes/authRoutes.js`

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
- ✅ Build POST /auth/refresh-token
- ✅ Build POST /auth/logout
- ✅ Build GET /auth/me
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

#### Raneem (Employment & Feedback) ✅ COMPLETE
- ✅ Import real requireAuth middleware
- ✅ Build POST /employments/request
- ✅ Build GET /employments (list mine)
- ✅ Build PATCH /employments/:id/approve
- ✅ Build PATCH /employments/:id/reject
- ✅ Create `checkVerifiedEmployment()` helper — on dev for Aya
- ✅ Use real requireAuth middleware
- ✅ Build... (10 KB left)
message.txt
60 KB