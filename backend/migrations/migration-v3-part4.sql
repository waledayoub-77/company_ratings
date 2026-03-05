-- ============================================================================
-- RATEHUB V3 MIGRATION — PART 4
-- Phase 5: Employee of the Year tables
-- ============================================================================

-- ── eoty_events ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eoty_events (
  id         UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID    NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  year       INTEGER NOT NULL CHECK (year >= 2024),
  is_active  BOOLEAN DEFAULT TRUE,
  created_by UUID    NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at  TIMESTAMPTZ,
  UNIQUE(company_id, year)
);

-- ── eoty_nominees ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eoty_nominees (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES eoty_events(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  nominated_by UUID NOT NULL REFERENCES users(id),
  UNIQUE(event_id, employee_id)
);

-- ── eoty_votes ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eoty_votes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id     UUID NOT NULL REFERENCES eoty_events(id) ON DELETE CASCADE,
  voter_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, voter_id)
);

-- ── employee_of_year ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_of_year (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID    REFERENCES eoty_events(id),
  company_id  UUID    NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID    REFERENCES employees(id),
  year        INTEGER NOT NULL,
  votes_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, year)
);

CREATE INDEX IF NOT EXISTS idx_eoty_events_company   ON eoty_events(company_id);
CREATE INDEX IF NOT EXISTS idx_eoty_votes_event      ON eoty_votes(event_id);
CREATE INDEX IF NOT EXISTS idx_eoty_nominees_event   ON eoty_nominees(event_id);
CREATE INDEX IF NOT EXISTS idx_eoy_company           ON employee_of_year(company_id);
