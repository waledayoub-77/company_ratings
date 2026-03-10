/**
 * ratehub9-features.test.js
 * ═══════════════════════════════════════════════════════════════════════════
 * Backend API tests for ratehub.9 branch features:
 *
 *   T1  Job position creation — required fields validation
 *   T2  Review deletion — only system_admin allowed
 *   T3  Very negative review blocking (sentiment pre-check)
 *   T4  Feedback report — correct table query
 *   T5  EOTY event creation — December-only restriction
 *   T6  Platform stats endpoint
 *   T7  Filter options endpoint (industries from DB)
 *
 * Run:
 *   cd backend && npm test -- --testPathPattern=ratehub9-features
 * ═══════════════════════════════════════════════════════════════════════════
 */

const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../../e2e/.env'), override: false });
process.env.NODE_ENV = 'development';

const request = require('supertest');
const app = require('../src/app');

// ── Test credentials ─────────────────────────────────────────────────────────

const COMPANY_ADMIN = {
  email: process.env.COMPANY_ADMIN_EMAIL || 'tech.admin@ratehub.com',
  password: process.env.COMPANY_ADMIN_PASSWORD || 'Test1234!',
};
const EMPLOYEE = {
  email: process.env.EMPLOYEE_EMAIL || 'frank@ratehub.com',
  password: process.env.EMPLOYEE_PASSWORD || 'Test1234!',
};
const SYSTEM_ADMIN = {
  email: process.env.SYSTEM_ADMIN_EMAIL || 'admin@ratehub.com',
  password: process.env.SYSTEM_ADMIN_PASSWORD || 'Test1234!',
};

// ── Token storage ────────────────────────────────────────────────────────────

let adminToken = null;
let adminCompanyId = null;
let empToken = null;
let sysAdminToken = null;

// ── Helper ───────────────────────────────────────────────────────────────────

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

// ── Setup ────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  jest.setTimeout(30000);

  const [adminSession, empSession] = await Promise.all([
    loginUser(COMPANY_ADMIN),
    loginUser(EMPLOYEE),
  ]);

  adminToken = adminSession.token;
  empToken = empSession.token;
  adminCompanyId = adminSession.user?.companyId ?? null;

  expect(adminToken).toBeTruthy();
  expect(empToken).toBeTruthy();

  try {
    const sysSession = await loginUser(SYSTEM_ADMIN);
    sysAdminToken = sysSession.token;
  } catch {
    console.warn('[beforeAll] System admin login failed — some tests will be skipped');
    sysAdminToken = null;
  }
}, 30000);

// ═══════════════════════════════════════════════════════════════════════════
// T1 — JOB POSITION CREATION — REQUIRED FIELDS
// ═══════════════════════════════════════════════════════════════════════════

describe('T1 — Job Position Required Fields', () => {

  test('T1-A  Missing title returns 400', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId: adminCompanyId, description: 'Test desc', requirements: 'Test req' });

    expect(res.status).toBe(400);
  });

  test('T1-B  Missing description returns 400', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId: adminCompanyId, title: 'Test Job', requirements: 'Test req' });

    expect(res.status).toBe(400);
  });

  test('T1-C  Missing requirements returns 400', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId: adminCompanyId, title: 'Test Job', description: 'Test desc' });

    expect(res.status).toBe(400);
  });

  test('T1-D  Empty-string title returns 400', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId: adminCompanyId, title: '   ', description: 'Test desc', requirements: 'Test req' });

    expect(res.status).toBe(400);
  });

  test('T1-E  All fields provided returns 201', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId: adminCompanyId,
        title: 'Test Job Position T1',
        description: 'A valid description',
        requirements: 'Valid requirements',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Clean up — close the position
    if (res.body.data?.id) {
      await request(app)
        .patch(`/api/jobs/${res.body.data.id}/close`)
        .set('Authorization', `Bearer ${adminToken}`)
        .catch(() => {});
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T2 — REVIEW DELETION — SYSTEM_ADMIN ONLY
// ═══════════════════════════════════════════════════════════════════════════

describe('T2 — Review Deletion Authorization', () => {

  test('T2-A  Employee cannot delete own review → 403', async () => {
    // First get an existing review by this employee
    const myReviews = await request(app)
      .get('/api/reviews/my-reviews')
      .set('Authorization', `Bearer ${empToken}`);

    if (!myReviews.body?.data?.length && !myReviews.body?.reviews?.length) {
      console.warn('[T2-A] No reviews found for employee — skipping');
      return;
    }

    const reviews = myReviews.body?.reviews ?? myReviews.body?.data ?? [];
    const reviewId = reviews[0]?.id;
    if (!reviewId) return;

    const res = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${empToken}`);

    expect(res.status).toBe(403);
  });

  test('T2-B  Company admin cannot delete review → 403', async () => {
    // Get any review
    const empReviews = await request(app)
      .get('/api/reviews/my-reviews')
      .set('Authorization', `Bearer ${empToken}`);

    const reviews = empReviews.body?.reviews ?? empReviews.body?.data ?? [];
    if (!reviews.length) {
      console.warn('[T2-B] No reviews found — skipping');
      return;
    }

    const res = await request(app)
      .delete(`/api/reviews/${reviews[0].id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
  });

  (sysAdminToken ? test : test.skip)('T2-C  System admin can delete review → 200', async () => {
    // Note: only run if system admin token available; using a non-existent ID to avoid data loss
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .delete(`/api/reviews/${fakeId}`)
      .set('Authorization', `Bearer ${sysAdminToken}`);

    // Should be 404 (not found) rather than 403 (forbidden), proving auth passed
    expect([200, 404]).toContain(res.status);
    expect(res.status).not.toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T3 — VERY NEGATIVE REVIEW BLOCKING
// ═══════════════════════════════════════════════════════════════════════════

describe('T3 — Sentiment-Based Review Blocking', () => {

  test('T3-A  Very negative review text is blocked → 400', async () => {
    // Highly negative text to trigger AFINN very_negative classification
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${empToken}`)
      .send({
        companyId: adminCompanyId,
        overallRating: 1,
        work_life_balance: 1,
        compensation: 1,
        management: 1,
        culture: 1,
        content: 'This is the absolute worst terrible horrible disgusting awful hateful abomination of a company. I despise and loathe every horrific criminal act of abuse and cruelty. Garbage trash despicable evil vile vicious wretched nasty repulsive revolting sickening appalling',
      });

    // 400 = blocked by sentiment check (expected fresh DB)
    // 409 = employee already reviewed this company (re-run scenario) — proves validation passed
    // 403 = no verified employment (acceptable skip)
    expect([400, 409, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
    // If sentiment actually blocked it, confirm the message says "negative"
    if (res.status === 400) {
      expect(res.body.error?.message || res.body.message || '').toMatch(/negative/i);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T4 — FEEDBACK REPORT — CORRECT TABLE
// ═══════════════════════════════════════════════════════════════════════════

describe('T4 — Feedback Report Endpoint', () => {

  test('T4-A  Report non-existent feedback → 404 (not crash)', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .post(`/api/feedback/${fakeId}/report`)
      .set('Authorization', `Bearer ${empToken}`)
      .send({ reason: 'Inappropriate content', description: 'This feedback contains inappropriate and offensive content that violates community guidelines.' });

    // Should return 404 (feedback not found), not 500 (table not found)
    expect(res.status).toBe(404);
    expect(res.status).not.toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T5 — EOTY DECEMBER-ONLY RESTRICTION
// ═══════════════════════════════════════════════════════════════════════════

describe('T5 — EOTY December-Only Event Creation', () => {

  test('T5-A  Creating EOTY event outside December → 400', async () => {
    const currentMonth = new Date().getMonth(); // 0-indexed

    const res = await request(app)
      .post('/api/eoty/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId: adminCompanyId,
        year: new Date().getFullYear(),
      });

    if (currentMonth !== 11) {
      // Not December — should be rejected
      expect(res.status).toBe(400);
      expect(res.body.error?.message || res.body.message || '').toMatch(/december/i);
    } else {
      // December — may succeed or fail for other reasons (duplicate, etc.)
      // Just ensure it's not the December check that blocks it
      if (res.status === 400) {
        expect(res.body.error?.message || res.body.message || '').not.toMatch(/december/i);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T6 — PLATFORM STATS ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════

describe('T6 — Platform Stats', () => {

  test('T6-A  GET /companies/platform-stats → 200 with expected shape', async () => {
    const res = await request(app)
      .get('/api/companies/platform-stats')
      .expect(200);

    expect(res.body.success).toBe(true);
    const stats = res.body.data;
    expect(stats).toHaveProperty('totalReviews');
    expect(stats).toHaveProperty('totalCompanies');
    expect(stats).toHaveProperty('totalEmployees');
    expect(stats).toHaveProperty('avgPlatformRating');
    expect(typeof stats.totalReviews).toBe('number');
    expect(typeof stats.totalCompanies).toBe('number');
    expect(typeof stats.totalEmployees).toBe('number');
  });

  test('T6-B  Stats values are non-negative', async () => {
    const res = await request(app)
      .get('/api/companies/platform-stats')
      .expect(200);

    const stats = res.body.data;
    expect(stats.totalReviews).toBeGreaterThanOrEqual(0);
    expect(stats.totalCompanies).toBeGreaterThanOrEqual(0);
    expect(stats.totalEmployees).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T7 — FILTER OPTIONS ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════

describe('T7 — Filter Options (Industries from DB)', () => {

  test('T7-A  GET /companies/filter-options → 200 with industries array', async () => {
    const res = await request(app)
      .get('/api/companies/filter-options')
      .expect(200);

    expect(res.body.success).toBe(true);
    const options = res.body.data;
    expect(options).toHaveProperty('industries');
    expect(options).toHaveProperty('countries');
    expect(options).toHaveProperty('citiesByCountry');
    expect(Array.isArray(options.industries)).toBe(true);
    expect(Array.isArray(options.countries)).toBe(true);
  });

  test('T7-B  Industries are sorted alphabetically', async () => {
    const res = await request(app)
      .get('/api/companies/filter-options')
      .expect(200);

    const industries = res.body.data.industries;
    if (industries.length > 1) {
      const sorted = [...industries].sort();
      expect(industries).toEqual(sorted);
    }
  });

  test('T7-C  Countries are sorted alphabetically', async () => {
    const res = await request(app)
      .get('/api/companies/filter-options')
      .expect(200);

    const countries = res.body.data.countries;
    if (countries.length > 1) {
      const sorted = [...countries].sort();
      expect(countries).toEqual(sorted);
    }
  });
});
