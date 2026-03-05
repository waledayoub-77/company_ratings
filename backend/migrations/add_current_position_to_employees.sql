-- Migration: add current_position to employees
-- Run this in your Supabase SQL editor if the column does not already exist.

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS current_position VARCHAR(255);

-- Verify the column was added:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'employees'
-- ORDER BY ordinal_position;
