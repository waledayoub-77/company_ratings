-- Add is_verified column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;