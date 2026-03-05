-- Migration: Cascade soft-delete to employees/employments for already-deleted users
-- This backfills deleted_at on employee + employment rows whose user was
-- previously soft-deleted (is_deleted = true) but the cascade was not applied.

-- 1. Set deleted_at on employees whose user is soft-deleted
UPDATE employees e
SET    deleted_at = u.deleted_at
FROM   users u
WHERE  e.user_id   = u.id
  AND  u.is_deleted = true
  AND  e.deleted_at IS NULL;

-- 2. Set deleted_at on employments whose employee is now soft-deleted
UPDATE employments em
SET    deleted_at = e.deleted_at
FROM   employees e
WHERE  em.employee_id = e.id
  AND  e.deleted_at   IS NOT NULL
  AND  em.deleted_at   IS NULL;
