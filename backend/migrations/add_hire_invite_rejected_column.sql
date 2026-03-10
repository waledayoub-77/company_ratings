-- ============================================================================
-- Add hire_invite_rejected_at column to job_applications
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/<your-project>/sql/new
-- ============================================================================

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS hire_invite_rejected_at TIMESTAMP WITH TIME ZONE;
