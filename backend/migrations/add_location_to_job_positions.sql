-- Migration: Add location column to job_positions
-- Run this in your Supabase SQL editor or via your migration runner.

ALTER TABLE job_positions
  ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Optional: backfill a default or copy from companies.location if desired
-- UPDATE job_positions SET location = companies.location
-- FROM companies WHERE job_positions.company_id = companies.id AND job_positions.location IS NULL;

-- Verify
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'job_positions';
