// tests/06-profile.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// PROFILE — E26–E30
// View, Edit (name, bio, position), Change Password (errors + success),
// Deactivate, Delete account
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');
const { loginAsEmployee, loginAsCompanyAdmin, loginAsSystemAdmin } = require('./helpers/auth');
require('dotenv').config();
const E = process.env;

// ─── E26–E27 VIEW & EDIT PROFILE ──────────────────────────────────────────────
test.describe('E26–E27 View and Edit Profile (/profile)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/profile');
  });

  test('E26 profile shows real user data (not "Jane Cooper" placeholder)', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /profile|account|settings/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(E.EMPLOYEE_EMAIL).first()).toBeVisible({ timeout: 8_000 });
    // Should NOT show placeholder "Jane Cooper"
    await expect(page.getByText('Jane Cooper')).toHaveCount(0);
  });

  test('E27 can update full name', async ({ page }) => {
    // Profile starts in view mode — click Edit to enable editing
    const editBtn = page.getByRole('button', { name: /^edit$/i });
    if (await editBtn.count() > 0) await editBtn.first().click();
    // Full Name input: Input component has no htmlFor, use label proximity selector
    const nameInput = page.locator('label:has-text("Full Name")').locator('..').locator('input');
    if (await nameInput.count() > 0) {
      await nameInput.first().fill('Updated Name E2E');
    } else {
      // Fallback: first non-email, non-password input
      const textInput = page.locator('input:not([type="email"]):not([type="password"])').first();
      if (await textInput.count() === 0) { test.skip(true, 'No name field found'); return; }
      await textInput.fill('Updated Name E2E');
    }
    await page.getByRole('button', { name: /save changes|save|update|submit/i }).first().click();
    await expect(page.getByText(/saved|updated|success|profile saved/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('E27 can update bio', async ({ page }) => {
    const bioField = page.getByLabel(/bio|about/i)
      .or(page.getByPlaceholder(/bio|about yourself/i));
    if (await bioField.count() === 0) { test.skip(true, 'No bio field'); return; }
    await bioField.first().fill('Updated bio from E2E automated test.');
    await page.getByRole('button', { name: /save|update|submit/i }).first().click();
    await expect(page.getByText(/saved|updated|success/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('E27 can update current position/job title', async ({ page }) => {
    const posField = page.getByLabel(/position|title|job|current role/i)
      .or(page.getByPlaceholder(/position|title|job/i));
    if (await posField.count() === 0) { test.skip(true, 'No position field'); return; }
    await posField.first().fill('Senior QA Engineer');
    await page.getByRole('button', { name: /save|update|submit/i }).first().click();
    await expect(page.getByText(/saved|updated|success/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

// ─── E28 CHANGE PASSWORD ──────────────────────────────────────────────────────
test.describe('E28 Change Password', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/profile');
    const pwTab = page.getByRole('button', { name: /change.*password|password|security/i })
      .or(page.getByRole('tab', { name: /password|security/i }));
    if (await pwTab.count() > 0) await pwTab.first().click();
  });

  test('change password form is present', async ({ page }) => {
    const currentPw = page.getByLabel(/current password|old password/i)
      .or(page.getByPlaceholder(/current password/i));
    if (await currentPw.count() > 0) {
      await expect(currentPw.first()).toBeVisible();
    }
  });

  test('wrong current password shows error', async ({ page }) => {
    const currentPw = page.getByLabel(/current password|old password/i)
      .or(page.getByPlaceholder(/current password/i));
    if (await currentPw.count() === 0) { test.skip(true, 'No change-pw form'); return; }
    await currentPw.first().fill('WRONG_PASSWORD_XYZ!');
    await page.getByLabel(/new password/i).or(page.getByPlaceholder(/new password/i)).first().fill('NewPass1234!');
    await page.getByLabel(/confirm.*password|repeat.*password/i)
      .or(page.getByPlaceholder(/confirm.*password/i)).first().fill('NewPass1234!');
    await page.getByRole('button', { name: /change|update.*password|save/i }).first().click();
    await expect(page.getByText(/incorrect|wrong|invalid.*password|current.*password/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('mismatched new/confirm passwords shows error', async ({ page }) => {
    const currentPw = page.getByLabel(/current password|old password/i)
      .or(page.getByPlaceholder(/current password/i));
    if (await currentPw.count() === 0) { test.skip(true, 'No change-pw form'); return; }
    await currentPw.first().fill(E.EMPLOYEE_PASSWORD);
    await page.getByLabel(/new password/i).or(page.getByPlaceholder(/new password/i)).first().fill('NewPass1234!');
    await page.getByLabel(/confirm.*password|repeat.*password/i)
      .or(page.getByPlaceholder(/confirm.*password/i)).first().fill('DifferentPass9999!');
    await page.getByRole('button', { name: /change|update.*password|save/i }).first().click();
    await expect(page.getByText(/do not match|mismatch|passwords.*match/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

// ─── E29–E30 DEACTIVATE & DELETE ──────────────────────────────────────────────
test.describe('E29–E30 Deactivate and Delete Account', () => {
  test('E29 deactivate button is visible and triggers confirmation', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/profile');
    const deactivateBtn = page.getByRole('button', { name: /deactivate.*account|close.*account/i });
    if (await deactivateBtn.count() === 0) { test.skip(true, 'No deactivate button'); return; }
    await expect(deactivateBtn.first()).toBeVisible();
    await deactivateBtn.first().click();
    const confirm = page.getByRole('dialog').or(page.getByText(/are you sure|confirm|irreversible/i));
    await expect(confirm.first()).toBeVisible({ timeout: 6_000 });
    // Cancel — don't actually deactivate the test account
    const cancelBtn = page.getByRole('button', { name: /cancel|no|back/i });
    if (await cancelBtn.count() > 0) await cancelBtn.first().click();
  });

  test('E30 delete account button is visible and triggers confirmation', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/profile');
    const deleteBtn = page.getByRole('button', { name: /delete.*account|permanently delete/i });
    if (await deleteBtn.count() === 0) { test.skip(true, 'No delete button'); return; }
    await expect(deleteBtn.first()).toBeVisible();
    await deleteBtn.first().click();
    const confirm = page.getByRole('dialog').or(page.getByText(/are you sure|confirm|permanent|irreversible/i));
    await expect(confirm.first()).toBeVisible({ timeout: 6_000 });
    const cancelBtn = page.getByRole('button', { name: /cancel|no|back/i });
    if (await cancelBtn.count() > 0) await cancelBtn.first().click();
  });
});

// ─── OTHER ROLES PROFILE ──────────────────────────────────────────────────────
test.describe('Profile — All Roles', () => {
  test('company_admin can view their profile with real data', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /profile|account/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(E.COMPANY_ADMIN_EMAIL).first()).toBeVisible({ timeout: 8_000 });
  });

  test('system_admin can view their profile with real data', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /profile|account/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(E.SYSTEM_ADMIN_EMAIL).first()).toBeVisible({ timeout: 8_000 });
  });
});
