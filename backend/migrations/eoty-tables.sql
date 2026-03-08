-- ============================================================================
-- EOTY (Employee of the Year) TABLES
-- Run this in Supabase SQL Editor after migration-v2.sql
-- ============================================================================

-- ── 1. EOTY Events Table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eoty_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year >= 2024),
    is_active BOOLEAN DEFAULT TRUE,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, year)
);

CREATE INDEX IF NOT EXISTS idx_eoty_events_company_id ON eoty_events(company_id);
CREATE INDEX IF NOT EXISTS idx_eoty_events_year ON eoty_events(year);
CREATE INDEX IF NOT EXISTS idx_eoty_events_is_active ON eoty_events(is_active);

-- ── 2. EOTY Votes Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eoty_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES eoty_events(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_eoty_votes_event_id ON eoty_votes(event_id);
CREATE INDEX IF NOT EXISTS idx_eoty_votes_candidate_id ON eoty_votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_eoty_votes_voter_id ON eoty_votes(voter_id);

-- ── 3. Employee of Year Winners Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_of_year (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES eoty_events(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    votes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, year)
);

CREATE INDEX IF NOT EXISTS idx_employee_of_year_company_id ON employee_of_year(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_of_year_year ON employee_of_year(year);
CREATE INDEX IF NOT EXISTS idx_employee_of_year_employee_id ON employee_of_year(employee_id);

-- ============================================================================
-- END OF EOTY TABLES CREATION
-- ============================================================================
