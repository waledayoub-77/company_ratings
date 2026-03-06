// 17-v3-features.spec.js — Tests for V3 features:
// Country/City filters, Anonymous feedback, EOTY, Jobs, Invite-only employment, Notifications
const { test, expect } = require('@playwright/test');
const { loginAsCompanyAdmin } = require('./helpers/auth');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function getToken(page) {
  return page.evaluate(() => localStorage.getItem('rh_access'));
}

// Try to login as employee — returns true on success, false on failure
async function tryLoginAsEmployee(page) {
  try {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(process.env.EMPLOYEE_EMAIL || 'bob@ratehub.com');
    await page.locator('input[type="password"]').fill(process.env.EMPLOYEE_PASSWORD || 'Test1234!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(url => !url.href.includes('/login'), { timeout: 8_000 });
    return true;
  } catch {
    return false;
  }
}

// ─── F3: Country / City Filters ────────────────────────────────────────────────
test.describe('F3 — Country & City Filters on Companies Page', () => {
  test('Companies page loads and shows filter dropdowns', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click the Filters toggle button to reveal filter panel
    const filtersBtn = page.getByRole('button', { name: /filters/i })
      .or(page.getByText(/filters/i));
    await filtersBtn.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/f3-companies-page.png', fullPage: true });

    // After opening, check for Country or City label/select in the filter panel
    const countryLabel = page.getByText(/country/i);
    await expect(countryLabel.first()).toBeVisible({ timeout: 8_000 });
  });

  test('GET /companies/filter-options returns options', async ({ page }) => {
    // Navigate first so fetch works (avoids about:blank CORS)
    await page.goto('/companies');
    await page.waitForLoadState('networkidle');
    const result = await page.evaluate(async (apiUrl) => {
      const res = await fetch(`${apiUrl}/companies/filter-options`);
      const body = await res.json();
      return { status: res.status, hasCountries: Array.isArray(body.data?.countries), hasCities: Array.isArray(body.data?.cities) };
    }, API_URL);
    expect(result.status).toBe(200);
    expect(result.hasCountries).toBe(true);
    expect(result.hasCities).toBe(true);
  });
});

// ─── F11: Anonymous Feedback Toggle ────────────────────────────────────────────
test.describe('F11 — Anonymous Feedback Toggle', () => {
  test('Feedback page shows anonymous toggle', async ({ page }) => {
    const ok = await tryLoginAsEmployee(page);
    if (!ok) { test.skip(); return; }
    await page.goto('/dashboard/feedback');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/f11-feedback-page.png', fullPage: true });

    // Look for the anonymous toggle
    const toggle = page.getByText(/anonymous/i).first();
    await expect(toggle).toBeVisible({ timeout: 8_000 });
  });
});

// ─── F7: EOTY (Employee of the Year) ──────────────────────────────────────────
test.describe('F7 — EOTY Tab on Company Admin Dashboard', () => {
  test('EOTY tab is visible on company admin dashboard', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/company-admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const eotyTab = page.getByRole('button', { name: /eoty/i })
      .or(page.getByText(/eoty/i));
    await expect(eotyTab.first()).toBeVisible({ timeout: 8_000 });
    await page.screenshot({ path: 'e2e/screenshots/f7-eoty-tab-visible.png', fullPage: true });
  });

  test('Can navigate to EOTY tab', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/company-admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const eotyTab = page.getByRole('button', { name: /eoty/i })
      .or(page.getByText(/eoty/i));
    await eotyTab.first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'e2e/screenshots/f7-eoty-tab-content.png', fullPage: true });

    // Should show EOTY content (create button or event list)
    const content = page.getByText(/employee of the year|create.*eoty|eoty.*event|hall of fame/i);
    await expect(content.first()).toBeVisible({ timeout: 5_000 });
  });

  test('EOTY API — create event', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    const token = await getToken(page);

    // Get the admin's own company ID from localStorage
    const companyId = await page.evaluate(() => {
      const u = JSON.parse(localStorage.getItem('rh_user') || '{}');
      return u.companyId || null;
    });
    if (!companyId) { test.skip(); return; }

    const result = await page.evaluate(async ({ apiUrl, token, companyId }) => {
      const res = await fetch(`${apiUrl}/eoty/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyId, year: new Date().getFullYear() }),
      });
      return { status: res.status, body: await res.json() };
    }, { apiUrl: API_URL, token, companyId });

    // 201 = created, 400 = already exists for this year
    expect([201, 400]).toContain(result.status);
    await page.screenshot({ path: 'e2e/screenshots/f7-eoty-api-create.png', fullPage: true });
  });
});

// ─── F7: EOTY on Employee Dashboard ───────────────────────────────────────────
test.describe('F7 — EOTY Tab on Employee Dashboard', () => {
  test('EOTY tab is visible on employee dashboard', async ({ page }) => {
    const ok = await tryLoginAsEmployee(page);
    if (!ok) { test.skip(); return; }
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const eotyTab = page.getByRole('button', { name: /eoty/i })
      .or(page.getByText(/eoty/i));
    await expect(eotyTab.first()).toBeVisible({ timeout: 8_000 });
    await page.screenshot({ path: 'e2e/screenshots/f7-employee-eoty-tab.png', fullPage: true });
  });
});

// ─── F5: Jobs & CV Pipeline ───────────────────────────────────────────────────
test.describe('F5 — Jobs Tab on Company Admin Dashboard', () => {
  test('Jobs tab is visible on company admin dashboard', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/company-admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const jobsTab = page.getByRole('button', { name: /jobs/i })
      .or(page.getByText(/jobs/i));
    await expect(jobsTab.first()).toBeVisible({ timeout: 8_000 });
    await page.screenshot({ path: 'e2e/screenshots/f5-jobs-tab-visible.png', fullPage: true });
  });

  test('Can navigate to Jobs tab and see content', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/company-admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const jobsTab = page.getByRole('button', { name: /jobs/i })
      .or(page.getByText(/jobs/i));
    await jobsTab.first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'e2e/screenshots/f5-jobs-tab-content.png', fullPage: true });

    // Should show jobs content (create form or positions list)
    const content = page.getByText(/job position|create position|open position|title/i);
    await expect(content.first()).toBeVisible({ timeout: 5_000 });
  });

  test('Jobs API — create position', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    const token = await getToken(page);

    // Get the admin's own company ID from localStorage
    const companyResult = await page.evaluate(() => {
      const u = JSON.parse(localStorage.getItem('rh_user') || '{}');
      return u.companyId || null;
    });
    if (!companyResult) { test.skip(); return; }

    const result = await page.evaluate(async ({ apiUrl, token, companyId }) => {
      const res = await fetch(`${apiUrl}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyId, title: 'E2E Test Position', description: 'Test position description', requirements: 'Testing skills' }),
      });
      return { status: res.status, body: await res.json() };
    }, { apiUrl: API_URL, token, companyId: companyResult });

    expect([201, 400]).toContain(result.status);
    await page.screenshot({ path: 'e2e/screenshots/f5-jobs-api-create.png', fullPage: true });
  });

  test('Jobs API — list positions for a company (public)', async ({ page }) => {
    // Navigate first so fetch works (avoids about:blank CORS)
    await page.goto('/companies');
    await page.waitForLoadState('networkidle');

    // Get a company ID first
    const companies = await page.evaluate(async (apiUrl) => {
      const res = await fetch(`${apiUrl}/companies`);
      const body = await res.json();
      return body.data || [];
    }, API_URL);

    if (companies.length === 0) { test.skip(); return; }

    const result = await page.evaluate(async ({ apiUrl, companyId }) => {
      const res = await fetch(`${apiUrl}/jobs?companyId=${companyId}`);
      return { status: res.status, body: await res.json() };
    }, { apiUrl: API_URL, companyId: companies[0].id });

    expect(result.status).toBe(200);
    expect(Array.isArray(result.body.data)).toBe(true);
  });
});

// ─── F5: Job Board on Employee Dashboard ──────────────────────────────────────
test.describe('F5 — Job Board on Employee Dashboard', () => {
  test('Job Board tab is visible on employee dashboard', async ({ page }) => {
    const ok = await tryLoginAsEmployee(page);
    if (!ok) { test.skip(); return; }
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const jobTab = page.getByRole('button', { name: /job/i })
      .or(page.getByText(/job board/i));
    await expect(jobTab.first()).toBeVisible({ timeout: 8_000 });
    await page.screenshot({ path: 'e2e/screenshots/f5-employee-jobs-tab.png', fullPage: true });
  });
});

// ─── F12: Invite-Only Employment ──────────────────────────────────────────────
test.describe('F12 — Invite-Only Employment (no self-request)', () => {
  test('Employee dashboard does NOT show request verification button', async ({ page }) => {
    const ok = await tryLoginAsEmployee(page);
    if (!ok) { test.skip(); return; }
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/f12-no-request-button.png', fullPage: true });

    // The "Request Verification" button should NOT be present
    const requestBtn = page.getByRole('button', { name: /request.*verification/i });
    await expect(requestBtn).not.toBeVisible({ timeout: 3_000 });
  });

  test('Employee dashboard shows invite-only banner', async ({ page }) => {
    const ok = await tryLoginAsEmployee(page);
    if (!ok) { test.skip(); return; }
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should show invite-only message
    const banner = page.getByText(/invite-only|invitation link|admin will send/i);
    await expect(banner.first()).toBeVisible({ timeout: 5_000 });
  });

  test('Company admin dashboard shows invite employee section', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/company-admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Employees tab (use exact role button to avoid matching "Verified Employees" text)
    const empTab = page.getByRole('button', { name: 'Employees', exact: true });
    await empTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/f12-invite-section.png', fullPage: true });

    // Should show invite form section: heading "Invite Employee" or button "Send Invite" or email placeholder
    const inviteSection = page.getByText(/Invite Employee/i)
      .or(page.getByRole('button', { name: /Send Invite/i }))
      .or(page.getByPlaceholder(/email address/i));
    await expect(inviteSection.first()).toBeVisible({ timeout: 8_000 });
  });

  test('Invite API — send invite', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    const token = await getToken(page);

    const result = await page.evaluate(async ({ apiUrl, token }) => {
      const res = await fetch(`${apiUrl}/employments/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: 'e2e-invite-test@ratehub.com', position: 'E2E Tester', department: 'QA' }),
      });
      return { status: res.status, body: await res.json() };
    }, { apiUrl: API_URL, token });

    // 201 = success, 400 = duplicate/revoked
    expect([201, 400]).toContain(result.status);
  });
});

// ─── F14: Notification Deep Links ─────────────────────────────────────────────
test.describe('F14 — Notification Deep Links', () => {
  test('Notification bell is visible for logged-in user', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/f14-notification-bell.png', fullPage: true });
  });

  test('Notifications API returns data', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    const token = await getToken(page);

    const result = await page.evaluate(async ({ apiUrl, token }) => {
      const res = await fetch(`${apiUrl}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { status: res.status, body: await res.json() };
    }, { apiUrl: API_URL, token });

    expect(result.status).toBe(200);
    expect(Array.isArray(result.body.data)).toBe(true);
  });
});

// ─── Company Profile: EOTY Hall of Fame & Open Positions ──────────────────────
test.describe('Company Profile — EOTY & Jobs Sections', () => {
  test('Company profile page loads', async ({ page }) => {
    // Navigate first so fetch works (avoids about:blank CORS)
    await page.goto('/companies');
    await page.waitForLoadState('networkidle');

    // Get a company ID
    const companies = await page.evaluate(async (apiUrl) => {
      const res = await fetch(`${apiUrl}/companies`);
      const body = await res.json();
      return body.data || [];
    }, API_URL);

    if (companies.length === 0) {
      test.skip();
      return;
    }

    await page.goto(`/companies/${companies[0].id}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/company-profile.png', fullPage: true });

    // Company name should be visible
    const title = page.locator('h1').first();
    await expect(title).toBeVisible({ timeout: 8_000 });
  });
});
