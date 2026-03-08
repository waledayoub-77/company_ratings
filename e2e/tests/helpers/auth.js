// tests/helpers/auth.js  — shared login helpers for all spec files
require('dotenv').config();

const E = process.env;

/**
 * Log in via the UI and return once redirected to the dashboard.
 * Saves localStorage tokens so the session persists within the page.
 */
async function loginAs(page, email, password) {
  // Navigate to app origin first so localStorage.clear() works across origin boundaries
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  // Wait until we leave /login (redirect to dashboard / company-admin / admin)
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 10_000 });
}

async function loginAsEmployee(page) {
  await loginAs(page, E.EMPLOYEE_EMAIL, E.EMPLOYEE_PASSWORD);
}

async function loginAsEmployee2(page) {
  await loginAs(page, E.EMPLOYEE2_EMAIL, E.EMPLOYEE2_PASSWORD);
}

async function loginAsCompanyAdmin(page) {
  await loginAs(page, E.COMPANY_ADMIN_EMAIL, E.COMPANY_ADMIN_PASSWORD);
}

async function loginAsSystemAdmin(page) {
  await loginAs(page, E.SYSTEM_ADMIN_EMAIL, E.SYSTEM_ADMIN_PASSWORD);
}

async function logout(page) {
  // Click user menu / logout button in the navbar
  try {
    await page.getByRole('button', { name: /logout|sign out/i }).click({ timeout: 5_000 });
  } catch {
    // Maybe behind a dropdown
    await page.getByRole('button', { name: /account|profile|menu/i }).first().click({ timeout: 5_000 });
    await page.getByRole('menuitem', { name: /logout|sign out/i }).click({ timeout: 5_000 });
  }
  await page.waitForURL('/login', { timeout: 8_000 });
}

module.exports = { loginAs, loginAsEmployee, loginAsEmployee2, loginAsCompanyAdmin, loginAsSystemAdmin, logout };
