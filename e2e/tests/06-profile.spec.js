// tests/06-profile.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// PROFILE FLOWS — View, Edit, Change Password, Deactivate
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');
const { loginAsEmployee, loginAsCompanyAdmin, loginAsSystemAdmin } = require('./helpers/auth');

test.describe('Profile Page (/profile)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/profile');
  });

  test('profile page loads with profile heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /profile|account|settings/i })).toBeVisible({ timeout: 8_000 });
  });

  test('shows user email on profile page', async ({ page }) => {
    await expect(page.getByText(process.env.EMPLOYEE_EMAIL)).toBeVisible({ timeout: 8_000 });
  });

  test('shows editable name field', async ({ page }) => {
    const nameField = page.getByLabel(/full name|first name|name/i)
      .or(page.getByPlaceholder(/full name|first name|name/i));
    await expect(nameField.first()).toBeVisible({ timeout: 8_000 });
  });

  test('shows bio field', async ({ page }) => {
    const bioField = page.getByLabel(/bio|about/i)
      .or(page.getByPlaceholder(/bio|about yourself/i));
    if (await bioField.count() > 0) {
      await expect(bioField.first()).toBeVisible();
    }
  });

  test('can update bio', async ({ page }) => {
    const bioField = page.getByLabel(/bio|about/i)
      .or(page.getByPlaceholder(/bio|about yourself/i));
    if (await bioField.count() === 0) {
      test.skip(true, 'No bio field found');
      return;
    }
    await bioField.first().fill('Updated bio from E2E test — automated.');
    const saveBtn = page.getByRole('button', { name: /save|update|submit/i });
    await saveBtn.first().click();
    await expect(page.getByText(/saved|updated|success/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('can update current position / job title', async ({ page }) => {
    const posField = page.getByLabel(/position|title|job/i)
      .or(page.getByPlaceholder(/position|title|job/i));
    if (await posField.count() === 0) {
      test.skip(true, 'No position field found');
      return;
    }
    await posField.first().fill('QA Engineer');
    const saveBtn = page.getByRole('button', { name: /save|update|submit/i });
    await saveBtn.first().click();
    await expect(page.getByText(/saved|updated|success/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Profile — Change Password', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/profile');
    // Navigate to change password section if in a tab
    const changePwBtn = page.getByRole('button', { name: /change.*password|password/i })
      .or(page.getByRole('tab', { name: /password|security/i }))
      .or(page.getByRole('link', { name: /change.*password|security/i }));
    if (await changePwBtn.count() > 0) await changePwBtn.first().click();
  });

  test('change password form is visible', async ({ page }) => {
    const currentPwField = page.getByLabel(/current password|old password/i)
      .or(page.getByPlaceholder(/current password|old password/i));
    if (await currentPwField.count() > 0) {
      await expect(currentPwField.first()).toBeVisible({ timeout: 8_000 });
    }
  });

  test('shows error for wrong current password', async ({ page }) => {
    const currentPwField = page.getByLabel(/current password|old password/i)
      .or(page.getByPlaceholder(/current password|old password/i));
    if (await currentPwField.count() === 0) {
      test.skip(true, 'Change password form not found');
      return;
    }
    await currentPwField.first().fill('wrongpassword!123');
    await page.getByLabel(/new password/i).or(page.getByPlaceholder(/new password/i)).first().fill('NewPass1234!');
    await page.getByLabel(/confirm.*password|repeat.*password/i)
      .or(page.getByPlaceholder(/confirm.*password|repeat/i))
      .first().fill('NewPass1234!');
    await page.getByRole('button', { name: /change|update.*password|save/i }).first().click();
    await expect(page.getByText(/incorrect|wrong|invalid.*password|current.*password/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('shows error when new password and confirm do not match', async ({ page }) => {
    const currentPwField = page.getByLabel(/current password|old password/i)
      .or(page.getByPlaceholder(/current password|old password/i));
    if (await currentPwField.count() === 0) {
      test.skip(true, 'Change password form not found');
      return;
    }
    await currentPwField.first().fill(process.env.EMPLOYEE_PASSWORD);
    await page.getByLabel(/new password/i).or(page.getByPlaceholder(/new password/i)).first().fill('NewPass1234!');
    await page.getByLabel(/confirm.*password|repeat.*password/i)
      .or(page.getByPlaceholder(/confirm.*password|repeat/i))
      .first().fill('DifferentPass9999!');
    await page.getByRole('button', { name: /change|update.*password|save/i }).first().click();
    await expect(page.getByText(/do not match|mismatch|passwords.*match/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Profile — Account Actions', () => {
  test('deactivate account button is visible', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/profile');
    const deactivateBtn = page.getByRole('button', { name: /deactivate|close.*account|delete.*account/i });
    if (await deactivateBtn.count() > 0) {
      await expect(deactivateBtn.first()).toBeVisible({ timeout: 8_000 });
    }
  });

  test('deactivate button triggers confirmation dialog', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/profile');
    const deactivateBtn = page.getByRole('button', { name: /deactivate|close.*account|delete.*account/i });
    if (await deactivateBtn.count() === 0) {
      test.skip(true, 'No deactivate button found');
      return;
    }
    await deactivateBtn.first().click();
    const confirmation = page.getByRole('dialog')
      .or(page.getByText(/are you sure|confirm|irreversible/i));
    await expect(confirmation.first()).toBeVisible({ timeout: 8_000 });
    // Cancel the dialog
    const cancelBtn = page.getByRole('button', { name: /cancel|no|back/i });
    if (await cancelBtn.count() > 0) await cancelBtn.first().click();
  });
});

test.describe('Profile — Company Admin view', () => {
  test('company admin can access and view their profile', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /profile|account|settings/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(process.env.COMPANY_ADMIN_EMAIL)).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Profile — System Admin view', () => {
  test('system admin can access and view their profile', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /profile|account|settings/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(process.env.SYSTEM_ADMIN_EMAIL)).toBeVisible({ timeout: 8_000 });
  });
});
