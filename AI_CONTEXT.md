# 🤖 AI ASSISTANT PROJECT CONTEXT

> **FOR AI ASSISTANTS**: This file contains the current state of the project, completed tasks, and active work. Update this file whenever you make changes or complete tasks. This helps all team members' AI assistants stay synchronized.

**Last Updated**: March 3, 2026 (Bug Fix Rounds 4 & 5 complete — 8 fixes total, MANUAL_TEST_CASES restructured)  
**Project**: Company Ratings Platform (Glassdoor-like)  
**Team Size**: 4 developers  
**Sprint**: Day 8 ✅ COMPLETE — Frontend integration finished, all 8 phases done + 2 post-phase bug fix rounds  
**Tech Lead**: @baraa

---

## 📊 PROJECT STATUS: DAY 6 COMPLETE ✅

**Server Status**: ✅ Running on `localhost:5000`  
**Database Status**: ✅ Deployed and verified  
**Auth Status**: ✅ Full auth system — register, login, verify-email, forgot/reset-password, refresh, logout, getMe  
**Email Status**: ✅ Nodemailer + Gmail SMTP (switched from Resend) + sendAccountDeletedEmail added  
**Company & Review Status**: ✅ Full CRUD + analytics + cascade delete + pagination edge cases  
**Employment & Feedback Status**: ✅ Full flow — feedback received/given, employment re-hire, is_current filter  
**Admin & Reports Status**: ✅ Full admin layer — reports stats, bulk suspend, name search, audit logs  
**Security Status**: ✅ XSS sanitization, Helmet hardening, CORS locked, body limit 10kb, rate limiters prod-ready, trim validators, SQL injection safe  
**Integration Tests**: ✅ **122/122 assertions passing** — 87 flow+security tests + 17 Day 6-7+ tests (W01-W04 admin, R01-R04 feedback, V01-V04 edge cases, 43b suspended login, E14/E15 employee profile, D0/D1 user delete)  
**Bug Fixed (BUG-041)**: `reviewService.js` null crash on `.single()` with multiple soft-deleted employment rows — added `deleted_at` filter + `.maybeSingle()`  
**Team Status**: ✅ Baraa Days 0-7, Aya Days 0-7, Walid Days 0-7, Raneem Days 0-7 ✅ all merged into dev

---

## ✅ COMPLETED TASKS

### Day 6-7: Postman Integration Tests Expanded + BUG-041 Fix ✅
- [x] Added 12 new tests to `backend/Day5_Complete_Test.postman_collection.json`
  - **Section 14 (W01-W04)**: Walid Day 6 admin polish — report stats, name search, bulk-suspend, unsuspend  
  - **Section 15 (R01-R04)**: Raneem Day 6-7 feedback endpoints — given, received (colleague), received (employee), Q2 submit  
  - **Section 16 (V01-V04)**: Day 7 edge cases — non-owner PATCH 403, pagination, sort, role filter  
- [x] **BUG-041 Fixed**: `reviewService.js` — employment query used `.single()` without `deleted_at` filter causing 500 when multiple soft-deleted rows exist; fixed with `.is('deleted_at', null).order().limit(1).maybeSingle()` + null guard  
- [x] Fixed test 38 expected codes `[201,409]` → `[201,400,403,409]` (Raneem's employment check now enforces `is_current=true`)  
- [x] Fixed test 46 verify company to accept `[200,400]` (already verified from prior run)  
- [x] Fixed W01 stats assertions to check `d.data.byStatus` for pending count  
- [x] **Final result**: **104 requests / 122 assertions / 0 failures** ✅  
- [x] Installed missing `xss` npm package (required by Baraa's `sanitize.js` middleware)  
- [x] Committed + pushed to `baraa` and `dev` branches  

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

## 🚧 CURRENT TASKS — FRONTEND INTEGRATION

> **Backend is 100% complete** — 122/122 tests passing, all 4 members merged to dev.
> Now connecting every backend endpoint to the frontend.

---

### 🔴 CRITICAL GAP ANALYSIS

**What exists today:**
- `api/client.js` is auth-aware with silent 401 → refresh → retry
- `api/auth.js` has all 9 functions: login, register, verify-email, forgot/reset-password, refresh, logout, getMe, changePassword
- `AuthContext.jsx` stores tokens, refresh logic, logout, session rehydration via `GET /auth/me`
- `Navbar.jsx` is fully auth-aware: role-based nav links, profile dropdown, real initials, logout
- **ALL 12+ pages are connected to real API** — no mock data remains
- **Role-based route protection** implemented via `ProtectedRoute` / `RoleRoute` in App.jsx
- **Email verification page** exists at `/verify-email/:token`
- **Forgot/reset password pages** exist at `/forgot-password` and `/reset-password/:token`
- **New endpoints added**: `POST /auth/change-password`, `GET /companies/:id/employees`

---

### 📋 COMPLETE BACKEND → FRONTEND MAPPING

#### Auth Endpoints (`/api/auth`) — 9 endpoints
| # | Backend Endpoint | Frontend Location | Status |
|---|---|---|---|
| 1 | `POST /auth/register` | `RegisterPage.jsx` → `apiRegister()` | ✅ Connected |
| 2 | `POST /auth/login` | `LoginPage.jsx` → `apiLogin()` | ✅ Connected |
| 3 | `GET /auth/verify-email/:token` | `VerifyEmailPage.jsx` → auto-verify on mount | ✅ Connected |
| 4 | `POST /auth/forgot-password` | `ForgotPasswordPage.jsx` → email form | ✅ Connected |
| 5 | `POST /auth/reset-password/:token` | `ResetPasswordPage.jsx` → new password form | ✅ Connected |
| 6 | `POST /auth/refresh-token` | `AuthContext.jsx` → silent refresh on 401 | ✅ Connected |
| 7 | `POST /auth/logout` | `Navbar.jsx` "Sign Out" → `logout()` | ✅ Connected |
| 8 | `GET /auth/me` | `AuthContext.jsx` → session rehydration on mount | ✅ Connected |
| 9 | `POST /auth/change-password` | `ProfilePage.jsx` Settings → `apiChangePassword()` | ✅ Connected |

#### Company Endpoints (`/api/companies`) — 9 endpoints
| # | Backend Endpoint | Frontend Location | Status |
|---|---|---|---|
| 9 | `GET /companies` | `CompaniesPage.jsx` → real API with filters/search/pagination | ✅ Connected |
| 10 | `GET /companies/:id` | `CompanyProfilePage.jsx` → real company data | ✅ Connected |
| 11 | `GET /companies/:companyId/reviews` | `CompanyProfilePage.jsx` → paginated reviews with sort | ✅ Connected |
| 12 | `GET /companies/:id/analytics` | `CompanyAdminDashboard.jsx` AnalyticsTab → real chart data | ✅ Connected |
| 13 | `GET /companies/:id/stats` | `CompanyAdminDashboard.jsx` stat cards → real stats | ✅ Connected |
| 14 | `POST /companies` | Not exposed in UI — company created during registration | ⚠️ Implicit |
| 15 | `PATCH /companies/:id` | `CompanyAdminDashboard.jsx` SettingsTab → `updateCompany()` | ✅ Connected |
| 16 | `DELETE /companies/:id` | Not exposed in frontend UI | ⚠️ N/A |
| 17 | `GET /companies/:id/employees` | `InternalFeedbackPage.jsx` → coworker picker | ✅ Connected (NEW) |

#### Review Endpoints (`/api/reviews`) — 5 endpoints
| # | Backend Endpoint | Frontend Location | Status |
|---|---|---|---|
| 18 | `POST /reviews` | `WriteReviewPage.jsx` → `createReview()` | ✅ Connected |
| 19 | `GET /reviews/my-reviews` | `EmployeeDashboard.jsx` Reviews tab → real reviews | ✅ Connected |
| 20 | `GET /reviews/:id` | Not used (could be for review detail modal) | ⚠️ N/A |
| 21 | `PATCH /reviews/:id` | `EmployeeDashboard.jsx` Reviews tab → edit within 48h | ✅ Connected |
| 22 | `DELETE /reviews/:id` | `EmployeeDashboard.jsx` Reviews tab → delete review | ✅ Connected |

#### Employment Endpoints (`/api/employments`) — 6 endpoints
| # | Backend Endpoint | Frontend Location | Status |
|---|---|---|---|
| 23 | `POST /employments/request` | `EmployeeDashboard.jsx` Employment tab → `requestEmployment()` | ✅ Connected |
| 24 | `GET /employments` | `EmployeeDashboard.jsx` Employment tab + `ProfilePage.jsx` | ✅ Connected |
| 25 | `GET /employments/pending` | `CompanyAdminDashboard.jsx` RequestsTab → real requests | ✅ Connected |
| 26 | `PATCH /employments/:id/approve` | `CompanyAdminDashboard.jsx` RequestsTab "Approve" | ✅ Connected |
| 27 | `PATCH /employments/:id/reject` | `CompanyAdminDashboard.jsx` RequestsTab "Reject" | ✅ Connected |
| 28 | `PATCH /employments/:id/end` | Not exposed in frontend UI | ⚠️ N/A |

#### Feedback Endpoints (`/api/feedback`) — 3 endpoints
| # | Backend Endpoint | Frontend Location | Status |
|---|---|---|---|
| 29 | `POST /feedback` | `InternalFeedbackPage.jsx` → `submitFeedback()` with real coworkers | ✅ Connected |
| 30 | `GET /feedback/received` | `EmployeeDashboard.jsx` Feedback tab + `ProfilePage.jsx` | ✅ Connected |
| 31 | `GET /feedback/given` | `ProfilePage.jsx` activity stats | ✅ Connected |

#### Employee Endpoints (`/api/employees`) — 2 endpoints
| # | Backend Endpoint | Frontend Location | Status |
|---|---|---|---|
| 32 | `GET /employees/:id` | `ProfilePage.jsx` → real profile data | ✅ Connected |
| 33 | `PATCH /employees/:id` | `ProfilePage.jsx` ProfileSection → `updateEmployeeProfile()` | ✅ Connected |

#### Reports & Admin Endpoints — 14 endpoints
| # | Backend Endpoint | Frontend Location | Status |
|---|---|---|---|
| 34 | `POST /reports` | `CompanyProfilePage.jsx` report form → `submitReport()` | ✅ Connected |
| 35 | `GET /admin/reports` | `AdminPanel.jsx` ReportsTab → real reports with status filter | ✅ Connected |
| 36 | `GET /admin/reports/stats` | `AdminPanel.jsx` OverviewTab → real pending count badge | ✅ Connected |
| 37 | `PATCH /admin/reports/:id/resolve` | `AdminPanel.jsx` ReportsTab → resolve/dismiss actions | ✅ Connected |
| 38 | `GET /admin/users` | `AdminPanel.jsx` UsersTab → real users with search/role filter | ✅ Connected |
| 39 | `PATCH /admin/users/bulk-suspend` | Not exposed in frontend UI | ⚠️ N/A |
| 40 | `PATCH /admin/users/:id/suspend` | `AdminPanel.jsx` UsersTab → suspend with reason modal | ✅ Connected |
| 41 | `PATCH /admin/users/:id/unsuspend` | `AdminPanel.jsx` UsersTab → unsuspend toggle | ✅ Connected |
| 42 | `DELETE /admin/users/:id` | `AdminPanel.jsx` UsersTab → delete with confirmation | ✅ Connected |
| 43 | `GET /admin/companies` | `AdminPanel.jsx` CompaniesTab → real companies with verify | ✅ Connected |
| 44 | `PATCH /admin/companies/:id/verify` | `AdminPanel.jsx` CompaniesTab → verify button | ✅ Connected |
| 45 | `PATCH /admin/employments/:id/override` | Not exposed in frontend UI | ⚠️ N/A |
| 46 | `GET /admin/analytics` | `AdminPanel.jsx` OverviewTab → real platform stats | ✅ Connected |
| 47 | `GET /admin/audit-logs` | `AdminPanel.jsx` AuditTab → real audit logs with pagination | ✅ Connected |

---

### 🗓️ FRONTEND INTEGRATION TODO — PHASE BY PHASE

---

#### PHASE 1: API Layer & Auth Foundation ✅ COMPLETE
> Done by Baraa — Feb 24, 2026

- [x] `src/api/client.js` — auth-aware fetch wrapper with silent 401 → refresh → retry
- [x] `src/api/auth.js` — rewrote with all 8 functions using client.js
- [x] `src/api/companies.js` — 8 functions
- [x] `src/api/reviews.js` — 5 functions
- [x] `src/api/employments.js` — 6 functions
- [x] `src/api/feedback.js` — 3 functions
- [x] `src/api/employees.js` — 2 functions
- [x] `src/api/admin.js` — 14 functions (reports + admin endpoints combined)
- [x] `AuthContext.jsx` — added `logout()`, `useEffect` session rehydration via `GET /auth/me`, exposes `logout` in context
- [x] `App.jsx` — added `ProtectedRoute`, `RoleRoute`, 3 new routes, full role-based protection on all pages
- [x] `src/pages/VerifyEmailPage.jsx` — auto-verifies token on mount, success/error states
- [x] `src/pages/ForgotPasswordPage.jsx` — email form → "check inbox" success state, matches LoginPage layout
- [x] `src/pages/ResetPasswordPage.jsx` — password + strength meter + confirm → auto-redirect to login after 3s
- [x] `LoginPage.jsx` — "Forgot password?" now links to `/forgot-password`

---

#### PHASE 2: Public Pages (Companies Browse & Company Profile) ✅ COMPLETE
> Done by Walid — Feb 25, 2026

- [x] **2.1** `CompaniesPage.jsx` — Connected to real API:
  - On mount: calls `GET /companies` with query params (search, industry, location, minRating, sortBy, sortOrder, page, limit)
  - Search input debounced (400ms) → `search` query param
  - Industry dropdown (20 DB industries) → `industry` query param
  - Location text input → `location` query param (backend does ilike)
  - Min rating buttons → `minRating` query param
  - Sort dropdown mapped to `sortBy` + `sortOrder` (Highest Rated / Most Reviewed / Alphabetical / Recently Added)
  - Real pagination with smart page buttons (ellipsis for large page counts)
  - Loading skeleton, empty state, error state with alert
  - Auto-reset to page 1 on filter change
  - Deterministic gradient picker for company cards (from company name hash)

- [x] **2.2** `CompanyProfilePage.jsx` — Connected to real API:
  - Reads `:id` from URL params
  - On mount: parallel fetch `GET /companies/:id` + `GET /companies/:id/analytics`
  - Reviews fetched via `GET /companies/:companyId/reviews` with sort + pagination
  - Review sort dropdown (Recent / Highest Rated / Lowest Rated) triggers re-fetch
  - Rating distribution sidebar computed from analytics data (5→1 stars with % bars)
  - Report form connected to `POST /reports` (auth check — redirects to login if not logged in)
  - Report form uses `reason` select + `description` textarea with submitting/success/error states
  - Loading spinner, 404/error state with back link, empty reviews state with CTA
  - Review pagination (prev/next with page counter)

- [x] **2.3** `LandingPage.jsx` — Top companies connected:
  - "Top Rated Companies" section fetches `GET /companies?sortBy=overall_rating&sortOrder=desc&limit=4`
  - Company cards link to real `/companies/:id` routes (not hardcoded `/companies/1`)
  - Uses real `overall_rating`, `total_reviews`, `industry` fields
  - Graceful fallback if API fails (empty array, no crash)
  - Stats counter section + testimonials kept as static marketing content

---

#### PHASE 3: Employee Features (Dashboard, Write Review, Feedback) ✅ COMPLETE
> Done by teammates (Raneem) + Walid (InternalFeedbackPage rewrite)

- [x] **3.1** `WriteReviewPage.jsx` — Connected by teammates
- [x] **3.2** `EmployeeDashboard.jsx` — Connected by teammates (all 4 tabs: Overview, Employment, Reviews, Feedback)
- [x] **3.3** `InternalFeedbackPage.jsx` — **REWRITTEN by Walid**:
  - Added `GET /companies/:id/employees` backend endpoint (new)
  - Replaced hardcoded coworkers with real API (getMyEmployments + getCompanyEmployees)
  - Company selector for multi-company users
  - Fixed payload format: `{ ratedEmployeeId, companyId, professionalism, communication, teamwork, reliability, writtenFeedback, quarter, year }`
  - Auto-detects current quarter, loading/error/empty states

---

#### PHASE 4: Company Admin Dashboard ✅ COMPLETE
> Connected by teammates (Baraa). All 5 tabs use real API.

- [x] **4.1** `CompanyAdminDashboard.jsx` — Uses `user.companyId` from auth context, real company name
- [x] **4.2** Analytics Tab — `getCompanyStats()` + `getCompanyAnalytics()` for real data
- [x] **4.3** Requests Tab — `getPendingEmployments()`, approve/reject with re-fetch
- [x] **4.4** Reviews Tab — `getCompanyReviews(companyId)` with real data
- [x] **4.5** Team Feedback Tab — `getFeedbackReceived()` for real feedback
- [x] **4.6** Settings Tab — Pre-filled from `getCompanyById()`, save via `updateCompany()`

---

#### PHASE 5: System Admin Panel ✅ COMPLETE
> **FULLY REWRITTEN by Walid** — all 5 tabs replaced from mock to real API (~750 lines).

- [x] **5.1** Overview Tab — `getAdminAnalytics()` for stats, `getReportStats()` for pending count, quick action buttons switch tabs
- [x] **5.2** Reports Tab — `getReports()` with status filter (pending/dismissed/resolved/all), resolve/dismiss via `resolveReport()`, pagination, per-action loading states
- [x] **5.3** Companies Tab — `getAdminCompanies()` for all companies, verify button for unverified, pagination
- [x] **5.4** Users Tab — `getAdminUsers()` with debounced search (400ms), role filter, suspend modal with reason → `suspendUser()`, unsuspend → `unsuspendUser()`, delete confirmation → `deleteUser()`, system_admin protection, pagination
- [x] **5.5** Audit Log Tab — `getAuditLogs()` with pagination, formatted action names, admin email display

---

#### PHASE 6: Profile & Account ✅ COMPLETE
> Connected by teammates (Baraa) + Walid (Settings section).

- [x] **6.1** `ProfilePage.jsx` — Profile section connected with `getEmployeeProfile()` + `updateEmployeeProfile()`
- [x] **6.2** Employment section — `getMyEmployments()` for real history
- [x] **6.3** Activity section — `getMyReviews()` + `getFeedbackGiven()` + `getFeedbackReceived()` for real counts
- [x] **6.4** Settings section — **Connected by Walid**:
  - Change Password: new `POST /auth/change-password` endpoint (validates current password, bcrypt hash, revokes refresh tokens) → frontend form with validation, success auto-logout
  - Notification Preferences: cosmetic only (no backend table — kept as-is)
  - Delete Account: shows "contact admin" message (no self-delete endpoint)

---

#### PHASE 7: Navbar & Navigation Polish ✅ COMPLETE
> Connected by teammates (Baraa).

- [x] **7.1** `Navbar.jsx` — Fully auth-aware (291 lines):
  - Uses `useAuth()` for user/logout
  - Role-based nav links (employee→Dashboard/Feedback, company_admin→Company Admin, system_admin→Admin Panel)
  - Profile dropdown with real initials/name, mobile menu
  - "Sign Out" calls `logout()`
- [x] **7.2** `App.jsx` — All routes added:
  - `/verify-email/:token`, `/forgot-password`, `/reset-password/:token`
  - `ProtectedRoute` and `RoleRoute` wrappers on all protected pages

---

#### PHASE 8: UX Polish & Edge Cases ✅ COMPLETE
> Done by Walid — Feb 25, 2026

- [x] **8.1** Loading states — Created reusable `Skeleton.jsx` component (CardSkeleton, TableRowSkeleton, StatSkeleton, PageLoader). AdminPanel + InternalFeedbackPage already have loading states. Other pages (CompaniesPage, CompanyProfilePage, EmployeeDashboard, CompanyAdminDashboard) already had loading states from teammates.
- [x] **8.2** Error handling — Created `ToastContext.jsx` global toast system (success/error/info, auto-dismiss, max 5 visible, animated with Framer Motion). Wrapped App in `ToastProvider`. Available via `useToast()` hook.
- [x] **8.3** Empty states — Created reusable `EmptyState` component in Skeleton.jsx. AdminPanel, InternalFeedbackPage already have empty states. Other pages had empty states from teammates.
- [x] **8.4** 404 page — Created `NotFoundPage.jsx` with large 404 display, home/companies navigation buttons, go-back link. Added `<Route path="*">` catch-all in App.jsx.
- [x] **8.5** Responsive testing — All pages use Tailwind responsive classes (sm:/md:/lg: breakpoints) throughout. Verified CSS structure is mobile-friendly.
- [x] **8.6** Token expiry UX — Added `SESSION_EXPIRED_EVENT` custom event in client.js, dispatched when refresh token fails. `SessionExpiredListener` component in App.jsx shows toast "Your session has expired. Please sign in again." before redirecting to /login.

---

### 📊 SUMMARY SCOREBOARD

| Category | Total Endpoints | Connected | Mock/Missing | N/A |
|---|---|---|---|---|
| Auth | 9 | 9 | 0 | 0 |
| Companies | 9 | 7 | 0 | 2 |
| Reviews | 5 | 4 | 0 | 1 |
| Employments | 6 | 5 | 0 | 1 |
| Feedback | 3 | 3 | 0 | 0 |
| Employees | 2 | 2 | 0 | 0 |
| Admin/Reports | 14 | 11 | 0 | 3 |
| **TOTAL** | **48** | **41** | **0** | **7** |

**Frontend pages needing work**: 0 of 15 — ALL pages connected ✅
**New pages created (Phase 1)**: 3 (VerifyEmail, ForgotPassword, ResetPassword)
**New API files created (Phase 1)**: 8 (client.js + 7 domain modules)
**New backend endpoints added**: 2 (POST /auth/change-password, GET /companies/:id/employees)

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
├── Email: Nodemailer (Gmail SMTP - configured ✅)
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
    │   ├── authRoutes.js         # ✅ POST /register, POST /login, POST /refresh-token, POST /logout, GET /me, GET /verify-email/:token, POST /forgot-password, POST /reset-password/:token, POST /change-password
    │   ├── companyRoutes.js      # ✅ Aya's work
    │   ├── reviewRoutes.js       # ✅ Aya's work
    │   ├── employmentRoutes.js   # ✅ Raneem's work
    │   ├── feedbackRoutes.js     # ✅ Raneem's work
    │   └── adminRoutes.js        # ✅ Walid's work — POST /reports, GET/PATCH /admin/reports, GET/PATCH/DELETE /admin/users, GET/PATCH /admin/companies, PATCH /admin/employments, GET /admin/analytics, GET /admin/audit-logs
    ├── controllers/
    │   ├── authController.js     # ✅ register, login, refresh, logout, getMe, verifyEmail, forgotPassword, resetPassword, changePassword
    │   ├── companyController.js  # ✅ Aya's work
    │   ├── reviewController.js   # ✅ Aya's work
    │   ├── employmentController.js # ✅ Raneem's work
    │   ├── feedbackController.js # ✅ Raneem's work
    │   ├── reportController.js   # ✅ Walid — createReport
    │   └── adminController.js    # ✅ Walid — getReports, resolveReport, getUsers, suspendUser, unsuspendUser, deleteUser, getCompanies, verifyCompany, overrideEmployment, getAnalytics, getAuditLogs
    └── services/
        ├── authService.js        # ✅ registerUser, loginUser, refreshToken, logout, getMe, verifyEmail, forgotPassword, resetPassword, changePassword
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
5. **Email**: Nodemailer + Gmail SMTP configured — `EMAIL_USER` and `EMAIL_PASS` (App Password) in `.env`

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

### 2026-03-03 — Walid: Bug Fix Round 5 (6 fixes) + MANUAL_TEST_CASES Restructure ✅

**Commit**: `e58b9fb` (fixes), `20fd482` (restructure)  
**Branch**: `ratehub.3`

**Summary**: Fixed 6 remaining broken test cases from Round 5 re-test. All `alert()`/`window.confirm()` calls replaced with inline error state. Fixed auth flash-redirect (F5) and Dashboard title bug. Restructured MANUAL_TEST_CASES.txt from 832 → 586 lines.

**Fixes applied**:

| Fix ID | File | Root Cause | Solution |
|--------|------|-----------|----------|
| C3 | `CompanyAdminDashboard.jsx` | `useState('Dashboard')` default + title template → "Dashboard Dashboard" | Default `''`; title: `companyName ? \`${companyName} Dashboard\` : 'Company Dashboard'` |
| C4 | `CompanyAdminDashboard.jsx` | No guard when `user.companyId` is null → blank/infinite loader | Early return rendering error card: "No company linked to your account." |
| A17 (UsersTab) | `AdminPanel.jsx` | 4 handlers used `alert()`; delete used `window.confirm()` | Added `userError` state + inline red banner; two-click delete confirm (`deleteConfirm` state: trash icon → "Sure? / ✕") |
| V2-F4-D (VerificationsTab) | `AdminPanel.jsx` | 3 `alert()` calls in approve/reject handlers | Added `verifError` state + inline red banner |
| X1 (F5 flash-redirect) | `AuthContext.jsx` + `App.jsx` | Any API error in getMe cleared session; routes redirected before rehydration | Added `initializing` state (true while token rehydration in-flight); `ProtectedRoute`/`RoleRoute` return `null` while initializing |
| V2-CR5 | `CompanyProfilePage.jsx` | Reply submit catch called `alert()` | Added `replyError` state; red text below textarea; cleared on success/cancel |

**Files modified**:
- `frontend/src/pages/CompanyAdminDashboard.jsx` — C3 title fix + C4 no-company guard
- `frontend/src/pages/AdminPanel.jsx` — UsersTab: `userError` + `deleteConfirm` state; VerificationsTab: `verifError` state
- `frontend/src/context/AuthContext.jsx` — Added `initializing` state + `.finally(() => setInitializing(false))`
- `frontend/src/App.jsx` — `ProtectedRoute` + `RoleRoute` read `initializing`, return `null` while true
- `frontend/src/pages/CompanyProfilePage.jsx` — `replyError` state, inline red text, cleared on cancel
- `MANUAL_TEST_CASES.txt` — **RESTRUCTURED** from 832 → 586 lines:
  - Removed 3 stacked orphan headers, empty section skeletons, inline failure notes, stale known-issues list
  - New 3-part structure: Part 1 (Core Pending, 15 tests) · Part 2 (V2 Features, 15 tests) · Part 3 (Re-test Rounds 1–5, 50 tests)
  - Added Totals section: **80 tests total**
  - Added R5 section (15 re-test cases for the 6 fixes above)

---

### 2026-03-03 — Baraa: Bug Fix Round 4 — Self-report + Dismiss Alert ✅

**Commit**: `ba15ac9`  
**Branch**: `ratehub.3`

**Summary**: Fixed self-report button being hidden for own anonymous reviews. Replaced `alert()` in AdminPanel ReportsTab Dismiss action with inline error state.

**Fixes applied**:

| Fix ID | File | Root Cause | Solution |
|--------|------|-----------|----------|
| F13-A (Self-report button) | `CompanyProfilePage.jsx` + backend | Employee ID hidden in public view for anonymous reviews → `review.employee_id` always null → "Report" button shown, "Self-report" button never shown for own reviews | Added `is_own` field: `reviewController.js` queries private `company_reviews` table (bypasses `public_company_reviews` view) when user is authenticated via `optionalAuth`; frontend uses `review.is_own` |
| A6 (Dismiss alert) | `AdminPanel.jsx` ReportsTab | `handleDismiss` catch block called `alert()` | Replaced with `setActionError()` → inline error banner in ReportsTab |

**Files modified**:
- `backend/src/controllers/reviewController.js` — Added `is_own` injection via private table query when `req.user` present
- `backend/src/routes/companyRoutes.js` — Added `optionalAuth` middleware to `GET /:companyId/reviews`
- `frontend/src/pages/CompanyProfilePage.jsx` — `review.is_own` replaces `review.employee_id === user?.userId` comparison
- `frontend/src/pages/AdminPanel.jsx` — ReportsTab `handleDismiss` catch: `setActionError()` instead of `alert()`

---

### 2026-02-25 — Walid: Phase 8 UX Polish Complete ✅

**Summary**: Implemented all Phase 8 UX polish items: global toast notification system, 404 not-found page, reusable skeleton/empty-state components, and session-expired toast notification.

**New files created**:
- `frontend/src/context/ToastContext.jsx` — Global toast system with success/error/info types, auto-dismiss, animated with Framer Motion, max 5 visible. `useToast()` hook exposes `toast.success()`, `toast.error()`, `toast.info()`
- `frontend/src/pages/NotFoundPage.jsx` — 404 page with large display, home/companies buttons, go-back link
- `frontend/src/components/ui/Skeleton.jsx` — Reusable loading components: `CardSkeleton`, `TableRowSkeleton`, `StatSkeleton`, `PageLoader`, `EmptyState`

**Files modified**:
- `frontend/src/App.jsx` — Wrapped in `ToastProvider`, added `SessionExpiredListener` component, added `<Route path="*">` catch-all for 404, imported `NotFoundPage` + `ToastProvider` + `useToast` + `SESSION_EXPIRED_EVENT`
- `frontend/src/api/client.js` — Added `SESSION_EXPIRED_EVENT` constant, dispatches custom event before redirect on refresh failure

---

### 2026-02-25 — Walid: Phases 3-6 Frontend Integration (AdminPanel, InternalFeedbackPage, ProfilePage Settings) ✅

**Summary**: Completed Phases 3-7 frontend integration. Rewrote AdminPanel.jsx (all 5 tabs) and InternalFeedbackPage.jsx from mock to real API. Added `POST /auth/change-password` backend endpoint and wired ProfilePage Settings section. All pages now use real API data with proper loading/error states.

**New backend endpoints created**:
- `GET /companies/:id/employees` — Lists approved+current employees at a company (excludes requesting user, deduplicates). Used by InternalFeedbackPage coworker picker.
- `POST /auth/change-password` — Validates current password, bcrypt hashes new password, revokes all refresh tokens. Used by ProfilePage Settings.

**Email system change**: Switched from Resend SDK to Nodemailer + Gmail SMTP
- `config/email.js` rewritten for Nodemailer
- Gmail App Password configured in .env
- All email functions continue to work (welcome, verify, reset, employment, suspend, etc.)

**Files modified**:
- `backend/src/controllers/companyController.js` — Added `getCompanyEmployees` function
- `backend/src/routes/companyRoutes.js` — Added `GET /:id/employees` route
- `backend/src/services/authService.js` — Added `changePassword` function
- `backend/src/controllers/authController.js` — Added `changePassword` handler
- `backend/src/routes/authRoutes.js` — Added `POST /change-password` route
- `frontend/src/api/companies.js` — Added `getCompanyEmployees(id)` export
- `frontend/src/api/auth.js` — Added `apiChangePassword()` export
- `frontend/src/pages/InternalFeedbackPage.jsx` — **COMPLETE REWRITE** (~450 lines): real coworker loading, company selector, correct payload format
- `frontend/src/pages/AdminPanel.jsx` — **COMPLETE REWRITE** (~750 lines): all 5 tabs (Overview, Reports, Companies, Users, Audit) with real API, pagination, search, suspend/delete modals
- `frontend/src/pages/ProfilePage.jsx` — Settings section: change password form with validation + API call + auto-logout, delete account shows "contact admin" message

**Pages confirmed already connected by teammates** (no changes needed):
- `WriteReviewPage.jsx` — by Raneem
- `EmployeeDashboard.jsx` — by Raneem
- `CompanyAdminDashboard.jsx` — by Baraa
- `ProfilePage.jsx` (Profile/Employment/Activity sections) — by Baraa
- `Navbar.jsx` — by Baraa

---

### 2026-02-25 — Walid: Phase 2 Public Pages Connected ✅

**Summary**: Connected CompaniesPage, CompanyProfilePage, and LandingPage to real API. Fixed CORS issues. Fixed report form reason values. Switched email from Resend to Nodemailer+Gmail SMTP. Disabled auto email verification.

**Files modified**:
- `frontend/src/pages/CompaniesPage.jsx` — Real API with search/filters/pagination
- `frontend/src/pages/CompanyProfilePage.jsx` — Real company data + reviews + report form
- `frontend/src/pages/LandingPage.jsx` — Top companies from real API
- `backend/src/config/email.js` — Switched from Resend SDK to Nodemailer+Gmail SMTP
- `backend/src/app.js` — CORS updated for multiple frontend origins

---

### 2026-02-24 — Baraa: Day 6 Security Hardening + 17 Security Tests (87/87) ✅
- S09 No auth header → 401 ✅
- S10 Malformed JWT → 401 ✅
- S11 Wrong JWT signature → 401 ✅
- S12 Stale action "remove" → 400 validation error ✅
- S13 Stale action "dismiss" → 400 validation error ✅
- S14 Password no uppercase → 400 ✅
- S15 Password no number → 400 ✅
- S16 Whitespace-padded short content → 400 after trim ✅
- S17 CORS: Access-Control-Allow-Origin present ✅

---

### 2026-02-24 — Raneem: Days 6–7 Employment & Feedback Polish ⏳ (on origin/raneem, NOT YET in dev)
- Branch: `origin/raneem`, commit `35bbcf7`
- **feedbackService.js**: `is_current=true` filter, `getFeedbackReceived`, `getFeedbackGiven`
- **feedbackController.js**: UUID validation, future quarter guard, `getFeedbackReceived`/`getFeedbackGiven` controllers
- **feedbackRoutes.js**: `GET /api/feedback/received`, `GET /api/feedback/given`
- **employmentService.js**: re-hire edge case, smarter duplicate check
- **Status**: Not merged into dev — Raneem must create PR

---

### 2026-02-23 (session 2) — Baraa: BUG-035→040 + Newman re-verification ✅

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
- ✅ Build POST /feedback (peer feedback)
- ✅ Validate: no self-feedback / same company / one per quarter
- ✅ Merge to develop
- ✅ Merged into baraa (Feb 21)
- ⚠️ Bug fixed: duplicate `rejectEmployment` export removed
- ⚠️ Bug fixed: unused `supabase` import in employmentRoutes removed

#### Walid (Admin & Reporting) ✅ COMPLETE
- ✅ Import middleware stubs
- ✅ Build POST /reports (submit report)
- ✅ Build rate limiting (5 reports/day)
- ✅ Build GET /admin/reports (list all)
- ✅ Build PATCH /admin/reports/:id/resolve
- ✅ Create audit logging function
- ✅ Replace mock auth with real middleware
- ✅ Build GET /admin/users (list users)
- ✅ Build PATCH /admin/users/:id/suspend
- ✅ Build PATCH /admin/users/:id/unsuspend
- ✅ Build DELETE /admin/users/:id (soft)
- ✅ Build GET /admin/companies
- ✅ Build GET /admin/analytics
- ✅ Merge to develop

---

### Days 3–4: Advanced Features
> Email system · Analytics · Notifications · Moderation

#### Baraa (Email & Security) ✅ COMPLETE
- ✅ Setup Resend SDK (replaced Nodemailer)
- ✅ Create emailService.js (5 send functions)
- ✅ Create DB tables: email_verification_tokens, password_reset_tokens
- ✅ Welcome email on register
- ✅ Build GET /auth/verify-email/:token
- ✅ Build POST /auth/forgot-password
- ✅ Build POST /auth/reset-password/:token
- ✅ Re-enabled email_verified check in loginUser
- ✅ Merge to baraa

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

#### Walid (Advanced Admin) ✅ COMPLETE
- ✅ Build review removal (soft delete + recalculate) — in reportService
- ✅ Build user suspension logic (with email, token revocation, audit log)
- ✅ Build company verification (PATCH /admin/companies/:id/verify)
- ✅ Build employment override (PATCH /admin/employments/:id/override)
- ✅ Test all moderation actions
- ✅ Build audit log filtering (GET /admin/audit-logs)
- ✅ Build detailed platform analytics (GET /admin/analytics)
- ✅ Build pending reports count in analytics
- ✅ Build recent activity feed (from audit_logs)
- ✅ Merge to develop

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

#### Aya (Review System Polish) ✅ COMPLETE
- [x] Test: Cannot review without employment ✅ (checkVerifiedEmployment in reviewService)
- [x] Test: Cannot duplicate review ✅ (checkDuplicateReview in reviewService)
- [x] Test: Cannot edit after 48 hours ✅ (can_edit_until check in reviewService)
- [x] Test: Anonymous review hides identity ✅ (BUG-012 fix, identity stripped)
- [x] Fix all edge cases ✅
- [x] Optimize search queries (add indexes) ✅
- [x] Test pagination with 1000+ companies ✅ (page > totalPages graceful handling)
- [x] Verify rating calculation accuracy ✅
- [x] Test company update permissions ✅
- [x] Merge to develop

#### Raneem (Employment Polish) ✅ COMPLETE
- [x] Test: Cannot self-feedback — `SELF_FEEDBACK` guard in feedbackController ✅
- [x] Test: Cannot feedback different company — `bothApprovedInCompany` enforces same company + current employment ✅
- [x] Test: Quarterly limit works — `feedbackAlreadyExists` blocks duplicate per quarter ✅
- [x] Test: Former employee restrictions — `bothApprovedInCompany` now checks `is_current = true`; former employees blocked ✅
- [x] Fix all edge cases — UUID validation, writtenFeedback max 1000 chars, future quarter guard, better duplicate messages ✅
- [x] Test: All emails send correctly — sendEmploymentRequestEmail/Approved/Rejected all wired up; Resend SDK gracefully skips when no API key ✅
- [x] Test: Feedback visibility rules — GET /api/feedback/received + GET /api/feedback/given added; employees see only own feedback; admins see all ✅
- [x] Test: Profile privacy works — optionalAuth on GET /employees/:id; private profiles return 404 for non-owners ✅
- [x] Test: Multi-company employment history — listMyEmployments returns all employments across companies; re-apply after end/rejection now allowed ✅
- [x] Merge to develop

#### Walid (Admin Polish) ✅ COMPLETE
- [x] Test: Only admin can access admin routes ✅
- [x] Test: Report rate limiting works ✅ (BUG-040 fix)
- [x] Test: Review removal recalculates rating ✅
- [x] Test: Suspension prevents login ✅ (is_active check in authService)
- [x] Fix all edge cases ✅
- [x] Test: Deleted user shows as 'Deleted User' ✅ (BUG-042: updated public_company_reviews view — JOIN users, check is_deleted)
- [x] Test: Audit logs capture everything ✅
- [x] Test: Analytics calculations correct ✅
- [x] Test: Cannot delete system admin ✅
- [x] Merge to develop

---

### Days 8–10: Final Stretch
> Staging deploy · Performance · Production launch 🚀

#### Day 8: Frontend Integration 🔄 IN PROGRESS
> Phase 1 done (AI-assisted). All 4 members now work in parallel — each on their own branch off `dev`.  
> **Before starting**: `git pull origin dev` to get Phase 1 files (client.js, API modules, AuthContext, App.jsx, 3 new auth pages).

---

##### 🔵 Baraa — Navbar + CompanyAdminDashboard + ProfilePage ✅ COMPLETE
> Files: `Navbar.jsx`, `CompanyAdminDashboard.jsx`, `ProfilePage.jsx`  
> Import from: `api/companies.js`, `api/employments.js`, `api/feedback.js`, `api/employees.js`, `api/auth.js`

**Navbar** (`src/components/layout/Navbar.jsx`) ✅ DONE
- [x] Import `useAuth()` — get `user` and `logout`
- [x] Show Login + Register buttons when `!user` (not logged in)
- [x] Show profile dropdown when logged in — real `user.fullName` initials
- [x] "Sign Out" → call `logout()` from context
- [x] Conditionally show nav links by `user.role`

**CompanyAdminDashboard** (`src/pages/CompanyAdminDashboard.jsx`) ✅ DONE
- [x] All 5 tabs connected to real API

**ProfilePage** (`src/pages/ProfilePage.jsx`) ✅ DONE
- [x] Profile, Employment, Activity sections connected
- [x] Settings section: Change Password via `POST /auth/change-password` (added by Walid)

---

##### 🟢 Aya — CompaniesPage + CompanyProfilePage + LandingPage ✅ COMPLETE
> Files: `CompaniesPage.jsx`, `CompanyProfilePage.jsx`, `LandingPage.jsx`  
> Import from: `api/companies.js`, `api/admin.js` (submitReport)
> Done by Walid (Phase 2)

- [x] **CompaniesPage** — Real API with search/filters/pagination/sorting
- [x] **CompanyProfilePage** — Real company + reviews + analytics + report form
- [x] **LandingPage** — Top companies from real API

---

##### 🟡 Raneem — EmployeeDashboard + WriteReviewPage + InternalFeedbackPage ✅ COMPLETE
> Files: `EmployeeDashboard.jsx`, `WriteReviewPage.jsx`, `InternalFeedbackPage.jsx`  
> EmployeeDashboard + WriteReviewPage done by teammates; InternalFeedbackPage rewritten by Walid

- [x] **WriteReviewPage** — Connected by teammates
- [x] **EmployeeDashboard** — Connected by teammates (all 4 tabs)
- [x] **InternalFeedbackPage** — **REWRITTEN by Walid** with real coworker loading + correct payload

---

##### 🔴 Walid — AdminPanel (all 5 tabs) ✅ COMPLETE
> File: `AdminPanel.jsx`  
> Import from: `api/admin.js`

- [x] **Overview Tab**: `getAdminAnalytics()` + `getReportStats()` → real stats + pending count badge
- [x] **Reports Tab**: `getReports()` with status filter, resolve/dismiss via `resolveReport()`, pagination
- [x] **Companies Tab**: `getAdminCompanies()` with verify button, pagination
- [x] **Users Tab**: `getAdminUsers()` with debounced search + role filter, suspend/unsuspend/delete modals, system_admin protection
- [x] **Audit Log Tab**: `getAuditLogs()` with pagination + formatted actions

---

##### 🟣 Phase 8 — All Together (after all 4 branches merged to dev)
- [ ] Add loading skeleton components to all data-fetching pages
- [ ] Add global error toast for API failures (small reusable component)
- [ ] Add empty state UI for: no reviews, no companies, no employments, no feedback
- [ ] Add 404 page for unknown routes (`/companies/invalid-id`, unmatched paths)
- [ ] Smoke test role-based redirect: employee → `/dashboard`, company_admin → `/company-admin`, system_admin → `/admin`
- [ ] Test token expiry flow: expired token → silent refresh → retry OR redirect to `/login`
- [ ] Responsive check on mobile for all updated pages

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
