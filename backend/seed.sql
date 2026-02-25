-- =============================================================
-- SEED FILE  –  RateHub Mock Data
-- All accounts use password: Test1234!
--
-- ROLES:
--   system_admin   → admin@ratehub.com
--   company_admin  → tech.admin@ratehub.com
--                    health.admin@ratehub.com
--                    bright.admin@ratehub.com
--   employee       → alice@ratehub.com  (TechCorp, current)
--                    bob@ratehub.com    (TechCorp, former)
--                    carol@ratehub.com  (HealthPlus, current)
--                    dan@ratehub.com    (HealthPlus, current)
--                    eve@ratehub.com    (BrightFuture, current)
--                    frank@ratehub.com  (TechCorp, current)
--
-- HOW TO RUN:
--   Open https://supabase.com → your project → SQL Editor
--   Paste this entire file and click Run.
-- =============================================================


-- -------------------------------------------------------------
-- 1. CLEAR ALL DATA  (order respects FK deps)
-- -------------------------------------------------------------
TRUNCATE TABLE
  audit_logs,
  reported_reviews,
  employee_feedback,
  company_reviews,
  refresh_tokens,
  email_verification_tokens,
  password_reset_tokens,
  employments,
  employees,
  companies,
  users,
  industries
RESTART IDENTITY CASCADE;


-- -------------------------------------------------------------
-- 2. INDUSTRIES
-- -------------------------------------------------------------
INSERT INTO industries (id, name) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'Technology'),
  ('e1000000-0000-0000-0000-000000000002', 'Healthcare'),
  ('e1000000-0000-0000-0000-000000000003', 'Finance'),
  ('e1000000-0000-0000-0000-000000000004', 'Education'),
  ('e1000000-0000-0000-0000-000000000005', 'Retail'),
  ('e1000000-0000-0000-0000-000000000006', 'Manufacturing'),
  ('e1000000-0000-0000-0000-000000000007', 'Real Estate');


-- -------------------------------------------------------------
-- 3. USERS
-- password_hash = bcrypt("Test1234!", rounds=12)
-- -------------------------------------------------------------
INSERT INTO users (id, email, password_hash, role, email_verified, is_active, is_deleted) VALUES

  -- Admin
  ('a0000000-0000-0000-0000-000000000001',
   'admin@ratehub.com',
   '$2a$12$91PXl.AOhshxD2rzO10WL.s.BKkdwQCdKBLOlyPhOHkpRDeQaOoqa',
   'system_admin', true, true, false),

  -- Company Admins
  ('a0000000-0000-0000-0000-000000000002',
   'tech.admin@ratehub.com',
   '$2a$12$91PXl.AOhshxD2rzO10WL.s.BKkdwQCdKBLOlyPhOHkpRDeQaOoqa',
   'company_admin', true, true, false),

  ('a0000000-0000-0000-0000-000000000003',
   'health.admin@ratehub.com',
   '$2a$12$91PXl.AOhshxD2rzO10WL.s.BKkdwQCdKBLOlyPhOHkpRDeQaOoqa',
   'company_admin', true, true, false),

  ('a0000000-0000-0000-0000-000000000009',
   'bright.admin@ratehub.com',
   '$2a$12$91PXl.AOhshxD2rzO10WL.s.BKkdwQCdKBLOlyPhOHkpRDeQaOoqa',
   'company_admin', true, true, false),

  -- Employees
  ('a0000000-0000-0000-0000-000000000004',
   'alice@ratehub.com',
   '$2a$12$91PXl.AOhshxD2rzO10WL.s.BKkdwQCdKBLOlyPhOHkpRDeQaOoqa',
   'employee', true, true, false),

  ('a0000000-0000-0000-0000-000000000005',
   'bob@ratehub.com',
   '$2a$12$91PXl.AOhshxD2rzO10WL.s.BKkdwQCdKBLOlyPhOHkpRDeQaOoqa',
   'employee', true, true, false),

  ('a0000000-0000-0000-0000-000000000006',
   'carol@ratehub.com',
   '$2a$12$91PXl.AOhshxD2rzO10WL.s.BKkdwQCdKBLOlyPhOHkpRDeQaOoqa',
   'employee', true, true, false),

  ('a0000000-0000-0000-0000-000000000007',
   'dan@ratehub.com',
   '$2a$12$91PXl.AOhshxD2rzO10WL.s.BKkdwQCdKBLOlyPhOHkpRDeQaOoqa',
   'employee', true, true, false),

  ('a0000000-0000-0000-0000-000000000008',
   'eve@ratehub.com',
   '$2a$12$91PXl.AOhshxD2rzO10WL.s.BKkdwQCdKBLOlyPhOHkpRDeQaOoqa',
   'employee', true, true, false),

  ('a0000000-0000-0000-0000-000000000010',
   'frank@ratehub.com',
   '$2a$12$91PXl.AOhshxD2rzO10WL.s.BKkdwQCdKBLOlyPhOHkpRDeQaOoqa',
   'employee', true, true, false);


-- -------------------------------------------------------------
-- 4. COMPANIES
-- user_id = the company_admin who owns it
-- -------------------------------------------------------------
INSERT INTO companies (id, user_id, name, industry, location, description, website, overall_rating, total_reviews, is_verified) VALUES

  ('b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000002',
   'TechCorp',
   'Technology',
   'San Francisco, CA',
   'TechCorp is a leading software company specializing in cloud infrastructure, developer tools, and enterprise SaaS solutions. We believe in work-life balance and fostering innovation at every level.',
   'https://techcorp.example.com',
   4.2, 3, true),

  ('b0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000003',
   'HealthPlus',
   'Healthcare',
   'New York, NY',
   'HealthPlus is a digital health startup on a mission to make quality healthcare accessible to everyone. We build AI-powered diagnostics and telemedicine platforms used by over 500 hospitals.',
   'https://healthplus.example.com',
   3.8, 2, true),

  ('b0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000009',
   'BrightFuture Finance',
   'Finance',
   'Chicago, IL',
   'BrightFuture Finance is a fintech company providing smart investment and personal banking tools. Our platform serves 2M+ customers with AI-driven financial planning and zero-fee trading.',
   'https://brightfuture.example.com',
   4.5, 1, false);


-- -------------------------------------------------------------
-- 5. EMPLOYEES
-- one row per employee user
-- -------------------------------------------------------------
INSERT INTO employees (id, user_id, full_name, current_position, bio, skills, profile_visibility) VALUES

  ('c0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000004',
   'Alice Johnson',
   'Senior Frontend Engineer',
   'Passionate about building accessible, performant web apps. 6 years of React experience.',
   ARRAY['React', 'TypeScript', 'Node.js', 'GraphQL', 'Figma'],
   'public'),

  ('c0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000005',
   'Bob Martinez',
   'Backend Engineer',
   'Loves distributed systems and Postgres query optimization. Former Google intern.',
   ARRAY['Python', 'Go', 'PostgreSQL', 'Kubernetes', 'Redis'],
   'public'),

  ('c0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000006',
   'Carol Williams',
   'Product Manager',
   'Bridging the gap between users and engineering. 4 years in healthtech.',
   ARRAY['Product Strategy', 'Jira', 'SQL', 'Figma', 'A/B Testing'],
   'public'),

  ('c0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000007',
   'Dan Lee',
   'Data Scientist',
   'Building ML models that turn clinical data into actionable insights.',
   ARRAY['Python', 'PyTorch', 'SQL', 'Spark', 'scikit-learn'],
   'public'),

  ('c0000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000008',
   'Eve Chen',
   'Quantitative Analyst',
   'Algorithmic trading and risk modeling with a focus on ML-driven strategies.',
   ARRAY['Python', 'R', 'MATLAB', 'SQL', 'Bloomberg Terminal'],
   'public'),

  ('c0000000-0000-0000-0000-000000000006',
   'a0000000-0000-0000-0000-000000000010',
   'Frank Nguyen',
   'DevOps Engineer',
   'Infrastructure-as-code enthusiast. Terraform, GitHub Actions, and coffee.',
   ARRAY['Terraform', 'AWS', 'Docker', 'GitHub Actions', 'Linux'],
   'public');


-- -------------------------------------------------------------
-- 6. EMPLOYMENTS
-- verification_status: pending | approved | rejected
-- -------------------------------------------------------------
INSERT INTO employments (id, employee_id, company_id, position, department, start_date, end_date, is_current, verification_status) VALUES

  -- Alice @ TechCorp (current, approved)
  ('d0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001',
   'Senior Frontend Engineer', 'Engineering',
   '2022-03-01', NULL, true, 'approved'),

  -- Bob @ TechCorp (former, approved)
  ('d0000000-0000-0000-0000-000000000002',
   'c0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000001',
   'Backend Engineer', 'Engineering',
   '2021-06-01', '2024-01-31', false, 'approved'),

  -- Carol @ HealthPlus (current, approved)
  ('d0000000-0000-0000-0000-000000000003',
   'c0000000-0000-0000-0000-000000000003',
   'b0000000-0000-0000-0000-000000000002',
   'Product Manager', 'Product',
   '2023-01-15', NULL, true, 'approved'),

  -- Dan @ HealthPlus (current, approved)
  ('d0000000-0000-0000-0000-000000000004',
   'c0000000-0000-0000-0000-000000000004',
   'b0000000-0000-0000-0000-000000000002',
   'Data Scientist', 'Data & AI',
   '2022-09-01', NULL, true, 'approved'),

  -- Eve @ BrightFuture (current, approved)
  ('d0000000-0000-0000-0000-000000000005',
   'c0000000-0000-0000-0000-000000000005',
   'b0000000-0000-0000-0000-000000000003',
   'Quantitative Analyst', 'Trading',
   '2023-07-01', NULL, true, 'approved'),

  -- Frank @ TechCorp (current, pending)
  ('d0000000-0000-0000-0000-000000000006',
   'c0000000-0000-0000-0000-000000000006',
   'b0000000-0000-0000-0000-000000000001',
   'DevOps Engineer', 'Infrastructure',
   '2024-02-01', NULL, true, 'pending');


-- -------------------------------------------------------------
-- 7. COMPANY REVIEWS
-- employee_id → employees.id  |  employment_id → employments.id
-- -------------------------------------------------------------
INSERT INTO company_reviews (id, company_id, employee_id, employment_id, overall_rating, content, is_anonymous, is_published) VALUES

  -- Alice reviews TechCorp (5★)
  ('f0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001',
   5,
   'TechCorp is genuinely one of the best places I have worked. The engineering culture is strong, code reviews are taken seriously, and the leadership is transparent about company direction. Remote-first policy is well-implemented. Salary is competitive and the stock options are generous. Highly recommend for any mid-to-senior engineer looking for growth.',
   false, true),

  -- Bob reviews TechCorp (3★)
  ('f0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000002',
   'd0000000-0000-0000-0000-000000000002',
   3,
   'Good company overall with smart colleagues and interesting technical challenges. However, the promotion process is opaque and slow. I spent over two years as a mid-level engineer with no clear path upward. Management tends to overpromise on roadmap and delivery timelines. Work-life balance is decent but crunch before major releases is real.',
   false, true),

  -- Frank reviews TechCorp (4★, anonymous)
  ('f0000000-0000-0000-0000-000000000003',
   'b0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000006',
   'd0000000-0000-0000-0000-000000000006',
   4,
   'Great infrastructure team with real ownership. We run our own k8s clusters and the on-call rotation is fair. The tooling budget is generous — we get to pick our own tools and cloud provider. The only downside is that company-wide communication could be improved; sometimes critical changes land without heads-up.',
   true, true),

  -- Carol reviews HealthPlus (4★)
  ('f0000000-0000-0000-0000-000000000004',
   'b0000000-0000-0000-0000-000000000002',
   'c0000000-0000-0000-0000-000000000003',
   'd0000000-0000-0000-0000-000000000003',
   4,
   'HealthPlus has a clear mission and the team cares deeply about the product. PMs have real authority and honest relationships with engineering. The product-market fit is still being refined which means priorities shift, but the leadership is self-aware about this. Salary is slightly below market but the equity upside is real given the growth trajectory.',
   false, true),

  -- Dan reviews HealthPlus (3★)
  ('f0000000-0000-0000-0000-000000000005',
   'b0000000-0000-0000-0000-000000000002',
   'c0000000-0000-0000-0000-000000000004',
   'd0000000-0000-0000-0000-000000000004',
   3,
   'The data science team is talented but severely under-resourced. We lack proper ML infrastructure — most models are trained on laptops. Management understands the vision but has not invested in the tooling to execute it. Data governance is also a challenge in a healthcare context. Hopeful but would need significant investment to reach its potential.',
   false, true),

  -- Eve reviews BrightFuture (5★)
  ('f0000000-0000-0000-0000-000000000006',
   'b0000000-0000-0000-0000-000000000003',
   'c0000000-0000-0000-0000-000000000005',
   'd0000000-0000-0000-0000-000000000005',
   5,
   'BrightFuture is a dream for quantitative finance professionals. The data pipelines are production-grade, the research process is rigorous, and bonuses are exceptional. Senior leadership has deep domain expertise. The culture rewards intellectual curiosity — weekly research talks are genuinely insightful. Work-life balance is demanding during earnings season but fair the rest of the year.',
   false, true);


-- -------------------------------------------------------------
-- 8. EMPLOYEE FEEDBACK  (internal peer reviews)
-- reviewer_id & rated_employee_id → employees.id
-- one per reviewer per (company, quarter, year, rated_employee)
-- -------------------------------------------------------------
INSERT INTO employee_feedback (id, reviewer_id, rated_employee_id, company_id, professionalism, communication, teamwork, reliability, written_feedback, quarter, year) VALUES

  -- Alice rates Frank (Q1 2025)
  ('70000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000006',
   'b0000000-0000-0000-0000-000000000001',
   5, 4, 5, 5,
   'Frank is an outstanding DevOps engineer. Deploys are always smooth and he communicates infra changes proactively.',
   1, 2025),

  -- Frank rates Alice (Q1 2025)
  ('70000000-0000-0000-0000-000000000002',
   'c0000000-0000-0000-0000-000000000006',
   'c0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001',
   5, 5, 4, 5,
   'Alice consistently delivers high-quality frontend work on time and mentors junior engineers.',
   1, 2025),

  -- Carol rates Dan (Q4 2024)
  ('70000000-0000-0000-0000-000000000003',
   'c0000000-0000-0000-0000-000000000003',
   'c0000000-0000-0000-0000-000000000004',
   'b0000000-0000-0000-0000-000000000002',
   4, 3, 4, 4,
   'Dan produces solid analysis but sometimes the data findings could be communicated more clearly to non-technical stakeholders.',
   4, 2024),

  -- Dan rates Carol (Q4 2024)
  ('70000000-0000-0000-0000-000000000004',
   'c0000000-0000-0000-0000-000000000004',
   'c0000000-0000-0000-0000-000000000003',
   'b0000000-0000-0000-0000-000000000002',
   5, 5, 5, 4,
   'Carol is a fantastic PM. She protects the team from scope creep and always has context on the why behind product decisions.',
   4, 2024);


-- -------------------------------------------------------------
-- 9. REPORTED REVIEWS
-- reporter_id → users.id  (any user can report)
-- -------------------------------------------------------------
INSERT INTO reported_reviews (id, review_id, reporter_id, reason, description, status) VALUES

  -- Bob's review (3★) reported by TechCorp admin as false_info
  ('80000000-0000-0000-0000-000000000001',
   'f0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000002',
   'false_info',
   'The claim about promotion process being opaque is inaccurate. We publish clear promotion rubrics on our internal wiki and conduct bi-annual reviews.',
   'pending'),

  -- Dan's HealthPlus review reported by a user as spam
  ('80000000-0000-0000-0000-000000000002',
   'f0000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000001',
   'spam',
   'This reads like a generic template review copy-pasted from another platform.',
   'pending');


-- -------------------------------------------------------------
-- 10. AUDIT LOGS  (sample admin actions)
-- -------------------------------------------------------------
INSERT INTO audit_logs (id, admin_id, action, entity_type, entity_id, details) VALUES

  ('90000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'VERIFY_COMPANY',
   'company',
   'b0000000-0000-0000-0000-000000000001',
   '{"note": "Verified TechCorp after document review"}'::jsonb),

  ('90000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   'VERIFY_COMPANY',
   'company',
   'b0000000-0000-0000-0000-000000000002',
   '{"note": "Verified HealthPlus after document review"}'::jsonb),

  ('90000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000001',
   'RESOLVE_REPORT',
   'report',
   '80000000-0000-0000-0000-000000000001',
   '{"action": "dismissed", "note": "Review content is within acceptable bounds"}'::jsonb);


-- -------------------------------------------------------------
-- Done! Quick verification:
-- -------------------------------------------------------------
SELECT 'users'        AS tbl, COUNT(*) FROM users
UNION ALL SELECT 'companies',     COUNT(*) FROM companies
UNION ALL SELECT 'employees',     COUNT(*) FROM employees
UNION ALL SELECT 'employments',   COUNT(*) FROM employments
UNION ALL SELECT 'company_reviews', COUNT(*) FROM company_reviews
UNION ALL SELECT 'employee_feedback', COUNT(*) FROM employee_feedback
UNION ALL SELECT 'reported_reviews', COUNT(*) FROM reported_reviews
UNION ALL SELECT 'industries',    COUNT(*) FROM industries
UNION ALL SELECT 'audit_logs',    COUNT(*) FROM audit_logs
ORDER BY tbl;
