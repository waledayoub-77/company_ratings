-- ============================================================================
-- RATEHUB V3 MIGRATION — PART 1
-- Phase 1: Quick wins (anonymous feedback, AI on feedback, notification deep links)
-- ============================================================================

-- ── employee_feedback: anonymous toggle ──────────────────────────────────────
ALTER TABLE employee_feedback
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- ── employee_feedback: AI sentiment columns ──────────────────────────────────
ALTER TABLE employee_feedback
  ADD COLUMN IF NOT EXISTS ai_sentiment     VARCHAR(20)    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_toxicity_score DECIMAL(3,2)  DEFAULT NULL;

-- ── notifications: deep-link columns ─────────────────────────────────────────
-- The "link" column may already exist; add entity_type and entity_id
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS link        TEXT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS entity_id   UUID          DEFAULT NULL;

-- ── employee_of_month: allow NULL winner (no-winner close) ───────────────────
ALTER TABLE employee_of_month
  ALTER COLUMN employee_id DROP NOT NULL;
