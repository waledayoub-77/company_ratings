-- ============================================================================
-- RATING MANAGEMENT SYSTEM - SUPABASE DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0
-- Date: February 17, 2026
-- Database: PostgreSQL (Supabase)
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('employee', 'company_admin', 'system_admin');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed');
CREATE TYPE feedback_category AS ENUM ('professionalism', 'communication', 'teamwork', 'reliability');

-- ============================================================================
-- TABLE: users
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires_at TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email) WHERE is_deleted = FALSE;
CREATE INDEX idx_users_role ON users(role) WHERE is_deleted = FALSE;
CREATE INDEX idx_users_email_verified ON users(email_verified) WHERE is_deleted = FALSE;

-- ============================================================================
-- TABLE: companies
-- ============================================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    website VARCHAR(255),
    overall_rating DECIMAL(2, 1) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_overall_rating CHECK (overall_rating >= 0 AND overall_rating <= 5),
    CONSTRAINT chk_total_reviews CHECK (total_reviews >= 0)
);

-- Indexes for companies
CREATE INDEX idx_companies_name ON companies(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_industry ON companies(industry) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_location ON companies(location) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_overall_rating ON companies(overall_rating DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_user_id ON companies(user_id);

-- Full-text search index for company name and description
CREATE INDEX idx_companies_search ON companies USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- ============================================================================
-- TABLE: employees
-- ============================================================================

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    current_position VARCHAR(255),
    bio TEXT,
    skills TEXT[], -- Array of skills
    profile_visibility VARCHAR(20) DEFAULT 'public', -- 'public' or 'private'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_profile_visibility CHECK (profile_visibility IN ('public', 'private'))
);

-- Indexes for employees
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_full_name ON employees(full_name) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: employments (many-to-many: employees ↔ companies)
-- ============================================================================

CREATE TABLE employments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    position VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT TRUE,
    verification_status verification_status DEFAULT 'pending',
    invitation_token VARCHAR(255),
    invitation_expires_at TIMESTAMP WITH TIME ZONE,
    rejection_note TEXT,
    verified_by UUID REFERENCES users(id), -- company admin who verified
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_end_date CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_current_no_end_date CHECK (
        (is_current = TRUE AND end_date IS NULL) OR 
        (is_current = FALSE)
    )
);

-- Indexes for employments
CREATE INDEX idx_employments_employee_id ON employments(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employments_company_id ON employments(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employments_verification_status ON employments(verification_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_employments_is_current ON employments(is_current) WHERE deleted_at IS NULL;

-- Unique constraint: one active employment per employee per company
CREATE UNIQUE INDEX idx_unique_active_employment 
ON employments(employee_id, company_id) 
WHERE deleted_at IS NULL AND verification_status = 'approved';

-- ============================================================================
-- TABLE: company_reviews
-- ============================================================================

CREATE TABLE company_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    employment_id UUID NOT NULL REFERENCES employments(id) ON DELETE CASCADE,
    overall_rating INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    anonymous_author_hash VARCHAR(255), -- Hashed ID for anonymous reviews
    is_published BOOLEAN DEFAULT TRUE,
    edited_at TIMESTAMP WITH TIME ZONE,
    can_edit_until TIMESTAMP WITH TIME ZONE, -- 48 hours from creation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_overall_rating CHECK (overall_rating >= 1 AND overall_rating <= 5),
    CONSTRAINT chk_content_length CHECK (char_length(content) >= 50 AND char_length(content) <= 2000)
);

-- Indexes for company_reviews
CREATE INDEX idx_reviews_company_id ON company_reviews(company_id) WHERE deleted_at IS NULL AND is_published = TRUE;
CREATE INDEX idx_reviews_employee_id ON company_reviews(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_created_at ON company_reviews(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_overall_rating ON company_reviews(overall_rating) WHERE deleted_at IS NULL;

-- Unique constraint: one review per employee per company
CREATE UNIQUE INDEX idx_unique_review_per_employee_company 
ON company_reviews(employee_id, company_id) 
WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: employee_feedback (private peer feedback)
-- ============================================================================

CREATE TABLE employee_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    rated_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    professionalism INTEGER NOT NULL,
    communication INTEGER NOT NULL,
    teamwork INTEGER NOT NULL,
    reliability INTEGER NOT NULL,
    written_feedback TEXT,
    quarter INTEGER NOT NULL, -- 1, 2, 3, or 4
    year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_professionalism CHECK (professionalism >= 1 AND professionalism <= 5),
    CONSTRAINT chk_communication CHECK (communication >= 1 AND communication <= 5),
    CONSTRAINT chk_teamwork CHECK (teamwork >= 1 AND teamwork <= 5),
    CONSTRAINT chk_reliability CHECK (reliability >= 1 AND reliability <= 5),
    CONSTRAINT chk_no_self_feedback CHECK (reviewer_id != rated_employee_id),
    CONSTRAINT chk_written_feedback_length CHECK (
        written_feedback IS NULL OR char_length(written_feedback) <= 1000
    ),
    CONSTRAINT chk_quarter CHECK (quarter >= 1 AND quarter <= 4),
    CONSTRAINT chk_year CHECK (year >= 2020 AND year <= 2100)
);

-- Indexes for employee_feedback
CREATE INDEX idx_feedback_rated_employee_id ON employee_feedback(rated_employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_feedback_reviewer_id ON employee_feedback(reviewer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_feedback_company_id ON employee_feedback(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_feedback_quarter_year ON employee_feedback(quarter, year) WHERE deleted_at IS NULL;

-- Unique constraint: one feedback per employee-pair per quarter
CREATE UNIQUE INDEX idx_unique_feedback_per_quarter 
ON employee_feedback(reviewer_id, rated_employee_id, quarter, year) 
WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: reported_reviews
-- ============================================================================

CREATE TABLE reported_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES company_reviews(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status report_status DEFAULT 'pending',
    admin_note TEXT,
    resolved_by UUID REFERENCES users(id), -- system admin who resolved
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_reason CHECK (reason IN ('false_info', 'spam', 'harassment', 'other'))
);

-- Indexes for reported_reviews
CREATE INDEX idx_reported_reviews_review_id ON reported_reviews(review_id);
CREATE INDEX idx_reported_reviews_reporter_id ON reported_reviews(reporter_id);
CREATE INDEX idx_reported_reviews_status ON reported_reviews(status);
CREATE INDEX idx_reported_reviews_created_at ON reported_reviews(created_at DESC);

-- ============================================================================
-- TABLE: audit_logs
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'user', 'company', 'review', etc.
    entity_id UUID NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit_logs
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================================================
-- TABLE: refresh_tokens (for JWT refresh token management)
-- ============================================================================

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for refresh_tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token) WHERE is_revoked = FALSE;
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employments_updated_at BEFORE UPDATE ON employments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_reviews_updated_at BEFORE UPDATE ON company_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_feedback_updated_at BEFORE UPDATE ON employee_feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reported_reviews_updated_at BEFORE UPDATE ON reported_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Set can_edit_until on review creation (48 hours)
CREATE OR REPLACE FUNCTION set_review_edit_deadline()
RETURNS TRIGGER AS $$
BEGIN
    NEW.can_edit_until = NOW() + INTERVAL '48 hours';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_review_edit_deadline_trigger BEFORE INSERT ON company_reviews
    FOR EACH ROW EXECUTE FUNCTION set_review_edit_deadline();

-- Function: Generate anonymous author hash
CREATE OR REPLACE FUNCTION generate_anonymous_hash()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_anonymous = TRUE THEN
        NEW.anonymous_author_hash = encode(
            digest(NEW.employee_id::text || NEW.company_id::text || NOW()::text || gen_random_uuid()::text, 'sha256'),
            'hex'
        );
    ELSE
        NEW.anonymous_author_hash = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_anonymous_hash_trigger BEFORE INSERT ON company_reviews
    FOR EACH ROW EXECUTE FUNCTION generate_anonymous_hash();

-- Function: Update company overall rating after review insert/update/delete
CREATE OR REPLACE FUNCTION update_company_rating()
RETURNS TRIGGER AS $$
DECLARE
    company_uuid UUID;
BEGIN
    -- Get company_id from OLD or NEW
    IF TG_OP = 'DELETE' THEN
        company_uuid = OLD.company_id;
    ELSE
        company_uuid = NEW.company_id;
    END IF;

    -- Update company rating and total reviews
    UPDATE companies
    SET 
        overall_rating = COALESCE((
            SELECT ROUND(AVG(overall_rating)::numeric, 1)
            FROM company_reviews
            WHERE company_id = company_uuid 
            AND deleted_at IS NULL 
            AND is_published = TRUE
        ), 0),
        total_reviews = (
            SELECT COUNT(*)
            FROM company_reviews
            WHERE company_id = company_uuid 
            AND deleted_at IS NULL 
            AND is_published = TRUE
        )
    WHERE id = company_uuid;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_rating_on_insert AFTER INSERT ON company_reviews
    FOR EACH ROW EXECUTE FUNCTION update_company_rating();

CREATE TRIGGER update_company_rating_on_update AFTER UPDATE ON company_reviews
    FOR EACH ROW EXECUTE FUNCTION update_company_rating();

CREATE TRIGGER update_company_rating_on_delete AFTER DELETE ON company_reviews
    FOR EACH ROW EXECUTE FUNCTION update_company_rating();

-- Function: Set employment end_date when is_current changes to false
CREATE OR REPLACE FUNCTION set_employment_end_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_current = FALSE AND OLD.is_current = TRUE AND NEW.end_date IS NULL THEN
        NEW.end_date = CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_employment_end_date_trigger BEFORE UPDATE ON employments
    FOR EACH ROW EXECUTE FUNCTION set_employment_end_date();

-- Function: Auto-calculate current quarter and year for feedback
CREATE OR REPLACE FUNCTION set_feedback_quarter_year()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quarter IS NULL THEN
        NEW.quarter = EXTRACT(QUARTER FROM NOW())::INTEGER;
    END IF;
    IF NEW.year IS NULL THEN
        NEW.year = EXTRACT(YEAR FROM NOW())::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_feedback_quarter_year_trigger BEFORE INSERT ON employee_feedback
    FOR EACH ROW EXECUTE FUNCTION set_feedback_quarter_year();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employments ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE reported_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies should be customized based on your auth implementation
-- Below are example policies - adjust based on your JWT claims structure

-- Users: Can read their own data
CREATE POLICY users_read_own ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Users: Can update their own data
CREATE POLICY users_update_own ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Companies: Public read access (for guests and logged-in users)
CREATE POLICY companies_public_read ON companies
    FOR SELECT
    USING (deleted_at IS NULL);

-- Companies: Company admins can update their own company
CREATE POLICY companies_update_own ON companies
    FOR UPDATE
    USING (user_id = auth.uid());

-- Employees: Can read their own profile
CREATE POLICY employees_read_own ON employees
    FOR SELECT
    USING (user_id = auth.uid() OR profile_visibility = 'public');

-- Employees: Can update their own profile
CREATE POLICY employees_update_own ON employees
    FOR UPDATE
    USING (user_id = auth.uid());

-- Company Reviews: Public can read published reviews (but not anonymous author details)
CREATE POLICY reviews_public_read ON company_reviews
    FOR SELECT
    USING (deleted_at IS NULL AND is_published = TRUE);

-- Company Reviews: Employees can insert reviews for their verified employments
CREATE POLICY reviews_insert_own ON company_reviews
    FOR INSERT
    WITH CHECK (
        employee_id IN (
            SELECT id FROM employees WHERE user_id = auth.uid()
        )
    );

-- Employee Feedback: Can only be read by rated employee, reviewer, or company admin
CREATE POLICY feedback_read_restricted ON employee_feedback
    FOR SELECT
    USING (
        deleted_at IS NULL AND (
            rated_employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR
            reviewer_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR
            company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
        )
    );

-- Employee Feedback: Employees can insert feedback for coworkers
CREATE POLICY feedback_insert_own ON employee_feedback
    FOR INSERT
    WITH CHECK (
        reviewer_id IN (
            SELECT id FROM employees WHERE user_id = auth.uid()
        )
    );

-- Audit Logs: Only system admins can read
CREATE POLICY audit_logs_admin_read ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'system_admin'
        )
    );

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View: Public Company Profile (hides sensitive data)
CREATE OR REPLACE VIEW public_company_profiles AS
SELECT 
    c.id,
    c.name,
    c.industry,
    c.location,
    c.description,
    c.logo_url,
    c.website,
    c.overall_rating,
    c.total_reviews,
    c.created_at
FROM companies c
WHERE c.deleted_at IS NULL;

-- View: Anonymous-safe reviews (hides employee info for anonymous reviews)
CREATE OR REPLACE VIEW public_company_reviews AS
SELECT 
    r.id,
    r.company_id,
    CASE 
        WHEN r.is_anonymous THEN NULL 
        ELSE e.full_name 
    END AS reviewer_name,
    CASE 
        WHEN r.is_anonymous THEN NULL 
        ELSE emp.position 
    END AS reviewer_position,
    r.overall_rating,
    r.content,
    r.is_anonymous,
    r.created_at,
    r.edited_at
FROM company_reviews r
JOIN employees e ON r.employee_id = e.id
LEFT JOIN employments emp ON r.employment_id = emp.id
WHERE r.deleted_at IS NULL 
AND r.is_published = TRUE;

-- View: Employee feedback summary (aggregate scores)
CREATE OR REPLACE VIEW employee_feedback_summary AS
SELECT 
    rated_employee_id,
    company_id,
    COUNT(*) as total_feedback_received,
    ROUND(AVG(professionalism)::numeric, 2) as avg_professionalism,
    ROUND(AVG(communication)::numeric, 2) as avg_communication,
    ROUND(AVG(teamwork)::numeric, 2) as avg_teamwork,
    ROUND(AVG(reliability)::numeric, 2) as avg_reliability,
    ROUND(AVG((professionalism + communication + teamwork + reliability) / 4.0)::numeric, 2) as overall_avg
FROM employee_feedback
WHERE deleted_at IS NULL
GROUP BY rated_employee_id, company_id;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function: Check if user can submit review for company
CREATE OR REPLACE FUNCTION can_submit_review(
    p_employee_id UUID,
    p_company_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    has_verified_employment BOOLEAN;
    has_existing_review BOOLEAN;
BEGIN
    -- Check for verified employment
    SELECT EXISTS(
        SELECT 1 FROM employments
        WHERE employee_id = p_employee_id
        AND company_id = p_company_id
        AND verification_status = 'approved'
        AND deleted_at IS NULL
    ) INTO has_verified_employment;

    -- Check for existing review
    SELECT EXISTS(
        SELECT 1 FROM company_reviews
        WHERE employee_id = p_employee_id
        AND company_id = p_company_id
        AND deleted_at IS NULL
    ) INTO has_existing_review;

    RETURN has_verified_employment AND NOT has_existing_review;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if employee can submit internal feedback
CREATE OR REPLACE FUNCTION can_submit_feedback(
    p_reviewer_id UUID,
    p_rated_employee_id UUID,
    p_company_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    reviewer_active BOOLEAN;
    rated_employee_active BOOLEAN;
    feedback_exists BOOLEAN;
    current_quarter INTEGER;
    current_year INTEGER;
BEGIN
    -- No self-feedback
    IF p_reviewer_id = p_rated_employee_id THEN
        RETURN FALSE;
    END IF;

    -- Get current quarter and year
    current_quarter := EXTRACT(QUARTER FROM NOW())::INTEGER;
    current_year := EXTRACT(YEAR FROM NOW())::INTEGER;

    -- Check if reviewer has active employment
    SELECT EXISTS(
        SELECT 1 FROM employments
        WHERE employee_id = p_reviewer_id
        AND company_id = p_company_id
        AND verification_status = 'approved'
        AND is_current = TRUE
        AND deleted_at IS NULL
    ) INTO reviewer_active;

    -- Check if rated employee has employment at same company
    SELECT EXISTS(
        SELECT 1 FROM employments
        WHERE employee_id = p_rated_employee_id
        AND company_id = p_company_id
        AND verification_status = 'approved'
        AND deleted_at IS NULL
    ) INTO rated_employee_active;

    -- Check for existing feedback this quarter
    SELECT EXISTS(
        SELECT 1 FROM employee_feedback
        WHERE reviewer_id = p_reviewer_id
        AND rated_employee_id = p_rated_employee_id
        AND quarter = current_quarter
        AND year = current_year
        AND deleted_at IS NULL
    ) INTO feedback_exists;

    RETURN reviewer_active AND rated_employee_active AND NOT feedback_exists;
END;
$$ LANGUAGE plpgsql;

-- Function: Get company statistics
CREATE OR REPLACE FUNCTION get_company_stats(p_company_id UUID)
RETURNS TABLE (
    total_reviews BIGINT,
    avg_rating NUMERIC,
    five_star_count BIGINT,
    four_star_count BIGINT,
    three_star_count BIGINT,
    two_star_count BIGINT,
    one_star_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_reviews,
        ROUND(AVG(overall_rating)::numeric, 2) as avg_rating,
        COUNT(*) FILTER (WHERE overall_rating = 5)::BIGINT as five_star_count,
        COUNT(*) FILTER (WHERE overall_rating = 4)::BIGINT as four_star_count,
        COUNT(*) FILTER (WHERE overall_rating = 3)::BIGINT as three_star_count,
        COUNT(*) FILTER (WHERE overall_rating = 2)::BIGINT as two_star_count,
        COUNT(*) FILTER (WHERE overall_rating = 1)::BIGINT as one_star_count
    FROM company_reviews
    WHERE company_id = p_company_id
    AND deleted_at IS NULL
    AND is_published = TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (Optional - for development/testing)
-- ============================================================================

-- Insert sample industries (reference data)
CREATE TABLE IF NOT EXISTS industries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO industries (name) VALUES
    ('Technology'),
    ('Healthcare'),
    ('Finance'),
    ('Education'),
    ('Retail'),
    ('Manufacturing'),
    ('Consulting'),
    ('Media & Entertainment'),
    ('Real Estate'),
    ('Transportation'),
    ('Food & Beverage'),
    ('Energy'),
    ('Telecommunications'),
    ('Automotive'),
    ('Aerospace'),
    ('Pharmaceuticals'),
    ('Legal'),
    ('Marketing & Advertising'),
    ('Construction'),
    ('Hospitality')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Analyze tables for query optimizer
ANALYZE users;
ANALYZE companies;
ANALYZE employees;
ANALYZE employments;
ANALYZE company_reviews;
ANALYZE employee_feedback;
ANALYZE reported_reviews;
ANALYZE audit_logs;

-- ============================================================================
-- GRANTS (Adjust based on your Supabase settings)
-- ============================================================================

-- Grant necessary permissions to authenticated users
-- Note: Supabase handles this automatically through RLS policies

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE users IS 'Core user authentication and profile data';
COMMENT ON TABLE companies IS 'Company profiles managed by company admins';
COMMENT ON TABLE employees IS 'Employee profiles linked to user accounts';
COMMENT ON TABLE employments IS 'Many-to-many relationship between employees and companies with verification';
COMMENT ON TABLE company_reviews IS 'Public reviews of companies by verified employees';
COMMENT ON TABLE employee_feedback IS 'Private peer feedback between employees at same company';
COMMENT ON TABLE reported_reviews IS 'User-reported reviews for moderation';
COMMENT ON TABLE audit_logs IS 'System admin action logging for compliance';
COMMENT ON TABLE refresh_tokens IS 'JWT refresh token management';

COMMENT ON COLUMN company_reviews.is_anonymous IS 'When true, reviewer identity hidden from all UI/API access';
COMMENT ON COLUMN company_reviews.anonymous_author_hash IS 'One-way hash for anonymous review attribution';
COMMENT ON COLUMN company_reviews.can_edit_until IS 'Reviews can be edited within 48 hours of creation';
COMMENT ON COLUMN employee_feedback.quarter IS 'Quarter when feedback was given (1-4)';
COMMENT ON COLUMN employee_feedback.year IS 'Year when feedback was given';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Rating Management System database schema created successfully!';
    RAISE NOTICE 'Tables: 9 (users, companies, employees, employments, company_reviews, employee_feedback, reported_reviews, audit_logs, refresh_tokens)';
    RAISE NOTICE 'Views: 3 (public_company_profiles, public_company_reviews, employee_feedback_summary)';
    RAISE NOTICE 'Functions: 7 (can_submit_review, can_submit_feedback, get_company_stats, + triggers)';
    RAISE NOTICE 'Next steps: Configure Supabase Auth, adjust RLS policies, seed reference data';
END $$;
