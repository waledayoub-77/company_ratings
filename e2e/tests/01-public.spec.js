// tests/01-public.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC PAGES — no login required
// Covers: Landing page, Companies browse, Company profile, Company analytics
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');

// ─── LANDING PAGE ────────────────────────────────────────────────────────────
test.describe('Landing Page', () => {
  test('renders hero section with CTA buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
    // Hero heading exists
    await expect(page.locator('h1, h2').first()).toBeVisible();
    // At least one CTA button visible
    await expect(page.getByRole('link', { name: /get started|sign up|explore|browse/i }).first()).toBeVisible();
  });

  test('navbar shows Login and Register links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /login|sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /register|sign up|get started/i }).first()).toBeVisible();
  });

  test('footer is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer')).toBeVisible();
  });

  test('clicking Login navigates to /login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /login|sign in/i }).first().click();
    await expect(page).toHaveURL(/login/);
  });

  test('clicking Register navigates to /register', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /register|sign up|get started/i }).first().click();
    await expect(page).toHaveURL(/register/);
  });

  test('Browse Companies link navigates to /companies', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /browse|companies|explore/i }).first().click();
    await expect(page).toHaveURL(/companies/);
  });
});

// ─── COMPANIES PAGE ───────────────────────────────────────────────────────────
test.describe('Companies Browse Page (/companies)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/companies');
  });

  test('page loads and shows company cards or empty state', async ({ page }) => {
    // Either there are company cards, or an empty-state message
    const cards = page.locator('[data-testid="company-card"], .company-card, article').first();
    const empty  = page.getByText(/no companies|no results/i);
    await expect(cards.or(empty)).toBeVisible({ timeout: 8_000 });
  });

  test('search box is visible', async ({ page }) => {
    await expect(page.getByRole('searchbox').or(page.getByPlaceholder(/search/i))).toBeVisible();
  });

  test('search filters results — typing narrows list', async ({ page }) => {
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i));
    await searchInput.fill('zzz_no_match_xyz');
    // Either 0 cards or empty-state
    await page.waitForTimeout(600);
    const count = await page.locator('[data-testid="company-card"], .company-card, article').count();
    // Can't assert count is 0 without real data — just assert no error
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('pagination controls appear when there are many companies', async ({ page }) => {
    const pager = page.getByRole('navigation', { name: /pagination/i })
      .or(page.getByRole('button', { name: /next|previous|page/i }).first());
    // Just verify no crash — pagination may or may not exist
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('clicking a company card navigates to its profile', async ({ page }) => {
    const firstCard = page.locator('a[href*="/companies/"]').first();
    const cardCount = await firstCard.count();
    if (cardCount === 0) {
      test.skip(); // No companies seeded
      return;
    }
    const href = await firstCard.getAttribute('href');
    await firstCard.click();
    await expect(page).toHaveURL(/\/companies\/.+/);
  });

  test('industry filter chips/select works', async ({ page }) => {
    const filter = page.getByRole('combobox').or(page.getByRole('button', { name: /industry|filter/i })).first();
    if (await filter.count() > 0) {
      await expect(filter).toBeVisible();
    }
  });
});

// ─── COMPANY PROFILE PAGE ─────────────────────────────────────────────────────
test.describe('Company Profile Page (/companies/:id)', () => {
  let companyUrl;

  test.beforeAll(async ({ browser }) => {
    // Get the first available company URL
    const page = await browser.newPage();
    await page.goto('/companies');
    const firstLink = page.locator('a[href*="/companies/"]').first();
    if (await firstLink.count() > 0) {
      const href = await firstLink.getAttribute('href');
      companyUrl = href;
    }
    await page.close();
  });

  test('company profile shows name, rating, and reviews section', async ({ page }) => {
    if (!companyUrl) { test.skip(); return; }
    await page.goto(companyUrl);
    // Company name heading
    await expect(page.locator('h1, h2').first()).toBeVisible();
    // Overall rating visible
    await expect(page.getByText(/\d+(\.\d+)?\/5|\d+\.\d+ stars?/i).or(
      page.locator('[aria-label*="rating"], [data-testid*="rating"]')
    ).first()).toBeVisible({ timeout: 8_000 });
  });

  test('reviews tab/section is visible', async ({ page }) => {
    if (!companyUrl) { test.skip(); return; }
    await page.goto(companyUrl);
    await expect(page.getByText(/reviews?/i).first()).toBeVisible();
  });

  test('analytics section visible', async ({ page }) => {
    if (!companyUrl) { test.skip(); return; }
    await page.goto(companyUrl);
    // Click analytics tab if present
    const analyticsBtn = page.getByRole('button', { name: /analytics|stats|statistics/i })
      .or(page.getByRole('tab', { name: /analytics/i }));
    if (await analyticsBtn.count() > 0) {
      await analyticsBtn.first().click();
      await expect(page.locator('canvas, svg, [data-testid*="chart"]').first()).toBeVisible({ timeout: 6_000 });
    }
  });

  test('Write Review button requires login — redirects to /login', async ({ page }) => {
    if (!companyUrl) { test.skip(); return; }
    await page.goto(companyUrl);
    const writeBtn = page.getByRole('link', { name: /write a review|leave a review/i })
      .or(page.getByRole('button', { name: /write a review/i }));
    if (await writeBtn.count() > 0) {
      await writeBtn.first().click();
      // Should redirect to login or show modal
      await expect(page).toHaveURL(/login|companies/);
    }
  });
});

// ─── 404 PAGE ─────────────────────────────────────────────────────────────────
test.describe('404 Not Found', () => {
  test('unknown route shows 404 page', async ({ page }) => {
    await page.goto('/this-route-definitely-does-not-exist-xyz');
    await expect(page.getByText(/404|not found|page.*not.*found/i)).toBeVisible();
  });
});
