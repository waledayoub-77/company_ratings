-- Add employee-initiated end-request columns to employments
-- Supports the end-request workflow: employee requests end → admin accepts or rejects
ALTER TABLE employments ADD COLUMN IF NOT EXISTS end_requested_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE employments ADD COLUMN IF NOT EXISTS end_request_reason TEXT;
