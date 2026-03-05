# RateHub v2 — Comprehensive Implementation Plan

> **Generated:** March 1, 2026  
> **Branch:** `ratehub.2`  
> **Base:** All v1 fixes committed on `baraa` (commit `a46f077`)

---

## Current State Summary

### What's Working (v1)
- JWT auth (access + refresh), email verification, password reset
- RBAC (employee, company_admin, system_admin)
- Company CRUD, search/filter/sort, pagination
- Employment request → approve/reject + admin override
- Single-star reviews (1–5) with anonymous toggle + 24h edit window
- Peer feedback (4 categories, quarterly)
- Report system (submit + admin resolve/dismiss)
- Admin panel (users, companies, reports, audit logs, bulk suspend)
- In-app notifications (polling) + 11 email templates
- XSS sanitization, rate limiting, Helmet headers

### Tech Stack
- **Backend:** Node.js + Express (plain JS) + Supabase (PostgreSQL)
- **Frontend:** React 19 + Vite 7 (JSX, no TypeScript)
- **Auth:** JWT (jsonwebtoken + bcryptjs)
- **Email:** Nodemailer (Gmail SMTP)
- **No:** Redis, WebSockets, AI/ML, File Storage, Docker, CI/CD

---

## Implementation Phases

### PHASE 1 — Trust & Verification Infrastructure
> **Goal:** File upload + ID verification + company document verification  
> **Dependency:** None (foundational)  
> **Estimated effort:** 3–4 days

#### 1.1 File Storage Setup (Supabase Storage)
Since we already use Supabase, use **Supabase Storage** (built-in S3-compatible) — no new service needed.

**Backend tasks:**
- [ ] Create Supabase Storage buckets:
  - `verification-documents` (private, admin-only access)
  - `avatars` (public read, authenticated write)
  - `company-logos` (public read, company_admin write)
- [ ] Add `multer` + `@supabase/storage-js` to dependencies
- [ ] Create `storageService.js`:
  - `uploadFile(bucket, file, path)` → returns public/signed URL
  - `deleteFile(bucket, path)`
  - `getSignedUrl(bucket, path, expiresIn)` (for private docs)
- [ ] Create `uploadMiddleware.js`:
  - File type validation (PDF, JPG, PNG only)
  - File size limit (5MB for docs, 2MB for avatars)
  - Virus/mime-type sniffing prevention

**Database tasks:**
- [ ] Create `verification_requests` table:
  ```sql
  CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    verification_type VARCHAR(20) NOT NULL, -- 'identity' or 'company'
    document_url TEXT NOT NULL,
    document_type VARCHAR(50), -- 'national_id', 'passport', 'drivers_license', 'business_license'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] Add `identity_verified` (BOOLEAN DEFAULT FALSE) column to `users` table
- [ ] Add `is_document_verified` (BOOLEAN DEFAULT FALSE) column to `companies` table

#### 1.2 Employee ID Verification Flow

**Backend tasks:**
- [ ] Create `verificationController.js` + `verificationService.js`:
  - `POST /api/verification/upload-id` — employee uploads government ID
  - `GET /api/admin/verifications` — list pending verification requests
  - `GET /api/admin/verifications/:id` — get single request + signed document URL
  - `PATCH /api/admin/verifications/:id/approve` — approve + set `identity_verified = true`
  - `PATCH /api/admin/verifications/:id/reject` — reject with reason
- [ ] Create `verificationRoutes.js` and mount in `app.js`
- [ ] Add email templates: `identityVerified`, `identityRejected`
- [ ] Add audit log entries for approve/reject actions
- [ ] Add notification on status change

**Frontend tasks:**
- [ ] **ProfilePage** — Add "Identity Verification" section:
  - Status indicator: Not Verified / Pending / Verified (with badge)
  - Upload form: file picker (PDF/JPG/PNG, max 5MB), document type dropdown
  - Upload progress bar
  - Re-upload button if rejected (show rejection reason)
- [ ] **AdminPanel** — Add "Verifications" tab:
  - Table: user name, email, document type, date submitted, status
  - Click row → side panel with document preview (image or PDF embed)
  - Approve / Reject buttons with notes textarea
  - Filter by status (pending/approved/rejected)

#### 1.3 Company Document Verification + Badge

**Backend tasks:**
- [ ] `POST /api/verification/upload-company-doc` — company admin uploads business registration
- [ ] Admin review uses same verification queue (type = 'company')
- [ ] On approve → set `companies.is_document_verified = true`
- [ ] Add email templates: `companyDocVerified`, `companyDocRejected`

**Frontend tasks:**
- [ ] **CompanyAdminDashboard → Settings tab** — Add "Company Verification" section:
  - Upload business registration document
  - Status: Not Verified / Pending / Verified
- [ ] **CompanyProfilePage** — Show "Verified Company ✓" badge (blue checkmark) when `is_document_verified = true`
- [ ] **CompaniesPage** — Show verification badge on company cards

#### 1.4 Verified Reviewer Badge

**Frontend tasks:**
- [ ] On every review card (CompanyProfilePage, EmployeeDashboard):
  - If the reviewer's user has `identity_verified = true` → show green "✓ Verified Reviewer" badge
  - If anonymous + verified → show "✓ Verified Employee" (no name)
- [ ] Backend: include `identity_verified` flag in review response (join through employee → user)

---

### PHASE 2 — Multi-Category Review Ratings
> **Goal:** 6-category ratings (1–10) alongside the 1–5 overall star  
> **Dependency:** None  
> **Estimated effort:** 2–3 days

#### 2.1 Database

- [ ] Create `category_ratings` table:
  ```sql
  CREATE TABLE category_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES company_reviews(id) ON DELETE CASCADE,
    category VARCHAR(30) NOT NULL, 
    -- 'work_life_balance', 'compensation', 'management', 'culture', 'career_growth', 'environment'
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    UNIQUE(review_id, category)
  );
  ```
- [ ] Add `category_averages` JSONB column to `companies` table (cached averages)

#### 2.2 Backend

- [ ] Update `reviewService.createReview()`:
  - Accept `categoryRatings: { work_life_balance: 8, compensation: 7, ... }` (all 6 required)
  - Insert into `category_ratings` table
  - Recalculate company `category_averages` on create/update/delete
- [ ] Update `reviewService.editReview()` — allow category rating edits
- [ ] Update `GET /api/companies/:id/reviews` — include category ratings per review
- [ ] Update `GET /api/companies/:id` — include `category_averages` in response
- [ ] Add `GET /api/companies/:id/analytics` — category breakdown data for radar chart
- [ ] Input validation: all 6 categories required, each 1–10

#### 2.3 Frontend

- [ ] **WriteReviewPage** — Add 6 slider/number inputs for categories:
  - Work-Life Balance, Compensation & Benefits, Management, Culture, Career Growth, Work Environment
  - Each: labeled slider 1–10 with current value display
  - Grouped under "Rate by Category" section below the overall star rating
- [ ] **CompanyProfilePage** — Add category breakdown:
  - Radar chart (Recharts RadarChart) showing 6-category averages
  - Horizontal bar chart alternative below with numeric scores
  - Each review card: show mini category bars or expandable details
- [ ] **CompanyAdminDashboard → Analytics tab** — Add:
  - Radar chart of own company's category averages
  - Category trend over time (line chart per category)
- [ ] **CompaniesPage** — Show top 2 category scores as tags on company cards

---

### PHASE 3 — Review Enhancements
> **Goal:** Departure reason, company replies, helpful votes, review weighting  
> **Dependency:** Phase 2 (category ratings)  
> **Estimated effort:** 2–3 days

#### 3.1 Departure Reason

- [ ] Add `departure_reason` column to `company_reviews`:
  ```sql
  ALTER TABLE company_reviews ADD COLUMN departure_reason VARCHAR(30);
  -- Values: 'new_job', 'terminated', 'resigned', 'contract_ended', 'prefer_not_to_say'
  ```
- [ ] Backend: if reviewer's employment `is_current = false`, require departure reason
- [ ] Frontend: add departure reason dropdown on WriteReviewPage (conditional)
- [ ] Display on review card: "Left because: Found new job" (or hidden if prefer_not_to_say)

#### 3.2 Company Replies (Review Responses)

- [ ] Create `review_replies` table:
  ```sql
  CREATE TABLE review_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES company_reviews(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id),
    user_id UUID NOT NULL REFERENCES users(id), -- company_admin who replied
    content TEXT NOT NULL CHECK (char_length(content) BETWEEN 10 AND 2000),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id) -- one reply per review
  );
  ```
- [ ] Backend endpoints:
  - `POST /api/reviews/:id/reply` (company_admin of that company only)
  - `PATCH /api/reviews/:id/reply` (edit own reply)
  - `DELETE /api/reviews/:id/reply` (delete own reply)
- [ ] Frontend:
  - CompanyAdminDashboard → Reviews tab: "Reply" button on each review → expandable textarea
  - CompanyProfilePage: show company reply below review in a highlighted card
  - Email notification to reviewer when company replies

#### 3.3 Helpful Votes

- [ ] Create `review_votes` table:
  ```sql
  CREATE TABLE review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES company_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    vote_type VARCHAR(10) DEFAULT 'helpful', -- 'helpful' only for now
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, user_id)
  );
  ```
- [ ] Add `helpful_count` cached column to `company_reviews`
- [ ] Backend:
  - `POST /api/reviews/:id/vote` — toggle helpful vote
  - Include `helpful_count` + `user_has_voted` in review responses
- [ ] Frontend:
  - "👍 Helpful (N)" button on each review card
  - Highlighted state when user has voted
  - Sort option: "Most Helpful"

#### 3.4 Trust-Weighted Ratings

- [ ] When calculating company `overall_rating` and `category_averages`:
  - `identity_verified = true` → rating weight = 1.5×
  - `identity_verified = false` → rating weight = 1.0×
- [ ] Show on company profile: "Weighted average based on verified reviews"
- [ ] Update `recalculateCompanyRating()` in reviewService

---

### PHASE 4 — Employee of the Month (EOTM)
> **Goal:** Department-scoped voting system with time-limited events  
> **Dependency:** None  
> **Estimated effort:** 3–4 days

#### 4.1 Database

- [ ] Create tables:
  ```sql
  CREATE TABLE eotm_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    department VARCHAR(100) NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, department, month, year)
  );

  CREATE TABLE eotm_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES eotm_events(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES employees(id),
    candidate_id UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, voter_id)
  );

  CREATE TABLE employee_of_month (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES eotm_events(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    department VARCHAR(100) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    votes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

#### 4.2 Backend

- [ ] Create `eotmController.js` + `eotmService.js`:
  - `POST /api/eotm/events` — company_admin creates voting event (department, month, voting window)
  - `GET /api/eotm/events` — list events for employee's company
  - `GET /api/eotm/events/:id` — event details + candidates + vote counts (after close)
  - `POST /api/eotm/events/:id/vote` — employee votes for a candidate
  - `GET /api/eotm/events/:id/candidates` — eligible employees in that department
  - `POST /api/eotm/events/:id/finalize` — manual close by admin (or auto via cron)
- [ ] Create `eotmRoutes.js` and mount
- [ ] Voting rules:
  - Voter must be in same department + same company + approved employment
  - Cannot vote for self
  - One vote per event per voter
  - Voting only during active window (start_date ≤ now ≤ end_date)
- [ ] Auto-finalize: create a simple `setInterval` or scheduled check that closes expired events and records winners
- [ ] Email notifications: event created, winner announcement
- [ ] In-app notifications: "EOTM voting is open for your department!"

#### 4.3 Frontend

- [ ] **EmployeeDashboard** — Add "Employee of the Month" tab:
  - Active voting events for user's department → vote button per candidate
  - Past results with winner badges
  - Countdown timer for active events
- [ ] **CompanyAdminDashboard** — Add "EOTM" tab:
  - Create Event form: select department, set month, set voting window dates
  - View all events (active/closed)
  - View results per event
  - "Finalize" button for pending events
- [ ] **Employee profile / public profile** — Show EOTM badges:
  - "🏆 Employee of the Month — Engineering, Jan 2026"
- [ ] **CompanyProfilePage** — "Recent Employee of the Month" section (optional)

---

### PHASE 5 — AI Content Moderation
> **Goal:** Toxicity detection + sentiment analysis on reviews  
> **Dependency:** Phase 2 (reviews already enhanced)  
> **Estimated effort:** 2–3 days

#### 5.1 AI Service Integration

Choose **one** provider (in order of simplicity):
1. **OpenAI Moderation API** (free, simplest) — `POST https://api.openai.com/v1/moderations`
2. **Google Perspective API** (free tier available) — toxicity scoring
3. **Azure Content Safety** (paid) — comprehensive

- [ ] Create `aiModerationService.js`:
  - `analyzeContent(text)` → `{ toxicity_score, sentiment, categories, flagged }`
  - `isToxic(score)` → true if score > 0.7
- [ ] Add environment variables: `AI_MODERATION_PROVIDER`, `AI_API_KEY`
- [ ] Add `env.js` config section for AI

#### 5.2 Database Changes

- [ ] Add columns to `company_reviews`:
  ```sql
  ALTER TABLE company_reviews ADD COLUMN ai_toxicity_score DECIMAL(3,2);
  ALTER TABLE company_reviews ADD COLUMN ai_sentiment VARCHAR(20); -- 'positive', 'neutral', 'negative'
  ALTER TABLE company_reviews ADD COLUMN ai_sentiment_score DECIMAL(3,2);
  ALTER TABLE company_reviews ADD COLUMN is_hidden_by_ai BOOLEAN DEFAULT FALSE;
  ALTER TABLE company_reviews ADD COLUMN ai_moderation_details JSONB;
  ```

#### 5.3 Backend Integration

- [ ] On `POST /api/reviews` (create) and `PATCH /api/reviews/:id` (edit):
  - Call AI moderation service (async, non-blocking)
  - Store scores in review record
  - If `toxicity_score > 0.7` → set `is_hidden_by_ai = true`, `is_published = false`
  - Create notification to system admins for manual review
- [ ] Admin endpoints:
  - `GET /api/admin/flagged-reviews` — list AI-flagged reviews
  - `PATCH /api/admin/reviews/:id/approve` — override AI, publish review
  - `PATCH /api/admin/reviews/:id/confirm-hide` — confirm AI decision
- [ ] Graceful degradation: if AI service is down, publish review normally + log warning

#### 5.4 Frontend

- [ ] **CompanyProfilePage** — reviews with `is_hidden_by_ai = true`:
  - Content blurred/collapsed with message: "This review has been flagged for potential policy violations"
  - System admins see full content with a red "AI Flagged" badge
- [ ] **AdminPanel** — Add "AI Moderation" tab (or sub-section in Reports):
  - List of flagged reviews with toxicity scores, sentiment labels
  - Preview content + approve/confirm-hide actions
  - Stats: "X reviews flagged this week, Y% auto-caught"
- [ ] **Review cards** — sentiment badge (small colored dot):
  - Green dot = positive, Gray dot = neutral, Orange dot = negative
  - Only visible to company admin + system admin (not public)

---

### PHASE 6 — Profile & UX Enhancements
> **Goal:** Avatar upload, dark mode, notification preferences  
> **Dependency:** Phase 1 (file storage)  
> **Estimated effort:** 2 days

#### 6.1 Profile Avatar Upload

- [ ] Backend:
  - `POST /api/auth/me/avatar` — upload profile picture (JPG/PNG, max 2MB)
  - Store in `avatars` bucket, save URL in `users.avatar_url` column
  - `DELETE /api/auth/me/avatar` — remove avatar, revert to initials
- [ ] Add `avatar_url` column to `users` table
- [ ] Frontend:
  - ProfilePage: clickable avatar circle → file picker → crop/preview → upload
  - Navbar: show avatar image instead of initials when available
  - All user mentions (reviews, feedback, admin panel): show avatar or initials fallback

#### 6.2 Dark Mode

- [ ] Create `ThemeContext` in frontend:
  - `theme` state: 'light' | 'dark' | 'system'
  - Persist choice in `localStorage`
  - Apply `class="dark"` to `<html>` element
- [ ] Update `index.css` / Tailwind config:
  - Add `darkMode: 'class'` to Tailwind config (if using Tailwind) or CSS variables approach
  - Define dark variants for all color tokens (bg, text, border, card, input, etc.)
- [ ] Add toggle in Navbar: sun/moon icon
- [ ] Add toggle in ProfilePage → Settings section

#### 6.3 Notification Preferences (Backend Wiring)

- [ ] Create `notification_preferences` table:
  ```sql
  CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) UNIQUE,
    email_employment_updates BOOLEAN DEFAULT TRUE,
    email_review_responses BOOLEAN DEFAULT TRUE,
    email_feedback_received BOOLEAN DEFAULT TRUE,
    email_eotm_events BOOLEAN DEFAULT TRUE,
    email_verification_updates BOOLEAN DEFAULT TRUE,
    email_report_updates BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] Backend: `GET/PATCH /api/auth/me/preferences`
- [ ] Wire existing ProfilePage checkboxes to this API
- [ ] Check preferences before sending each email type

---

### PHASE 7 — Discovery & Engagement Features
> **Goal:** Comparison, leaderboard, "Claim This Company", featured companies  
> **Dependency:** Phase 2 (category ratings needed for comparison)  
> **Estimated effort:** 2–3 days

#### 7.1 Company Comparison Page

- [ ] Frontend: new route `/companies/compare`
  - Select 2–3 companies via search/autocomplete
  - Side-by-side cards: overall rating, review count, category radar chart overlay, employee count
  - Highlight winner per category (green/bold)
- [ ] Backend: `GET /api/companies/compare?ids=uuid1,uuid2,uuid3`
  - Return full stats + category averages for each company

#### 7.2 Company Leaderboard / Rankings

- [ ] Frontend: new route `/rankings`
  - Tab: "Top Rated", "Most Reviewed", "Best in Category"
  - Filter by industry, location
  - Cards ranked 1–N with medals (🥇🥈🥉) for top 3
- [ ] Backend: `GET /api/companies/rankings?sort=rating&industry=tech&limit=25`

#### 7.3 Featured Companies Section

- [ ] Backend: `GET /api/companies/featured` — top 6 companies (high rating + many reviews + verified)
- [ ] Frontend: LandingPage — replace static "Top Rated Companies" with real data from API
- [ ] CompaniesPage — "Featured" badge on qualifying company cards

#### 7.4 "Claim This Company" Flow

- [ ] Backend:
  - `POST /api/companies/:id/claim` — user submits claim (must be company_admin role)
  - Creates a verification request (type = 'company_claim')
  - Admin approves → sets `companies.user_id` to claimant
- [ ] Frontend:
  - CompanyProfilePage: if company has no `user_id`, show "Claim This Company" button
  - Clicking opens a form: "prove you represent this company" + document upload
  - Admin queue handles approval

---

### PHASE 8 — Advanced Features
> **Goal:** Salary insights, interview reviews, real-time notifications, invitation system  
> **Dependency:** Phase 1 (storage), Phase 2 (category ratings)  
> **Estimated effort:** 4–5 days

#### 8.1 Salary Insights (Verified Users Only)

- [ ] Create `salary_reports` table:
  ```sql
  CREATE TABLE salary_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    employment_id UUID NOT NULL REFERENCES employments(id),
    position VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    salary_min INTEGER NOT NULL,
    salary_max INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    pay_period VARCHAR(20) DEFAULT 'yearly', -- 'yearly', 'monthly', 'hourly'
    includes_bonus BOOLEAN DEFAULT FALSE,
    bonus_range VARCHAR(50),
    years_at_company INTEGER,
    is_anonymous BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, company_id)
  );
  ```
- [ ] Backend: CRUD endpoints under `/api/salaries`
- [ ] **Restriction:** only `identity_verified = true` users can submit salary data
- [ ] Frontend:
  - CompanyProfilePage: "Salary Insights" tab (show only if ≥3 reports for anonymity)
  - Bar/box chart grouped by position
  - EmployeeDashboard: "Submit Salary" button

#### 8.2 Interview Experience Reviews

- [ ] Create `interview_reviews` table:
  ```sql
  CREATE TABLE interview_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    user_id UUID NOT NULL REFERENCES users(id),
    position_applied VARCHAR(255) NOT NULL,
    difficulty VARCHAR(20) NOT NULL, -- 'easy', 'medium', 'hard'
    experience VARCHAR(20) NOT NULL, -- 'positive', 'neutral', 'negative'
    got_offer BOOLEAN,
    interview_date DATE,
    process_description TEXT CHECK (char_length(process_description) BETWEEN 50 AND 3000),
    questions_asked TEXT, -- optional, freeform
    tips TEXT, -- optional
    is_anonymous BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] Backend: CRUD endpoints under `/api/interviews`
- [ ] Frontend:
  - CompanyProfilePage: "Interview Experiences" tab
  - Separate submission form at `/companies/:id/interview-review`
  - Summary: avg difficulty, % positive experience, % got offer

#### 8.3 Company Invitation System

- [ ] Backend (partially exists — `invitation_token` column already in `employments`):
  - `POST /api/employments/invite` — company admin sends invite to email
  - Generates unique token, sends email with accept link
  - `POST /api/employments/accept-invite/:token` — employee accepts
  - Auto-creates employment with `verification_status = 'approved'`
- [ ] Frontend:
  - CompanyAdminDashboard → Team tab: "Invite Employee" button → email input + position + department
  - Email template: "You've been invited to join [Company] on RateHub"

#### 8.4 Real-Time Notifications (WebSocket)

- [ ] Install `socket.io` on backend
- [ ] Create `socketService.js`:
  - Auth via JWT on connection
  - Join user-specific room
  - Emit events: `notification:new`, `notification:count`
- [ ] Update `notificationService.js`: after DB insert, emit via socket
- [ ] Frontend:
  - Install `socket.io-client`
  - Create `useSocket` hook in AuthContext
  - Connect on login, disconnect on logout
  - Update notification bell count in real-time (remove polling `setInterval`)

---

### PHASE 9 — Anonymity & Trust Hardening
> **Goal:** Delayed publishing, minimum threshold, trust levels  
> **Dependency:** Phase 1 (verification), Phase 5 (AI)  
> **Estimated effort:** 1–2 days

- [ ] **Delayed Anonymous Publishing:**
  - If `is_anonymous = true`, set `publish_after` to NOW + 24 hours
  - Cron/interval job publishes reviews after delay
  - Show "Your anonymous review will be published within 24 hours" on submission

- [ ] **Minimum Employee Threshold:**
  - Anonymous reviews only published if company has ≥ 5 verified employees
  - Otherwise, hold review and notify: "Anonymous reviews require at least 5 verified employees at this company"

- [ ] **Trust Levels Display:**
  - Level 0: Email verified only → gray outline badge
  - Level 1: Employment approved → blue badge
  - Level 2: ID verified → green "Verified ✓" badge
  - Show on profiles, review cards, feedback entries

- [ ] **Anonymous + Verified Combo:**
  - If reviewer is anonymous BUT identity-verified → show "✓ Verified Employee" without name
  - Most trustworthy anonymous signal

---

### PHASE 10 — Analytics & Export
> **Goal:** Enhanced dashboards, PDF/CSV export  
> **Dependency:** Phase 2 (categories), Phase 5 (sentiment)  
> **Estimated effort:** 2 days

- [ ] **Company Admin Analytics Enhancements:**
  - Radar chart: 6-category averages (Recharts RadarChart)
  - Sentiment pie chart: % positive/neutral/negative reviews
  - Department breakdown: ratings grouped by reviewer's department
  - Employee turnover insights: current vs former employee rating comparison
  - Review volume: bar chart per month (last 12 months)

- [ ] **CSV Export:**
  - `GET /api/companies/:id/analytics/export?format=csv` — downloads reviews + ratings as CSV
  - `GET /api/admin/analytics/export?format=csv` — platform-wide data export
  - Frontend: "Export CSV" button on analytics pages

- [ ] **PDF Export:**
  - Use `jspdf` + `html2canvas` on frontend (client-side PDF generation)
  - "Download Report" button → renders analytics charts to PDF
  - Alternative: server-side with `puppeteer` (heavier)

---

### PHASE 11 — Infrastructure & DevOps
> **Goal:** Redis, Docker, CI/CD, Swagger, monitoring  
> **Dependency:** None (can be done in parallel)  
> **Estimated effort:** 2–3 days

#### 11.1 Redis Caching
- [ ] Install `ioredis`, configure in `env.js`
- [ ] Cache patterns:
  - Company profile: 1-hour TTL, invalidate on review/rating change
  - Company list/search: 5-minute TTL
  - Analytics data: 1-hour TTL
  - Featured companies: 6-hour TTL
- [ ] Replace in-memory rate limiter with `rate-limit-redis`

#### 11.2 Swagger / OpenAPI Documentation
- [ ] Install `swagger-jsdoc` + `swagger-ui-express`
- [ ] Add JSDoc annotations to all route files
- [ ] Serve at `GET /api/docs`

#### 11.3 Docker
- [ ] Create `Dockerfile` for backend (Node 20 Alpine)
- [ ] Create `Dockerfile` for frontend (Vite build → nginx)
- [ ] Create `docker-compose.yml` (backend + frontend + redis)
- [ ] Create `.dockerignore`

#### 11.4 CI/CD Pipeline (GitHub Actions)
- [ ] `.github/workflows/ci.yml`:
  - On PR: lint, test, build
  - On merge to main: build + deploy
- [ ] `.github/workflows/deploy.yml`:
  - Build Docker images
  - Push to container registry
  - Deploy to hosting

#### 11.5 Testing Infrastructure
- [ ] Backend: install `jest` + `supertest`
- [ ] Create test structure: `backend/tests/unit/`, `backend/tests/integration/`
- [ ] Write unit tests for core services (auth, reviews, ratings calculations)
- [ ] Write integration tests for critical API flows
- [ ] Add coverage reporting (`jest --coverage`)

---

## Dependency Graph

```
Phase 1 (File Storage + Verification)
  ├── Phase 6.1 (Avatar Upload) — needs file storage
  ├── Phase 9 (Trust Hardening) — needs verification levels
  └── Phase 8.1 (Salary) — needs identity_verified gate

Phase 2 (Category Ratings)
  ├── Phase 3 (Review Enhancements) — needs enriched reviews
  ├── Phase 7.1 (Comparison) — needs category data
  └── Phase 10 (Analytics) — needs categories for charts

Phase 5 (AI Moderation)
  └── Phase 10 (Sentiment charts) — needs sentiment data

Phase 11 (Infrastructure) — independent, can run in parallel
Phase 4 (EOTM) — independent
Phase 6.2 (Dark Mode) — independent
Phase 8.4 (WebSocket) — independent
```

---

## Recommended Implementation Order

| Week | Phase | Deliverable |
|------|-------|-------------|
| **Week 1** | Phase 1 | File upload + ID verification + company doc verification + verified badges |
| **Week 2** | Phase 2 + 3.1 | Multi-category ratings + departure reason |
| **Week 3** | Phase 3.2–3.4 + Phase 6 | Review replies, helpful votes, trust weighting, avatars, dark mode |
| **Week 4** | Phase 4 | Employee of the Month (full feature) |
| **Week 5** | Phase 5 | AI content moderation |
| **Week 6** | Phase 7 + 8.3 | Comparison, leaderboard, featured companies, invitation system |
| **Week 7** | Phase 8.1–8.2 | Salary insights + interview reviews |
| **Week 8** | Phase 8.4 + 9 + 10 | WebSocket, anonymity hardening, analytics export |
| **Week 9** | Phase 11 | Redis, Docker, CI/CD, Swagger, tests |

---

## Files to Create/Modify Per Phase

### Phase 1 — New Files
```
backend/src/controllers/verificationController.js
backend/src/services/verificationService.js
backend/src/services/storageService.js
backend/src/routes/verificationRoutes.js
backend/src/middlewares/uploadMiddleware.js
frontend/src/api/verification.js
frontend/src/pages/VerificationPage.jsx  (or sections in ProfilePage + AdminPanel)
```

### Phase 2 — Modified Files
```
backend/database-schema.sql (or new migration)
backend/src/services/reviewService.js
backend/src/controllers/reviewController.js
backend/src/utils/validators.js
frontend/src/pages/WriteReviewPage.jsx
frontend/src/pages/CompanyProfilePage.jsx
frontend/src/pages/CompanyAdminDashboard.jsx
frontend/src/api/reviews.js
```

### Phase 3 — New + Modified Files
```
backend/src/controllers/replyController.js (new)
backend/src/services/replyService.js (new)
backend/src/routes/replyRoutes.js (new)
frontend/src/api/replies.js (new)
backend/src/services/reviewService.js (modified — votes + weighting)
frontend/src/pages/CompanyProfilePage.jsx (modified — replies + votes)
frontend/src/pages/CompanyAdminDashboard.jsx (modified — reply UI)
frontend/src/pages/WriteReviewPage.jsx (modified — departure reason)
```

### Phase 4 — New Files
```
backend/src/controllers/eotmController.js
backend/src/services/eotmService.js
backend/src/routes/eotmRoutes.js
frontend/src/api/eotm.js
frontend/src/pages/EOTMPage.jsx (or tabs in dashboards)
```

### Phase 5 — New + Modified Files
```
backend/src/services/aiModerationService.js (new)
backend/src/services/reviewService.js (modified — AI pipeline)
backend/src/controllers/adminController.js (modified — flagged reviews)
frontend/src/pages/AdminPanel.jsx (modified — AI tab)
frontend/src/pages/CompanyProfilePage.jsx (modified — blurred content)
```

---

## Environment Variables to Add

```env
# Phase 1 — File Storage (Supabase Storage, no new env vars needed if using existing Supabase)

# Phase 5 — AI Moderation
AI_MODERATION_PROVIDER=openai          # 'openai' | 'perspective' | 'azure'
AI_API_KEY=sk-...

# Phase 8.4 — WebSocket (no new vars, uses existing JWT_SECRET)

# Phase 11 — Redis
REDIS_URL=redis://localhost:6379
```

---

## Database Migration Summary

Total new tables: **8**
- `verification_requests`
- `category_ratings`
- `review_replies`
- `review_votes`
- `eotm_events`
- `eotm_votes`
- `employee_of_month`
- `salary_reports`
- `interview_reviews`
- `notification_preferences`

Total column additions: **~10**
- `users.identity_verified`, `users.avatar_url`
- `companies.is_document_verified`, `companies.category_averages`
- `company_reviews.departure_reason`, `company_reviews.ai_toxicity_score`, `company_reviews.ai_sentiment`, `company_reviews.ai_sentiment_score`, `company_reviews.is_hidden_by_ai`, `company_reviews.ai_moderation_details`, `company_reviews.helpful_count`, `company_reviews.publish_after`
