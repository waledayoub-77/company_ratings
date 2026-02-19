-- ============================================================================
-- DATABASE VERIFICATION QUERIES
-- ============================================================================
-- Run these queries in Supabase SQL Editor to verify deployment
-- ============================================================================

-- 1. Check all tables exist
SELECT 
    'Tables' as category,
    table_name as name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected: 10 tables (users, companies, employees, employments, company_reviews, 
--            employee_feedback, reported_reviews, audit_logs, refresh_tokens, industries)

-- 2. Check all views exist
SELECT 
    'Views' as category,
    table_name as name
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected: 3 views (employee_feedback_summary, public_company_profiles, public_company_reviews)

-- 3. Check functions exist
SELECT 
    'Functions' as category,
    routine_name as name,
    routine_type as type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Expected: 9 functions

-- 4. Check ENUMs created
SELECT 
    'Enums' as category,
    t.typname as name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
GROUP BY t.typname
ORDER BY t.typname;

-- Expected: 4 enums (feedback_category, report_status, user_role, verification_status)

-- 5. Check triggers exist
SELECT 
    'Triggers' as category,
    trigger_name as name,
    event_object_table as table_name
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Expected: Multiple triggers on each table

-- 6. Check indexes (performance optimization)
SELECT 
    'Indexes' as category,
    tablename as table_name,
    indexname as index_name
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 7. Verify industries reference data
SELECT 
    'Reference Data' as category,
    COUNT(*) as industry_count
FROM industries;

-- Expected: 20 industries

-- 8. Check RLS status
SELECT 
    'RLS Status' as category,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- If rls_enabled = true, you need to run disable-rls.sql

-- ============================================================================
-- TEST DATA (Optional - for manual testing)
-- ============================================================================

-- Create a test user
INSERT INTO users (email, password_hash, role, email_verified)
VALUES ('test.user@example.com', '$2a$12$test_hash_will_be_replaced', 'employee', TRUE)
RETURNING id, email, role, created_at;

-- Get the user ID (replace in next query)
-- CREATE test employee
INSERT INTO employees (user_id, full_name, current_position)
VALUES (
    (SELECT id FROM users WHERE email = 'test.user@example.com'),
    'Test User',
    'Software Engineer'
)
RETURNING id, full_name;

-- Verify user and employee created
SELECT 
    u.id as user_id,
    u.email,
    u.role,
    e.id as employee_id,
    e.full_name
FROM users u
LEFT JOIN employees e ON e.user_id = u.id
WHERE u.email = 'test.user@example.com';

-- Clean up test data
DELETE FROM employees WHERE user_id IN (SELECT id FROM users WHERE email = 'test.user@example.com');
DELETE FROM users WHERE email = 'test.user@example.com';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Database verification queries complete';
    RAISE NOTICE '';
    RAISE NOTICE 'If all queries returned expected results, your database is ready!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Run disable-rls.sql if RLS is enabled';
    RAISE NOTICE '  2. Test connection from your backend server';
    RAISE NOTICE '  3. Build auth service (authService.js)';
END $$;
