-- ============================================================================
-- RATEHUB V3 MIGRATION — PART 2
-- Phase 2+3: Country/city filters, employment invite flow, end-by-admin,
--            company email lock
-- ============================================================================

-- ── companies: country / city split ──────────────────────────────────────────
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS city    VARCHAR(100) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_companies_city    ON companies(city)    WHERE deleted_at IS NULL;

-- ── employments: invite flow columns ─────────────────────────────────────────
-- invitation_token + invitation_expires_at already exist in the schema;
-- add invite_email and source
ALTER TABLE employments
  ADD COLUMN IF NOT EXISTS source       VARCHAR(20)  DEFAULT 'request',
  ADD COLUMN IF NOT EXISTS invite_email VARCHAR(255) DEFAULT NULL;

-- ── employments: admin-end columns ───────────────────────────────────────────
ALTER TABLE employments
  ADD COLUMN IF NOT EXISTS ended_by_admin    BOOLEAN  DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ended_by_admin_id UUID     REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS end_reason        TEXT     DEFAULT NULL;

-- ── employments: company-issued email (for lock feature) ─────────────────────
ALTER TABLE employments
  ADD COLUMN IF NOT EXISTS company_email VARCHAR(255) DEFAULT NULL;

-- ── revoked_company_emails: prevent cycling back into a company ───────────────
CREATE TABLE IF NOT EXISTS revoked_company_emails (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_email VARCHAR(255) NOT NULL,
  employee_id   UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  ended_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, company_email)
);

CREATE INDEX IF NOT EXISTS idx_revoked_emails_company ON revoked_company_emails(company_id);
