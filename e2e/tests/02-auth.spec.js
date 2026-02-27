// tests/02-auth.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// AUTH FLOWS — Register, Login, Logout, Forgot Password, Route guards
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');
const { loginAsEmployee, loginAsCompanyAdmin, loginAsSystemAdmin } = require('./helpers/auth');
require('dotenv').config();

const E = process.env;

// ─── REGISTER PAGE ────────────────────────────────────────────────────────────
test.describe('Register Page (/register)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('page renders register form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /register|sign up|create.*account/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
  });

  test('role selector shows employee and company_admin options', async ({ page }) => {
    // Either radio buttons or a select
    const employeeOption = page.getByRole('radio', { name: /employee/i })
      .or(page.getByRole('option', { name: /employee/i }))
      .or(page.getByText(/employee/i));
    await expect(employeeOption.first()).toBeVisible();
  });

  test('selecting employee role shows first/last name fields', async ({ page }) => {
    const employeeRadio = page.getByRole('radio', { name: /employee/i })
      .or(page.getByText(/^employee$/i).first());
    if (await employeeRadio.count() > 0) {
      await employeeRadio.first().click();
    }
    await expect(page.getByLabel(/first name/i).or(page.getByPlaceholder(/first name/i))).toBeVisible();
    await expect(page.getByLabel(/last name/i).or(page.getByPlaceholder(/last name/i))).toBeVisible();
  });

  test('selecting company_admin role shows company name field', async ({ page }) => {
    const companyAdminOption = page.getByText(/company.admin|company admin/i).first();
    if (await companyAdminOption.count() > 0) {
      await companyAdminOption.click();
      await expect(page.getByLabel(/company name/i).or(page.getByPlaceholder(/company name/i))).toBeVisible();
    }
  });

  test('shows validation error for empty form submission', async ({ page }) => {
    await page.getByRole('button', { name: /register|sign up|create/i }).click();
    // Browser native validation or custom error message
    const invalidField = await page.evaluate(() => {
      const invalid = document.querySelector(':invalid');
      return invalid ? invalid.name || invalid.type : null;
    });
    const errorMsg = page.getByText(/required|invalid|please fill/i);
    const hasError = (invalidField !== null) || (await errorMsg.count() > 0);
    expect(hasError).toBeTruthy();
  });

  test('shows error for duplicate email', async ({ page }) => {
    // Try to register with an email we know exists
    const companyAdminOption = page.getByText(/company.admin|company admin/i).first();
    if (await companyAdminOption.count() > 0) await companyAdminOption.click();

    await page.getByLabel(/email/i).fill(E.EMPLOYEE_EMAIL);
    await page.getByLabel(/password/i).first().fill('Test1234!');
    // Fill required fields
    await page.getByLabel(/first name/i).or(page.getByPlaceholder(/first name/i)).fill('Test').catch(() => {});
    await page.getByLabel(/last name/i).or(page.getByPlaceholder(/last name/i)).fill('User').catch(() => {});
    await page.getByRole('button', { name: /register|sign up|create/i }).click();
    await expect(page.getByText(/already exists|taken|duplicate|exists/i)).toBeVisible({ timeout: 8_000 });
  });

  test('has link to login page', async ({ page }) => {
    await expect(page.getByRole('link', { name: /login|sign in|already.*account/i })).toBeVisible();
  });
});

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
test.describe('Login Page (/login)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('page renders login form', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('shows error for wrong credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page.getByText(/invalid|incorrect|wrong|not found|credentials/i)).toBeVisible({ timeout: 8_000 });
  });

  test('shows error for empty email', async ({ page }) => {
    await page.getByLabel(/password/i).fill('Test1234!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    const invalidField = await page.evaluate(() => document.querySelector(':invalid') !== null);
    const errorMsg = page.getByText(/required|email/i);
    expect(invalidField || await errorMsg.count() > 0).toBeTruthy();
  });

  test('successful employee login redirects to /dashboard', async ({ page }) => {
    await loginAsEmployee(page);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('successful company_admin login redirects to /company-admin', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await expect(page).toHaveURL(/company-admin/);
  });

  test('successful system_admin login redirects to /admin', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await expect(page).toHaveURL(/\/admin/);
  });

  test('has link to forgot password', async ({ page }) => {
    await expect(page.getByRole('link', { name: /forgot/i })).toBeVisible();
  });

  test('has link to register page', async ({ page }) => {
    await expect(page.getByRole('link', { name: /register|sign up|create/i })).toBeVisible();
  });

  test('already-logged-in user is redirected away from /login', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/login');
    await expect(page).toHaveURL(/dashboard/);
  });
});

// ─── FORGOT PASSWORD PAGE ─────────────────────────────────────────────────────
test.describe('Forgot Password Page (/forgot-password)', () => {
  test('renders email input and submit button', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i))).toBeVisible();
    await expect(page.getByRole('button', { name: /send|reset|submit/i })).toBeVisible();
  });

  test('shows success message after submitting a valid email', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).fill(E.EMPLOYEE_EMAIL);
    await page.getByRole('button', { name: /send|reset|submit/i }).click();
    await expect(page.getByText(/sent|check.*email|if.*exist/i)).toBeVisible({ timeout: 8_000 });
  });

  test('shows message for unknown email (security — same as valid email)', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).fill('notexists@example.com');
    await page.getByRole('button', { name: /send|reset|submit/i }).click();
    // Should NOT reveal whether email exists
    await expect(page.getByText(/sent|check.*email|if.*exist/i)).toBeVisible({ timeout: 8_000 });
  });
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
test.describe('Logout', () => {
  test('employee can logout and is sent to /login', async ({ page }) => {
    await loginAsEmployee(page);
    await expect(page).toHaveURL(/dashboard/);
    // Find logout — could be in navbar or a dropdown
    const logoutBtn = page.getByRole('button', { name: /logout|sign out/i })
      .or(page.getByRole('link', { name: /logout|sign out/i }));
    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click();
    } else {
      // Try opening a menu first
      await page.locator('header').getByRole('button').last().click();
      await page.getByText(/logout|sign out/i).first().click();
    }
    await expect(page).toHaveURL(/login|^\/$/);
  });
});
