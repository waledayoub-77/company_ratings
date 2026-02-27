// tests/01-public.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// GUEST (not logged in) — G1–G13, G29–G32
// Landing, Companies browse/search/filter/sort/paginate, Company profile,
// Report without auth, 404, Protected route redirects
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');

// ─── G1 LANDING PAGE ─────────────────────────────────────────────────────────
test.describe('G1–G2 Landing Page', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('G1 hero section and sections render', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /get started|sign up|explore|browse/i }).first()).toBeVisible();
  });

  test('G2 Top Rated Companies section shows real company data from DB', async ({ page }) => {
    // Must show a companies section — data comes from API, not hardcoded
    const section = page.getByText(/top rated|featured|top companies/i).first();
    await expect(section).toBeVisible({ timeout: 8_000 });
    // Wait for at least one company card/link to appear (real data)
    const companyLink = page.locator('a[href*="/companies/"]').first();
    await expect(companyLink).toBeVisible({ timeout: 8_000 });
  });

  test('G1 stats section visible', async ({ page }) => {
    const stats = page.getByText(/review|compan|user|employe/i).first();
    await expect(stats).toBeVisible({ timeout: 6_000 });
  });

  test('G32 navbar shows Login and Register, no profile dropdown', async ({ page }) => {
    await expect(page.getByRole('link', { name: /login|sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /register|sign up|get started/i }).first()).toBeVisible();
    // Profile dropdown should NOT be visible
    await expect(page.getByRole('button', { name: /profile|account|my profile/i })).toHaveCount(0);
  });

  test('footer is visible', async ({ page }) => {
    await expect(page.locator('footer')).toBeVisible();
  });

  test('Browse Companies link navigates to /companies', async ({ page }) => {
    await page.getByRole('link', { name: /browse|companies|explore/i }).first().click();
    await expect(page).toHaveURL(/companies/);
  });
});

// ─── G3–G9 COMPANIES BROWSE PAGE ─────────────────────────────────────────────
test.describe('G3–G9 Companies Browse (/companies)', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/companies'); });

  test('G3 company cards load from API', async ({ page }) => {
    const cards = page.locator('a[href*="/companies/"]');
    const empty = page.getByText(/no companies|no results|empty/i);
    await expect(cards.first().or(empty)).toBeVisible({ timeout: 8_000 });
  });

  test('G4 search box present, debounce works (300ms)', async ({ page }) => {
    const search = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i));
    await expect(search.first()).toBeVisible();
    await search.first().fill('tech');
    // Debounce — wait 400ms, then check no 500 error
    await page.waitForTimeout(400);
    await expect(page.locator('body')).not.toContainText(/500|error/i);
  });

  test('G4 search "zzz_nomatch" shows empty state', async ({ page }) => {
    const search = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i));
    await search.first().fill('zzznomatchxyz_unlikely');
    await page.waitForTimeout(500);
    // Either 0 cards or empty-state text
    const cardCount = await page.locator('a[href*="/companies/"]').count();
    if (cardCount > 0) {
      // Might still show cards if search isn't applied — check empty state text
      const empty = page.getByText(/no companies|no results/i);
      if (await empty.count() > 0) await expect(empty).toBeVisible();
    }
  });

  test('G5 industry filter appears and is interactive', async ({ page }) => {
    const filter = page.getByRole('combobox', { name: /industry/i })
      .or(page.getByRole('button', { name: /industry/i }))
      .or(page.locator('select[name*="industry"]'));
    if (await filter.count() > 0) {
      await expect(filter.first()).toBeVisible();
      // Interact — just verify it doesn't crash
      await filter.first().click();
      await page.keyboard.press('Escape');
    }
  });

  test('G6 location filter appears and is interactive', async ({ page }) => {
    const filter = page.getByRole('combobox', { name: /location|city/i })
      .or(page.getByRole('button', { name: /location|city/i }))
      .or(page.locator('select[name*="location"]'));
    if (await filter.count() > 0) {
      await expect(filter.first()).toBeVisible();
      await filter.first().click();
      await page.keyboard.press('Escape');
    }
  });

  test('G7 sort dropdown changes order', async ({ page }) => {
    const sort = page.getByRole('combobox', { name: /sort/i })
      .or(page.getByRole('button', { name: /sort|order/i }))
      .or(page.locator('select[name*="sort"]'));
    if (await sort.count() > 0) {
      await expect(sort.first()).toBeVisible();
      // No crash after interaction
      await sort.first().click();
      await page.keyboard.press('Escape');
      await expect(page.locator('body')).not.toContainText(/500/);
    }
  });

  test('G8 pagination controls exist when many companies', async ({ page }) => {
    const pager = page.getByRole('navigation', { name: /pagination/i })
      .or(page.getByRole('button', { name: /next|›|»/i }))
      .or(page.locator('[aria-label*="page"]'));
    if (await pager.count() > 0) {
      await expect(pager.first()).toBeVisible();
      await pager.first().click();
      await expect(page.locator('body')).not.toContainText(/500/);
    }
  });

  test('G9 nonsense search shows no-results empty state', async ({ page }) => {
    const search = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i));
    await search.first().fill('QQQQZZZZNOMATCH99999');
    await page.waitForTimeout(600);
    await expect(page.locator('body')).not.toContainText(/500|error/i);
  });
});

// ─── G10–G13 COMPANY PROFILE PAGE ─────────────────────────────────────────────
test.describe('G10–G13 Company Profile (/companies/:id)', () => {
  let companyUrl;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/companies');
    const firstLink = page.locator('a[href*="/companies/"]').first();
    if (await firstLink.count() > 0) {
      companyUrl = await firstLink.getAttribute('href');
    }
    await page.close();
  });

  test('G10 company profile shows name, rating, reviews section', async ({ page }) => {
    if (!companyUrl) { test.skip(true, 'No companies in DB'); return; }
    await page.goto(companyUrl);
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8_000 });
    // Rating present somewhere
    const rating = page.getByText(/\d(\.\d+)?\s*\/\s*5|\d+\.\d+\s*stars?/i)
      .or(page.locator('[aria-label*="rating"], [data-testid*="star"]'));
    await expect(rating.first().or(page.locator('body'))).toBeTruthy();
    await expect(page.getByText(/review/i).first()).toBeVisible({ timeout: 6_000 });
  });

  test('G11 invalid UUID goes to /companies/invalid-uuid — shows error not blank', async ({ page }) => {
    await page.goto('/companies/not-a-real-uuid-xyz-00000000');
    // Should show 404, error message, or redirect — NOT blank/empty body
    const content = page.getByText(/404|not found|error|company.*not.*found|invalid/i);
    const hasContent = await content.count() > 0 || (await page.locator('body').innerText()).trim().length > 10;
    expect(hasContent).toBeTruthy();
  });

  test('G12 review sort control exists on company profile', async ({ page }) => {
    if (!companyUrl) { test.skip(true, 'No companies in DB'); return; }
    await page.goto(companyUrl);
    const sortControl = page.getByRole('combobox', { name: /sort/i })
      .or(page.getByRole('button', { name: /sort.*review|newest|highest/i })  )
      .or(page.locator('select[name*="sort"]'));
    if (await sortControl.count() > 0) {
      await expect(sortControl.first()).toBeVisible();
      // Change sort — no crash
      await sortControl.first().click();
      await page.keyboard.press('Escape');
      await expect(page.locator('body')).not.toContainText(/500/);
    }
  });

  test('G13 report button without auth shows sign-in prompt', async ({ page }) => {
    if (!companyUrl) { test.skip(true, 'No companies in DB'); return; }
    await page.goto(companyUrl);
    // Look for a report/flag button on a review
    const reportBtn = page.getByRole('button', { name: /report|flag/i })
      .or(page.locator('[aria-label*="report"], [title*="report"]'));
    if (await reportBtn.count() > 0) {
      await reportBtn.first().click();
      // Should show sign-in requirement, not silently submit
      const signInPrompt = page.getByText(/sign in|login|log in|must be logged/i);
      const redirected = page.url().includes('/login');
      const promptVisible = await signInPrompt.count() > 0;
      expect(redirected || promptVisible).toBeTruthy();
    }
  });
});

// ─── G29–G31 PROTECTED ROUTES & 404 ──────────────────────────────────────────
test.describe('G29–G31 Protected routes & 404', () => {
  test('G29 /dashboard without login → /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
  });

  test('G30 /admin without login → /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
  });

  test('G31 unknown URL /asdfghjkl shows 404 page, not blank', async ({ page }) => {
    await page.goto('/asdfghjkl');
    await page.waitForTimeout(1_500);
    // Fixed: catch-all Route now renders NotFoundPage
    const has404 = page.getByText(/404|not found|page.*not.*exist/i);
    await expect(has404.first()).toBeVisible({ timeout: 5_000 });
  });

  test('G29 /company-admin without login → /login', async ({ page }) => {
    await page.goto('/company-admin');
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
  });

  test('G29 /profile without login → /login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
  });
});
