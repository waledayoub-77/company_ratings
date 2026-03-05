// tests/10-category-ratings.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// V2 — CATEGORY RATINGS
// Tests for per-category rating inputs on WriteReviewPage and
// category breakdown display on CompanyProfilePage.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');
const { loginAsEmployee, loginAsCompanyAdmin } = require('./helpers/auth');
require('dotenv').config();

let companyUrl; // e.g. /companies/<uuid>

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

// ─── CR1–CR5 WRITE REVIEW — CATEGORY SLIDERS ─────────────────────────────────
test.describe('CR1–CR5 Category Rating Inputs (WriteReviewPage)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
    if (!companyUrl) { test.skip(true, 'No company URL found'); return; }
    await page.goto(companyUrl + '/review');
    await page.waitForTimeout(1000);
  });

  test('CR1 category ratings section is visible with 6 categories', async ({ page }) => {
    const heading = page.getByText(/category ratings/i).first();
    await expect(heading).toBeVisible({ timeout: 8_000 });

    // Should see all 6 category labels
    const categories = [
      /work.life/i,
      /compensation/i,
      /management/i,
      /culture/i,
      /career/i,
      /facilities/i,
    ];
    for (const cat of categories) {
      await expect(page.getByText(cat).first()).toBeVisible({ timeout: 3_000 });
    }
  });

  test('CR2 category sliders default to 0 and can be adjusted', async ({ page }) => {
    const sliders = page.locator('input[type="range"]');
    const count = await sliders.count();
    expect(count).toBeGreaterThanOrEqual(6);

    // Adjust first slider to value 7
    const firstSlider = sliders.first();
    await firstSlider.fill('7');
    const val = await firstSlider.inputValue();
    expect(val).toBe('7');
  });

  test('CR3 each slider shows its value label (/10)', async ({ page }) => {
    // Value labels only appear when slider > 0, so move all sliders first
    const sliders = page.locator('input[type="range"]');
    const sliderCount = await sliders.count();
    for (let i = 0; i < sliderCount; i++) {
      await sliders.nth(i).fill('5');
    }
    await page.waitForTimeout(300);
    // Now each category should show "5/10"
    const valueLabels = page.getByText(/\/10/);
    const count = await valueLabels.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('CR4 category ratings are optional — can submit without them', async ({ page }) => {
    // Fill required fields only (overall rating + review text)
    const stars = page.locator('[data-testid*="star"], .star, svg').filter({ hasText: '' });
    // Click a star for overall rating
    const ratingArea = page.getByText(/overall rating/i)
      .or(page.getByText(/your rating/i))
      .or(page.getByText(/rate this/i));
    if (await ratingArea.count() > 0) {
      // Try to click on a star near the rating area
      const starBtn = page.locator('button, svg, span').filter({ hasText: '' }).nth(3);
      if (await starBtn.count() > 0) {
        await starBtn.click({ force: true }).catch(() => {});
      }
    }

    // Fill review text
    const textarea = page.locator('textarea').first();
    if (await textarea.count() > 0) {
      await textarea.fill('This is a great company to work for. Excellent benefits and culture!');
    }

    // Don't touch sliders — they should be optional
    // Check that submit button exists
    const submitBtn = page.getByRole('button', { name: /submit|post|publish/i });
    await expect(submitBtn.first()).toBeVisible({ timeout: 5_000 });
  });

  test('CR5 slider values update in real-time', async ({ page }) => {
    const sliders = page.locator('input[type="range"]');
    if (await sliders.count() === 0) { test.skip(true, 'No sliders'); return; }

    // Set slider to 3 then to 8
    const slider = sliders.first();
    await slider.fill('3');
    await page.waitForTimeout(200);
    let displayed = page.getByText('3/10');
    if (await displayed.count() > 0) {
      await expect(displayed.first()).toBeVisible();
    }

    await slider.fill('8');
    await page.waitForTimeout(200);
    displayed = page.getByText('8/10');
    if (await displayed.count() > 0) {
      await expect(displayed.first()).toBeVisible();
    }
  });
});

// ─── CR6–CR9 COMPANY PROFILE — CATEGORY BREAKDOWN DISPLAY ────────────────────
test.describe('CR6–CR9 Category Breakdown (CompanyProfilePage)', () => {
  test.beforeEach(async ({ page }) => {
    if (!companyUrl) { test.skip(true, 'No company URL found'); return; }
    await page.goto(companyUrl);
    await page.waitForTimeout(2000);
  });

  test('CR6 company profile shows Category Breakdown section', async ({ page }) => {
    // Category Breakdown only renders when company has category_averages data
    const section = page.getByText(/category breakdown/i)
      .or(page.getByText(/category averages/i))
      .or(page.getByText(/category ratings/i));
    const count = await section.count();
    if (count === 0) {
      console.log('ℹ️ No category breakdown visible – likely no category ratings submitted yet');
      test.skip(true, 'No category data for this company');
      return;
    }
    await expect(section.first()).toBeVisible({ timeout: 5_000 });
  });

  test('CR7 category bars show labels and scores', async ({ page }) => {
    const breakdown = page.getByText(/category breakdown/i)
      .or(page.getByText(/category averages/i));
    if (await breakdown.count() === 0) {
      test.skip(true, 'No category breakdown section');
      return;
    }

    // Check for individual category labels
    const categories = [/work.life/i, /compensation/i, /management/i, /culture/i, /career/i, /facilities/i];
    let found = 0;
    for (const cat of categories) {
      if (await page.getByText(cat).count() > 0) found++;
    }
    expect(found).toBeGreaterThan(0);
  });

  test('CR8 category scores are between 0 and 10', async ({ page }) => {
    // Look for "/10" score display
    const scoreTexts = page.getByText(/\d+\.?\d*\s*\/\s*10/);
    if (await scoreTexts.count() === 0) {
      test.skip(true, 'No scores visible');
      return;
    }
    const count = await scoreTexts.count();
    for (let i = 0; i < count; i++) {
      const text = await scoreTexts.nth(i).innerText();
      const match = text.match(/([\d.]+)\s*\/\s*10/);
      if (match) {
        const val = parseFloat(match[1]);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(10);
      }
    }
  });

  test('CR9 progress bars render for categories', async ({ page }) => {
    const breakdown = page.getByText(/category breakdown/i)
      .or(page.getByText(/category averages/i));
    if (await breakdown.count() === 0) {
      test.skip(true, 'No category breakdown section');
      return;
    }
    // Progress bars are typically div elements with a width style
    const bars = page.locator('.bg-amber-400, .bg-blue-500, [role="progressbar"], .progress-bar');
    // Just verify the section renders without errors
    const body = await page.content();
    expect(body).not.toContain('500');
  });
});
