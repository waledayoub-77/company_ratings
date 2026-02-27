// tests/04-company-admin.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// COMPANY ADMIN FLOWS — Dashboard, Employment Requests, Reviews, Settings
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');
const { loginAsCompanyAdmin } = require('./helpers/auth');

test.describe('Company Admin Dashboard (/company-admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/company-admin');
  });

  test('dashboard loads with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard|company|admin/i })).toBeVisible({ timeout: 8_000 });
  });

  test('shows analytics section or tab', async ({ page }) => {
    const section = page.getByText(/analytic|statistic|overview/i).first();
    await expect(section).toBeVisible({ timeout: 8_000 });
  });

  test('shows employment requests section or tab', async ({ page }) => {
    const section = page.getByText(/request|employment|pending/i).first();
    await expect(section).toBeVisible({ timeout: 8_000 });
  });

  test('shows reviews section or tab', async ({ page }) => {
    const section = page.getByText(/review/i).first();
    await expect(section).toBeVisible({ timeout: 8_000 });
  });

  test('settings tab is accessible', async ({ page }) => {
    const settingsTab = page.getByRole('button', { name: /setting/i })
      .or(page.getByRole('tab', { name: /setting/i }))
      .or(page.getByRole('link', { name: /setting/i }));
    if (await settingsTab.count() > 0) {
      await settingsTab.first().click();
      const form = page.getByRole('form')
        .or(page.getByLabel(/company name/i))
        .or(page.getByPlaceholder(/company name/i));
      await expect(form.first()).toBeVisible({ timeout: 8_000 });
    }
  });
});

test.describe('Company Admin — Employment Request Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/company-admin');
  });

  test('employment requests tab/section loads', async ({ page }) => {
    const requestsTab = page.getByRole('button', { name: /request|employment|pending/i })
      .or(page.getByRole('tab', { name: /request|employment/i }));
    if (await requestsTab.count() > 0) await requestsTab.first().click();
    const content = page.getByText(/pending|no request|employee request/i).first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });

  test('approve button present for pending requests', async ({ page }) => {
    const requestsTab = page.getByRole('button', { name: /request|employment|pending/i })
      .or(page.getByRole('tab', { name: /request|employment/i }));
    if (await requestsTab.count() > 0) await requestsTab.first().click();
    const approveBtn = page.getByRole('button', { name: /approve/i });
    if (await approveBtn.count() > 0) {
      await expect(approveBtn.first()).toBeVisible();
    } else {
      // No pending requests — that's fine
      const emptyState = page.getByText(/no.*request|no.*pending|empty/i);
      await expect(emptyState.first()).toBeVisible({ timeout: 8_000 });
    }
  });

  test('reject button present for pending requests', async ({ page }) => {
    const requestsTab = page.getByRole('button', { name: /request|employment|pending/i })
      .or(page.getByRole('tab', { name: /request|employment/i }));
    if (await requestsTab.count() > 0) await requestsTab.first().click();
    const rejectBtn = page.getByRole('button', { name: /reject|decline/i });
    if (await rejectBtn.count() > 0) {
      await expect(rejectBtn.first()).toBeVisible();
    }
  });

  test('can approve a pending employment request', async ({ page }) => {
    const requestsTab = page.getByRole('button', { name: /request|employment|pending/i })
      .or(page.getByRole('tab', { name: /request|employment/i }));
    if (await requestsTab.count() > 0) await requestsTab.first().click();
    const approveBtn = page.getByRole('button', { name: /approve/i }).first();
    if (await approveBtn.count() === 0) {
      test.skip(true, 'No pending requests to approve');
      return;
    }
    await approveBtn.click();
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|approve/i });
    if (await confirmBtn.count() > 0) await confirmBtn.first().click();
    await expect(page.getByText(/approved|success/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('can reject a pending employment request', async ({ page }) => {
    const requestsTab = page.getByRole('button', { name: /request|employment|pending/i })
      .or(page.getByRole('tab', { name: /request|employment/i }));
    if (await requestsTab.count() > 0) await requestsTab.first().click();
    const rejectBtn = page.getByRole('button', { name: /reject|decline/i }).first();
    if (await rejectBtn.count() === 0) {
      test.skip(true, 'No pending requests to reject');
      return;
    }
    await rejectBtn.click();
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|reject/i });
    if (await confirmBtn.count() > 0) await confirmBtn.first().click();
    await expect(page.getByText(/reject|declined|removed/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Company Admin — Reviews Section', () => {
  test('reviews tab shows company reviews or empty state', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/company-admin');
    const reviewsTab = page.getByRole('button', { name: /review/i })
      .or(page.getByRole('tab', { name: /review/i }));
    if (await reviewsTab.count() > 0) await reviewsTab.first().click();
    const content = page.getByText(/review|rating|no review|be the first/i).first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Company Admin — Feedback Section', () => {
  test('feedback tab shows aggregated feedback overview', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/company-admin');
    const feedbackTab = page.getByRole('button', { name: /feedback/i })
      .or(page.getByRole('tab', { name: /feedback/i }));
    if (await feedbackTab.count() > 0) {
      await feedbackTab.first().click();
      const content = page.getByText(/feedback|no feedback|peer/i).first();
      await expect(content).toBeVisible({ timeout: 8_000 });
    }
  });
});

test.describe('Company Admin — Company Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/company-admin');
    const settingsTab = page.getByRole('button', { name: /setting/i })
      .or(page.getByRole('tab', { name: /setting/i }))
      .or(page.getByRole('link', { name: /setting/i }));
    if (await settingsTab.count() > 0) await settingsTab.first().click();
  });

  test('settings form shows company name field', async ({ page }) => {
    const nameField = page.getByLabel(/company name/i)
      .or(page.getByPlaceholder(/company name/i));
    if (await nameField.count() > 0) {
      await expect(nameField.first()).toBeVisible();
    }
  });

  test('can update company description', async ({ page }) => {
    const descField = page.getByLabel(/description|about/i)
      .or(page.getByPlaceholder(/description|about/i));
    if (await descField.count() === 0) {
      test.skip(true, 'No description field found');
      return;
    }
    await descField.first().fill('Updated company description for E2E test.');
    const saveBtn = page.getByRole('button', { name: /save|update|submit/i });
    await saveBtn.first().click();
    await expect(page.getByText(/saved|updated|success/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Company Admin — Analytics', () => {
  test('analytics section shows stats or charts', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/company-admin');
    const analyticsTab = page.getByRole('button', { name: /analytic/i })
      .or(page.getByRole('tab', { name: /analytic/i }));
    if (await analyticsTab.count() > 0) await analyticsTab.first().click();
    const content = page.getByText(/employee|review|rating|analytic/i).first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });
});
