-- Migration: Allow NULL employee_id in employee_of_month
-- This enables recording "no winner" months in the Hall of Fame
-- Run this in Supabase SQL Editor

-- 1. Drop the existing NOT NULL + FK constraint on employee_id
ALTER TABLE employee_of_month ALTER COLUMN employee_id DROP NOT NULL;

-- 2. Verify: employee_id should now accept NULL
-- SELECT column_name, is_nullable FROM information_schema.columns
-- WHERE table_name = 'employee_of_month' AND column_name = 'employee_id';
