# Session Changes Summary

## Overview
This session implemented 14 new features for the RateHub platform and integrated them into the frontend UI. Below is a full log of every file edited and what was changed.

---

## Backend Changes

### 1. `backend/migration-v3.sql` (New File)
Full database migration script for all 14 features:
- Added `country` and `city` columns to `companies` table (Feature 3)
- Created `revoked_company_emails` table (Feature 4)
- Created `job_positions` table with `is_active`, `salary_min`, `salary_max` columns (Feature 5)
- Created `job_applications` table (Feature 5)
- Made `employee_of_month.employee_id` nullable (Feature 6)
- Created `eoty_events`, `eoty_nominees`, `eoty_votes`, `employee_of_year` tables (Feature 7)
- Added `is_anonymous` column to `feedback` table (Feature 11)
- Added `ai_sentiment`, `ai_toxicity_score` columns to `feedback` and `reviews` tables (Feature 13)
- Added `entity_type`, `entity_id` columns to `notifications` table (Feature 14)
- **Fix:** Wrapped `CREATE TYPE job_status` and `CREATE TYPE application_status` in `DO $$ ... EXCEPTION WHEN duplicate_object THEN null; END $$;` blocks to prevent errors on re-run
- **Fix:** Added defensive `ALTER TABLE` block to add `is_active` column to existing `job_positions` tables

### 2. `backend/src/services/jobService.js` (New File)
Service layer for job positions and applications:
- `createPosition()` — creates a job position with title, description, requirements, salary range, `is_active`
- `updatePosition()` — updates a position including salary fields
- `deletePosition()` — soft deletes a position
- `getCompanyPositions()` — returns open positions for a company (admin sees all, public sees only active)
- `applyToPosition()` — submits an application with `resume_url` and cover letter
- `getApplicationsForPosition()` — returns all applicants for a position (admin only)
- `updateApplicationStatus()` — admin updates application status
- `getMyApplications()` — employee views their own applications

### 3. `backend/src/controllers/jobController.js` (New File)
HTTP request handlers for job endpoints:
- `createPosition` — **Fixed:** added `salaryMin`, `salaryMax` extraction from request body
- `updatePosition` — **Fixed:** added `salaryMin`, `salaryMax` extraction and passing to service
- `deletePosition`, `getCompanyPositions`, `applyToPosition`, `getApplicationsForPosition`, `updateApplicationStatus`, `getMyApplications`

### 4. `backend/src/routes/jobRoutes.js` (New File)
REST routes for job features:
- `GET /api/jobs/company/:companyId` — public list of open positions
- `POST /api/jobs/company/:companyId` — admin: create position
- `PUT /api/jobs/:positionId` — admin: update position
- `DELETE /api/jobs/:positionId` — admin: delete position
- `POST /api/jobs/:positionId/apply` — employee: apply to position
- `GET /api/jobs/:positionId/applications` — admin: view applicants
- `PUT /api/jobs/applications/:applicationId/status` — admin: update application status
- `GET /api/jobs/my-applications` — employee: view own applications

### 5. `backend/src/services/eotyService.js` (New File)
Service layer for Employee of the Year (EOTY) voting:
- Create/manage EOTY events, nominees, votes
- `getEotyEventsByCompany()` — for employees to view active events
- `voteForNominee()` — employee casts vote
- `closeEvent()` — admin closes event and sets winner

### 6. `backend/src/controllers/eotyController.js` (New File)
HTTP handlers for EOTY endpoints.

### 7. `backend/src/routes/eotyRoutes.js` (New File)
REST routes for EOTY feature.

### 8. `backend/src/services/inviteService.js` (New File)
Service for admin inviting employees by email (Feature 1).

### 9. `backend/src/controllers/inviteController.js` (New File)
HTTP handlers for invite feature.

### 10. `backend/src/routes/inviteRoutes.js` (New File)
REST routes for invite feature.

### 11. `backend/src/app.js` (Edited)
- Mounted new routes: `/api/jobs`, `/api/eoty`, `/api/invites`

---

## Frontend Changes

### 12. `frontend/src/api/jobs.js` (New File)
API client functions for job features:
- `getCompanyPositions(companyId)` — fetch open jobs for a company
- `createPosition(companyId, data)` — admin creates a position
- `applyToPosition(positionId, data)` — employee applies
- `getMyApplications()` — employee views applications
- `getApplicationsForPosition(positionId)` — admin views applicants
- `updateApplicationStatus(applicationId, status)` — admin updates status

### 13. `frontend/src/api/eoty.js` (New File)
API client functions for EOTY voting:
- `getEotyEventsByCompany(companyId)` — employees view active events
- `createEotyEvent()`, `addNominee()`, `castVote()`, `closeEotyEvent()`

### 14. `frontend/src/pages/CompanyAdminDashboard.jsx` (Edited)
Added all 8 feature tabs to the company admin dashboard:
- **Overview tab** — company summary
- **Team (Requests) tab** — invite employees, end employment requests
- **Reviews tab** — view company reviews
- **EOTM tab** — Employee of the Month with certificate download
- **EOTY tab** — Employee of the Year event management and voting
- **Jobs tab** — create, delete, and manage job positions; view applicants
- **Feedback tab** — internal team feedback
- **Settings tab** — company settings including verified employee count
- Added imports: `Briefcase`, `Trophy`, `Award` icons, all new API functions
- Added `RequestsTab`, `EotmTab`, `JobsTab`, `EotyAdminTab` components

### 15. `frontend/src/pages/EmployeeDashboard.jsx` (Edited)
Added new tabs for employee features:
- **EOTY tab** — employees can view nominees and cast votes
- **My Applications tab** — employees track job application statuses
- Added hash navigation support (`#eoty`, `#applications`)
- Removed self-request button (Feature 12: disable self-request)

### 16. `frontend/src/pages/CompanyProfilePage.jsx` (Edited)
Added "Job Openings" tab to company profile pages so employees can discover open positions:
- Added import: `getCompanyPositions` from jobs API
- Added state: `activeTab`, `positions`, `jobsLoading`
- Added `useEffect` to load positions when "Job Openings" tab is selected
- Added tab navigation: "Employee Reviews" | "Job Openings"
- Added **Jobs Tab** component: displays position cards with title, description, salary range, and "Apply Now" button linking to `/companies/:id/jobs`
- Wrapped reviews section in `{activeTab === 'reviews' && <>...</>}` conditional

### 17. `frontend/src/pages/CompanyJobsPage.jsx` (New File)
Dedicated page for employees to apply to job positions:
- Lists all open positions for the company
- Application form with cover letter input and resume/CV file upload
- Submits application via `applyToPosition()` API
- Shows success/error states

### 18. `frontend/src/pages/AcceptInvitePage.jsx` (New File)
Page for accepting company admin invitations:
- Reads invite token from URL params
- Validates and accepts the invite
- Redirects to dashboard on success

### 19. `frontend/src/components/CertificateModal.jsx` (New File)
Reusable modal component for downloading EOTM/EOTY certificates:
- Uses `html2canvas` to render certificate as PNG
- Certificate shows employee name, company, month/year, and award type

---

## Bug Fixes

### Fix 1: Missing `is_active` column
- **Error:** `Could not find the 'is_active' column of 'job_positions' in the schema cache`
- **Cause:** `jobService.js` was querying `is_active` but the column wasn't in the original migration
- **Fix:** Added `is_active BOOLEAN DEFAULT TRUE` to `job_positions` CREATE TABLE and a defensive ALTER TABLE block

### Fix 2: Duplicate enum type error
- **Error:** `ERROR: 42710: type 'job_status' already exists`
- **Cause:** Re-running the migration attempted to CREATE TYPE again
- **Fix:** Wrapped both `CREATE TYPE` statements in `DO $$ ... EXCEPTION WHEN duplicate_object THEN null; END $$;` blocks

### Fix 3: Salary fields not being saved
- **Cause:** `jobController.js` was not extracting `salaryMin`/`salaryMax` from request body
- **Fix:** Added `salaryMin` and `salaryMax` to both `createPosition` and `updatePosition` handlers in the controller, and updated service to pass them to the database insert/update

---

## Summary of All Files Touched

| File | Action |
|------|--------|
| `backend/migration-v3.sql` | Created + Fixed |
| `backend/src/services/jobService.js` | Created + Fixed |
| `backend/src/controllers/jobController.js` | Created + Fixed |
| `backend/src/routes/jobRoutes.js` | Created |
| `backend/src/services/eotyService.js` | Created |
| `backend/src/controllers/eotyController.js` | Created |
| `backend/src/routes/eotyRoutes.js` | Created |
| `backend/src/services/inviteService.js` | Created |
| `backend/src/controllers/inviteController.js` | Created |
| `backend/src/routes/inviteRoutes.js` | Created |
| `backend/src/app.js` | Edited |
| `frontend/src/api/jobs.js` | Created |
| `frontend/src/api/eoty.js` | Created |
| `frontend/src/pages/CompanyAdminDashboard.jsx` | Edited |
| `frontend/src/pages/EmployeeDashboard.jsx` | Edited |
| `frontend/src/pages/CompanyProfilePage.jsx` | Edited |
| `frontend/src/pages/CompanyJobsPage.jsx` | Created |
| `frontend/src/pages/AcceptInvitePage.jsx` | Created |
| `frontend/src/components/CertificateModal.jsx` | Created |
