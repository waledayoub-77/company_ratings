-- ============================================================================
-- DISABLE RLS FOR DEVELOPMENT
-- ============================================================================
-- Run this after deploying the main schema to disable Row Level Security
-- This allows your Express middleware to handle all authorization
-- ============================================================================

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE employments DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE reported_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens DISABLE ROW LEVEL SECURITY;

-- Drop existing policies (they won't work with custom JWT auth anyway)
DROP POLICY IF EXISTS users_read_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS companies_public_read ON companies;
DROP POLICY IF EXISTS companies_update_own ON companies;
DROP POLICY IF EXISTS employees_read_own ON employees;
DROP POLICY IF EXISTS employees_update_own ON employees;
DROP POLICY IF EXISTS reviews_public_read ON company_reviews;
DROP POLICY IF EXISTS reviews_insert_own ON company_reviews;
DROP POLICY IF EXISTS feedback_read_restricted ON employee_feedback;
DROP POLICY IF EXISTS feedback_insert_own ON employee_feedback;
DROP POLICY IF EXISTS audit_logs_admin_read ON audit_logs;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Row Level Security disabled on all tables';
    RAISE NOTICE '✅ All policies dropped';
    RAISE NOTICE '✅ Your Express middleware will handle authorization';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: This is for development only!';
    RAISE NOTICE '   For production, implement proper RLS policies or network restrictions';
END $$;
