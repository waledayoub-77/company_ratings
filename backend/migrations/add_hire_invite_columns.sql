-- ============================================================================
-- Add hire invite columns to job_applications
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nfpeazirwxuwpjryvcny/sql/new
-- ============================================================================

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS hire_invite_sent_at     TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS hire_invite_accepted_at TIMESTAMP WITH TIME ZONE;
