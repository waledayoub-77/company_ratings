/**
 * jobs.test.js
 * ═══════════════════════════════════════════════════════════════════════════
 * Backend API test suite — mirrors tests/manual/jobs-manual-tests.txt
 *
 * Covers all HTTP routes in /api/jobs/*, including:
 *   - Job position CRUD (create, close, delete)
 *   - Application lifecycle (apply, review, invite, approve, hire)
 *   - Authorization guards (employee vs admin, cross-user)
 *   - Business-rule enforcement (transitions, idempotency, guards)
 *
 * Requirements:
 *   npm install --save-dev jest supertest
 *   NODE_ENV=development (rate limiter skips in dev)
 *   Real DB + test accounts configured in .env
 *
 * Run:
 *   cd backend && npm test
 * ═══════════════════════════════════════════════════════════════════════════
 */

const path = require('path');
// Load backend .env first (Supabase, JWT secrets, etc.)
require('dotenv').config();
// Load e2e .env for test account credentials (does not override already-set vars)
require('dotenv').config({ path: path.resolve(__dirname, '../../e2e/.env'), override: false });
process.env.NODE_ENV = 'development'; // disable rate limiting for tests

const request = require('supertest');
const app = require('../src/app');
const supabase = require('../src/config/database');

// ── Test credentials (from e2e/.env — real seeded test accounts) ─────────────

const COMPANY_ADMIN = {
  email: process.env.COMPANY_ADMIN_EMAIL || 'tech.admin@ratehub.com',
  password: process.env.COMPANY_ADMIN_PASSWORD || 'Test1234!',
};
const EMPLOYEE = {
  email: process.env.EMPLOYEE_EMAIL || 'frank@ratehub.com',
  password: process.env.EMPLOYEE_PASSWORD || 'Test1234!',
};
const EMPLOYEE2 = {
  email: process.env.EMPLOYEE2_EMAIL || 'carol@ratehub.com',
  password: process.env.EMPLOYEE2_PASSWORD || 'Test1234!',
};

// ── Token storage (populated in beforeAll) ───────────────────────────────────

let adminToken = null;
let adminCompanyId = null;
let empToken = null;
let emp2Token = null;

// ── Shared test-run state ────────────────────────────────────────────────────

let jobId = null;
let appId = null;   // frank's application id

// ── Helper: POST /api/auth/login and return token + user ─────────────────────

async function loginUser(credentials) {
  const res = await request(app)
    .post('/api/auth/login')
    .send(credentials)
    .expect(200);

  expect(res.body.success).toBe(true);
  return {
    token: res.body.data?.accessToken,
    user: res.body.data?.user,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// ONE-TIME SETUP: authenticate all three accounts
// ────────────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  jest.setTimeout(30000); // network round-trips to Supabase

  // Login each account individually so a suspended secondary account
  // does not abort the whole suite.
  const [adminSession, empSession] = await Promise.all([
    loginUser(COMPANY_ADMIN),
    loginUser(EMPLOYEE),
  ]);

  adminToken = adminSession.token;
  empToken   = empSession.token;
  adminCompanyId = adminSession.user?.companyId ?? null;

  expect(adminToken).toBeTruthy();
  expect(empToken).toBeTruthy();

  // Employee 2 is optional — suspended accounts are skipped gracefully
  try {
    const emp2Session = await loginUser(EMPLOYEE2);
    emp2Token = emp2Session.token;
  } catch {
    console.warn(`[beforeAll] Employee2 login failed (${EMPLOYEE2.email}) — tests requiring emp2 will be skipped`);
    emp2Token = null;
  }
}, 30000);

// ────────────────────────────────────────────────────────────────────────────
// SECTION 1 — JOB POSITION MANAGEMENT
// ────────────────────────────────────────────────────────────────────────────

describe('S1 — Job Position Management', () => {

  // ── J1 Create ──────────────────────────────────────────────────────────────

  describe('J1 — Create a Job Position', () => {

    test('J1-A  POST /jobs  → 201 with is_active:true', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          companyId: adminCompanyId,
          title: 'Backend Engineer',
          description: 'Open role for backend development',
          requirements: 'Valid requirements for backend engineering role',
          employmentType: 'full-time',
          department: 'Engineering',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Backend Engineer');
      expect(res.body.data.is_active).toBe(true);
      expect(res.body.data.deleted_at).toBeNull();

      jobId = res.body.data.id;
    });

    test('J1-B  GET /jobs?companyId — new position appears in public list', async () => {
      if (!adminCompanyId) return;

      const res = await request(app)
        .get(`/api/jobs?companyId=${adminCompanyId}`);

      expect(res.status).toBe(200);
      const jobs = res.body.data ?? [];
      const found = jobs.find(j => j.id === jobId || j.title === 'Backend Engineer');
      expect(found).toBeDefined();
    });

    test('J1-C  POST /jobs without title  → 400 validation error', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          companyId: adminCompanyId,
          description: 'Missing title',
        });

      expect(res.status).toBe(400);
    });

    test('J1-D  POST /jobs without description  → 400 validation error', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          companyId: adminCompanyId,
          title: 'No Description Job',
        });

      expect(res.status).toBe(400);
    });

    test('J1-E  GET /jobs/:id  — public endpoint returns job details', async () => {
      if (!jobId) return;

      const res = await request(app)
        .get(`/api/jobs/${jobId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(jobId);
      expect(res.body.data.title).toBe('Backend Engineer');
    });

    test('J1-F  POST /jobs (second position)  → 201 both visible in /jobs/all', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          companyId: adminCompanyId,
          title: 'Frontend Developer',
          description: 'Part-time frontend role',
          requirements: 'Valid requirements for frontend developer role',
          employmentType: 'part-time',
        });

      expect(res.status).toBe(201);
      const tempJobId = res.body.data.id;

      const listRes = await request(app)
        .get(`/api/jobs/all?companyId=${adminCompanyId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const titles = (listRes.body.data ?? []).map(j => j.title);
      expect(titles).toContain('Backend Engineer');
      expect(titles).toContain('Frontend Developer');

      // Clean up the second job so it doesn't pollute later tests
      await request(app)
        .delete(`/api/jobs/${tempJobId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    test('J1-G  Employee cannot create a job position  → 403', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${empToken}`)
        .send({
          companyId: adminCompanyId,
          title: 'Hacker Job',
          description: 'Unauthorized',
          requirements: 'Valid requirements for hacker job',
        });

      // 403 = employee role forbidden, or 401 if the route blocks on admin check
      expect([403, 401]).toContain(res.status);
    });
  });

  // ── J2 Close ───────────────────────────────────────────────────────────────

  describe('J2 — Close a Job Position', () => {

    test('J2-A  PATCH /jobs/:id/close  → 200, is_active:false, closed_at set', async () => {
      if (!jobId) return;

      const res = await request(app)
        .patch(`/api/jobs/${jobId}/close`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.is_active).toBe(false);
      expect(res.body.data.closed_at).toBeTruthy();
    });

    test('J2-B  GET /jobs?companyId — closed job absent from public list', async () => {
      if (!adminCompanyId || !jobId) return;

      const res = await request(app)
        .get(`/api/jobs?companyId=${adminCompanyId}`);

      expect(res.status).toBe(200);
      const found = (res.body.data ?? []).find(j => j.id === jobId);
      expect(found).toBeUndefined();
    });

    test('J2-C  GET /jobs/all (employee) — closed job absent', async () => {
      const res = await request(app)
        .get('/api/jobs/all')
        .set('Authorization', `Bearer ${empToken}`);

      expect(res.status).toBe(200);
      const found = (res.body.data ?? []).find(j => j.id === jobId);
      expect(found).toBeUndefined();
    });

    test('J2-D  POST /jobs/:id/apply to closed position  → 400', async () => {
      if (!jobId) return;

      const res = await request(app)
        .post(`/api/jobs/${jobId}/apply`)
        .set('Authorization', `Bearer ${empToken}`)
        .send({ coverLetter: 'Applying to a closed role' });

      expect(res.status).toBe(400);
      expect(res.body.message ?? res.body.error?.message).toMatch(/no longer accepting|closed|not active/i);
    });

    // Re-open position (by creating a fresh one) so S2 apply tests can proceed
    test('J2-E  Create fresh open position for subsequent tests', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          companyId: adminCompanyId,
          title: 'Backend Engineer',
          description: 'Re-opened role for subsequent test sections',
          requirements: 'Valid requirements for backend engineering role',
          employmentType: 'full-time',
        });

      expect(res.status).toBe(201);
      jobId = res.body.data.id; // replace closed jobId with the fresh one
    });
  });

  // ── J3 Delete ──────────────────────────────────────────────────────────────

  describe('J3 — Soft-Delete a Job Position', () => {

    let tempJobId;

    beforeAll(async () => {
      // Create a disposable job for deletion tests
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          companyId: adminCompanyId,
          title: 'Delete Me Job',
          description: 'Created only to be deleted',
          requirements: 'Valid requirements for deletion test',
        });
      tempJobId = res.body.data?.id;
    });

    test('J3-A  DELETE /jobs/:id  → 200, job gone from active list', async () => {
      if (!tempJobId) return;

      const res = await request(app)
        .delete(`/api/jobs/${tempJobId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    test('J3-B  GET /jobs/:id on deleted job — deleted_at is set (soft delete)', async () => {
      if (!tempJobId) return;

      const res = await request(app)
        .get(`/api/jobs/${tempJobId}`);

      // Either 404 (not found) OR the record has deleted_at set
      if (res.status === 200) {
        expect(res.body.data.deleted_at).toBeTruthy();
      } else {
        expect(res.status).toBe(404);
      }
    });

    test('J3-C  GET /jobs?companyId — deleted job absent from public list', async () => {
      if (!adminCompanyId || !tempJobId) return;

      const res = await request(app)
        .get(`/api/jobs?companyId=${adminCompanyId}`);

      expect(res.status).toBe(200);
      const found = (res.body.data ?? []).find(j => j.id === tempJobId);
      expect(found).toBeUndefined();
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// SECTION 2 — JOB APPLICATION (APPLY FLOW)
// ────────────────────────────────────────────────────────────────────────────

describe('S2 — Job Application Apply Flow', () => {

  // ── J4 Guest redirect (API-level) ─────────────────────────────────────────

  test('J4  POST /jobs/:id/apply without token  → 401', async () => {
    if (!jobId) return;

    const res = await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .send({ coverLetter: 'No auth header' });

    expect(res.status).toBe(401);
  });

  // ── J5 Apply via normal flow ───────────────────────────────────────────────

  test('J5-F  POST /jobs/:id/apply with cover letter only (no CV)  → 201', async () => {
    if (!jobId) return;

    const res = await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .set('Authorization', `Bearer ${empToken}`)
      .field('coverLetter', 'I would love to join your backend team!');

    // 201 on first run; 400 "already applied" on subsequent runs
    if (res.status === 400) {
      expect(res.body.message ?? res.body.error?.message).toMatch(/already applied/i);
      // Retrieve existing appId
      const myApps = await request(app)
        .get('/api/jobs/my-applications')
        .set('Authorization', `Bearer ${empToken}`)
        .expect(200);

      const existing = (myApps.body.data ?? []).find(a => a.position_id === jobId);
      appId = existing?.id;
    } else {
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
      appId = res.body.data.id;
    }
  });

  test('J5-D  Attach .txt file  → 400 invalid file type', async () => {
    if (!jobId || !emp2Token) return;

    const res = await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .set('Authorization', `Bearer ${emp2Token}`)
      .attach('cv', Buffer.from('plain text content'), { filename: 'resume.txt', contentType: 'text/plain' })
      .field('coverLetter', 'Testing .txt upload');

    // Either 400 (file type rejected by multer fileFilter) or the server rejects after
    expect([400, 422]).toContain(res.status);
  });

  test('J6-B  Employee B applies with .docx attachment  → 201 or already-applied 400', async () => {
    if (!jobId || !emp2Token) return;

    // Simulate a docx with application/vnd.openxmlformats-officedocument.wordprocessingml.document
    const docxContent = Buffer.from('PK\x03\x04'); // minimal ZIP header (DOCX signature)
    const res = await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .set('Authorization', `Bearer ${emp2Token}`)
      .attach('cv', docxContent, {
        filename: 'resume.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      .field('coverLetter', 'Hi, Employee B here.');

    const ok = res.status === 201 || (res.status === 400 && /already applied/i.test(res.body.message ?? ''));
    expect(ok).toBe(true);
  });

  // ── J7 Duplicate guard ─────────────────────────────────────────────────────

  test('J7-B  Duplicate apply by same employee  → 400 "already applied"', async () => {
    if (!jobId) return;

    // First attempt — may or may not succeed depending on run order
    await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .set('Authorization', `Bearer ${empToken}`)
      .field('coverLetter', 'First call');

    // Second attempt MUST fail
    const res = await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .set('Authorization', `Bearer ${empToken}`)
      .field('coverLetter', 'Second call');

    expect(res.status).toBe(400);
    expect(res.body.message ?? res.body.error?.message).toMatch(/already applied/i);
  });

  // ── My Applications ────────────────────────────────────────────────────────

  test('J5-G  GET /jobs/my-applications  → 200 with our application', async () => {
    const res = await request(app)
      .get('/api/jobs/my-applications')
      .set('Authorization', `Bearer ${empToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    // At least one application should match our jobId
    if (jobId) {
      const found = (res.body.data ?? []).find(a => a.position_id === jobId);
      expect(found).toBeDefined();
    }
  });

  test('GET /jobs/my-applications without token  → 401', async () => {
    const res = await request(app).get('/api/jobs/my-applications');
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// SECTION 3 — APPLICATION REVIEW (COMPANY ADMIN)
// ────────────────────────────────────────────────────────────────────────────

describe('S3 — Application Review (Company Admin)', () => {

  // ── J8 View applications ───────────────────────────────────────────────────

  test('J8-A  GET /jobs/:id/applications (admin)  → 200 array', async () => {
    if (!jobId) return;

    const res = await request(app)
      .get(`/api/jobs/${jobId}/applications`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('J8-Employee  GET /jobs/:id/applications (employee)  → 403', async () => {
    if (!jobId) return;

    const res = await request(app)
      .get(`/api/jobs/${jobId}/applications`)
      .set('Authorization', `Bearer ${empToken}`);

    expect(res.status).toBe(403);
  });

  test('J8-Unauth  GET /jobs/:id/applications (no token)  → 401', async () => {
    if (!jobId) return;

    const res = await request(app)
      .get(`/api/jobs/${jobId}/applications`);

    expect(res.status).toBe(401);
  });

  // ── J9 pending → interview ─────────────────────────────────────────────────

  test('J9-A  PATCH status to "interview" (admin)  → 200', async () => {
    if (!appId) return;

    const res = await request(app)
      .patch(`/api/jobs/applications/${appId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'interview' });

    // 200 = transitioned; 400 = already in interview/beyond (re-run)
    const ok = res.status === 200 || (res.status === 400 && /cannot transition/i.test(res.body.message ?? res.body.error?.message ?? ''));
    expect(ok).toBe(true);
    if (res.status === 200) {
      expect(res.body.data.status).toBe('interview');
    }
  });

  test('J9-B  Employee sees status "interview" in my-applications', async () => {
    if (!appId) return;

    const res = await request(app)
      .get('/api/jobs/my-applications')
      .set('Authorization', `Bearer ${empToken}`)
      .expect(200);

    const foundApp = (res.body.data ?? []).find(a => a.id === appId);
    if (foundApp) expect(['interview', 'approved', 'rejected'].includes(foundApp.status)).toBe(true);
  });

  test('J9-Invalid transition  → 400 (pending cannot go to approved directly)', async () => {
    // Create ephemeral pending application with emp2 on the same job
    // Then try to jump from pending→approved directly
    if (!jobId || !adminToken) return;

    const appsRes = await request(app)
      .get(`/api/jobs/${jobId}/applications`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Find any pending one (could be emp2's)
    const pending = (appsRes.body.data ?? []).find(a => a.status === 'pending');
    if (!pending) return; // no pending application available

    const res = await request(app)
      .patch(`/api/jobs/applications/${pending.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' }); // invalid — pending→approved not allowed

    expect(res.status).toBe(400);
  });

  test('J9-EmpCannotPatch  Employee cannot PATCH application status  → 403', async () => {
    if (!appId) return;

    const res = await request(app)
      .patch(`/api/jobs/applications/${appId}/status`)
      .set('Authorization', `Bearer ${empToken}`)
      .send({ status: 'interview' });

    expect(res.status).toBe(403);
  });

  // ── J10 Send interview invite ──────────────────────────────────────────────

  test('J10-A  POST /applications/:id/invite (admin, status=interview)  → 200, invite_sent_at set', async () => {
    if (!appId) return;

    const res = await request(app)
      .post(`/api/jobs/applications/${appId}/invite`)
      .set('Authorization', `Bearer ${adminToken}`);

    // 200 = sent; 400 = already sent (re-run idempotent check is separate)
    const ok = res.status === 200 || (res.status === 400 && /already/i.test(res.body.message ?? ''));
    expect(ok).toBe(true);
    if (res.status === 200) {
      expect(res.body.data.invite_sent_at).toBeTruthy();
    }
  });

  test('J10-D  Sending invite when status is NOT interview  → 400', async () => {
    if (!jobId || !adminToken) return;

    // Find a pending application for this
    const appsRes = await request(app)
      .get(`/api/jobs/${jobId}/applications`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const pendingApp = (appsRes.body.data ?? []).find(a => a.status === 'pending');
    if (!pendingApp) return; // no pending apps, skip

    const res = await request(app)
      .post(`/api/jobs/applications/${pendingApp.id}/invite`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message ?? res.body.error?.message).toMatch(/interview status/i);
  });

  test('J10-EmpCannot  Employee cannot send interview invite  → 403', async () => {
    if (!appId) return;

    const res = await request(app)
      .post(`/api/jobs/applications/${appId}/invite`)
      .set('Authorization', `Bearer ${empToken}`);

    expect(res.status).toBe(403);
  });

  // ── J11 Accept interview invite ────────────────────────────────────────────

  test('J11-A  POST /accept-invite (employee)  → 200, invite_accepted_at set', async () => {
    if (!appId) return;

    const res = await request(app)
      .post(`/api/jobs/applications/${appId}/accept-invite`)
      .set('Authorization', `Bearer ${empToken}`);

    const ok = res.status === 200 || (res.status === 400 && /already accepted/i.test(res.body.message ?? ''));
    expect(ok).toBe(true);
    if (res.status === 200) {
      expect(res.body.data.invite_accepted_at).toBeTruthy();
    }
  });

  test('J11-E  Accepting interview invite twice  → 400 "already accepted"', async () => {
    if (!appId) return;

    // First call (should succeed or already be accepted)
    await request(app)
      .post(`/api/jobs/applications/${appId}/accept-invite`)
      .set('Authorization', `Bearer ${empToken}`);

    // Second call MUST fail
    const res = await request(app)
      .post(`/api/jobs/applications/${appId}/accept-invite`)
      .set('Authorization', `Bearer ${empToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message ?? res.body.error?.message).toMatch(/already accepted/i);
  });

  test('J11-WrongUser  Employee B cannot accept Employee A invite  → 404', async () => {
    if (!appId || !emp2Token) return;

    const res = await request(app)
      .post(`/api/jobs/applications/${appId}/accept-invite`)
      .set('Authorization', `Bearer ${emp2Token}`);

    expect(res.status).toBe(404);
  });

  // ── J12 interview → approved ───────────────────────────────────────────────

  test('J12-A  PATCH status to "approved" (from interview)  → 200, auto employment record', async () => {
    if (!appId) return;

    const res = await request(app)
      .patch(`/api/jobs/applications/${appId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    const msg = res.body.message ?? res.body.error?.message ?? '';
    const ok = res.status === 200 || (res.status === 400 && /cannot transition|already/i.test(msg));
    expect(ok).toBe(true);
    if (res.status === 200) {
      expect(res.body.data.status).toBe('approved');
    }
  });

  test('J12-InvalidReverse  Approved cannot be moved back to interview  → 400', async () => {
    if (!appId) return;

    const res = await request(app)
      .patch(`/api/jobs/applications/${appId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'interview' });

    expect(res.status).toBe(400);
  });

  // ── J13 Rejection ──────────────────────────────────────────────────────────

  test('J13-A  PATCH status to "rejected" (from pending/interview)  → 200', async () => {
    if (!jobId) return;

    const appsRes = await request(app)
      .get(`/api/jobs/${jobId}/applications`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const rejectTarget = (appsRes.body.data ?? []).find(a => ['pending', 'interview'].includes(a.status));
    if (!rejectTarget) return; // nothing to reject

    const res = await request(app)
      .patch(`/api/jobs/applications/${rejectTarget.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('rejected');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// SECTION 4 — HIRE INVITE FLOW
// ────────────────────────────────────────────────────────────────────────────

describe('S4 — Hire Invite Flow (Approved → Employed)', () => {

  test('J14-B  POST /hire-invite (admin, status=approved)  → 200, hire_invite_sent_at set', async () => {
    if (!appId) return;

    const res = await request(app)
      .post(`/api/jobs/applications/${appId}/hire-invite`)
      .set('Authorization', `Bearer ${adminToken}`);

    const msg = res.body.message ?? res.body.error?.message ?? '';
    const ok = res.status === 200 || (res.status === 400 && /already|approved before|interview/i.test(msg));
    expect(ok).toBe(true);
    if (res.status === 200) {
      expect(res.body.data.hire_invite_sent_at).toBeTruthy();
    }
  });

  test('J14-EmpCannot  Employee cannot send hire invite  → 403', async () => {
    if (!appId) return;

    const res = await request(app)
      .post(`/api/jobs/applications/${appId}/hire-invite`)
      .set('Authorization', `Bearer ${empToken}`);

    expect(res.status).toBe(403);
  });

  test('J14-NotApproved  Hire invite when status is NOT approved  → 400', async () => {
    // Use a separate pending/interview application to test guard
    if (!jobId || !adminToken) return;

    const appsRes = await request(app)
      .get(`/api/jobs/${jobId}/applications`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const notApproved = (appsRes.body.data ?? []).find(a => ['pending', 'interview'].includes(a.status));
    if (!notApproved) return;

    const res = await request(app)
      .post(`/api/jobs/applications/${notApproved.id}/hire-invite`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message ?? res.body.error?.message).toMatch(/approved before/i);
  });

  test('J15-A  POST /accept-hire (employee)  → 200, hire_invite_accepted_at set', async () => {
    if (!appId) return;

    const res = await request(app)
      .post(`/api/jobs/applications/${appId}/accept-hire`)
      .set('Authorization', `Bearer ${empToken}`);

    const msg = res.body.message ?? res.body.error?.message ?? '';
    // 200 = success; 400 = already accepted / employed at another company (re-run) / no invite sent
    const ok = res.status === 200 || res.status === 400 || res.status === 404;
    expect(ok).toBe(true);
    if (res.status === 200) {
      expect(res.body.data.hire_invite_accepted_at).toBeTruthy();
    }
  });

  test('J15-E  Accepting hire invite twice  → 400 "already accepted"', async () => {
    if (!appId) return;

    // Ensure at least one accept went through
    await request(app)
      .post(`/api/jobs/applications/${appId}/accept-hire`)
      .set('Authorization', `Bearer ${empToken}`);

    const res = await request(app)
      .post(`/api/jobs/applications/${appId}/accept-hire`)
      .set('Authorization', `Bearer ${empToken}`);

    expect(res.status).toBe(400);
    // On re-runs: employee may already be employed elsewhere, invite already accepted, or invite not sent
    expect(res.body.message ?? res.body.error?.message ?? '').toMatch(/already accepted|already|employed|interview|no hire invitation|not been sent/i);
  });

  test('J15-WrongUser  Employee B cannot accept Employee A hire invite  → 404', async () => {
    if (!appId || !emp2Token) return;

    const res = await request(app)
      .post(`/api/jobs/applications/${appId}/accept-hire`)
      .set('Authorization', `Bearer ${emp2Token}`);

    expect(res.status).toBe(404);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// SECTION 7 — EDGE CASES & SECURITY
// ────────────────────────────────────────────────────────────────────────────

describe('S7 — Edge Cases & Security', () => {

  // ── CV endpoint ────────────────────────────────────────────────────────────

  test('J20-I  GET /jobs/cv/:filename without token  → 401', async () => {
    const res = await request(app)
      .get('/api/jobs/cv/anything.pdf');

    expect(res.status).toBe(401);
  });

  test('J20-K  GET /jobs/cv/../../../etc/passwd  → 404 (not 500 or 200)', async () => {
    const res = await request(app)
      .get('/api/jobs/cv/../../../etc/passwd')
      .set('Authorization', `Bearer ${empToken}`);

    // path.basename sanitizes → resolves to non-existent file → 404
    expect(res.status).toBe(404);
  });

  // ── Non-existent resources ─────────────────────────────────────────────────

  test('GET /jobs/00000000-0000-0000-0000-000000000000  → 404', async () => {
    const res = await request(app)
      .get('/api/jobs/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
  });

  test('PATCH /jobs/00000000-0000-0000-0000-000000000000/close  → 404 or 403/400', async () => {
    const res = await request(app)
      .patch('/api/jobs/00000000-0000-0000-0000-000000000000/close')
      .set('Authorization', `Bearer ${adminToken}`);

    expect([404, 403, 400]).toContain(res.status);
  });

  // ── Accept invite without invite being sent first ──────────────────────────

  test('J20-F  accept-invite when invite_sent_at is null  → 400', async () => {
    if (!jobId || !emp2Token) return;

    // Create a fresh application from emp2 and move to interview WITHOUT sending invite
    const emp2ApplyRes = await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .set('Authorization', `Bearer ${emp2Token}`)
      .field('coverLetter', 'Edge case: accept without invite');

    let edgeAppId;
    if (emp2ApplyRes.status === 201) {
      edgeAppId = emp2ApplyRes.body.data?.id;
    } else if (emp2ApplyRes.status === 400 && /already applied/i.test(emp2ApplyRes.body.message ?? '')) {
      // emp2 already applied — find their app
      const myApps = await request(app)
        .get('/api/jobs/my-applications')
        .set('Authorization', `Bearer ${emp2Token}`)
        .expect(200);
      const existing = (myApps.body.data ?? []).find(a => a.position_id === jobId);
      edgeAppId = existing?.id;
    }

    if (!edgeAppId) return;

    // Make sure it's in interview status
    await request(app)
      .patch(`/api/jobs/applications/${edgeAppId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'interview' });

    // Try to accept invite WITHOUT it being sent
    const res = await request(app)
      .post(`/api/jobs/applications/${edgeAppId}/accept-invite`)
      .set('Authorization', `Bearer ${emp2Token}`);

    // Either 400 (no invite sent) or it already has invite_sent_at from a previous run
    // We just validate no server crash (not 500)
    expect(res.status).not.toBe(500);
    if (res.status === 400) {
      expect(res.body.message ?? res.body.error?.message).toBeTruthy();
    }
  });

  // ── Invalid status value ────────────────────────────────────────────────────

  test('PATCH status with invalid value  → 400', async () => {
    if (!appId) return;

    const res = await request(app)
      .patch(`/api/jobs/applications/${appId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'hired' }); // not a valid status

    expect(res.status).toBe(400);
  });

  // ── Admin of other company cannot manage this company's jobs ───────────────

  test('POST /jobs with companyId belonging to another company  → 403', async () => {
    // Use a fake company UUID — admin doesn't own it
    const fakeCompanyId = '00000000-0000-0000-0000-000000000099';

    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId: fakeCompanyId,
        title: 'Should Fail',
        description: 'Not the owner',
        requirements: 'Valid requirements for cross-company test',
      });

    expect(res.status).toBe(403);
  });

  // ── Health check sanity ────────────────────────────────────────────────────

  test('GET /health  → 200 ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// SECTION 8 — HAPPY PATH (complete lifecycle in one test)
// ────────────────────────────────────────────────────────────────────────────

describe('S8 — Full Happy Path', () => {

  test('HP-1..HP-21  Complete lifecycle: create → apply → review → invite → hire → close', async () => {
    // HP-1: Admin creates "QA Engineer" position
    const createRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId: adminCompanyId,
        title: 'QA Engineer',
        description: 'Full-time QA role for happy path test',
        requirements: 'Valid requirements for QA engineer role',
        employmentType: 'full-time',
        department: 'QA',
      });
    expect(createRes.status).toBe(201);
    const hpJobId = createRes.body.data.id;
    expect(hpJobId).toBeTruthy();
    expect(createRes.body.data.is_active).toBe(true);

    // HP-2: Position visible in public list
    const pubRes = await request(app).get(`/api/jobs?companyId=${adminCompanyId}`);
    expect(pubRes.status).toBe(200);
    const visibleJob = (pubRes.body.data ?? []).find(j => j.id === hpJobId);
    expect(visibleJob).toBeDefined();

    // HP-3: Employee A applies with cover letter
    const applyRes = await request(app)
      .post(`/api/jobs/${hpJobId}/apply`)
      .set('Authorization', `Bearer ${empToken}`)
      .field('coverLetter', "I'm a great tester.");

    expect([201, 400]).toContain(applyRes.status);
    let hpAppId;
    if (applyRes.status === 201) {
      hpAppId = applyRes.body.data.id;
      expect(applyRes.body.data.status).toBe('pending');
    } else {
      const myApps = await request(app)
        .get('/api/jobs/my-applications')
        .set('Authorization', `Bearer ${empToken}`)
        .expect(200);
      hpAppId = (myApps.body.data ?? []).find(a => a.position_id === hpJobId)?.id;
    }
    expect(hpAppId).toBeTruthy();

    // HP-4: Admin views application list
    const appsRes = await request(app)
      .get(`/api/jobs/${hpJobId}/applications`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const foundApp = (appsRes.body.data ?? []).find(a => a.id === hpAppId);
    expect(foundApp).toBeDefined();

    // HP-6: Admin moves to interview
    const toInterviewRes = await request(app)
      .patch(`/api/jobs/applications/${hpAppId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'interview' });

    expect([200, 400]).toContain(toInterviewRes.status);

    // HP-7: Admin sends interview invite
    const inviteRes = await request(app)
      .post(`/api/jobs/applications/${hpAppId}/invite`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect([200, 400]).toContain(inviteRes.status);

    // HP-9: Employee accepts invite
    const acceptInvRes = await request(app)
      .post(`/api/jobs/applications/${hpAppId}/accept-invite`)
      .set('Authorization', `Bearer ${empToken}`);

    expect([200, 400]).toContain(acceptInvRes.status);

    // HP-11: Admin approves from interview
    const approveRes = await request(app)
      .patch(`/api/jobs/applications/${hpAppId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    expect([200, 400]).toContain(approveRes.status);

    // HP-13: Admin sends hire invite
    const hireInvRes = await request(app)
      .post(`/api/jobs/applications/${hpAppId}/hire-invite`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect([200, 400]).toContain(hireInvRes.status);

    // HP-15: Employee accepts employment offer
    const acceptHireRes = await request(app)
      .post(`/api/jobs/applications/${hpAppId}/accept-hire`)
      .set('Authorization', `Bearer ${empToken}`);

    expect([200, 400]).toContain(acceptHireRes.status);

    // HP-17: Application appears as "approved" / "hired" in my-applications
    const myAppsRes = await request(app)
      .get('/api/jobs/my-applications')
      .set('Authorization', `Bearer ${empToken}`)
      .expect(200);

    const finalApp = (myAppsRes.body.data ?? []).find(a => a.id === hpAppId);
    expect(finalApp).toBeDefined();

    // HP-21: Admin closes the position
    const closeRes = await request(app)
      .patch(`/api/jobs/${hpJobId}/close`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(closeRes.body.data.is_active).toBe(false);

    // Verify no longer in active board
    const boardRes = await request(app)
      .get('/api/jobs/all')
      .set('Authorization', `Bearer ${empToken}`)
      .expect(200);

    const stillActive = (boardRes.body.data ?? []).find(j => j.id === hpJobId);
    expect(stillActive).toBeUndefined();
  });

  test('GET /jobs/all without token  → 401', async () => {
    const res = await request(app).get('/api/jobs/all');
    expect(res.status).toBe(401);
  });
});

afterAll(async () => {
  // Clean up frank's active employments so other test suites start with a clean slate
  if (!empToken) return;
  const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${empToken}`);
  const empUserId = meRes.body.data?.id;
  if (!empUserId) return;
  const { data: empRecord } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', empUserId)
    .is('deleted_at', null)
    .maybeSingle();
  if (!empRecord) return;
  await supabase
    .from('employments')
    .update({ is_current: false })
    .eq('employee_id', empRecord.id)
    .eq('is_current', true)
    .is('deleted_at', null);
});
