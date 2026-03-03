-- Migration: Add departure_reason to public_company_reviews view
-- Run this in Supabase SQL Editor

CREATE OR REPLACE VIEW public_company_reviews AS
SELECT 
    r.id,
    r.company_id,
    CASE 
        WHEN r.is_anonymous THEN NULL
        WHEN u.is_deleted = TRUE THEN 'Deleted User'
        ELSE e.full_name 
    END AS reviewer_name,
    CASE 
        WHEN r.is_anonymous THEN NULL
        WHEN u.is_deleted = TRUE THEN NULL
        ELSE emp.position 
    END AS reviewer_position,
    r.overall_rating,
    r.content,
    r.is_anonymous,
    r.departure_reason,
    r.created_at,
    r.edited_at
FROM company_reviews r
JOIN employees e ON r.employee_id = e.id
JOIN users u ON e.user_id = u.id
LEFT JOIN employments emp ON r.employment_id = emp.id
WHERE r.deleted_at IS NULL 
AND r.is_published = TRUE;
