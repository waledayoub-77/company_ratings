-- Migration: Add salary column to job_positions
-- Run in Supabase SQL editor

ALTER TABLE job_positions
ADD COLUMN IF NOT EXISTS salary VARCHAR(100);
