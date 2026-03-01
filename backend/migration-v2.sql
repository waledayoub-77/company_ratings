-- ============================================================================
-- RATEHUB V2 DATABASE MIGRATION
-- ============================================================================
-- Run this AFTER the original database-schema.sql
-- Date: March 1, 2026
-- ============================================================================

-- ============================================================================
-- NEW COLUMNS ON EXISTING TABLES
-- ============================================================================

-- Users: identity verification + avatar
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Companies: document verification + category averages
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_document_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS category_averages JSONB DEFAULT '{}';

-- Reviews: category ratings, departure reason, helpful count, AI moderation
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS departure_reason VARCHAR(30);
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS ai_toxicity_score DECIMAL(3,2);
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS ai_sentiment VARCHAR(20);
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS is_hidden_by_ai BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- TABLE: verification_requests (ID + company doc uploads)
-- ============================================================================

CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_type VARCHAR(20) NOT NULL, -- 'identity' or 'company'
    document_url TEXT NOT NULL,
    document_type VARCHAR(50), -- 'national_id', 'passport', 'drivers_license', 'business_license'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_type ON verification_requests(verification_type);

-- ============================================================================
-- TABLE: category_ratings (per-review multi-category scores)
-- ============================================================================

CREATE TABLE IF NOT EXISTS category_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES company_reviews(id) ON DELETE CASCADE,
    category VARCHAR(30) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    UNIQUE(review_id, category)
);

CREATE INDEX IF NOT EXISTS idx_category_ratings_review_id ON category_ratings(review_id);

-- ============================================================================
-- TABLE: review_replies (company admin responses to reviews)
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES company_reviews(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) BETWEEN 10 AND 2000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id)
);

CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_company_id ON review_replies(company_id);

-- ============================================================================
-- TABLE: review_votes (helpful votes on reviews)
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES company_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);

-- ============================================================================
-- EOTM (Employee of the Month) TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS eotm_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, department, month, year)
);

CREATE TABLE IF NOT EXISTS eotm_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES eotm_events(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, voter_id)
);

CREATE TABLE IF NOT EXISTS employee_of_month (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES eotm_events(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    votes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE: notification_preferences
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    email_employment_updates BOOLEAN DEFAULT TRUE,
    email_review_responses BOOLEAN DEFAULT TRUE,
    email_feedback_received BOOLEAN DEFAULT TRUE,
    email_eotm_events BOOLEAN DEFAULT TRUE,
    email_verification_updates BOOLEAN DEFAULT TRUE,
    email_report_updates BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TRIGGERS for new tables
-- ============================================================================

CREATE TRIGGER update_verification_requests_updated_at BEFORE UPDATE ON verification_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_replies_updated_at BEFORE UPDATE ON review_replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
