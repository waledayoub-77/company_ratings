// 22-ratehub9-features.spec.js
// ═══════════════════════════════════════════════════════════════════════════════
// E2E TESTS FOR RATEHUB.9 BRANCH FEATURES
//
//   E1  Landing page — real stats from DB (no mock data)
//   E2  Companies page — filters from DB, no Location filter
//   E3  Company profile — Apply button hidden for company admin
//   E4  Company admin dashboard — job fields required (no "optional" label)
//   E5  Employee dashboard — job board tabs, search, pagination controls
//   E6  Employee dashboard — no Delete button on reviews
//   E7  Internal feedback page — updated placeholder + anonymous text
//   E8  Profile page — "Job Title" label, no email edit, no visibility toggle
//   E9  Employee dashboard — EOTM/EOTY vote text ("Results will be revealed")
// ═══════════════════════════════════════════════════════════════════════════════

const { test, expect } = require('@playwright/test');
const {
  loginAsEmployee,
  loginAsCompanyAdmin,
} = require('./helpers/auth');

// ═══════════════════════════════════════════════════════════════════════════
// E1 — LANDING PAGE REAL STATS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('E1 — Landing Page Stats', () => {

  test('E1-A  Landing page loads real stats (no "10,000+" mock text)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The old mock had "10,000+" — should not appear anymore
    const content = await page.textContent('body');
    expect(content).not.toContain('10,000+');
  });

  test('E1-B  Testimonials section is removed', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // No testimonial quotes should exist
    const testimonials = page.getByText(/changed my career/i);
    await expect(testimonials).toHaveCount(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// E2 — COMPANIES PAGE FILTERS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('E2 — Companies Page Filters', () => {

  test('E2-A  No "Location" filter label visible', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('networkidle');

    // Click filters button to show filter panel
    const filtersBtn = page.getByRole('button', { name: /filters/i });
    if (await filtersBtn.isVisible()) {
      await filtersBtn.click();
      await page.waitForTimeout(300);
    }

    // Check that "Location" label does not exist as a filter label
    // But "Country" and "City" and "Industry" should exist
    const labels = page.locator('label');
    const labelTexts = await labels.allTextContents();
    expect(labelTexts.join(' ')).not.toMatch(/\bLocation\b/);
    expect(labelTexts.join(' ')).toContain('Industry');
    expect(labelTexts.join(' ')).toContain('Country');
    expect(labelTexts.join(' ')).toContain('City');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// E3 — COMPANY PROFILE — APPLY BUTTON HIDDEN FOR COMPANY ADMIN
// ═══════════════════════════════════════════════════════════════════════════

test.describe('E3 — Apply Button Visibility', () => {

  test('E3-A  Company admin does not see Apply buttons on own company page', async ({ page }) => {
    await loginAsCompanyAdmin(page);

    // Get company ID from localStorage
    const companyId = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('rh_user') || '{}').companyId || null; }
      catch { return null; }
    });

    if (!companyId) {
      test.skip();
      return;
    }

    await page.goto(`/companies/${companyId}`);
    await page.waitForLoadState('networkidle');

    // Apply buttons should not be visible for company admin
    const applyButtons = page.getByRole('button', { name: /^apply$/i });
    await expect(applyButtons).toHaveCount(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// E4 — JOB FIELDS REQUIRED
// ═══════════════════════════════════════════════════════════════════════════

test.describe('E4 — Job Position Required Fields', () => {

  test('E4-A  Description and Requirements fields show * instead of (optional)', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.waitForLoadState('networkidle');

    // Navigate to company admin dashboard
    const content = await page.textContent('body');

    // Look for the job creation form — may need to click a tab
    const jobTab = page.getByRole('button', { name: /job/i });
    if (await jobTab.isVisible()) {
      await jobTab.click();
      await page.waitForTimeout(500);
    }

    // Check that "(optional)" text does not appear in the job form placeholders
    const pageContent = await page.textContent('body');
    // The old text was "Description (optional)" and "Requirements (optional)"
    expect(pageContent).not.toContain('Description (optional)');
    expect(pageContent).not.toContain('Requirements (optional)');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// E5 — EMPLOYEE DASHBOARD JOB BOARD TABS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('E5 — Job Board Tabs & Search', () => {

  test('E5-A  Job Board has Open Positions and My Applications tabs', async ({ page }) => {
    await loginAsEmployee(page);
    await page.waitForLoadState('networkidle');

    // Navigate to Job Board tab
    const jobBoardTab = page.getByRole('button', { name: /job board/i });
    if (await jobBoardTab.isVisible()) {
      await jobBoardTab.click();
      await page.waitForTimeout(500);
    }

    // Should see the two sub-tabs
    await expect(page.getByRole('button', { name: /open positions/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /my applications/i })).toBeVisible();
  });

  test('E5-B  Search bar is visible in Job Board', async ({ page }) => {
    await loginAsEmployee(page);
    await page.waitForLoadState('networkidle');

    const jobBoardTab = page.getByRole('button', { name: /job board/i });
    if (await jobBoardTab.isVisible()) {
      await jobBoardTab.click();
      await page.waitForTimeout(500);
    }

    // Search input should be present
    const searchInput = page.getByPlaceholder(/search by job name/i);
    await expect(searchInput).toBeVisible();
  });

  test('E5-C  Clicking My Applications tab shows application list', async ({ page }) => {
    await loginAsEmployee(page);
    await page.waitForLoadState('networkidle');

    const jobBoardTab = page.getByRole('button', { name: /job board/i });
    if (await jobBoardTab.isVisible()) {
      await jobBoardTab.click();
      await page.waitForTimeout(500);
    }

    // Click My Applications tab
    await page.getByRole('button', { name: /my applications/i }).click();
    await page.waitForTimeout(300);

    // Should show either application items or an empty state message
    const content = await page.textContent('body');
    const hasApps = content.includes('Applied') || content.includes("haven't applied");
    expect(hasApps).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// E6 — NO DELETE BUTTON ON EMPLOYEE REVIEWS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('E6 — Review Delete Button Removed', () => {

  test('E6-A  Employee reviews tab has no Delete button', async ({ page }) => {
    await loginAsEmployee(page);
    await page.waitForLoadState('networkidle');

    // Navigate to Reviews tab
    const reviewsTab = page.getByRole('button', { name: /reviews/i });
    if (await reviewsTab.isVisible()) {
      await reviewsTab.click();
      await page.waitForTimeout(500);
    }

    // No Trash/Delete buttons should be visible
    const deleteButtons = page.getByRole('button', { name: /delete/i });
    await expect(deleteButtons).toHaveCount(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// E7 — INTERNAL FEEDBACK PAGE TEXT
// ═══════════════════════════════════════════════════════════════════════════

test.describe('E7 — Feedback Page Text', () => {

  test('E7-A  Search placeholder says "Search by name..."', async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto('/feedback');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder('Search by name...');
    await expect(searchInput).toBeVisible();
  });

  test('E7-B  Info banner mentions feedback can be anonymous', async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto('/feedback');
    await page.waitForLoadState('networkidle');

    // Should say "can be anonymous" instead of "not anonymous"
    const content = await page.textContent('body');
    expect(content).toContain('can be anonymous');
    expect(content).not.toContain('not anonymous');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// E8 — PROFILE PAGE CHANGES
// ═══════════════════════════════════════════════════════════════════════════

test.describe('E8 — Profile Page', () => {

  test('E8-A  Shows "Job Title" instead of "Position"', async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content).toContain('Job Title');
  });

  test('E8-B  No email input field when editing', async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Click Edit button
    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(500);
    }

    // Should NOT have an editable email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveCount(0);

    // But should still display the email as text
    const content = await page.textContent('body');
    expect(content).toContain('Email');
  });

  test('E8-C  No Profile Visibility toggle when editing', async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Click Edit button
    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(500);
    }

    // Should NOT have Public/Private visibility buttons
    const content = await page.textContent('body');
    expect(content).not.toMatch(/Profile Visibility/);
  });

  test('E8-D  No email change warning text', async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(500);
    }

    const content = await page.textContent('body');
    expect(content).not.toContain('Changing your email will sign you out');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// E9 — EOTM/EOTY VOTE TEXT
// ═══════════════════════════════════════════════════════════════════════════

test.describe('E9 — Vote Visibility Text', () => {

  test('E9-A  No "Vote counts hidden" text visible', async ({ page }) => {
    await loginAsEmployee(page);
    await page.waitForLoadState('networkidle');

    // Check EOTM tab if it exists
    const eotmTab = page.getByRole('button', { name: /eotm|employee of the month/i });
    if (await eotmTab.isVisible()) {
      await eotmTab.click();
      await page.waitForTimeout(500);

      const content = await page.textContent('body');
      // Should NOT contain old text
      expect(content).not.toContain('Vote counts hidden');
    }
  });
});
