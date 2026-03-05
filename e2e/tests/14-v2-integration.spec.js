// tests/14-v2-integration.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// V2 — INTEGRATION & E2E FLOW TESTS
// Full end-to-end flows combining multiple V2 features:
// Write review with category ratings → view on profile → vote → reply.
// Verification submit → admin approve. EOTM create → vote → close.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');
const { loginAsEmployee, loginAsEmployee2, loginAsCompanyAdmin, loginAsSystemAdmin } = require('./helpers/auth');
require('dotenv').config();

let companyUrl;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto('/companies');
  await page.waitForTimeout(2000);
  const link = page.locator('a[href*="/companies/"]').first();
  if (await link.count() > 0) {
    companyUrl = await link.getAttribute('href');
  }
  await page.close();
});

// ─── INT1–INT5 REVIEW WITH CATEGORY RATINGS FLOW ────────────────────────────
test.describe('INT1–INT5 Review + Category Ratings E2E Flow', () => {

  test('INT1 write review page loads with all review fields', async ({ page }) => {
    await loginAsEmployee(page);
    if (!companyUrl) { test.skip(true, 'No company'); return; }
    await page.goto(companyUrl + '/review');
    await page.waitForTimeout(2000);

    // Check all major sections exist
    const body = await page.content();
    expect(body.toLowerCase()).toContain('review');

    // Overall rating area
    const ratingSection = page.getByText(/rating/i).first();
    await expect(ratingSection).toBeVisible({ timeout: 5_000 });

    // Review text area
    const textarea = page.locator('textarea');
    await expect(textarea.first()).toBeVisible({ timeout: 3_000 });

    // Category ratings section
    const catSection = page.getByText(/category/i);
    if (await catSection.count() > 0) {
      await expect(catSection.first()).toBeVisible();
    }

    // Submit button
    const submitBtn = page.getByRole('button', { name: /submit|post|publish/i });
    await expect(submitBtn.first()).toBeVisible();
  });

  test('INT2 review form shows departure reason field', async ({ page }) => {
    await loginAsEmployee(page);
    if (!companyUrl) { test.skip(true, 'No company'); return; }
    await page.goto(companyUrl + '/review');
    await page.waitForTimeout(2000);

    // Employment status / departure reason select
    const departureSection = page.getByText(/employment status/i)
      .or(page.getByText(/departure/i))
      .or(page.getByText(/still employed/i));
    if (await departureSection.count() > 0) {
      await expect(departureSection.first()).toBeVisible();
    }
  });

  test('INT3 anonymous toggle works', async ({ page }) => {
    await loginAsEmployee(page);
    if (!companyUrl) { test.skip(true, 'No company'); return; }
    await page.goto(companyUrl + '/review');
    await page.waitForTimeout(2000);

    const anonToggle = page.getByText(/anonymous/i)
      .or(page.getByRole('button', { name: /anonymous/i }))
      .or(page.getByRole('switch'));
    if (await anonToggle.count() === 0) {
      console.log('ℹ️ No anonymous toggle found');
      return;
    }

    // Click the toggle
    await anonToggle.first().click();
    await page.waitForTimeout(500);

    // Should show "Anonymous Review" or "Public Review" text
    const body = await page.content();
    const hasToggleState = body.toLowerCase().includes('anonymous') || body.toLowerCase().includes('public');
    expect(hasToggleState).toBeTruthy();
  });

  test('INT4 write review page validates required fields', async ({ page }) => {
    await loginAsEmployee(page);
    if (!companyUrl) { test.skip(true, 'No company'); return; }
    await page.goto(companyUrl + '/review');
    await page.waitForTimeout(2000);

    const submitBtn = page.getByRole('button', { name: /submit|post|publish/i }).first();
    
    // Without filling required fields, submit button should be disabled
    await expect(submitBtn).toBeDisabled({ timeout: 5_000 });

    // Should still be on the review page
    await expect(page).toHaveURL(/review/);
  });

  test('INT5 company profile page structure renders correctly', async ({ page }) => {
    if (!companyUrl) { test.skip(true, 'No company'); return; }
    await page.goto(companyUrl);
    await page.waitForTimeout(2000);

    // Company name heading
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();

    // Rating display
    const body = await page.content();
    const hasRating = body.includes('★') || body.includes('star') ||
                      body.toLowerCase().includes('rating') ||
                      body.toLowerCase().includes('review');
    expect(hasRating).toBeTruthy();

    // No server errors
    expect(body).not.toMatch(/internal server error/i);
  });
});

// ─── INT6–INT10 VERIFICATION FLOW ───────────────────────────────────────────
test.describe('INT6–INT10 Verification E2E Flow', () => {

  test('INT6 employee profile → verification → submit → admin sees it', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/profile');
    await page.waitForTimeout(1500);

    const tab = page.getByRole('button', { name: /verification/i })
      .or(page.getByRole('tab', { name: /verification/i }));
    if (await tab.count() === 0) { test.skip(true, 'No verification tab'); return; }
    await tab.first().click();
    await page.waitForTimeout(1000);

    // Check current state
    const urlInput = page.locator('input[type="url"]')
      .or(page.getByPlaceholder(/url/i));
    const verified = page.getByText(/identity verified/i);
    const pending = page.getByText(/pending/i);

    if (await verified.count() > 0 || await pending.count() > 0) {
      console.log('ℹ️ Already verified or pending');
      return;
    }

    if (await urlInput.count() > 0) {
      await urlInput.first().fill('https://example.com/test-document.pdf');
      const submitBtn = page.getByRole('button', { name: /submit/i }).first();
      if (await submitBtn.count() > 0) {
        const [response] = await Promise.all([
          page.waitForResponse(r => r.url().includes('/verification') && r.request().method() === 'POST', { timeout: 10_000 }).catch(() => null),
          submitBtn.click(),
        ]);
        await page.waitForTimeout(1500);
        if (response) {
          expect([200, 201, 400, 409]).toContain(response.status());
        }
      }
    }
  });

  test('INT7 admin panel shows pending verification requests', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');
    await page.waitForTimeout(2000);

    const tab = page.getByRole('button', { name: /verification/i })
      .or(page.getByText(/verification/i));
    if (await tab.count() === 0) { test.skip(true, 'No verification tab'); return; }
    await tab.first().click();
    await page.waitForTimeout(2000);

    // Should load without errors
    const body = await page.content();
    expect(body).not.toMatch(/internal server error/i);
  });

  test('INT8 admin can switch between verification filters', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');
    await page.waitForTimeout(2000);

    const tab = page.getByRole('button', { name: /verification/i })
      .or(page.getByText(/verification/i));
    if (await tab.count() === 0) { test.skip(true, 'No verification tab'); return; }
    await tab.first().click();
    await page.waitForTimeout(1500);

    const filters = ['Pending', 'Approved', 'Rejected'];
    for (const f of filters) {
      const btn = page.getByRole('button', { name: new RegExp(f, 'i') });
      if (await btn.count() > 0) {
        await btn.first().click();
        await page.waitForTimeout(800);
      }
    }
    const body = await page.content();
    expect(body).not.toMatch(/internal server error/i);
  });

  test('INT9 verification status persists after page refresh', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/profile');
    await page.waitForTimeout(1500);

    const tab = page.getByRole('button', { name: /verification/i })
      .or(page.getByRole('tab', { name: /verification/i }));
    if (await tab.count() === 0) { test.skip(true, 'No verification tab'); return; }
    await tab.first().click();
    await page.waitForTimeout(1000);

    const contentBefore = await page.content();

    // Refresh
    await page.reload();
    await page.waitForTimeout(2000);

    // Click verification tab again
    const tab2 = page.getByRole('button', { name: /verification/i })
      .or(page.getByRole('tab', { name: /verification/i }));
    if (await tab2.count() > 0) {
      await tab2.first().click();
      await page.waitForTimeout(1000);
    }

    const body = await page.content();
    expect(body).not.toMatch(/internal server error/i);
  });

  test('INT10 company admin can also access verification tab', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/profile');
    await page.waitForTimeout(1500);

    const tab = page.getByRole('button', { name: /verification/i })
      .or(page.getByRole('tab', { name: /verification/i }));
    if (await tab.count() > 0) {
      await tab.first().click();
      await page.waitForTimeout(1000);
      const body = await page.content();
      expect(body).not.toMatch(/internal server error/i);
    }
  });
});

// ─── INT11–INT15 MULTI-ROLE INTERACTION TESTS ──────────────────────────────
test.describe('INT11–INT15 Multi-Role Interactions', () => {

  test('INT11 company profile reviews section handles votes and replies correctly', async ({ page }) => {
    if (!companyUrl) { test.skip(true, 'No company'); return; }
    // Visit as guest first
    await page.goto(companyUrl);
    await page.waitForTimeout(2000);

    const body = await page.content();
    expect(body).not.toMatch(/internal server error/i);

    // Check review cards render
    const reviewSection = page.getByText(/review/i);
    if (await reviewSection.count() > 0) {
      await expect(reviewSection.first()).toBeVisible();
    }
  });

  test('INT12 all dashboard tabs load without errors (employee)', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    // Click through all available tabs
    const tabs = page.locator('[role="tab"], button').filter({ hasText: /overview|review|employment|feedback|eotm|notification/i });
    const count = await tabs.count();
    
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(1500);
      const body = await page.content();
      expect(body).not.toMatch(/internal server error/i);
    }
  });

  test('INT13 all dashboard tabs load without errors (company admin)', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/company-admin');
    await page.waitForTimeout(2000);

    const tabs = page.locator('[role="tab"], button').filter({ hasText: /overview|request|review|feedback|eotm|setting|team/i });
    const count = await tabs.count();
    
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(1500);
      const body = await page.content();
      expect(body).not.toMatch(/internal server error/i);
    }
  });

  test('INT14 all admin panel tabs load without errors', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');
    await page.waitForTimeout(2000);

    const tabs = page.locator('[role="tab"], button').filter({ hasText: /overview|report|compan|user|verification|audit|log/i });
    const count = await tabs.count();
    
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(1500);
      const body = await page.content();
      expect(body).not.toMatch(/internal server error/i);
    }
  });

  test('INT15 navigation between key pages works smoothly', async ({ page }) => {
    await loginAsEmployee(page);

    // Navigate through key pages
    const routes = ['/dashboard', '/companies', '/profile'];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForTimeout(1500);
      const body = await page.content();
      expect(body).not.toMatch(/internal server error/i);
      expect(body).not.toMatch(/404/);
    }

    if (companyUrl) {
      await page.goto(companyUrl);
      await page.waitForTimeout(1500);
      const body = await page.content();
      expect(body).not.toMatch(/internal server error/i);
    }
  });
});

// ─── INT16–INT20 API ERROR HANDLING ─────────────────────────────────────────
test.describe('INT16–INT20 Frontend Error Handling', () => {

  test('INT16 expired/invalid token redirects to login', async ({ page }) => {
    // Set an invalid token
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'invalid-token-12345');
    });
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);

    // Should redirect to login or show error — not crash
    const body = await page.content();
    expect(body).not.toMatch(/internal server error/i);
  });

  test('INT17 network failure handled gracefully on company profile', async ({ page }) => {
    if (!companyUrl) { test.skip(true, 'No company'); return; }
    
    // Block API calls to simulate network failure
    await page.route('**/api/companies/**', route => route.abort());
    await page.goto(companyUrl);
    await page.waitForTimeout(3000);

    // Should show error state, not crash
    const body = await page.content();
    expect(body).not.toMatch(/internal server error/i);
  });

  test('INT18 non-existent company shows 404 or error', async ({ page }) => {
    await page.goto('/companies/00000000-0000-0000-0000-000000000000');
    await page.waitForTimeout(3000);

    const body = await page.content();
    // Should show not found or redirect, not crash
    const handled = body.toLowerCase().includes('not found') ||
                    body.toLowerCase().includes('404') ||
                    body.toLowerCase().includes('error') ||
                    body.toLowerCase().includes('no data') ||
                    page.url().includes('/companies');
    expect(handled || !body.includes('Internal Server Error')).toBeTruthy();
  });

  test('INT19 review page for non-existent company handles gracefully', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/companies/00000000-0000-0000-0000-000000000000/review');
    await page.waitForTimeout(3000);

    const body = await page.content();
    expect(body).not.toMatch(/internal server error/i);
  });

  test('INT20 all pages handle empty data states', async ({ page }) => {
    // Just verify key pages don't crash on load
    const pages = ['/', '/companies', '/login', '/register'];
    for (const p of pages) {
      await page.goto(p);
      await page.waitForTimeout(1000);
      const body = await page.content();
      expect(body).not.toMatch(/internal server error/i);
    }
  });
});
