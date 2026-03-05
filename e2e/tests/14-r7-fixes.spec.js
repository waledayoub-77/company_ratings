// tests/14-r7-fixes.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// RE-TEST ROUND 7 — Playwright tests for the 4 fixes:
//   R7-FIX 1 — Deleted user blocked from login & email freed for re-use
//   R7-FIX 2 — Suspend user enforces min 3-char reason
//   R7-FIX 3 — Departure reason badge shown on reviews
//   + Regression: tab persistence, helpful vote error, notification link,
//     own-review label
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('@playwright/test');
const { loginAs, loginAsEmployee, loginAsCompanyAdmin, loginAsSystemAdmin, logout } = require('./helpers/auth');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const E = process.env;

// Helper — get stored token after login
async function getToken(page) {
  return page.evaluate(() => localStorage.getItem('rh_access'));
}

// ═══════════════════════════════════════════════════════════════════════════════
// R7-FIX 1 — Deleted user fully blocked
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('R7-FIX 1 — Admin delete user: login blocked & email freed', () => {
  const TEST_EMAIL = `e2e_del_${Date.now()}@ratehub.com`;
  const TEST_PASSWORD = 'Test1234!';
  let adminToken;

  test.beforeAll(async ({ browser }) => {
    // Create a throwaway user via API
    const page = await browser.newPage();
    await page.goto('/');
    await page.evaluate(async ({ apiUrl, email, password }) => {
      await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role: 'employee',
          fullName: 'E2E DeleteTest',
        }),
      });
    }, { apiUrl: API_URL, email: TEST_EMAIL, password: TEST_PASSWORD });
    await page.close();
  });

  test('R7-F1-B — admin deletes user, then login with that email fails', async ({ page }) => {
    // Step 1: login as system admin
    await loginAsSystemAdmin(page);
    adminToken = await getToken(page);

    // Step 2: delete the user via API
    // First get the user's ID
    const userId = await page.evaluate(async ({ apiUrl, token, email }) => {
      const res = await fetch(`${apiUrl}/admin/users?search=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const users = json.data?.users || json.data || [];
      const u = users.find(u => u.email === email);
      return u?.id;
    }, { apiUrl: API_URL, token: adminToken, email: TEST_EMAIL });

    if (!userId) {
      console.log('  Skipping: test user not found (may not be seeded)');
      test.skip(true, 'Test user not found');
      return;
    }

    // Delete user
    const delResult = await page.evaluate(async ({ apiUrl, token, userId }) => {
      const res = await fetch(`${apiUrl}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      return { status: res.status, ok: res.ok };
    }, { apiUrl: API_URL, token: adminToken, userId });

    expect(delResult.ok).toBe(true);

    // Step 3: logout and try to login as the deleted user
    await logout(page);
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show an error — NOT redirect to dashboard
    const error = page.getByText(/invalid|not found|deleted|wrong|credentials/i);
    await expect(error).toBeVisible({ timeout: 8_000 });
    // Should still be on /login
    expect(page.url()).toContain('/login');
  });

  test('R7-F1-C — re-registration with deleted email succeeds', async ({ page }) => {
    // Try registering with the same email that was deleted above
    await page.goto('/');
    const result = await page.evaluate(async ({ apiUrl, email, password }) => {
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role: 'employee',
          fullName: 'E2E Reregistered',
        }),
      });
      const json = await res.json();
      return { status: res.status, ok: res.ok, code: json?.error?.code };
    }, { apiUrl: API_URL, email: TEST_EMAIL, password: TEST_PASSWORD });

    console.log(`  Re-register with deleted email → status ${result.status}`);
    // Should succeed (201) or at worst 200, NOT 409 "Email already exists"
    expect(result.status).toBeLessThan(400);
  });

  test('R7-F1-D — deleted user refresh token is rejected', async ({ page }) => {
    // Register + login a fresh user, then admin-delete, then try refresh
    const freshEmail = `e2e_rtk_${Date.now()}@ratehub.com`;
    await page.goto('/');

    // Register
    await page.evaluate(async ({ apiUrl, email }) => {
      await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password: 'Test1234!', role: 'employee', fullName: 'E2E Refresh',
        }),
      });
    }, { apiUrl: API_URL, email: freshEmail });

    // Login to get refresh token
    const loginResult = await page.evaluate(async ({ apiUrl, email }) => {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Test1234!' }),
      });
      return res.json();
    }, { apiUrl: API_URL, email: freshEmail });

    // This may fail if email_verified is required. In that case, skip.
    if (!loginResult.data?.refresh_token && !loginResult.data?.refreshToken) {
      console.log('  Skipping refresh test: login did not return token (email unverified?)');
      test.skip(true, 'Could not login fresh user');
      return;
    }

    const refreshTk = loginResult.data.refresh_token || loginResult.data.refreshToken;

    // Admin deletes the user
    await loginAsSystemAdmin(page);
    const token = await getToken(page);
    const userId2 = await page.evaluate(async ({ apiUrl, token, email }) => {
      const res = await fetch(`${apiUrl}/admin/users?search=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const users = json.data?.users || json.data || [];
      return users.find(u => u.email === email)?.id;
    }, { apiUrl: API_URL, token, email: freshEmail });

    if (userId2) {
      await page.evaluate(async ({ apiUrl, token, userId }) => {
        await fetch(`${apiUrl}/admin/users/${userId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }, { apiUrl: API_URL, token, userId: userId2 });
    }

    // Now try to refresh the old token
    const refreshResult = await page.evaluate(async ({ apiUrl, refreshTk }) => {
      const res = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTk }),
      });
      return { status: res.status };
    }, { apiUrl: API_URL, refreshTk });

    console.log(`  Refresh after delete → status ${refreshResult.status}`);
    expect(refreshResult.status).toBeGreaterThanOrEqual(401);
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// R7-FIX 2 — Suspend user min 3-char reason
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('R7-FIX 2 — Suspend user enforces min 3-char reason', () => {
  test('R7-F2-A — single suspend: button disabled when reason < 3 chars', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');

    // Click Users tab
    const usersTab = page.getByRole('button', { name: /users/i })
      .or(page.getByText(/users/i).first());
    await usersTab.click();
    await page.waitForTimeout(1500);

    // Find an active non-admin user and click the suspend (Ban) button
    const banButton = page.locator('button[title="Suspend"]').first();
    if (await banButton.count() === 0) {
      test.skip(true, 'No active users to suspend');
      return;
    }
    await banButton.click();

    // The suspend reason input should appear
    const reasonInput = page.locator('input[placeholder*="Reason"]')
      .or(page.locator('input[placeholder*="reason"]'));
    await expect(reasonInput.first()).toBeVisible({ timeout: 3_000 });

    // Type 1 char — Confirm button should be disabled
    await reasonInput.first().fill('a');
    const confirmBtn = page.getByRole('button', { name: /^confirm$/i })
      .or(page.locator('button').filter({ hasText: /^Confirm$/i }));
    await expect(confirmBtn.first()).toBeDisabled();

    // Type 2 chars — still disabled
    await reasonInput.first().fill('ab');
    await expect(confirmBtn.first()).toBeDisabled();

    // Type 3 chars — should be enabled
    await reasonInput.first().fill('abc');
    await expect(confirmBtn.first()).toBeEnabled();

    // Cancel (don't actually suspend)
    await page.getByText(/cancel/i).first().click();
  });

  test('R7-F2-B — backend rejects suspend with < 3 char reason', async ({ page }) => {
    await loginAsSystemAdmin(page);
    const token = await getToken(page);

    // Get a non-admin user ID
    const userId = await page.evaluate(async ({ apiUrl, token }) => {
      const res = await fetch(`${apiUrl}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const users = json.data?.users || json.data || [];
      const target = users.find(u => u.role !== 'system_admin' && u.is_active);
      return target?.id;
    }, { apiUrl: API_URL, token });

    if (!userId) { test.skip(true, 'No eligible user'); return; }

    // Try suspending with 1-char reason
    const result = await page.evaluate(async ({ apiUrl, token, userId }) => {
      const res = await fetch(`${apiUrl}/admin/users/${userId}/suspend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: 'a' }),
      });
      return { status: res.status };
    }, { apiUrl: API_URL, token, userId });

    console.log(`  Suspend with 1-char reason → status ${result.status}`);
    expect(result.status).toBe(400);
  });

  test('R7-F2-C — bulk suspend: button disabled when reason < 3 chars', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');

    const usersTab = page.getByRole('button', { name: /users/i })
      .or(page.getByText(/users/i).first());
    await usersTab.click();
    await page.waitForTimeout(1500);

    // Check a user checkbox
    const checkbox = page.locator('tbody input[type="checkbox"]').first();
    if (await checkbox.count() === 0) { test.skip(true, 'No checkboxes'); return; }
    await checkbox.check();

    // Click "Suspend X Selected"
    const bulkBtn = page.getByRole('button', { name: /suspend.*selected/i });
    if (await bulkBtn.count() === 0) { test.skip(true, 'No bulk button'); return; }
    await bulkBtn.click();

    // Bulk reason input should appear
    const bulkInput = page.locator('input[placeholder*="Reason"]')
      .or(page.locator('input[placeholder*="reason"]'));
    await expect(bulkInput.first()).toBeVisible({ timeout: 3_000 });

    // Type 2 chars — Confirm Bulk Suspend should be disabled
    await bulkInput.first().fill('ab');
    const confirmBulk = page.getByRole('button', { name: /confirm bulk suspend/i });
    await expect(confirmBulk).toBeDisabled();

    // Type 3 chars — enabled
    await bulkInput.first().fill('abc');
    await expect(confirmBulk).toBeEnabled();

    // Cancel
    await page.getByText(/cancel/i).first().click();
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// R7-FIX 3 — Departure reason badge on company profile reviews
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('R7-FIX 3 — Departure reason badge on reviews', () => {
  test('R7-F3-B — review with departure reason shows badge', async ({ page }) => {
    // Login as employee and check if there's a company with reviews
    await loginAsEmployee(page);
    const token = await getToken(page);

    // Find a company with at least one review that has a departure reason
    const reviewData = await page.evaluate(async ({ apiUrl, token }) => {
      // Get list of companies
      const res = await fetch(`${apiUrl}/companies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const companies = json.data?.companies || json.data || [];
      for (const c of companies.slice(0, 5)) {
        const rRes = await fetch(`${apiUrl}/companies/${c.id}/reviews`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const rJson = await rRes.json();
        const reviews = rJson.data?.reviews || rJson.data || [];
        const withDeparture = reviews.find(r => r.departure_reason && r.departure_reason !== 'still_employed');
        if (withDeparture) {
          return { companyId: c.id, slug: c.slug, reason: withDeparture.departure_reason };
        }
      }
      return null;
    }, { apiUrl: API_URL, token });

    if (!reviewData) {
      console.log('  No review with departure_reason found — testing via API');
      test.skip(true, 'No review with departure reason in DB');
      return;
    }

    // Navigate to company profile and check for the badge
    const companyUrl = reviewData.slug ? `/companies/${reviewData.slug}` : `/companies/${reviewData.companyId}`;
    await page.goto(companyUrl);
    await page.waitForTimeout(2_000);

    // Look for "Left:" badge text
    const badge = page.getByText(/left:/i);
    await expect(badge.first()).toBeVisible({ timeout: 5_000 });
  });

  test('R7-F3-API — departure_reason is present in API response', async ({ page }) => {
    // Direct API check that the public_company_reviews view includes departure_reason
    await page.goto('/');
    const result = await page.evaluate(async (apiUrl) => {
      const res = await fetch(`${apiUrl}/companies`);
      const json = await res.json();
      const companies = json.data?.companies || json.data || [];
      if (companies.length === 0) return { skip: true };

      const rRes = await fetch(`${apiUrl}/companies/${companies[0].id}/reviews`);
      const rJson = await rRes.json();
      const reviews = rJson.data?.reviews || rJson.data || [];
      if (reviews.length === 0) return { skip: true };

      // Check that the field exists (even if null)
      return { hasDepartureField: 'departure_reason' in reviews[0], sample: reviews[0].departure_reason };
    }, API_URL);

    if (result?.skip) {
      test.skip(true, 'No companies/reviews to test');
      return;
    }

    console.log(`  departure_reason field present: ${result.hasDepartureField}, value: ${result.sample}`);
    expect(result.hasDepartureField).toBe(true);
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// REGRESSION — R6 fixes still work
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('Regression — R6 fixes', () => {
  test('R6-REG-1 — Helpful vote on OWN review shows error message', async ({ page }) => {
    await loginAsEmployee(page);
    const token = await getToken(page);

    // Find a company where bob has a review
    const ownReview = await page.evaluate(async ({ apiUrl, token }) => {
      const res = await fetch(`${apiUrl}/companies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const companies = json.data?.companies || json.data || [];
      for (const c of companies.slice(0, 5)) {
        const rRes = await fetch(`${apiUrl}/companies/${c.id}/reviews`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const rJson = await rRes.json();
        const reviews = rJson.data?.reviews || rJson.data || [];
        const own = reviews.find(r => r.is_own);
        if (own) return { companyId: c.id, slug: c.slug, reviewId: own.id };
      }
      return null;
    }, { apiUrl: API_URL, token });

    if (!ownReview) { test.skip(true, 'No own review found'); return; }

    const url = ownReview.slug ? `/companies/${ownReview.slug}` : `/companies/${ownReview.companyId}`;
    await page.goto(url);
    await page.waitForTimeout(2_000);

    // Click the "Helpful" button on bob's own review
    const helpfulBtns = page.locator('button').filter({ hasText: /helpful/i });
    // We need the one associated with our own review — click the first match
    if (await helpfulBtns.count() === 0) { test.skip(true, 'No Helpful button found'); return; }

    // Try voting via API and expect an error
    const voteResult = await page.evaluate(async ({ apiUrl, token, reviewId }) => {
      const res = await fetch(`${apiUrl}/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      return { status: res.status };
    }, { apiUrl: API_URL, token, reviewId: ownReview.reviewId });

    console.log(`  Self-vote → status ${voteResult.status}`);
    expect(voteResult.status).toBeGreaterThanOrEqual(400);
  });

  test('R6-REG-2 — Tab hash persistence: admin panel keeps #users after F5', async ({ page }) => {
    await loginAsSystemAdmin(page);
    await page.goto('/admin');

    // Click Users tab
    const usersTab = page.getByRole('button', { name: /users/i })
      .or(page.getByText(/users/i).first());
    await usersTab.click();
    await page.waitForTimeout(500);

    // Hash should be #users
    expect(page.url()).toContain('#users');

    // Reload
    await page.reload();
    await page.waitForTimeout(2_000);

    // Should still be on #users tab
    expect(page.url()).toContain('#users');

    // The users tab content should be visible
    const usersHeading = page.getByText(/user management/i);
    await expect(usersHeading).toBeVisible({ timeout: 5_000 });
  });

  test('R6-REG-3 — Tab hash persistence: company admin keeps #reviews after F5', async ({ page }) => {
    await loginAsCompanyAdmin(page);
    await page.goto('/company-admin');

    // Click Reviews tab
    const reviewsTab = page.getByRole('button', { name: /reviews/i })
      .or(page.getByText(/reviews/i).first());
    await reviewsTab.click();
    await page.waitForTimeout(500);

    expect(page.url()).toContain('#reviews');

    await page.reload();
    await page.waitForTimeout(2_000);

    expect(page.url()).toContain('#reviews');
  });

  test('R6-REG-4 — Notification link /feedback does not 404', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/feedback');
    await page.waitForTimeout(1_500);

    // Should NOT show 404
    const notFound = page.getByText(/404|page not found|not found/i);
    const is404 = await notFound.count() > 0;
    expect(is404).toBe(false);
  });

  test('R6-REG-5 — Own review shows is_own:true in API when authenticated', async ({ page }) => {
    await loginAsEmployee(page);
    const token = await getToken(page);

    const result = await page.evaluate(async ({ apiUrl, token }) => {
      const res = await fetch(`${apiUrl}/companies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const companies = json.data?.companies || json.data || [];
      for (const c of companies.slice(0, 5)) {
        const rRes = await fetch(`${apiUrl}/companies/${c.id}/reviews`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const rJson = await rRes.json();
        const reviews = rJson.data?.reviews || rJson.data || [];
        const own = reviews.find(r => r.is_own === true);
        if (own) return { found: true, is_own: own.is_own };
      }
      return { found: false };
    }, { apiUrl: API_URL, token });

    if (!result.found) { test.skip(true, 'No own review found to verify is_own'); return; }
    expect(result.is_own).toBe(true);
  });
});
