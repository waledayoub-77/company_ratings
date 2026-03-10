# 🏢 RateHub — AI Context File

**Last Updated**: 2026-03-10  
**Current Branch**: `ratehub.10` (HEAD: `02f68f5`)  
**Project**: Company rating platform (Glassdoor-like) where employees can anonymously review companies, give peer feedback, apply for jobs, and earn recognition awards.  
**Stack**: Node.js/Express + Supabase (PostgreSQL) backend · React + Vite + Tailwind CSS frontend  

---

## 👥 TEAM

| Name | Role | Area |
|------|------|------|
| **Baraa** | Tech Lead | Backend infrastructure, Auth, Security, Frontend integration, Bug fixes, Testing |
| **Raneem** | Backend Dev | Employment, Feedback, Jobs, EOTM/EOTY, Notifications, Verification gating |
| **Aya** | Backend Dev | Companies, Reviews, Review interactions |
| **Walid** | Full-Stack Dev | Admin panel, Frontend Phase 2/5/8, Bug fixes |

---

## ✅ WHAT EVERYONE DID (ratehub.1 → ratehub.10)

---

### 🔵 BARAA — Tech Lead

#### Phase 0–2 (Feb 19 – Mar 3) — Backend Foundation
- Designed and deployed entire DB schema to Supabase (9 tables, triggers, RLS disabled, views, stored functions)
- `authService.js`: register, login, JWT issue, refresh-token, logout, getMe, verify-email, forgot-password, reset-password, change-password
- `authController.js` + `authRoutes.js`: all 10 auth endpoints
- `JWT utility` (utils/jwt.js): generate/verify access (15min) + refresh (7day) tokens
- `bcrypt` password hashing
- `emailService.js`: welcome, verify-email, password-reset, employment approved/rejected emails via Nodemailer + Gmail SMTP
- `authMiddleware.js` (`requireAuth`): full JWT verification with refresh-token silent retry
- `roleMiddleware.js` (`requireRole`, `requireCompanyAdmin`): role-based access guards
- `sanitize.js` middleware: XSS protection (strips script tags & HTML)
- `rateLimiter.js`: report limiter, standard limiter
- `errorHandler.js`: global Express error handler
- `auditLogger.js`: logs all admin actions to audit_logs table
- `validators.js`: shared input validators
- API client `frontend/src/api/client.js`: auth-aware axios instance, 401 → silent refresh → retry
- All frontend API layer files: `api/auth.js`, `api/companies.js`, `api/employees.js`, `api/employments.js`, `api/eotm.js`, `api/feedback.js`, `api/notifications.js`, `api/reviews.js`, `api/verification.js`
- `AuthContext.jsx`: React context with session rehydration on page load
- `App.jsx`: all route guards (ProtectedRoute, GuestRoute, RoleRoute)
- `Navbar.jsx`: auth-aware with role-based links, user initials dropdown, sign out
- `CompanyAdminDashboard.jsx`: all 5 tabs connected to real API (Overview, Employees, Reviews, EOTM/EOTY, Verifications, Settings)
- `ProfilePage.jsx`: Profile/Employment/Activity/Settings sections connected to real API

#### ratehub.3 Bug Fixes (Mar 3)
- Fixed 6 bugs: Dashboard title, no-company guard, replaced all `alert()` in AdminPanel, VerificationsTab, CompanyProfilePage reply, F5 session rehydration

#### ratehub.9 (Mar 10) — 18 Features
1. Hired employee now shows correctly in Employees tab
2. Removed Apply Job button for company_admin on CompanyProfilePage
3. Job creation: all fields required validation
4. Fixed CV loading bug
5. Fixed applied-state persistence after page refresh
6. Soft message instead of error for duplicate hire-accept
7. Sentiment analysis threshold tuning
8. Fixed "Feedback not found" error when reporting
9. EOTM/EOTY: hide "no votes" message, hide counts until event is closed
10. EOTY: December-only event creation guard
11. Prevent employees from deleting other users' reviews
12. LandingPage: replaced static data with real API calls (simplified -54 lines)
13. CompaniesPage: country-state-city dropdowns + 30 real industry categories
14. Job Board: split tabs (Available/Applied), pagination 10/page, text search
15. Feedback: added "search by name" + "can be anonymous" text hint
16. Profile: renamed "position" field to "job title", fixed persistence bug
17. Removed email change feature
18. Removed public/private profile toggle buttons
- Wrote `ratehub9-features.test.js` (375 lines) + `22-ratehub9-features.spec.js` (336 lines Playwright E2E)

#### ratehub.10 (Mar 10)
- `CompaniesPage.jsx`: real country-state-city dropdowns + 30 real industry filter options
- `CompanyAdminDashboard.jsx` Settings tab: country/city dropdowns for company location (saves "City, Country")
- Sentiment moderation full flow: very_negative reviews → `is_published: false` (amber "Under Review" screen for author)
- `VERY_NEGATIVE_THRESHOLD` set to `-0.10` in `sentimentService.js`
- `WriteReviewPage.jsx`: amber "Under Review" screen shown when review is pending moderation
- `AdminPanel.jsx`: Pending Approval badge on Sentiment tab, Approve/Reject buttons wired
- `adminService.js`: `approveFlaggedReview()`, `rejectFlaggedReview()`
- `adminRoutes.js` + `adminController.js`: `PATCH /admin/reviews/:id/approve` and `/admin/reviews/:id/reject`

---

### 🟢 RANEEM — Backend Dev

#### Phase 1–3 (Feb 19 – Mar 3) — Employment, Feedback, Profiles
- `employmentService.js`: request, approve, reject, end — full CRUD + email hooks
- `employmentController.js` + `employmentRoutes.js`
- `feedbackService.js`: peer feedback, no-self guard, same-company guard, quarterly limit
- `feedbackController.js` + `feedbackRoutes.js`
- `checkVerifiedEmployment.js` helper (shared with Aya)
- `employeeController.js` + `employeeRoutes.js`: GET/PATCH `/employees/:id` (profile, privacy)
- Initial `EmployeeDashboard.jsx` + `WriteReviewPage.jsx` connections

#### ratehub.5 (Mar 6) — 47 files, 3931 insertions
- **Jobs system**: `jobController.js`, `jobService.js`, `jobRoutes.js`, `api/jobs.js`, `CompanyJobsPage.jsx`
- **EOTY**: `eotyController.js`, `eotyService.js`, `eotyRoutes.js`, `api/eoty.js`
- **Employee invite flow**: `AcceptInvitePage.jsx`, `POST /employments/invite` (removed self-request endpoint)
- **CertificateModal.jsx**: award certificate display
- **Sentiment**: initial `sentimentService.js` (AFINN-165 scoring)
- **Notifications**: `notificationService.js`, `notificationController.js`, `notificationRoutes.js`
- DB migrations v3: notifications, EOTY, job tables

#### ratehub.6 (Mar 8) — Bug fixes for v3

#### ratehub.6→7 (Mar 8-9)
- EOTM/EOTY overhaul: certificates, vote visibility
- `NotificationContext.jsx`: real-time notification polling in React
- Job applications + CV upload: `create_job_tables.sql`, `upload.js` (multer), CompanyProfilePage jobs section, CompanyAdminDashboard Open Positions tab, EmployeeDashboard Job Board tab
- Full hire invite flow: admin sends offer → employee accepts/rejects → email notifications
- Identity verification gating: `add_is_verified_to_employees.sql`, improved `verificationService.js`
- Test suites: `jobs.test.js` (54 unit tests), `20-jobs-flow.spec.js` (57 Playwright tests)
- `employee-flow.test.js` (843 lines), `21-employee-flow.spec.js` (695 lines)

#### ratehub.8 (Mar 9) — 23 files changed
- **Employment end-request flow**: `add_end_request_to_employments.sql`
  - `PATCH /employments/:id/request-end`, `/approve-end-request`, `/reject-end-request`, `/end-by-admin`
- Ended employee access control (blocked from reviewing after end)
- EOTM/EOTY: vote counts hidden until event is closed
- Major `CompanyAdminDashboard.jsx` rewrite (681 lines)
- Major `EmployeeDashboard.jsx` rewrite (230 lines changed)
- `frontend/src/api/employments.js` +31 lines
- `RATEHUB_8_MANUAL_TESTS.txt` (311 lines)

#### ratehub.10 (Mar 10)
- `7b90fa6`: Job location field — DB migration, backend model, admin create-position form, company profile display, dashboard display
- `620e6a8`: `add_hire_invite_rejected_column.sql` + reject-hire fallback in jobService + `rejectHireInvite()` in `api/jobs.js`
- `75057eb`: Company detail page: total employees count pulled from DB (not hardcoded)
- `8fcc6b2`: CompanyAdminDashboard job-position create form: country/city dropdowns
- `cf9ec82`: **NEW `JobsBoard.jsx` (321 lines)** — public jobs board at `/jobs`, browse without login, apply modal with CV upload, custom country/city dropdowns
- `37a80e6`: LandingPage "Jobs" nav link added
- `266770d`: `GET /jobs/all` made PUBLIC (no auth required), `/jobs` route added to `App.jsx` unguarded
- `02f68f5`: Removed inline feedback report form from EmployeeDashboard FeedbackTab (Flag button + report form removed)

---

### 🔴 WALID — Full-Stack Dev

#### Phase 2 (Feb 25) — Frontend Real API Integration
- `CompaniesPage.jsx`: full real API — search, filters, sort, pagination, debounced search, loading skeleton, empty/error states, deterministic gradient cards
- `CompanyProfilePage.jsx`: real company data + reviews + analytics + report form, pagination, sort
- `LandingPage.jsx`: top companies pulled from real API

#### Phase 5 (Feb 25) — Admin Panel + More
- **Complete rewrite of `AdminPanel.jsx`** (~750 lines, 5 tabs): Overview, Reports, Companies, Users (suspend/unsuspend/delete), Audit Log — all connected to real API
- New backend endpoints: `GET /companies/:id/employees`, `POST /auth/change-password`
- **Complete rewrite of `InternalFeedbackPage.jsx`**: real coworkers API, company picker, correct payload format
- `ProfilePage.jsx` Settings: change-password form + auto-logout after password change

#### Phase 8 (Feb 25) — UX Polish
- `ToastContext.jsx`: global toast notification system
- `NotFoundPage.jsx`: 404 page
- `Skeleton.jsx`: reusable loading + empty state components
- Session expired UX: `SESSION_EXPIRED_EVENT` → auto-redirect to login

#### ratehub.3 Bug Fixes (Mar 3)
- 6 bug fixes: Dashboard title, no-company guard, replaced all `alert()` calls in AdminPanel, VerificationsTab, CompanyProfilePage reply, F5 session rehydration
- `MANUAL_TEST_CASES.txt` restructured (832 → 586 lines, cleaner)

---

### 🟡 AYA — Backend Dev

#### Phase 0–4 (Feb 19–21) — Companies + Reviews
- `companyService.js`: `getCompanies` (search, filter, sort, paginate), `getCompanyById`, `createCompany`, `updateCompany`, `deleteCompany`, `getCompanyStats`, `getCompanyAnalytics`
- `companyController.js` (7 endpoints) + `companyRoutes.js`
- `reviewService.js`: `createReview`, `updateReview` (48h window), `deleteReview`, `getCompanyReviews`, `getMyReviews`, `getReviewById`, `reportReview`, `checkDuplicateReview`, `recalculateCompanyRating`
- `reviewController.js` (7 endpoints) + `reviewRoutes.js`
- `reviewReplyService.js` + `reviewVoteService.js` + `categoryRatingService.js` + `reviewInteractionController.js`
- Fixed DB schema compatibility issues (deleted_at, user_id column names)
- Anonymous review handling via `public_company_reviews` DB view
- Review analytics: rating distribution (per star) + monthly trends
- Fixed BUG-002 (report reason validation), BUG-003 (duplicate checkVerifiedEmployment)

---

## 📁 PROJECT STRUCTURE

```
company_ratings/
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   │   ├── database.js         # Supabase client
│   │   │   ├── email.js            # Nodemailer + Gmail SMTP
│   │   │   ├── env.js              # env var validation
│   │   │   └── upload.js           # multer for CV uploads
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── authController.js
│   │   │   ├── companyController.js
│   │   │   ├── employeeController.js
│   │   │   ├── employmentController.js
│   │   │   ├── eotmController.js
│   │   │   ├── eotyController.js
│   │   │   ├── feedbackController.js
│   │   │   ├── jobController.js
│   │   │   ├── notificationController.js
│   │   │   ├── reportController.js
│   │   │   ├── reviewController.js
│   │   │   ├── reviewInteractionController.js
│   │   │   └── verificationController.js
│   │   ├── helpers/
│   │   │   └── checkVerifiedEmployment.js
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js   # requireAuth (JWT verify + refresh)
│   │   │   ├── errorHandler.js
│   │   │   ├── rateLimiter.js
│   │   │   ├── roleMiddleware.js   # requireRole, requireCompanyAdmin
│   │   │   ├── sanitize.js         # XSS protection
│   │   │   └── validateMiddleware.js
│   │   ├── routes/
│   │   │   ├── index.js            # mounts all routers
│   │   │   ├── adminRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── companyRoutes.js
│   │   │   ├── employeeRoutes.js
│   │   │   ├── employmentRoutes.js
│   │   │   ├── eotmRoutes.js
│   │   │   ├── eotyRoutes.js
│   │   │   ├── feedbackRoutes.js
│   │   │   ├── jobRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   ├── reviewRoutes.js
│   │   │   └── verificationRoutes.js
│   │   ├── services/
│   │   │   ├── adminService.js
│   │   │   ├── authService.js
│   │   │   ├── categoryRatingService.js
│   │   │   ├── companyService.js
│   │   │   ├── emailService.js
│   │   │   ├── employmentService.js
│   │   │   ├── eotmService.js
│   │   │   ├── eotyService.js
│   │   │   ├── feedbackService.js
│   │   │   ├── jobService.js
│   │   │   ├── notificationService.js
│   │   │   ├── reportService.js
│   │   │   ├── reviewReplyService.js
│   │   │   ├── reviewService.js
│   │   │   ├── reviewVoteService.js
│   │   │   ├── sentimentService.js  # AFINN-165, threshold -0.10
│   │   │   └── verificationService.js
│   │   └── utils/
│   │       ├── auditLogger.js
│   │       ├── jwt.js
│   │       └── validators.js
│   └── tests/
│       ├── unit/                   # Jest unit tests
│       └── e2e/                    # Playwright E2E tests
├── frontend/
│   └── src/
│       ├── App.jsx                 # All routes + guards
│       ├── main.jsx
│       ├── index.css
│       ├── api/
│       │   ├── client.js           # axios, 401→refresh→retry
│       │   ├── admin.js
│       │   ├── auth.js
│       │   ├── companies.js
│       │   ├── employees.js
│       │   ├── employments.js
│       │   ├── eotm.js
│       │   ├── eoty.js
│       │   ├── feedback.js
│       │   ├── jobs.js
│       │   ├── notifications.js
│       │   ├── reviews.js
│       │   └── verification.js
│       ├── components/
│       │   ├── CertificateModal.jsx
│       │   ├── layout/
│       │   │   ├── Footer.jsx
│       │   │   ├── Layout.jsx
│       │   │   └── Navbar.jsx      # auth-aware, role links
│       │   └── ui/
│       │       ├── Badge.jsx
│       │       ├── Button.jsx
│       │       ├── Input.jsx
│       │       ├── PageHeader.jsx
│       │       ├── Reveal.jsx
│       │       ├── Skeleton.jsx
│       │       └── StarRating.jsx
│       ├── context/
│       │   ├── AuthContext.jsx     # session rehydration
│       │   ├── NotificationContext.jsx  # real-time polling
│       │   └── ToastContext.jsx    # global toasts
│       └── pages/
│           ├── AcceptInvitePage.jsx
│           ├── AdminPanel.jsx
│           ├── CompaniesPage.jsx
│           ├── CompanyAdminDashboard.jsx
│           ├── CompanyProfilePage.jsx
│           ├── EmployeeDashboard.jsx
│           ├── ForgotPasswordPage.jsx
│           ├── InternalFeedbackPage.jsx
│           ├── JobsBoard.jsx        # PUBLIC jobs page (ratehub.10)
│           ├── LandingPage.jsx
│           ├── LoginPage.jsx
│           ├── NotFoundPage.jsx
│           ├── ProfilePage.jsx
│           ├── RegisterPage.jsx
│           ├── ResetPasswordPage.jsx
│           ├── VerifyEmailPage.jsx
│           └── WriteReviewPage.jsx
└── AI_CONTEXT.md
```

---

## 🌐 FRONTEND ROUTES

| Route | Component | Auth Guard |
|-------|-----------|------------|
| `/` | LandingPage | None (public) |
| `/login` | LoginPage | GuestRoute |
| `/register` | RegisterPage | GuestRoute |
| `/verify-email/:token` | VerifyEmailPage | GuestRoute |
| `/forgot-password` | ForgotPasswordPage | GuestRoute |
| `/reset-password/:token` | ResetPasswordPage | GuestRoute |
| `/companies` | CompaniesPage | None (public) |
| `/jobs` | **JobsBoard** | **None (public)** |
| `/companies/:id` | CompanyProfilePage | None (public) |
| `/companies/:id/review` | WriteReviewPage | RoleRoute: employee |
| `/profile` | ProfilePage | ProtectedRoute |
| `/accept-invite` | AcceptInvitePage | ProtectedRoute |
| `/dashboard` | EmployeeDashboard | RoleRoute: employee |
| `/dashboard/feedback` or `/feedback` | InternalFeedbackPage | RoleRoute: employee |
| `/company-admin` | CompanyAdminDashboard | RoleRoute: company_admin |
| `/admin` | AdminPanel | RoleRoute: system_admin |
| `*` | NotFoundPage | None |

---

## 🔌 COMPLETE API ROUTE MAP

### Auth — `/api/auth`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register + send verify email |
| POST | `/login` | Login → JWT access + refresh |
| GET | `/verify-email/:token` | Verify email address |
| POST | `/forgot-password` | Send password reset email |
| POST | `/reset-password/:token` | Reset password |
| POST | `/refresh-token` | Silent token refresh |
| POST | `/logout` | Invalidate refresh token |
| GET | `/me` | Get current user |
| POST | `/change-password` | Change password (requires auth) |

### Companies — `/api/companies`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List companies (public, filter by country/industry) |
| GET | `/:id` | Get company details |
| GET | `/:id/analytics` | Rating distribution + monthly trends |
| GET | `/:id/stats` | Stats summary |
| GET | `/:id/employees` | List current employees |
| POST | `/` | Create company (company_admin) |
| PATCH | `/:id` | Update company (company_admin) |
| DELETE | `/:id` | Soft-delete company (admin) |
| GET | `/:id/reviews` | Get paginated reviews |

### Reviews — `/api/reviews`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Submit review (sentiment-checked) |
| GET | `/my-reviews` | Get my reviews |
| GET | `/:id` | Get single review |
| PATCH | `/:id` | Edit review (48h window) |
| DELETE | `/:id` | Delete review (admin only — employees blocked) |
| POST | `/:id/reply` | Reply to review |
| PATCH | `/replies/:id` | Edit reply |
| DELETE | `/replies/:id` | Delete reply |
| POST | `/:id/vote` | Helpful/unhelpful vote |
| GET | `/:id/category-ratings` | Per-category scores |

### Employment — `/api/employments`
> ⚠️ `POST /request` (self-request) was **REMOVED** in ratehub.5 — use invite flow only

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List my employments |
| POST | `/invite` | Admin sends invite |
| POST | `/accept-invite` | Employee accepts invite |
| GET | `/pending-invites` | Get pending invites |
| DELETE | `/invite/:id` | Cancel invite |
| PATCH | `/invite/:id/resend` | Resend invite email |
| GET | `/pending` | Admin: pending requests |
| GET | `/all` | Admin: all employments |
| GET | `/current` | Get current employment |
| PATCH | `/:id/approve` | Approve request |
| PATCH | `/:id/reject` | Reject request |
| PATCH | `/:id/end` | End employment (employee) |
| PATCH | `/:id/end-by-admin` | End employment (admin) |
| DELETE | `/:id/cancel` | Cancel pending request |
| PATCH | `/:id/request-end` | Employee requests end |
| PATCH | `/:id/approve-end-request` | Admin approves end request |
| PATCH | `/:id/reject-end-request` | Admin rejects end request |

### Feedback — `/api/feedback`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Submit peer feedback |
| GET | `/received` | Get feedback received |
| GET | `/given` | Get feedback given |

### Jobs — `/api/jobs`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get company job positions (by company admin) |
| GET | `/all` | **PUBLIC — no auth** — list all open positions |
| GET | `/my-applications` | Get my job applications |
| GET | `/:id` | Get single position |
| POST | `/` | Create position (company_admin) |
| PATCH | `/:id/close` | Close position |
| DELETE | `/:id` | Delete position |
| POST | `/:id/apply` | Apply with CV (multipart) |
| GET | `/:id/applications` | Get applicants (company_admin) |
| PATCH | `/applications/:appId/status` | Update application status |
| POST | `/applications/:appId/invite` | Invite to interview |
| POST | `/applications/:appId/accept-invite` | Accept interview invite |
| POST | `/applications/:appId/hire-invite` | Send hire offer |
| POST | `/applications/:appId/accept-hire` | Accept hire offer |
| POST | `/applications/:appId/reject-hire` | Reject hire offer |
| GET | `/cv/:filename` | Stream CV file |

### Notifications — `/api/notifications`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get my notifications |
| PATCH | `/:id/read` | Mark as read |

### Verification — `/api/verification`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload-id` | Upload identity document |
| POST | `/upload-company-doc` | Upload company doc |
| GET | `/status` | Get verification status |
| GET | `/admin/requests` | Admin: list all requests |
| PATCH | `/admin/:id/approve` | Admin: approve |
| PATCH | `/admin/:id/reject` | Admin: reject |

### EOTM — `/api/eotm`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/events` | Create EOTM event |
| POST | `/events/:id/vote` | Vote for nominee |
| PATCH | `/events/:id/close` | Close event (reveal results) |
| GET | `/company/:companyId` | List events |
| GET | `/events/:id/nominees` | Get nominees + vote counts (hidden until closed) |
| GET | `/company/:companyId/winners` | Past winners |

### EOTY — `/api/eoty`
Same structure as EOTM. **Creation restricted to December only.**

### Admin — `/api/admin` + `/admin`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/reports` | Submit report |
| GET | `/admin/reports` | List reports |
| PATCH | `/admin/reports/:id/resolve` | Resolve report |
| GET | `/admin/users` | List users (search + filter) |
| PATCH | `/admin/users/:id/suspend` | Suspend user |
| PATCH | `/admin/users/:id/unsuspend` | Unsuspend user |
| DELETE | `/admin/users/:id` | Soft-delete user |
| PATCH | `/admin/users/:id/confirm-suspension` | Confirm suspension |
| PATCH | `/admin/users/:id/dismiss-suspension` | Dismiss suspension |
| GET | `/admin/companies` | List companies (admin view) |
| PATCH | `/admin/companies/:id/verify` | Verify company |
| PATCH | `/admin/employments/:id/override` | Override employment |
| GET | `/admin/analytics` | Platform analytics |
| GET | `/admin/audit-logs` | Audit log (paginated, filterable) |
| GET | `/admin/sentiment-reviews` | List reviews pending moderation |
| PATCH | `/admin/reviews/:id/approve` | Approve flagged review |
| PATCH | `/admin/reviews/:id/reject` | Reject flagged review |

---

## 🔑 KEY TECHNICAL DETAILS

### Authentication
- **Access token**: JWT, 15-minute expiry, stored in memory
- **Refresh token**: JWT, 7-day expiry, stored in `httpOnly` cookie
- **Silent refresh**: `client.js` catches 401, calls `/auth/refresh-token`, retries original request
- **Session rehydration**: `AuthContext.jsx` calls `/auth/me` on app load

### Sentiment Moderation
- Library: `sentiment` npm (AFINN-165 word list)
- `VERY_NEGATIVE_THRESHOLD = -0.10`
- Reviews scoring below threshold: `is_published = false`
- Status shown to author as amber "Under Review" badge on WriteReviewPage
- Admin can Approve (publish) or Reject (delete) from AdminPanel Sentiment tab

### Employment Flow (Current — invite only)
1. Company admin sends invite → email sent to employee
2. Employee accepts invite at `/accept-invite`
3. Admin approves/rejects employment
4. Employee can request end; admin approves/rejects
5. Admin can end employment directly

### Job Application Flow
1. Company admin creates job position (with location, skills, salary)
2. Anyone (including guests) can browse `/jobs` (JobsBoard.jsx)
3. Employee applies with CV upload → `POST /jobs/:id/apply`
4. Admin reviews applications, can invite to interview
5. Admin sends hire offer → employee accepts or rejects
6. On accept-hire: employment record auto-created

### EOTM/EOTY Rules
- Vote counts hidden until admin closes event
- "No votes" message hidden until event closed
- EOTY creation restricted to December only
- Winners shown after event closed

### Identity Verification (Gating)
- Employees must upload ID doc via `/api/verification/upload-id`
- Admin approves/rejects via dashboard
- `is_verified` flag added to employees table
- Unverified employees blocked from certain actions

---

## 📋 RECENT CHANGES LOG

### 2026-03-10 — ratehub.10 (HEAD: 02f68f5)
**Raneem:**
- Added `location` field to job positions (migration + backend + frontend)
- Added reject-hire invite flow + DB column
- Public JobsBoard page (`/jobs`) — 321 lines, guests can browse and apply
- Made `GET /jobs/all` public (no auth)
- Company detail: total employees from DB
- CompanyAdminDashboard: country/city dropdowns on job-position form
- LandingPage + Navbar: added Jobs link for guests
- Removed inline feedback report form from FeedbackTab

**Baraa:**
- CompaniesPage: country-state-city + 30 real industries
- CompanyAdminDashboard Settings: country/city dropdowns
- Sentiment moderation: very_negative → `is_published: false`, admin Approve/Reject, "Under Review" screen
- `VERY_NEGATIVE_THRESHOLD` set to `-0.10`
- AdminPanel: Pending Approval badge, Approve/Reject in Sentiment tab

### 2026-03-10 — ratehub.9 (c0d4f36)
**Baraa:** 18 features + tests (see Baraa section above for full list)

### 2026-03-09 — ratehub.8 (efbc3bf)
**Raneem:** Employment end-request flow, ended employee access control, EOTM/EOTY vote count hiding, major dashboard rewrites

### 2026-03-08→09 — ratehub.6→7 (2fee664)
**Raneem:** Job applications + CV upload, hire invite flow, identity verification gating, massive test suites  
**Baraa (fd7a663):** Jobs E2E (57 Playwright tests) + unit tests (54 Jest tests), `requireCompanyAdmin` middleware on invite routes

### 2026-03-06 — ratehub.5 (a8f592b)
**Raneem:** Jobs system, EOTY, employee invite flow, CertificateModal, Notifications, Sentiment initial, DB migrations v3

### 2026-03-03 — ratehub.3
**Walid + Baraa:** 6 bug fixes, MANUAL_TEST_CASES.txt restructured

### 2026-03-01 — ratehub.2 / Phase 8
**Walid:** ToastContext, NotFoundPage, Skeleton component, session-expired UX

### 2026-02-25 — Phase 2 + 5
**Walid:** CompaniesPage, CompanyProfilePage, LandingPage (real API); full AdminPanel rewrite; InternalFeedbackPage rewrite; change-password backend

### 2026-02-19→23 — Phase 0–4
**Baraa:** DB schema, all auth, security middleware, JWT, email, API client, AuthContext, frontend integration  
**Aya:** Company + Review backend (services, controllers, routes, analytics, anonymous reviews)  
**Raneem:** Employment + Feedback backend, employee profiles  
**Walid:** Admin + Reports backend, audit logging, analytics

---

## 🚀 QUICK START

```bash
# Backend
cd backend
npm install
npm run dev         # http://localhost:5000

# Frontend
cd frontend
npm install
npm run dev         # http://localhost:5173
```

### Environment Variables (backend/.env)
```
PORT=5000
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
GMAIL_USER=...
GMAIL_APP_PASSWORD=...
CLIENT_URL=http://localhost:5173
```

---

## 🤖 INSTRUCTIONS FOR AI ASSISTANTS

1. **Read this file first** before making any changes.
2. **Update this file** when you complete work:
   - Add to "Recent Changes Log"
   - Update route tables if new endpoints added
   - Update project structure if new files added
3. **Key rules to never break:**
   - Employees cannot delete reviews (only admins)
   - `POST /employments/request` does NOT exist — invite flow only
   - `GET /jobs/all` is PUBLIC — no auth middleware
   - EOTY creation only allowed in December
   - Sentiment threshold is `-0.10` — do not change without discussing
   - JWT access tokens expire in 15min, refresh in 7 days
4. **Commit message format:**
   ```
   feat: Brief description
   
   - Detail 1
   - Detail 2
   
   Updated AI_CONTEXT.md
   ```
