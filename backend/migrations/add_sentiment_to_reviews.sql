-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add sentiment analysis columns to company_reviews
-- Branch: ratehub.4
-- Purpose: Store AI sentiment label, score, and auto-flag status per review
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Add sentiment columns to company_reviews
ALTER TABLE company_reviews
  ADD COLUMN IF NOT EXISTS sentiment          VARCHAR(20)  DEFAULT 'neutral',
  ADD COLUMN IF NOT EXISTS sentiment_score    FLOAT        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS auto_flagged       BOOLEAN      DEFAULT FALSE;

-- 2) Add pending_suspension flag to users
--    When a review is "very negative", the author is flagged for admin review
--    before any real suspension happens.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pending_suspension BOOLEAN DEFAULT FALSE;

-- 3) Allow NULL reporter_id in reported_reviews
--    Auto-generated system reports have no human reporter.
ALTER TABLE reported_reviews
  ALTER COLUMN reporter_id DROP NOT NULL;

-- 4) Add new allowed reason for auto-flagged reports
--    (No SQL enum change needed — the column is VARCHAR, validated in app code)
--    Just a reminder comment:
--    New valid reason added: 'auto_flagged'

-- Indexes for efficient admin queries
CREATE INDEX IF NOT EXISTS idx_reviews_auto_flagged  ON company_reviews (auto_flagged) WHERE auto_flagged = TRUE;
CREATE INDEX IF NOT EXISTS idx_reviews_sentiment     ON company_reviews (sentiment);
CREATE INDEX IF NOT EXISTS idx_users_pending_susp    ON users (pending_suspension) WHERE pending_suspension = TRUE;
