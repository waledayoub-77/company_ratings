// tests/07-route-guards.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// ROUTE GUARDS — Redirect behavior for unauthenticated users and wrong roles
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');
const { loginAsEmployee, loginAsCompanyAdmin, loginAsSystemAdmin } = require('./helpers/auth');

// ─── UNAUTHENTICATED ACCESS ───────────────────────────────────────────────────
test.describe('Unauthenticated access — protected routes redirect to /login', () => {
  const protectedRoutes = [
    '/dashboard',
    '/dashboard/feedback',
    '/feedback',
    '/company-admin',
    '/admin',
    '/profile',
  ];

  for (const route of protectedRoutes) {
    test(`${route} → redirects to /login when not logged in`, async ({ page }) => {
      // Make sure we have no session
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());
      await page.goto(route);
      await expect(page).toHaveURL(/login/, { timeout: 8_000 });
    });
  }
});

// ─── EMPLOYEE — wrong role routes ─────────────────────────────────────────────
test.describe('Employee — accessing wrong-role routes', () => {
  test('employee accessing /company-admin is redirected away', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/company-admin');
    // Should be redirected to /dashboard or /login or home — NOT stay on /company-admin
    await expect(page).not.toHaveURL(/company-admin/, { timeout: 6_000 });
  });

  test('employee accessing /admin is redirected away', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/\/admin$/, { timeout: 6_000 });
  });
});

// ─── COMPANY ADMIN — wrong role routes ────────────────────────────────────────
test.describe('Company Admin — accessing wrong-role routes', () => {
  test('company_admin accessing /dashboard is redirected away', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/\/dashboard$/, { timeout: 6_000 });
  });

  test('company_admin accessing /admin is redirected away', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/\/admin$/, { timeout: 6_000 });
  });
});

// ─── SYSTEM ADMIN — wrong role routes ─────────────────────────────────────────
test.describe('System Admin — accessing wrong-role routes', () => {
  test('system_admin accessing /dashboard is redirected away', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/\/dashboard$/, { timeout: 6_000 });
  });

  test('system_admin accessing /company-admin is redirected away', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/company-admin');
    await expect(page).not.toHaveURL(/company-admin/, { timeout: 6_000 });
  });
});

// ─── LOGGED-IN USER — can't reach /login or /register ────────────────────────
test.describe('Logged-in user — accessing auth pages should redirect away', () => {
  test('logged-in employee on /login is redirected to dashboard', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/login');
    await expect(page).toHaveURL(/dashboard/, { timeout: 6_000 });
  });

  test('logged-in employee on /register is redirected to dashboard', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/register');
    await expect(page).toHaveURL(/dashboard/, { timeout: 6_000 });
  });

  test('logged-in company_admin on /login is redirected to company-admin', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/login');
    await expect(page).toHaveURL(/company-admin/, { timeout: 6_000 });
  });

  test('logged-in system_admin on /login is redirected to /admin', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/admin/, { timeout: 6_000 });
  });
});

// ─── WRITE REVIEW — employee-only page ───────────────────────────────────────
test.describe('/companies/:id/review — access control', () => {
  test('unauthenticated user trying to review is redirected to /login', async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto('/companies/1/review');
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
  });
});
