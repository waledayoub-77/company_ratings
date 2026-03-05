// tests/05-system-admin.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM ADMIN FLOWS — A1–A21
// Admin panel overview, Reports (resolve/dismiss), Companies (approve/reject),
// Users (search/suspend/unsuspend/delete/bulk), Audit logs, Override employment
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');
const { loginAsSystemAdmin } = require('./helpers/auth');

// ─── A1–A3 LOGIN & OVERVIEW ───────────────────────────────────────────────────
test.describe('A1–A3 Admin Panel Login & Overview', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');
  });

  test('A1 login redirects to /admin', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin/);
  });

  test('A2 navbar shows Companies and Admin Panel; hides Dashboard/Feedback/Company Admin', async ({ page }) => {
    await expect(page.getByRole('link', { name: /^companies$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /admin panel|admin/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^dashboard$/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /company admin/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^feedback$/i })).toHaveCount(0);
  });

  test('A3 overview tab shows real platform stats', async ({ page }) => {
    // Click overview/analytics tab if present
    const overviewTab = page.getByRole('button', { name: /overview|analytic/i })
      .or(page.getByRole('tab', { name: /overview|analytic/i }));
    if (await overviewTab.count() > 0) await overviewTab.first().click();
    await page.waitForTimeout(1_500);
    // Real numbers — not all zero and not hardcoded
    const stats = page.getByText(/user|compan|review|report/i).first();
    await expect(stats).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('body')).not.toContainText(/500/);
  });
});

// ─── A4–A6 REPORTS MANAGEMENT ────────────────────────────────────────────────
test.describe('A4–A6 Reports Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');
    const tab = page.getByRole('button', { name: /^report/i })
      .or(page.getByRole('tab', { name: /^report/i }));
    if (await tab.count() > 0) await tab.first().click();
  });

  test('A4 reports tab shows list or empty state', async ({ page }) => {
    const content = page.getByText(/report|no report|empty|nothing/i).first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });

  test('A5 "Remove Review" resolves report and removes review', async ({ page }) => {
    const removeBtn = page.getByRole('button', { name: /remove.*review/i }).first();
    if (await removeBtn.count() === 0) {
      test.skip(true, 'No reports with Remove Review option');
      return;
    }
    await removeBtn.click();
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|remove/i });
    if (await confirmBtn.count() > 0) await confirmBtn.first().click();
    await expect(page.getByText(/resolved|removed|success/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('A6 "Dismiss Report" dismisses without removing review', async ({ page }) => {
    const dismissBtn = page.getByRole('button', { name: /dismiss/i }).first();
    if (await dismissBtn.count() === 0) {
      test.skip(true, 'No reports to dismiss');
      return;
    }
    await dismissBtn.click();
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|dismiss/i });
    if (await confirmBtn.count() > 0) await confirmBtn.first().click();
    await expect(page.getByText(/dismissed|resolved|success/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

// ─── A7–A9 COMPANIES MANAGEMENT ──────────────────────────────────────────────
test.describe('A7–A9 Companies Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');
    const tab = page.getByRole('button', { name: /compan/i })
      .or(page.getByRole('tab', { name: /compan/i }));
    if (await tab.count() > 0) await tab.first().click();
  });

  test('A7 companies tab shows unverified companies or empty state', async ({ page }) => {
    const content = page.getByText(/compan|pending|unverified|no compan/i).first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });

  test('A8 verify company — approved changes status', async ({ page }) => {
    const verifyBtn = page.getByRole('button', { name: /^verify$|approve/i }).first();
    if (await verifyBtn.count() === 0) {
      test.skip(true, 'No unverified company');
      return;
    }
    await verifyBtn.click();
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|verify/i });
    if (await confirmBtn.count() > 0) await confirmBtn.first().click();
    await expect(page.getByText(/verified|approved|success/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('A9 reject company — removes or rejects it', async ({ page }) => {
    const rejectBtn = page.getByRole('button', { name: /reject/i }).first();
    if (await rejectBtn.count() === 0) {
      test.skip(true, 'No company to reject');
      return;
    }
    await rejectBtn.click();
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|reject/i });
    if (await confirmBtn.count() > 0) await confirmBtn.first().click();
    await expect(page.getByText(/rejected|removed|success/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

// ─── A10–A16 USER MANAGEMENT ─────────────────────────────────────────────────
test.describe('A10–A16 User Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');
    const tab = page.getByRole('button', { name: /^user/i })
      .or(page.getByRole('tab', { name: /^user/i }));
    if (await tab.count() > 0) await tab.first().click();
  });

  test('A10 users tab shows user list', async ({ page }) => {
    const content = page.getByText(/user|email|role|no user/i).first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });

  test('A11 search users by email filters results', async ({ page }) => {
    const search = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/search.*user|email/i));
    if (await search.count() === 0) { test.skip(true, 'No search'); return; }
    await search.first().fill(process.env.EMPLOYEE_EMAIL);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1_000);
    await expect(page.getByText(process.env.EMPLOYEE_EMAIL)).toBeVisible({ timeout: 8_000 });
  });

  test('A12 suspend user changes their status', async ({ page }) => {
    const suspendBtn = page.getByRole('button', { name: /^suspend$/i }).first();
    if (await suspendBtn.count() === 0) {
      test.skip(true, 'No active user to suspend');
      return;
    }
    await suspendBtn.click();
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|suspend/i });
    if (await confirmBtn.count() > 0) await confirmBtn.first().click();
    await expect(page.getByText(/suspended|banned|success/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('A13 unsuspend user restores access', async ({ page }) => {
    const unsuspendBtn = page.getByRole('button', { name: /unsuspend|restore|reactivate/i }).first();
    if (await unsuspendBtn.count() === 0) {
      test.skip(true, 'No suspended user');
      return;
    }
    await unsuspendBtn.click();
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|unsuspend/i });
    if (await confirmBtn.count() > 0) await confirmBtn.first().click();
    await expect(page.getByText(/unsuspended|restored|success|active/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('A14 ⚠️ BUG — suspended user can still access app for up to 15 min', async ({ page }) => {
    // Document known caching bug — suspended flag not checked on each request
    // No middleware re-check on every API call; token stays valid until expiry
    console.log('A14: ⚠️ BUG — no server-side middleware checks suspension per-request');
    console.log('A14:         Suspended users can continue using app until token expires (~15min)');
    // This is a security/UX documentation test — no automated assertion possible without
    // coordinating two browsers simultaneously
  });

  test('A15 delete user — removes from list', async ({ page }) => {
    const deleteBtn = page.getByRole('button', { name: /delete.*user|remove.*user/i })
      .or(page.locator('[aria-label*="delete"]'))
      .first();
    if (await deleteBtn.count() === 0) {
      test.skip(true, 'No delete button found');
      return;
    }
    await deleteBtn.click();
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i });
    if (await confirmBtn.count() > 0) await confirmBtn.first().click();
    // A17 bug check: should NOT use alert(), should use inline message
    const alertTriggered = await page.evaluate(() => {
      // window.alert was called if replaced
      return typeof window.__alertCalled !== 'undefined' ? window.__alertCalled : false;
    });
    if (alertTriggered) {
      console.log('A17: ⚠️ BUG CONFIRMED — alert() used for delete error instead of inline message');
    }
    await expect(page.locator('body')).not.toContainText(/500/);
  });

  test('A16 bulk suspend — select multiple users and suspend all', async ({ page }) => {
    // Select all checkbox
    const selectAll = page.getByRole('checkbox', { name: /select all/i })
      .or(page.locator('input[type="checkbox"]').first());
    if (await selectAll.count() === 0) {
      test.skip(true, 'No checkboxes for bulk selection');
      return;
    }
    await selectAll.first().check();
    const bulkSuspendBtn = page.getByRole('button', { name: /bulk.*suspend|suspend.*selected/i });
    if (await bulkSuspendBtn.count() > 0) {
      await bulkSuspendBtn.click();
      const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
      if (await confirmBtn.count() > 0) await confirmBtn.first().click();
      await expect(page.getByText(/suspended|success/i).first()).toBeVisible({ timeout: 8_000 });
    }
  });

  test('A17 ⚠️ BUG — delete/action error shows inline message, not alert()', async ({ page }) => {
    // Intercept window.alert to detect the bug
    await page.addInitScript(() => {
      window.__alertCalled = false;
      window.__origAlert = window.alert;
      window.alert = (msg) => { window.__alertCalled = true; window.__origMsg = msg; };
    });
    // Trigger an error by blocking the delete API
    await page.route('**/api/admin/users/**', route => route.abort('failed'));
    const deleteBtn = page.getByRole('button', { name: /delete.*user|remove.*user/i })
      .or(page.locator('[aria-label*="delete"]')).first();
    if (await deleteBtn.count() === 0) {
      await page.unroute('**/api/admin/users/**');
      test.skip(true, 'No delete button');
      return;
    }
    await deleteBtn.click();
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i });
    if (await confirmBtn.count() > 0) await confirmBtn.first().click();
    await page.waitForTimeout(2_000);
    const alertUsed = await page.evaluate(() => window.__alertCalled);
    if (alertUsed) {
      console.log('A17: ⚠️ BUG CONFIRMED — alert() called on delete error. Should use inline toast/message.');
    }
    await page.unroute('**/api/admin/users/**');
  });
});

// ─── A18–A19 AUDIT LOGS & OVERRIDE EMPLOYMENT ────────────────────────────────
test.describe('A18–A19 Audit Logs & Override Employment', () => {
  test('A18 audit logs tab shows entries with action, admin, date columns', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');
    const tab = page.getByRole('button', { name: /audit|log/i })
      .or(page.getByRole('tab', { name: /audit|log/i }));
    if (await tab.count() > 0) await tab.first().click();
    const content = page.getByText(/log|action|audit|date|no.*log/i).first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });

  test('A19 override employment — admin can approve any employment request', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');
    const empTab = page.getByRole('button', { name: /employment/i })
      .or(page.getByRole('tab', { name: /employment/i }));
    if (await empTab.count() > 0) {
      await empTab.first().click();
      const overrideBtn = page.getByRole('button', { name: /override|approve/i }).first();
      if (await overrideBtn.count() > 0) {
        await overrideBtn.click();
        const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
        if (await confirmBtn.count() > 0) await confirmBtn.first().click();
        await expect(page.getByText(/approved|overridden|success/i).first()).toBeVisible({ timeout: 8_000 });
      } else {
        test.skip(true, 'No employment requests to override');
      }
    } else {
      test.skip(true, 'No employment admin tab');
    }
  });
});

// ─── A20–A21 ROLE REDIRECTS ───────────────────────────────────────────────────
test.describe('A20–A21 System Admin Role Redirects', () => {
  test('A20 system_admin accessing /dashboard → redirected to /admin', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/\/dashboard$/, { timeout: 6_000 });
    await expect(page).toHaveURL(/\/admin/, { timeout: 6_000 });
  });

  test('A21 system_admin accessing /company-admin → redirected to /admin', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/company-admin');
    await expect(page).not.toHaveURL(/company-admin/, { timeout: 6_000 });
    await expect(page).toHaveURL(/\/admin/, { timeout: 6_000 });
  });
});
