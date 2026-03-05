// tests/07-route-guards.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// ROUTE GUARDS — All role-based redirect scenarios
// Unauthenticated → /login, employee/company_admin/system_admin wrong-role
// Logged-in users blocked from /login and /register
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');
const { loginAsEmployee, loginAsCompanyAdmin, loginAsSystemAdmin } = require('./helpers/auth');

// ─── UNAUTHENTICATED ACCESS ────────────────────────────────────────────────────
test.describe('Unauthenticated access — all protected routes → /login', () => {
  const routes = ['/dashboard', '/dashboard/feedback', '/feedback', '/company-admin', '/admin', '/profile'];
  for (const route of routes) {
    test(`${route} → /login when not logged in`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/login/, { timeout: 8_000 });
    });
  }

  test('/companies/:id/review without auth → /login', async ({ page }) => {
    await page.goto('/companies/00000000-0000-0000-0000-000000000000/review');
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
  });
});

// ─── EMPLOYEE WRONG-ROLE REDIRECTS ────────────────────────────────────────────
test.describe('Employee — wrong-role routes redirect to /dashboard', () => {
  test('E33 employee on /admin → redirected (not /admin)', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/\/admin$/, { timeout: 6_000 });
  });

  test('E34 employee on /company-admin → redirected (not /company-admin)', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/company-admin');
    await expect(page).not.toHaveURL(/company-admin/, { timeout: 6_000 });
  });
});

// ─── COMPANY ADMIN WRONG-ROLE REDIRECTS ───────────────────────────────────────
test.describe('Company Admin — wrong-role routes redirect to /company-admin', () => {
  test('C19 company_admin on /admin → /company-admin', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/\/admin$/, { timeout: 6_000 });
    await expect(page).toHaveURL(/company-admin/, { timeout: 6_000 });
  });

  test('C20 company_admin on /dashboard → /company-admin', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/\/dashboard$/, { timeout: 6_000 });
    await expect(page).toHaveURL(/company-admin/, { timeout: 6_000 });
  });
});

// ─── SYSTEM ADMIN WRONG-ROLE REDIRECTS ────────────────────────────────────────
test.describe('System Admin — wrong-role routes redirect to /admin', () => {
  test('A20 system_admin on /dashboard → /admin', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/\/dashboard$/, { timeout: 6_000 });
    await expect(page).toHaveURL(/\/admin/, { timeout: 6_000 });
  });

  test('A21 system_admin on /company-admin → /admin', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/company-admin');
    await expect(page).not.toHaveURL(/company-admin/, { timeout: 6_000 });
    await expect(page).toHaveURL(/\/admin/, { timeout: 6_000 });
  });
});

// ─── LOGGED-IN USERS BLOCKED FROM AUTH PAGES ──────────────────────────────────
test.describe('Logged-in users cannot access /login or /register', () => {
  test('logged-in employee on /login → /dashboard', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/login');
    await expect(page).toHaveURL(/dashboard/, { timeout: 6_000 });
  });

  test('logged-in employee on /register → /dashboard', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/register');
    await expect(page).toHaveURL(/dashboard/, { timeout: 6_000 });
  });

  test('logged-in company_admin on /login → /company-admin', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/login');
    await expect(page).toHaveURL(/company-admin/, { timeout: 6_000 });
  });

  test('logged-in company_admin on /register → /company-admin', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/register');
    await expect(page).toHaveURL(/company-admin/, { timeout: 6_000 });
  });

  test('logged-in system_admin on /login → /admin', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/admin/, { timeout: 6_000 });
  });

  test('logged-in system_admin on /register → /admin', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/register');
    await expect(page).toHaveURL(/\/admin/, { timeout: 6_000 });
  });
});
