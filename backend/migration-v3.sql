-- RateHub V3 Migration: Features 1-14
-- Apply this migration to Supabase to support all new features

-- ============================================================================
-- Feature 3: Country/City Filters on Companies
-- ============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS country VARCHAR(100);
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS city VARCHAR(100);
  END IF;
END $$;

-- ============================================================================
-- Feature 4: Revoked Company Emails (Email Lock/Revocation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS revoked_company_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  reason TEXT,
  revoked_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, email)
);

CREATE INDEX IF NOT EXISTS idx_revoked_company_emails_company_id ON revoked_company_emails(company_id);
CREATE INDEX IF NOT EXISTS idx_revoked_company_emails_email ON revoked_company_emails(email);

-- ============================================================================
-- Feature 5: Job Positions and Applications Pipeline
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('open', 'closed', 'filled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('submitted', 'reviewing', 'shortlisted', 'rejected', 'accepted', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS job_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requirements TEXT,
  status job_status DEFAULT 'open',
  salary_min INTEGER,
  salary_max INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_positions_company_id ON job_positions(company_id);
CREATE INDEX IF NOT EXISTS idx_job_positions_status ON job_positions(status);

-- Add is_active column if it doesn't exist (for existing tables)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_positions') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_positions' AND column_name = 'is_active') THEN
      ALTER TABLE job_positions ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID NOT NULL REFERENCES job_positions(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  resume_url TEXT,
  cover_letter TEXT,
  status application_status DEFAULT 'submitted',
  applied_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(position_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_position_id ON job_applications(position_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_company_id ON job_applications(company_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

-- ============================================================================
-- Feature 6 & 8: EOTM (Employee of the Month) - Current Month Only, Hide Vote Counts
-- ============================================================================

-- Drop NOT NULL constraint on employee_of_month.employee_id to allow closed events with no votes
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_of_month') THEN
    ALTER TABLE employee_of_month ALTER COLUMN employee_id DROP NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- Feature 7: EOTY (Employee of the Year) Voting System
-- ============================================================================
CREATE TABLE IF NOT EXISTS eoty_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, year)
);

CREATE INDEX IF NOT EXISTS idx_eoty_events_company_id ON eoty_events(company_id);
CREATE INDEX IF NOT EXISTS idx_eoty_events_year ON eoty_events(year);

CREATE TABLE IF NOT EXISTS eoty_nominees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES eoty_events(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  nominated_by UUID NOT NULL REFERENCES users(id),
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_eoty_nominees_event_id ON eoty_nominees(event_id);
CREATE INDEX IF NOT EXISTS idx_eoty_nominees_employee_id ON eoty_nominees(employee_id);

CREATE TABLE IF NOT EXISTS eoty_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES eoty_events(id) ON DELETE CASCADE,
  nominee_id UUID NOT NULL REFERENCES eoty_nominees(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_eoty_votes_event_id ON eoty_votes(event_id);
CREATE INDEX IF NOT EXISTS idx_eoty_votes_nominee_id ON eoty_votes(nominee_id);
CREATE INDEX IF NOT EXISTS idx_eoty_votes_voter_id ON eoty_votes(voter_id);

CREATE TABLE IF NOT EXISTS employee_of_year (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  event_id UUID NOT NULL REFERENCES eoty_events(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, year)
);

CREATE INDEX IF NOT EXISTS idx_employee_of_year_company_id ON employee_of_year(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_of_year_employee_id ON employee_of_year(employee_id);

-- ============================================================================
-- Feature 11: Anonymous Feedback
-- ============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedback') THEN
    ALTER TABLE feedback ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ============================================================================
-- Feature 13: Sentiment Analysis on Feedback and Reviews
-- ============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedback') THEN
    ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ai_sentiment VARCHAR(50);
    ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ai_toxicity_score DECIMAL(3, 2);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ai_sentiment VARCHAR(50);
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ai_toxicity_score DECIMAL(3, 2);
  END IF;
END $$;

-- ============================================================================
-- Feature 14: Entity-Based Notification Deep Links
-- ============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100);
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_id UUID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_entity_type ON notifications(entity_type);
CREATE INDEX IF NOT EXISTS idx_notifications_entity_id ON notifications(entity_id);
