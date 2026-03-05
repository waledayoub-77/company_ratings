-- Migration: add full_name column to users table
-- Run this once in Supabase SQL editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
