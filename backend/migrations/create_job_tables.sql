-- ============================================================================
-- CREATE JOB TABLES — Run this FIRST before migration-v3-features.sql
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nfpeazirwxuwpjryvcny/sql/new
-- ============================================================================

-- ── 1. Application status enum ───────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('pending', 'interview', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL; -- already exists, skip
END $$;

-- ── 2. Job positions table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_positions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by       UUID REFERENCES users(id),
  title            VARCHAR(255) NOT NULL,
  department       VARCHAR(100),
  description      TEXT,
  requirements     TEXT,
  employment_type  VARCHAR(30) DEFAULT 'full-time',
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  closed_at        TIMESTAMP WITH TIME ZONE,
  deleted_at       TIMESTAMP WITH TIME ZONE,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 3. Job applications table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id         UUID NOT NULL REFERENCES job_positions(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  applicant_id        UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  resume_url          TEXT,
  cover_letter        TEXT,
  status              application_status NOT NULL DEFAULT 'pending',
  admin_note          TEXT,
  reviewed_by         UUID REFERENCES users(id),
  reviewed_at         TIMESTAMP WITH TIME ZONE,
  invite_sent_at      TIMESTAMP WITH TIME ZONE,
  invite_accepted_at  TIMESTAMP WITH TIME ZONE,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (position_id, applicant_id)
);

-- ── 4. Indexes for common query patterns ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_job_positions_company_id  ON job_positions(company_id);
CREATE INDEX IF NOT EXISTS idx_job_positions_is_active   ON job_positions(is_active);
CREATE INDEX IF NOT EXISTS idx_job_applications_position ON job_applications(position_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_company  ON job_applications(company_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status   ON job_applications(status);

-- ============================================================================
-- END — job_positions and job_applications are now ready.
-- You do NOT need to run add_job_invite_columns.sql separately;
-- invite_sent_at and invite_accepted_at are already included above.
-- ============================================================================
