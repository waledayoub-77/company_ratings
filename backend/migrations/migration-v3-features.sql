-- ============================================================================
-- MIGRATION V3 — Schema fixes for RateHub V3 Features
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nfpeazirwxuwpjryvcny/sql/new
-- ============================================================================

-- ── 1. Employments: Allow null employee_id for invite records ────────────────
ALTER TABLE employments ALTER COLUMN employee_id DROP NOT NULL;

-- ── 1b. Employments: Add invite/admin-end/source/company_email columns ──────
ALTER TABLE employments ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'request';
ALTER TABLE employments ADD COLUMN IF NOT EXISTS invite_email VARCHAR(255);
ALTER TABLE employments ADD COLUMN IF NOT EXISTS invite_token VARCHAR(255);
ALTER TABLE employments ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE employments ADD COLUMN IF NOT EXISTS company_email VARCHAR(255);
ALTER TABLE employments ADD COLUMN IF NOT EXISTS ended_by_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE employments ADD COLUMN IF NOT EXISTS ended_by_admin_id UUID REFERENCES users(id);
ALTER TABLE employments ADD COLUMN IF NOT EXISTS end_reason TEXT;

-- ── 2. Employee feedback: Add is_anonymous + sentiment columns ───────────────
ALTER TABLE employee_feedback ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;
ALTER TABLE employee_feedback ADD COLUMN IF NOT EXISTS ai_sentiment VARCHAR(20);
ALTER TABLE employee_feedback ADD COLUMN IF NOT EXISTS ai_toxicity_score DECIMAL(5,3);

-- ── 3. EOTY: Add missing columns for direct-vote model ──────────────────────
ALTER TABLE eoty_votes ADD COLUMN IF NOT EXISTS candidate_id UUID REFERENCES employees(id);
ALTER TABLE eoty_votes ALTER COLUMN nominee_id DROP NOT NULL;
ALTER TABLE employee_of_year ADD COLUMN IF NOT EXISTS votes_count INTEGER DEFAULT 0;
ALTER TABLE eoty_events ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;

-- ── 4. Job positions: Add missing columns ────────────────────────────────────
ALTER TABLE job_positions ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE job_positions ADD COLUMN IF NOT EXISTS employment_type VARCHAR(30);
ALTER TABLE job_positions ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;

-- ── 5. Job applications: Add missing columns ────────────────────────────────
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- ── 6. Application status enum: add missing values ──────────────────────────
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'interview';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'rejected';

-- ── 7. Revoked company emails: add unique constraint for upsert ─────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'revoked_company_emails_company_id_email_key') THEN
    ALTER TABLE revoked_company_emails ADD CONSTRAINT revoked_company_emails_company_id_email_key UNIQUE (company_id, email);
  END IF;
END $$;

-- ============================================================================
-- END OF MIGRATION V3
-- ============================================================================
