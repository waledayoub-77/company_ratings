-- ============================================================================
-- RATEHUB V3 MIGRATION — PART 3
-- Phase 4: Job positions + CV application pipeline
-- ============================================================================

-- ── application_status enum ──────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('pending', 'interview', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── job_positions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_positions (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  department      VARCHAR(100),
  description     TEXT        NOT NULL,
  requirements    TEXT,
  employment_type VARCHAR(30),
  is_active       BOOLEAN     DEFAULT TRUE,
  created_by      UUID        NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  closed_at       TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_job_positions_company_id ON job_positions(company_id)
  WHERE deleted_at IS NULL AND is_active = TRUE;

-- ── job_applications ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_applications (
  id          UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  position_id UUID              NOT NULL REFERENCES job_positions(id) ON DELETE CASCADE,
  company_id  UUID              NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  applicant_id UUID             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cv_url      TEXT              NOT NULL,
  cover_letter TEXT,
  status      application_status DEFAULT 'pending',
  admin_note  TEXT,
  reviewed_by UUID              REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ       DEFAULT NOW(),
  updated_at  TIMESTAMPTZ       DEFAULT NOW(),
  UNIQUE(position_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_position    ON job_applications(position_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant   ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_company     ON job_applications(company_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status      ON job_applications(status);
