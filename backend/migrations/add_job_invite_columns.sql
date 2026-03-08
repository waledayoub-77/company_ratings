-- Migration: add interview invitation tracking columns to job_applications
-- Run this migration to enable the invite feature

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invite_accepted_at TIMESTAMPTZ;
