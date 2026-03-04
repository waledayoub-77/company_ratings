# RateHub — Full Project Explanation
> This document explains **every file** in the project: what it does, why it exists, and how it works.
> Use this to prepare for instructor questions.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Backend — Entry Points](#backend--entry-points)
3. [Backend — Config](#backend--config)
4. [Backend — Utils](#backend--utils)
5. [Backend — Middlewares](#backend--middlewares)
6. [Backend — Helpers](#backend--helpers)
7. [Backend — Routes](#backend--routes)
8. [Backend — Controllers](#backend--controllers)
9. [Backend — Services](#backend--services)
10. [Frontend — Entry Points](#frontend--entry-points)
11. [Frontend — Context (Global State)](#frontend--context-global-state)
12. [Frontend — API Layer](#frontend--api-layer)
13. [Frontend — Pages](#frontend--pages)
14. [Database Migrations](#database-migrations)
15. [Common Instructor Questions & Answers](#common-instructor-questions--answers)

---

## Project Overview

**RateHub** is a company-rating platform. It has three user roles:
- **Employee** — can search companies, submit verified reviews, give internal peer feedback, and vote in Employee of the Month (EOTM)
- **Company Admin** — manages their company profile, approves/rejects employee verification requests, replies to reviews, creates EOTM events
- **System Admin** — manages all users and companies, resolves reported reviews, approves identity/company verifications, views audit logs

The project is split into:
- `backend/` — Node.js + Express REST API connected to Supabase (PostgreSQL)
- `frontend/` — React (Vite) single-page app
- `e2e/` — Playwright end-to-end tests

---

## Backend — Entry Points

### `backend/src/server.js`
**What it does:** This is the file that actually *starts* the server.
- Loads environment variables from `.env` using `dotenv`
- Imports the `app` object from `app.js`
- Calls `app.listen()` on the port defined in `.env` (default `5000`)
- Prints confirmation messages with the server URL

**Why it exists:** We separate the *app configuration* (app.js) from the *server startup* (server.js) so we can import `app` in tests without actually starting a server.

---

### `backend/src/app.js`
**What it does:** This is the main Express application configuration file. Everything the app **uses** is registered here.

Step by step, it does:
1. **Helmet** — adds HTTP security headers (prevents clickjacking, sniffing, etc.)
2. **CORS** — allows only the frontend origin (`FRONTEND_URL` in `.env`) to talk to the API
3. **Rate Limiter** — limits all IPs to 100 requests per 15 minutes globally
4. **Body Parsing** — parses incoming JSON bodies, max 10KB
5. **XSS Sanitization** — strips HTML tags from all incoming request bodies
6. **Health check** — `GET /health` returns `{ status: "ok" }` to confirm the server is running
7. **API Routes** — mounts all routes under `/api`
8. **404 handler** — returns a 404 JSON response for unknown routes
9. **Global Error Handler** — catches any error thrown in the app and returns a clean JSON response

---

## Backend — Config

### `backend/src/config/database.js`
**What it does:** Creates and exports the **Supabase client** used by all services to talk to the database.
- Uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `.env`
- The **Service Role Key** bypasses Row Level Security (RLS) so the backend can read/write anything
- If the service role key is missing, it falls back to the anon key with a warning

**Why it exists:** Every service file imports this one client instead of creating its own connection.

---

### `backend/src/config/env.js`
**What it does:** Reads all environment variables from `.env` and exports them as a typed config object.
- Groups related configs: `supabase`, `jwt`, `email`, `rateLimit`, `frontend`
- **Validates** that required variables exist — if any are missing, it calls `process.exit(1)` and crashes on purpose with a clear error message

**Why it exists:** Centralizes all config in one place. If a variable is missing, you find out immediately on startup instead of getting a cryptic error later.

**Key values:**
- `jwt.accessTokenExpiry` = `15m` (access tokens live 15 minutes)
- `jwt.refreshTokenExpiry` = `7d` (refresh tokens live 7 days)

---

### `backend/src/config/email.js`
**What it does:** Sets up a **Nodemailer** transporter using Gmail SMTP.
- Reads `EMAIL_USER` and `EMAIL_PASS` from `.env`
- Exports a `sendEmail({ to, subject, html })` function
- If credentials are not set, it logs a warning and **skips** sending (so the app still works in dev without email)

**Why it exists:** Used by `emailService.js` to actually send emails. Separating transport setup from email templates keeps things clean.

---

## Backend — Utils

### `backend/src/utils/jwt.js`
**What it does:** Contains all JWT (JSON Web Token) functions.

This is **where the tokens are generated**:
- `generateAccessToken(payload)` — signs a JWT with `JWT_SECRET`, expires in **15 minutes**
- `generateRefreshToken(payload)` — signs a JWT with `JWT_REFRESH_SECRET`, expires in **7 days**
- `verifyAccessToken(token)` — verifies a token using `JWT_SECRET`, throws if invalid/expired
- `verifyRefreshToken(token)` — verifies using `JWT_REFRESH_SECRET`

**The payload** stored in every token is: `{ userId, email, role }`

**Why two tokens?**
- Access token is short-lived (15 min) for security. If stolen, it expires quickly.
- Refresh token is long-lived (7 days). When the access token expires, the frontend sends the refresh token to get a new access token without re-logging in.

---

### `backend/src/utils/auditLogger.js`
**What it does:** Provides a `logAdminAction()` function that writes a record to the `audit_logs` table in Supabase.

Each log entry stores:
- `adminId` — who performed the action
- `action` — what they did (e.g., "SUSPEND_USER", "DELETE_REVIEW")
- `entityType` — what type of thing was acted on (e.g., "user", "review")
- `entityId` — the ID of the specific item
- `details` — extra JSON data
- `ipAddress`, `userAgent` — from the HTTP request

**Why it exists:** For accountability. System admins have lots of power, so every destructive action they take is recorded. Instructors may ask "how do you track what admins do?" — this is the answer.

---

### `backend/src/utils/validators.js`
**What it does:** Defines **validation rule arrays** using `express-validator`.

Rules defined:
- `validateRegister` — email must be valid, password min 8 chars with uppercase + number, role must be `employee` or `company_admin` (not `system_admin`)
- `validateLogin` — email valid, password not empty
- Other validators for review creation, profile updates, etc.

**Why it exists:** Input validation prevents bad data from reaching the database. Using `express-validator` allows rules to be defined declaratively and reused across routes.

---

## Backend — Middlewares

### `backend/src/middlewares/authMiddleware.js`
**What it does:** Contains two middleware functions:

**`requireAuth`** — protects routes that need a logged-in user:
1. Checks for `Authorization: Bearer <token>` header
2. Calls `verifyAccessToken()` from `jwt.js` to decode it
3. Hits the database to check `is_active` and `is_deleted` on the user (so a suspended user can't use an old valid token)
4. Attaches `req.user = { userId, email, role }` for downstream use
5. Returns 401 if token missing/invalid, 403 if account suspended

**`optionalAuth`** — used on public routes that behave differently when logged in (e.g., company profile shows "your review" indicator):
- If no token → sets `req.user = null` and continues
- If valid token → sets `req.user` and continues
- If invalid token → sets `req.user = null` and continues (doesn't block)

**Why it exists:** Every protected endpoint needs to know who is making the request. This middleware does that check once and makes it reusable.

---

### `backend/src/middlewares/roleMiddleware.js`
**What it does:** Provides `requireRole(...roles)` — a middleware factory that checks `req.user.role`.

Usage: `requireRole('system_admin')` returns a middleware that blocks anyone who isn't a system admin.

Shortcuts exported:
- `requireEmployee` = `requireRole('employee')`
- `requireCompanyAdmin` = `requireRole('company_admin')`
- `requireSystemAdmin` = `requireRole('system_admin')`

**Why it exists:** After `requireAuth` confirms the user is logged in, `requireRole` confirms they have permission. Separating authentication from authorization is a security best practice.

**Must be used AFTER `requireAuth`** because it reads `req.user` which `requireAuth` sets.

---

### `backend/src/middlewares/errorHandler.js`
**What it does:** Two things:

1. **`AppError` class** — a custom error class used throughout the codebase. You throw `new AppError('message', statusCode, 'ERROR_CODE')` anywhere in a service, and it bubbles up to the error handler.

2. **`errorHandler` middleware** — Express global error handler (4 parameters: `err, req, res, next`). It:
   - Translates JWT errors, Supabase uniqueness violations (code `23505`), foreign key errors (`23503`), payload-too-large errors into clean JSON responses
   - Returns `{ success: false, error: { message, code } }` format

**Why it exists:** Without this, every controller would need its own try/catch with custom error formatting. Instead, services throw errors and one central place formats them.

---

### `backend/src/middlewares/sanitize.js`
**What it does:** Two functions:

1. **`sanitizeBody` middleware** — recursively strips HTML tags from all string values in `req.body` using the `xss` library. Prevents XSS (Cross-Site Scripting) attacks where a user submits `<script>alert(1)</script>` as their name.

2. **`sanitizeSearch(value)`** — removes characters like `( ) , \n \r` from search query strings. This prevents PostgREST filter injection (where special characters in `.or()` filters could manipulate the database query).

**Why it exists:** Security. Raw user input should never go directly into database queries or HTML rendering.

---

### `backend/src/middlewares/rateLimiter.js`
**What it does:** Defines three rate limiters using `express-rate-limit`:

- **`generalLimiter`** — 100 requests per 15 minutes per IP (applied globally in `app.js`)
- **`authLimiter`** — 5 login/register attempts per 15 minutes (applied on auth routes)
- **`reportLimiter`** — 5 reports per 24 hours per user (applied on report submission)

All limiters are **disabled in `NODE_ENV=development`** so tests can run freely.

**Why it exists:** Prevents brute-force attacks (someone trying thousands of passwords), spam, and DDoS.

---

### `backend/src/middlewares/validateMiddleware.js`
**What it does:** Wraps `express-validator`'s `validationResult()`. After the validator rules run, this middleware checks if any failed and returns a `400` error with the list of validation errors.

**Why it exists:** Reusable "catch validation errors and respond" logic used in all routes after validator rule arrays.

---

## Backend — Helpers

### `backend/src/helpers/checkVerifiedEmployment.js`
**What it does:** A single exported async function `checkVerifiedEmployment(employeeId, companyId)` that queries the `employments` table.

Returns `true` if the employee has an **approved** (verified) employment record at that company, `false` otherwise.

**Why it exists:** Before an employee can submit a review, we need to confirm they actually worked there and their employment was approved by the company admin. This helper is called inside `reviewService.js`.

---

## Backend — Routes

### `backend/src/routes/index.js`
**What it does:** The master router. Imports every route file and mounts them under their path prefix:
- `/auth` → authRoutes
- `/companies` → companyRoutes
- `/employments` → employmentRoutes
- `/feedback` → feedbackRoutes
- `/reviews` → reviewRoutes
- `/employees` → employeeRoutes
- `/notifications` → notificationRoutes
- `/verification` → verificationRoutes
- `/eotm` → eotmRoutes
- `/` → adminRoutes (admin routes use paths like `/admin/...` and `/reports`)

**Why it exists:** `app.js` only needs to know about one router (`routes/index.js`). This file handles the internal organization.

---

### `backend/src/routes/authRoutes.js`
**What it does:** Defines all authentication endpoints:
- `POST /auth/register` — with validation + auth rate limiter
- `POST /auth/login` — with validation + auth rate limiter
- `POST /auth/logout` — requires auth
- `POST /auth/refresh-token` — exchanges refresh token for new access token
- `GET /auth/verify-email/:token` — email verification link
- `POST /auth/forgot-password` — sends reset email
- `POST /auth/reset-password/:token` — resets password
- `GET /auth/me` — get current user profile
- `PATCH /auth/me` — update profile
- `POST /auth/change-password` — change password
- `DELETE /auth/me` — delete account

---

### `backend/src/routes/companyRoutes.js`
**What it does:** Company CRUD and sub-resources:
- `GET /companies` — public list with filters
- `GET /companies/:id` — public single company
- `GET /companies/:id/reviews` — public reviews for a company
- `GET /companies/:id/analytics` — category rating averages
- `PATCH /companies/:id` — update company (company admin only)
- `GET /companies/:id/employees` — list employees (company admin only)
- `GET /companies/:id/stats` — dashboard stats (company admin only)

---

### `backend/src/routes/reviewRoutes.js`
**What it does:** Review CRUD and interactions:
- `POST /reviews` — create review (employee only, verified employment required)
- `GET /reviews/my-reviews` — employee's own reviews
- `PATCH /reviews/:id` — edit own review
- `DELETE /reviews/:id` — soft delete own review
- `POST /reviews/:id/reply` — company admin reply
- `PATCH /reviews/replies/:id` — edit reply
- `DELETE /reviews/replies/:id` — delete reply
- `POST /reviews/:id/vote` — toggle helpful vote
- `GET /reviews/:id/vote` — check if current user voted

---

### `backend/src/routes/employmentRoutes.js`
**What it does:** Employment verification flow:
- `POST /employments` — employee requests employment verification
- `GET /employments/my-employments` — employee's employment list
- `GET /employments/pending` — company admin sees pending requests
- `GET /employments/all` — company admin sees all employments
- `PATCH /employments/:id/approve` — company admin approves
- `PATCH /employments/:id/reject` — company admin rejects
- `PATCH /employments/:id/end` — mark employment as ended
- `DELETE /employments/:id` — cancel pending request

---

### `backend/src/routes/feedbackRoutes.js`
**What it does:** Internal peer feedback:
- `POST /feedback` — submit feedback on a coworker
- `GET /feedback/given` — feedback the employee gave
- `GET /feedback/received` — feedback the employee received
- `POST /feedback/:id/report` — report inappropriate feedback

---

### `backend/src/routes/eotmRoutes.js`
**What it does:** Employee of the Month:
- `POST /eotm/companies/:companyId/events` — create EOTM event (company admin)
- `GET /eotm/companies/:companyId/events` — list events
- `POST /eotm/events/:eventId/vote` — cast a vote (employee)
- `GET /eotm/events/:eventId/nominees` — see nominees + vote counts
- `POST /eotm/events/:eventId/close` — close event and set winner
- `GET /eotm/companies/:companyId/winners` — see past winners

---

### `backend/src/routes/adminRoutes.js`
**What it does:** System admin management:
- `GET /admin/users` — list users with search/filter
- `PATCH /admin/users/:id/suspend` — suspend a user
- `PATCH /admin/users/:id/unsuspend` — unsuspend
- `DELETE /admin/users/:id` — soft delete user
- `GET /admin/companies` — list companies
- `PATCH /admin/companies/:id/verify` — mark company as verified
- `PATCH /admin/companies/:id/reject` — reject company
- `GET /admin/reports` — list reported reviews
- `PATCH /admin/reports/:id/resolve` — remove or dismiss a report
- `GET /admin/audit-logs` — view audit log
- `GET /admin/analytics` — platform statistics
- `POST /admin/users/bulk-suspend` — suspend multiple users

---

### `backend/src/routes/verificationRoutes.js`
**What it does:** Identity and company document verification:
- `POST /verification/identity` — employee submits ID document URL
- `POST /verification/company/:companyId` — company admin submits company doc
- `GET /verification/status` — check own verification status
- `GET /admin/verification-requests` — admin sees pending requests
- `PATCH /admin/verification-requests/:id/approve` — admin approves
- `PATCH /admin/verification-requests/:id/reject` — admin rejects

---

### `backend/src/routes/notificationRoutes.js`
**What it does:**
- `GET /notifications` — get user's notifications
- `PATCH /notifications/:id/read` — mark one as read
- `PATCH /notifications/read-all` — mark all as read

---

### `backend/src/routes/employeeRoutes.js`
**What it does:**
- `GET /employees/:id` — public employee profile (uses `optionalAuth`)
- `PATCH /employees/:id` — update own employee profile

---

## Backend — Controllers

Controllers are **thin**. They extract data from `req`, call the service, and send the response. They do not contain business logic.

### `backend/src/controllers/authController.js`
Functions: `register`, `login`, `logout`, `refresh`, `verifyEmail`, `forgotPassword`, `resetPassword`, `getMe`, `updateMe`, `changePassword`, `deactivateAccount`, `deleteAccount`

Each function follows the same pattern:
```
async (req, res, next) => {
  try {
    const result = await authService.someFunction(req.body)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)  // passes to errorHandler
  }
}
```

---

### `backend/src/controllers/companyController.js`
Functions: `getCompanies`, `getCompanyById`, `getCompanyReviews`, `updateCompany`, `getCompanyAnalytics`, `getCompanyEmployees`, `getCompanyStats`

---

### `backend/src/controllers/reviewController.js`
Functions: `createReview`, `getMyReviews`, `updateReview`, `deleteReview`

---

### `backend/src/controllers/reviewInteractionController.js`
Functions: `createReply`, `updateReply`, `deleteReply`, `toggleVote`, `getVoteStatus`

---

### `backend/src/controllers/employmentController.js`
Functions: `requestEmployment`, `getMyEmployments`, `getPendingEmployments`, `approveEmployment`, `rejectEmployment`, `endEmployment`, `cancelEmployment`, `getAllEmploymentsForAdmin`

---

### `backend/src/controllers/eotmController.js`
Functions: `createEvent`, `castVote`, `getEventNominees`, `closeEvent`, `getCompanyEvents`, `getCompanyWinners`

---

### `backend/src/controllers/feedbackController.js`
Functions: `createFeedback`, `getFeedbackGiven`, `getFeedbackReceived`, `reportFeedback`

---

### `backend/src/controllers/notificationController.js`
Functions: `getNotifications`, `markRead`, `markAllRead`

---

### `backend/src/controllers/verificationController.js`
Functions: `submitIdentityVerification`, `submitCompanyVerification`, `getVerificationStatus`, `getVerificationRequests` (admin), `approveVerification` (admin), `rejectVerification` (admin)

---

### `backend/src/controllers/reportController.js`
Functions: `createReport`, wrapped and also called through `adminController`

---

### `backend/src/controllers/adminController.js`
Functions: `getUsers`, `suspendUser`, `unsuspendUser`, `deleteUser`, `getCompanies`, `verifyCompany`, `rejectCompany`, `getReports`, `resolveReport`, `getAuditLogs`, `getAnalytics`, `bulkSuspendUsers`

---

### `backend/src/controllers/employeeController.js`
Functions: `getEmployeeProfile`, `updateEmployeeProfile`

---

## Backend — Services

Services contain all the **business logic**. This is where the real work happens.

### `backend/src/services/authService.js`
**What it does:** Handles user registration, login, logout, token refresh, email verification, password reset, and account management.

**Key functions and how they work:**

**`registerUser()`**:
1. Blocks `system_admin` self-registration
2. Checks if email already exists
3. Hashes password with `bcrypt` (12 salt rounds)
4. Inserts user into `users` table
5. If employee → inserts into `employees` table
6. If company_admin → checks company name is unique, then inserts into `companies` table
7. Generates a random 32-byte hex token, saves it to `email_verification_tokens`, sends verification email

**`loginUser()`**:
1. Looks up user by email
2. Compares password using `bcrypt.compare()`
3. Blocks login if `email_verified = false`
4. Generates access token + refresh token using `jwt.js`
5. Saves refresh token hash to `refresh_tokens` table
6. Returns `{ user, accessToken, refreshToken }`

**`refreshToken()`**:
1. Verifies refresh token using `verifyRefreshToken()` from `jwt.js`
2. Checks the token exists in `refresh_tokens` table (not revoked)
3. Generates a new access token and a new refresh token (rotating refresh tokens)
4. Returns the new tokens

**`logout()`**: Deletes the refresh token from the database so it can't be used again.

---

### `backend/src/services/companyService.js`
**What it does:** CRUD for companies plus analytics.

**`getCompanies(filters)`**:
- Supports filtering by `industry`, `location`, `minRating`, `search`
- Sanitizes search input using `sanitizeSearch()` to prevent injection
- Uses pagination with `limit` and `page` clamps
- Handles `page > totalPages` gracefully (returns empty array, not crash)

**`getCompanyAnalytics(companyId)`**: Returns average scores per category (work_life_balance, compensation, etc.) from `category_ratings` table.

---

### `backend/src/services/reviewService.js`
**What it does:** Business logic for creating, editing, deleting reviews.

**`createReview(reviewData, userId)`**:
1. Gets `employee.id` from `user.id`
2. Calls `checkVerifiedEmployment(employeeId, companyId)` — blocks if not verified
3. Calls `checkDuplicateReview()` — blocks if already reviewed this company
4. Inserts into `company_reviews` table
5. Saves category ratings (up to 6 categories) via `categoryRatingService`
6. Recalculates the company's `overall_rating` and `total_reviews`

**`recalculateCompanyRating(companyId)`**: Fetches all non-deleted reviews, averages the `overall_rating`, updates the `companies` table.

---

### `backend/src/services/employmentService.js`
**What it does:** Manages the employment verification flow.

**`requestEmployment()`**:
1. Verifies the company exists
2. Checks for duplicate: blocks if there's already a `pending` request OR an `approved + is_current = true` record for that company
3. Inserts with `verification_status = 'pending'`

**`approveEmployment(employmentId, adminUserId)`**:
1. Verifies the calling user owns the company
2. Updates status to `'approved'`
3. Sends approval email to the employee
4. Creates a notification for the employee

**`rejectEmployment()`**: Similar but sets status to `'rejected'`, sends rejection email.

---

### `backend/src/services/eotmService.js`
**What it does:** Employee of the Month voting system.

**`createEvent()`**: Creates EOTM event for a department/month/year. Prevents duplicate events.

**`castVote(eventId, userId, candidateEmployeeId)`**:
1. Verifies the event is active
2. Gets voter's `employee.id` from their `user.id`
3. Checks voter belongs to the same company as the event
4. Prevents self-voting
5. Prevents duplicate votes (one vote per event per voter)
6. Inserts into `eotm_votes` table

**`closeEvent(eventId, userId)`**:
1. Finds the candidate with the most votes
2. Updates `eotm_events` with `winner_employee_id` and `is_active = false`

---

### `backend/src/services/feedbackService.js`
**What it does:** Internal peer feedback between coworkers.

**Key logic:**
- Both the reviewer AND the rated employee must have `approved + is_current = true` employment at the same company
- Only one feedback per pair per quarter/year (prevents spam)
- Scores are 1–5 for: `professionalism`, `communication`, `teamwork`, `reliability`

---

### `backend/src/services/adminService.js`
**What it does:** All system admin operations.

**`getUsers()`**: Lists users with optional search by email or employee name, role filter, pagination.

**`suspendUser(userId, adminId, ipAddress)`**:
1. Sets `is_active = false` on the user
2. Logs to `audit_logs` with `logAdminAction()`
3. Sends suspension email

**`deleteUser(userId, adminId)`**: Soft delete — sets `is_deleted = true`, does NOT physically remove the row.

**`getAnalytics()`**: Returns platform-wide stats: total users, total reviews, total companies, pending verifications, open reports, etc.

**`bulkSuspendUsers(userIds, adminId)`**: Suspends multiple users in one operation, logs each action.

---

### `backend/src/services/categoryRatingService.js`
**What it does:** Manages the 6 rating categories for each review.

**`saveCategoryRatings(reviewId, categoryRatings)`**: Validates categories against allowed list, validates scores 1–10, inserts rows into `category_ratings`.

**`recalcCompanyCategoryAverages(companyId)`**: Calculates average score per category across all reviews for a company, stores in `company_category_averages` table.

---

### `backend/src/services/emailService.js`
**What it does:** Defines HTML email templates and exported send functions.

**Templates defined:**
- `welcomeTemplate()` — "Welcome to RateHub"
- `verifyEmailTemplate()` — email verification link button
- `resetPasswordTemplate()` — password reset link button
- `employmentApprovedTemplate()` — "Your employment at X was approved"
- `employmentRejectedTemplate()` — "Your employment at X was rejected"
- `employmentRequestTemplate()` — notifies company admin of new request
- `accountSuspendedTemplate()`, `accountUnsuspendedTemplate()`

**Exported functions:** `sendVerifyEmail`, `sendWelcomeEmail`, `sendResetPasswordEmail`, `sendEmploymentApprovedEmail`, `sendEmploymentRejectedEmail`, `sendAccountSuspendedEmail`, `sendAccountUnsuspendedEmail`

Each function calls `sendEmail()` from `config/email.js`.

---

### `backend/src/services/verificationService.js`
**What it does:** Handles document-based identity and company verification.

**`submitIdentityVerification(userId, { documentUrl })`**:
1. Blocks if identity already approved or pending
2. Inserts into `verification_requests` with `verification_type = 'identity', status = 'pending'`

Admin can then approve/reject, which updates the record and can mark the user as verified.

---

### `backend/src/services/reportService.js`
**What it does:** Review reporting system.

**`createReport()`**:
1. Validates reason is in allowed list (`false_info`, `spam`, `harassment`, `other`)
2. Description must be ≥ 20 characters
3. Enforces max 5 reports per 24 hours per user (quota check in DB)
4. Inserts into `reported_reviews`

**`resolveReport(reportId, action, adminNote, adminId)`**:
- `action = 'remove'` → soft-deletes the review and recalculates company rating
- `action = 'dismiss'` → marks report as dismissed with no further action
- Logs action using `auditLogger`

---

### `backend/src/services/notificationService.js`
**What it does:** In-app notification system.

**`createNotification({ userId, type, title, message, link })`**: Inserts a notification row. Called by other services (employment approval, etc.) as a "fire and forget" — errors are just logged, not thrown.

**`getNotifications(userId)`**: Returns latest 30 notifications, newest first.

**`markRead(notificationId, userId)`**: Owner-guarded: can only mark your own notification.

---

### `backend/src/services/reviewReplyService.js`
**What it does:** Company admin replies to employee reviews.

- Reply must be 10–2000 characters
- Verifies the calling user owns the company that was reviewed
- Only **one reply allowed per review** (can be edited, not duplicated)

---

### `backend/src/services/reviewVoteService.js`
**What it does:** "Helpful" votes on reviews (toggle).

**`toggleVote(reviewId, userId)`**:
1. Prevents voting on your own review
2. If vote exists → deletes it (toggle off), returns `{ action: 'removed' }`
3. If no vote → inserts it, returns `{ action: 'added' }`
4. Recalculates `helpful_count` on the review after each toggle

---

## Frontend — Entry Points

### `frontend/src/main.jsx`
**What it does:** Root entry point. Wraps `<App />` with `<BrowserRouter>`, `<AuthProvider>`, `<ToastProvider>`, and renders into `#root` in `index.html`.

---

### `frontend/src/App.jsx`
**What it does:** Defines all client-side **routes** and **route guards** using React Router v6.

**Three route guard components defined here:**

**`GuestRoute`** — redirects already-logged-in users away from login/register pages back to their dashboard.

**`ProtectedRoute`** — redirects unauthenticated users to `/login`.

**`RoleRoute`** — redirects users to their correct home if they try to access a page for a different role (e.g., an employee trying to visit `/admin`).

**Role → home page mapping:**
- `employee` → `/dashboard`
- `company_admin` → `/company-admin`
- `system_admin` → `/admin`

---

## Frontend — Context (Global State)

### `frontend/src/context/AuthContext.jsx`
**What it does:** Manages **global authentication state** (who is logged in) across the entire app.

**State stored:** `user` (object with `id, email, role, ...`), `accessToken`, `refreshToken`

**Where stored:** `localStorage` using keys `rh_user`, `rh_access`, `rh_refresh`

**On app load:** Calls `apiGetMe()` to fetch fresh user data from the server. If the stored token is invalid, it clears localStorage and logs the user out silently.

**Key functions exported:**
- `saveSession({ user, accessToken, refreshToken })` — called after login/register
- `logout()` — clears state + localStorage + calls logout API
- `updateUser(changes)` — merges partial user updates into state

**Why context?** Every page needs to know if you're logged in and who you are. Instead of passing props everywhere, any component can call `useAuth()` to get the current user.

---

### `frontend/src/context/ToastContext.jsx`
**What it does:** Global toast notification system.

**Provides:** A `toast` object with `toast.success(msg)`, `toast.error(msg)`, `toast.info(msg)` functions.

**How it works:**
- Maintains an array of toast objects (max 5 visible)
- Each toast auto-dismisses after a timeout (default 4s, errors 6s)
- Renders toasts in a fixed bottom-right container with Framer Motion animations

---

## Frontend — API Layer

All files in `frontend/src/api/` are thin wrapper functions around `fetch`. They do **not** contain business logic.

### `frontend/src/api/client.js`
**What it does:** The core HTTP client. All other API files use this.

**Two main functions:**
- `request(path, options)` — public request, no auth header
- `authRequest(path, options)` — authenticated request, adds `Authorization: Bearer <token>`

**Token refresh logic in `authRequest()`:**
1. Send request with stored access token
2. If server returns `401` (token expired) → call `tryRefresh()` to get a new access token using the refresh token
3. Retry the original request with the new token
4. If refresh also fails → dispatch `SESSION_EXPIRED_EVENT`, clear storage, redirect to login

**Why it exists:** Without this, every API call would need to manually handle token refresh. This does it automatically and transparently.

---

### `frontend/src/api/auth.js`
**What it covers:** `apiRegister`, `apiLogin`, `apiLogout`, `apiRefreshToken`, `apiVerifyEmail`, `apiForgotPassword`, `apiResetPassword`, `apiGetMe`, `apiUpdateMe`, `apiChangePassword`, `apiDeactivateAccount`, `apiDeleteAccount`

---

### `frontend/src/api/companies.js`
**What it covers:** `getCompanies`, `getCompanyById`, `getCompanyReviews`, `getCompanyAnalytics`, `getCompanyStats`, `updateCompany`, `getCompanyEmployees`

---

### `frontend/src/api/reviews.js`
**What it covers:** `createReview`, `getMyReviews`, `updateReview`, `deleteReview`, `createReviewReply`, `updateReviewReply`, `deleteReviewReply`, `toggleReviewVote`, `getVoteStatus`, `reportReview`

---

### `frontend/src/api/employees.js`
**What it covers:** `getEmployeeProfile`, `updateEmployeeProfile`

---

### `frontend/src/api/employments.js`
**What it covers:** `requestEmployment`, `getMyEmployments`, `getPendingEmployments`, `getAllEmploymentsForAdmin`, `approveEmployment`, `rejectEmployment`, `endEmployment`, `cancelEmployment`

---

### `frontend/src/api/eotm.js`
**What it covers:** `createEotmEvent`, `getCompanyEotmEvents`, `castEotmVote`, `getEotmNominees`, `closeEotmEvent`, `getCompanyEotmWinners`

---

### `frontend/src/api/feedback.js`
**What it covers:** `createFeedback`, `getFeedbackGiven`, `getFeedbackReceived`, `reportFeedback`

---

### `frontend/src/api/notifications.js`
**What it covers:** `getNotifications`, `markNotificationRead`, `markAllNotificationsRead`

---

### `frontend/src/api/admin.js`
**What it covers:** `submitReport`, `getReports`, `getReportStats`, `resolveReport`, `getAdminUsers`, `suspendUser`, `unsuspendUser`, `deleteUser`, `getAdminCompanies`, `verifyCompany`, `rejectCompany`, `getAdminAnalytics`, `getAuditLogs`, `bulkSuspendUsers`

---

### `frontend/src/api/verification.js`
**What it covers:** `submitIdentityVerification`, `submitCompanyVerification`, `getVerificationStatus`, `getVerificationRequests`, `approveVerification`, `rejectVerification`

---

## Frontend — Pages

### `frontend/src/pages/LandingPage.jsx`
**What it does:** The home page at `/`. Shows:
- Hero section with stats (10K+ reviews, 2500+ companies, etc.)
- Feature highlights (Employment Verified, Anonymous Protection, etc.)
- Live-fetched featured companies using `getCompanies()`
- Testimonials section, CTA buttons

Accessible to everyone (no auth required).

---

### `frontend/src/pages/LoginPage.jsx`
**What it does:** Login form at `/login`.
- Calls `apiLogin({ email, password })`
- On success: calls `saveSession()` from `AuthContext` to store the user + tokens
- Redirects to role-based home: `/dashboard`, `/company-admin`, or `/admin`
- Protected by `GuestRoute` (already logged in users are redirected away)

---

### `frontend/src/pages/RegisterPage.jsx`
**What it does:** Registration form at `/register`.
- Two modes: **Employee** (requires name) and **Company Admin** (requires company name)
- Real-time **password strength meter** (checks length, uppercase, number, special char)
- Calls `apiRegister()`
- On success: shows "check your email" message (does NOT auto-login — email must be verified first)

---

### `frontend/src/pages/VerifyEmailPage.jsx`
**What it does:** Handles email verification at `/verify-email/:token`.
- On mount, calls `apiVerifyEmail(token)` using the token from the URL
- Shows success or error message

---

### `frontend/src/pages/ForgotPasswordPage.jsx`
**What it does:** At `/forgot-password`.
- User enters email, calls `apiForgotPassword(email)`
- Backend sends a reset link email

---

### `frontend/src/pages/ResetPasswordPage.jsx`
**What it does:** At `/reset-password/:token`.
- First validates the token is still valid via `apiValidateResetToken(token)`
- User enters new password, calls `apiResetPassword(token, password)`

---

### `frontend/src/pages/CompaniesPage.jsx`
**What it does:** Public company search at `/companies`.
- Calls `getCompanies(filters)` and displays results as cards
- Filters: industry dropdown, location dropdown, min rating, sort order
- Search input with debounce
- Pagination controls

---

### `frontend/src/pages/CompanyProfilePage.jsx`
**What it does:** Public company detail page at `/companies/:id`.
- Shows company info, overall rating, category rating bars
- Lists paginated reviews with helpful vote button and report button
- If logged-in company admin: shows "Reply" button on reviews
- If logged-in employee: shows "Write a Review" button (checks if they already reviewed)
- Uses `optionalAuth` on the backend so logged-in users get extra features

---

### `frontend/src/pages/WriteReviewPage.jsx`
**What it does:** Review submission form at `/companies/:id/review`.
- Protected: **employee only** (company admins and system admins are redirected)
- Star rating 1–5 for overall + optional 1–10 for 6 categories
- Anonymous toggle (hides name in review)
- Departure reason dropdown
- Written review text
- Submits via `createReview()`

---

### `frontend/src/pages/EmployeeDashboard.jsx`
**What it does:** The employee's main dashboard at `/dashboard`. The biggest page (~1450 lines).

**Tabs:**
- **Overview** — summary cards (my companies, reviews, feedback received)
- **Employments** — list of employment requests with status, ability to request new employment or cancel pending
- **Reviews** — employee's own reviews with edit/delete
- **Feedback** — feedback received from coworkers
- **EOTM** — voting section: browse active EOTM events, see nominees, cast vote, see winners

---

### `frontend/src/pages/CompanyAdminDashboard.jsx`
**What it does:** Company admin dashboard at `/company-admin`. (~990 lines)

**Tabs:**
- **Overview** — stats: pending requests count, review count, active EOTM events, bar/area charts
- **Requests** — approve or reject employee employment requests
- **Reviews** — see all reviews for the company, reply to them
- **EOTM** — create new EOTM events, close them
- **Feedback** — view feedback submitted about employees in the company
- **Settings** — update company profile (name, industry, location, description, website, logo)

---

### `frontend/src/pages/AdminPanel.jsx`
**What it does:** System admin dashboard at `/admin`. (~950 lines)

**Tabs:**
- **Dashboard** — analytics: total users, companies, reviews, pending reports, unresolved reports
- **Users** — search/filter users, suspend, unsuspend, delete, bulk suspend
- **Companies** — list companies, verify or reject them
- **Reports** — list reported reviews, resolve by removing review or dismissing
- **Verification** — approve or reject identity/company verification requests
- **Audit Logs** — read-only log of all admin actions

---

### `frontend/src/pages/InternalFeedbackPage.jsx`
**What it does:** Peer feedback form at `/dashboard/feedback`.
- Employee selects a coworker and company, rates them on 4 dimensions (professionalism, communication, teamwork, reliability)
- Optional written feedback
- Quarter/year selector
- Only shows approved colleagues at your same company

---

### `frontend/src/pages/ProfilePage.jsx`
**What it does:** User profile at `/profile`. (~1078 lines)

**Sections:**
- **Profile** — view and edit name, email, bio, title, location
- **Security** — change password, deactivate or delete account
- **Reviews** — see own reviews
- **Feedback** — see feedback given and received
- **Verification** — submit identity document URL for verification, see status

---

### `frontend/src/pages/NotFoundPage.jsx`
**What it does:** 404 page shown for any unknown route (caught by React Router's `*` path).

---

## Database Migrations

Migration files in `backend/migrations/` are **SQL scripts** run once to alter the database schema.

### `add_departure_reason_to_view.sql`
Adds the `departure_reason` column to the `company_reviews_with_details` view so the reason why an employee left appears in the review data returned to the frontend.

### `allow_null_winner_eotm.sql`
Alters the `eotm_events` table to allow `winner_employee_id` to be `NULL`. This is needed because when you *create* an event, there is no winner yet — the winner is only set when the event is *closed*.

### `cascade_soft_delete_to_employees.sql`
When a user is soft-deleted (set `is_deleted = true`), this migration ensures the related `employees` row is also soft-deleted automatically via a database trigger or update, so queries filtering `is_deleted = false` don't accidentally return data for deleted users.

### `add_full_name_to_users.sql`
Adds a `full_name` column to the `users` table so the name can be queried directly without joining to `employees`.

### `add_current_position_to_employees.sql`
Adds `current_position` field to the `employees` table so employees can store their current job title.

### `add_departure_reason_to_view.sql`
Adds departure_reason to review query views.

---

## Common Instructor Questions & Answers

**Q: Where do you generate the token?**
> In `backend/src/utils/jwt.js`. The `generateAccessToken()` function signs a JWT with `JWT_SECRET` and 15-minute expiry. It is called inside `authService.js` in the `loginUser()` function.

**Q: Where do you verify the token?**
> In `backend/src/middlewares/authMiddleware.js`. The `requireAuth` middleware calls `verifyAccessToken(token)` from `jwt.js` on every protected request.

**Q: Where do you hash the password?**
> In `authService.js`, `registerUser()`. We use `bcrypt.hash(password, 12)` before storing, and `bcrypt.compare()` in `loginUser()`.

**Q: Why do you have two tokens (access + refresh)?**
> Access tokens expire in 15 minutes for security. When they expire, the frontend sends the refresh token (valid 7 days) to `/auth/refresh-token` to get a new access token without requiring the user to log in again.

**Q: How do you prevent XSS attacks?**
> In `backend/src/middlewares/sanitize.js`, the `sanitizeBody` middleware strips all HTML tags from request body strings using the `xss` library. Applied globally in `app.js`.

**Q: How do you prevent brute force on login?**
> In `backend/src/middlewares/rateLimiter.js`, the `authLimiter` limits login/register to 5 attempts per 15 minutes per IP.

**Q: How do you make sure only verified employees can write reviews?**
> In `reviewService.js`, `createReview()` calls `checkVerifiedEmployment(employeeId, companyId)` from `helpers/checkVerifiedEmployment.js`. If the employee doesn't have an `approved` employment record at that company, the review is rejected with a 403 error.

**Q: How does the role system work?**
> When a user logs in, their `role` is embedded in the JWT payload. `authMiddleware.js` reads the token and sets `req.user.role`. Then `roleMiddleware.js` checks `req.user.role` against allowed roles for each route.

**Q: Why can't system_admin self-register?**
> In `authService.js`, `registerUser()` checks `if (role === 'system_admin') throw AppError(403)`. System admins must be created directly in the database.

**Q: How do notifications work?**
> `notificationService.js` has a `createNotification()` function. Other services call it after key events (employment approved, report resolved, etc.). The frontend polls `GET /notifications` and displays them in a bell icon. Mark-as-read goes through `PATCH /notifications/:id/read`.

**Q: What is Supabase?**
> Supabase is a cloud-hosted PostgreSQL database with a REST API client. We use it as our database. The backend connects using the Supabase JS client with the Service Role Key, which gives full database access bypassing Row Level Security.

**Q: How does the frontend know if the access token expired?**
> In `frontend/src/api/client.js`, `authRequest()` checks if the response is `401`. If so, it calls `tryRefresh()` to get a new access token using the stored refresh token, then retries the original request automatically.

**Q: What is an audit log?**
> The `audit_logs` table records every significant action a system admin takes (suspend user, delete review, etc.). It stores who did it, what they did, when, and from what IP. Implemented in `utils/auditLogger.js` and called in `adminService.js`.

**Q: How does anonymous reviews work?**
> When creating a review, `isAnonymous: true` can be passed. The review is stored with the `employee_id` (for business logic), but the API response omits the name when returning reviews to the public if `is_anonymous = true`. The employee can still see/edit their own anonymous review.

**Q: Where is CORS configured?**
> In `app.js`. The `cors` middleware only allows origins listed in `FRONTEND_URL` (from `.env`). Other origins get a CORS error.

**Q: What is Helmet?**
> In `app.js`. Helmet is an Express middleware that sets HTTP security headers: prevents clickjacking (`X-Frame-Options: DENY`), disables MIME sniffing (`X-Content-Type-Options: nosniff`), enforces HTTPS (`Strict-Transport-Security`), controls referrer policy, etc.

**Q: What happens when a user is deleted?**
> We use **soft delete**. We set `is_deleted = true` and `deleted_at = now()` — the row stays in the database. `requireAuth` checks `is_deleted` and blocks the token. All queries filter `.eq('is_deleted', false)` or `.is('deleted_at', null)`.

**Q: What is the difference between controllers and services?**
> Controllers handle HTTP — they read from `req` and write to `res`. Services handle business logic and database operations. Controllers call services. This separation makes testing easier and keeps code organized.
