// tests/03-employee.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE FLOWS — Dashboard, Employment, Reviews, Feedback, Notifications
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');
const { loginAsEmployee, loginAsEmployee2 } = require('./helpers/auth');

test.describe('Employee Dashboard (/dashboard)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/dashboard');
  });

  test('dashboard loads with expected heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard|welcome|overview/i })).toBeVisible({ timeout: 8_000 });
  });

  test('shows navigation tabs or sections', async ({ page }) => {
    // At least one of these section identifiers should be visible
    const section = page.getByText(/review|employment|feedback|notification/i).first();
    await expect(section).toBeVisible({ timeout: 8_000 });
  });

  test('sidebar or navbar shows employee-specific links', async ({ page }) => {
    const navItem = page.getByRole('link', { name: /dashboard|profile|companies/i }).first();
    await expect(navItem).toBeVisible();
  });
});

test.describe('Employee — Employment Requests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
  });

  test('can navigate to companies page from dashboard', async ({ page }) => {
    await page.goto('/companies');
    await expect(page).toHaveURL(/companies/);
    await expect(page.getByRole('heading', { name: /compan/i })).toBeVisible({ timeout: 8_000 });
  });

  test('company profile page shows "Request Employment" for authenticated employees', async ({ page }) => {
    await page.goto('/companies');
    const companyLinks = page.getByRole('link', { name: /view|profile|details/i });
    const cards = page.locator('a[href^="/companies/"]');
    const target = companyLinks.or(cards).first();
    if (await target.count() === 0) {
      test.skip(true, 'No company links found on browse page');
      return;
    }
    await target.click();
    await expect(page).toHaveURL(/\/companies\//);
    // Should see a request employment button OR already employed message
    const btn = page.getByRole('button', { name: /request employment|apply|join/i })
      .or(page.getByText(/already employed|current employee|pending/i));
    await expect(btn.first()).toBeVisible({ timeout: 8_000 });
  });

  test('employment list section visible on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    const section = page.getByText(/employment|request/i).first();
    await expect(section).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Employee — Write Review', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
  });

  test('/companies/:id/review page accessible when employed', async ({ page }) => {
    // Navigate to companies and find one
    await page.goto('/companies');
    const cards = page.locator('a[href^="/companies/"]').first();
    if (await cards.count() === 0) {
      test.skip(true, 'No companies to navigate to');
      return;
    }
    const href = await cards.getAttribute('href');
    await page.goto(`${href}/review`);
    // Should either show the form or "not employed" / redirect
    const content = page.getByText(/write.*review|rate|not.*employed|must.*employed|not authorized/i);
    await expect(content.first()).toBeVisible({ timeout: 8_000 });
  });

  test('write review form has required fields when employed', async ({ page }) => {
    await page.goto('/companies');
    const cards = page.locator('a[href^="/companies/"]').first();
    if (await cards.count() === 0) {
      test.skip(true, 'No companies to navigate to');
      return;
    }
    const href = await cards.getAttribute('href');
    await page.goto(`${href}/review`);

    // If the review form is shown, check for star rating and text area
    const starRating = page.locator('[aria-label*="star"], .star, [data-testid*="star"]')
      .or(page.getByRole('radio', { name: /star|\d/i }));
    const reviewText = page.getByLabel(/review|comment|description/i)
      .or(page.getByPlaceholder(/review|comment|your experience/i));

    const formVisible = await reviewText.count() > 0 || await starRating.count() > 0;
    if (!formVisible) {
      // Might be blocked — not employed there, so the block is expected
      const blocked = await page.getByText(/not.*employed|must.*employed|not authorized|no access/i).count() > 0;
      expect(blocked).toBeTruthy();
    }
  });
});

test.describe('Employee — My Reviews (/dashboard → reviews section)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/dashboard');
  });

  test('my reviews section shows list or empty state', async ({ page }) => {
    // Click reviews tab / navigate
    const reviewTab = page.getByRole('button', { name: /review/i })
      .or(page.getByRole('tab', { name: /review/i }))
      .or(page.getByRole('link', { name: /review/i }));
    if (await reviewTab.count() > 0) await reviewTab.first().click();
    const content = page.getByText(/review|no review|write.*first/i).first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Employee — Internal Feedback (/feedback and /dashboard/feedback)', () => {
  test('feedback page loads with coworker search', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/feedback');
    await expect(page.getByText(/feedback|coworker|peer/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('/dashboard/feedback shows internal feedback page', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/dashboard/feedback');
    await expect(page.getByText(/feedback|coworker|peer|give.*feedback/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('feedback received tab shows received feedback', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/feedback');
    const receivedTab = page.getByRole('tab', { name: /received/i })
      .or(page.getByRole('button', { name: /received/i }));
    if (await receivedTab.count() > 0) {
      await receivedTab.first().click();
      await expect(page.getByText(/received|no feedback|nothing yet/i).first()).toBeVisible({ timeout: 8_000 });
    }
  });

  test('feedback given tab shows given feedback', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/feedback');
    const givenTab = page.getByRole('tab', { name: /given|sent/i })
      .or(page.getByRole('button', { name: /given|sent/i }));
    if (await givenTab.count() > 0) {
      await givenTab.first().click();
      await expect(page.getByText(/given|sent|no feedback|nothing yet/i).first()).toBeVisible({ timeout: 8_000 });
    }
  });
});

test.describe('Employee — Notifications', () => {
  test('notifications section or icon is visible on dashboard', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/dashboard');
    const notifEl = page.getByRole('button', { name: /notification/i })
      .or(page.locator('[aria-label*="notification"]'))
      .or(page.getByText(/notification/i).first());
    await expect(notifEl.first()).toBeVisible({ timeout: 8_000 });
  });
});
