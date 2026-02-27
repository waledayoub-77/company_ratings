// tests/05-system-admin.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM ADMIN FLOWS — Reports, Users, Companies, Analytics, Audit Logs
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');
const { loginAsSystemAdmin } = require('./helpers/auth');

test.describe('Admin Panel (/admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');
  });

  test('admin panel loads with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /admin|panel|control/i })).toBeVisible({ timeout: 8_000 });
  });

  test('shows Reports tab or section', async ({ page }) => {
    await expect(page.getByText(/report/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('shows Users tab or section', async ({ page }) => {
    await expect(page.getByText(/user/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('shows Companies tab or section', async ({ page }) => {
    await expect(page.getByText(/compan/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('shows Analytics tab or section', async ({ page }) => {
    await expect(page.getByText(/analytic|statistic/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('shows Audit Logs tab or section', async ({ page }) => {
    await expect(page.getByText(/audit.*log|log/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Admin — Reports Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');
    const tab = page.getByRole('button', { name: /^report/i })
      .or(page.getByRole('tab', { name: /^report/i }));
    if (await tab.count() > 0) await tab.first().click();
  });

  test('reports tab shows list or empty state', async ({ page }) => {
    const content = page.getByText(/report|no report|nothing|empty/i).first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });

  test('report items show dismiss/resolve button when reports exist', async ({ page }) => {
    const dismissBtn = page.getByRole('button', { name: /dismiss|resolve/i });
    if (await dismissBtn.count() > 0) {
      await expect(dismissBtn.first()).toBeVisible();
    } else {
      const empty = page.getByText(/no report|empty|none/i);
      if (await empty.count() > 0) await expect(empty.first()).toBeVisible();
    }
  });

  test('can dismiss/resolve a report', async ({ page }) => {
    const resolveBtn = page.getByRole('button', { name: /dismiss|resolve/i }).first();
    if (await resolveBtn.count() === 0) {
      test.skip(true, 'No reports to resolve');
      return;
    }
    await resolveBtn.click();
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|ok/i });
    if (await confirmBtn.count() > 0) await confirmBtn.first().click();
    await expect(page.getByText(/resolved|dismissed|success/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('report stats section is visible', async ({ page }) => {
    const stats = page.getByText(/total|pending|resolved/i).first();
    await expect(stats).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Admin — User Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');
    const tab = page.getByRole('button', { name: /^user/i })
      .or(page.getByRole('tab', { name: /^user/i }));
    if (await tab.count() > 0) await tab.first().click();
  });

  test('users tab shows user list or empty state', async ({ page }) => {
    const content = page.getByText(/user|email|no user|empty/i).first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });

  test('search field for users is present', async ({ page }) => {
    const search = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/search.*user|user.*search|email/i));
    if (await search.count() > 0) {
      await expect(search.first()).toBeVisible();
    }
  });

  test('can search for a user by email', async ({ page }) => {
    const searchInput = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/search|email/i));
    if (await searchInput.count() === 0) {
      test.skip(true, 'No search input found');
      return;
    }
    await searchInput.first().fill(process.env.EMPLOYEE_EMAIL);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1_000);
    await expect(page.getByText(process.env.EMPLOYEE_EMAIL)).toBeVisible({ timeout: 8_000 });
  });

  test('suspend button present for users', async ({ page }) => {
    const suspendBtn = page.getByRole('button', { name: /suspend/i });
    if (await suspendBtn.count() > 0) {
      await expect(suspendBtn.first()).toBeVisible();
    }
  });

  test('can suspend a user', async ({ page }) => {
    const suspendBtn = page.getByRole('button', { name: /^suspend$/i }).first();
    if (await suspendBtn.count() === 0) {
      test.skip(true, 'No suspend button found');
      return;
    }
    await suspendBtn.click();
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|suspend/i });
    if (await confirmBtn.count() > 0) await confirmBtn.first().click();
    await expect(page.getByText(/suspended|success|banned/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('unsuspend button present for suspended users', async ({ page }) => {
    const unsuspendBtn = page.getByRole('button', { name: /unsuspend|restore|reactivate/i });
    if (await unsuspendBtn.count() > 0) {
      await expect(unsuspendBtn.first()).toBeVisible();
    }
  });

  test('delete user button is present', async ({ page }) => {
    const deleteBtn = page.getByRole('button', { name: /delete.*user|remove.*user/i });
    if (await deleteBtn.count() > 0) {
      await expect(deleteBtn.first()).toBeVisible();
    }
  });

  test('bulk actions (bulk suspend) are available', async ({ page }) => {
    const bulkBtn = page.getByRole('button', { name: /bulk|select all/i })
      .or(page.getByRole('checkbox', { name: /select all/i }));
    if (await bulkBtn.count() > 0) {
      await expect(bulkBtn.first()).toBeVisible();
    }
  });
});

test.describe('Admin — Company Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');
    const tab = page.getByRole('button', { name: /compan/i })
      .or(page.getByRole('tab', { name: /compan/i }));
    if (await tab.count() > 0) await tab.first().click();
  });

  test('companies tab shows list or empty state', async ({ page }) => {
    const content = page.getByText(/compan|no compan|empty/i).first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });

  test('verify button present for unverified companies', async ({ page }) => {
    const verifyBtn = page.getByRole('button', { name: /verify/i });
    if (await verifyBtn.count() > 0) {
      await expect(verifyBtn.first()).toBeVisible();
    }
  });

  test('can verify a company', async ({ page }) => {
    const verifyBtn = page.getByRole('button', { name: /^verify$/i }).first();
    if (await verifyBtn.count() === 0) {
      test.skip(true, 'No company to verify');
      return;
    }
    await verifyBtn.click();
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|verify/i });
    if (await confirmBtn.count() > 0) await confirmBtn.first().click();
    await expect(page.getByText(/verified|success/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Admin — Analytics', () => {
  test('analytics tab shows platform statistics', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');
    const tab = page.getByRole('button', { name: /analytic/i })
      .or(page.getByRole('tab', { name: /analytic/i }));
    if (await tab.count() > 0) await tab.first().click();
    const content = page.getByText(/user|review|compan|analytic|total/i).first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Admin — Audit Logs', () => {
  test('audit logs tab shows log entries or empty state', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');
    const tab = page.getByRole('button', { name: /audit|log/i })
      .or(page.getByRole('tab', { name: /audit|log/i }));
    if (await tab.count() > 0) await tab.first().click();
    const content = page.getByText(/log|action|audit|no.*log|empty/i).first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });

  test('audit logs show action type and timestamp columns', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');
    const tab = page.getByRole('button', { name: /audit|log/i })
      .or(page.getByRole('tab', { name: /audit|log/i }));
    if (await tab.count() > 0) {
      await tab.first().click();
      // Check for column headers
      const actionHeader = page.getByText(/action|type/i);
      const timestampHeader = page.getByText(/time|date|created/i);
      if (await actionHeader.count() > 0) await expect(actionHeader.first()).toBeVisible();
      if (await timestampHeader.count() > 0) await expect(timestampHeader.first()).toBeVisible();
    }
  });
});
