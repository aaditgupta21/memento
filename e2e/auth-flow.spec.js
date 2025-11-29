import { test, expect } from "@playwright/test";

/**
 * End-to-end test for user authentication flow
 * Tests: Signup -> Login -> View Profile
 */
test.describe("User Authentication Flow", () => {
  const timestamp = Date.now();
  const testEmail = `testuser${timestamp}@example.com`;
  const testPassword = "TestPassword123!";
  const testUsername = `testuser${timestamp}`;

  test.beforeEach(async ({ page }) => {
    // Clear cookies and local storage before each test
    await page.context().clearCookies();
  });

  test("should complete full signup and login flow", async ({ page }) => {
    // Step 1: Navigate to signup page
    await page.goto("/signup");
    await expect(page).toHaveURL(/.*signup/);

    // Step 2: Fill out signup form
    await page.fill("#username", testUsername);
    await page.fill("#email", testEmail);
    await page.fill("#password", testPassword);

    // Step 3: Submit signup form
    await page.click('button[type="submit"]');

    // Step 4: Wait for redirect (should redirect to home or set-username)
    // The app might redirect to home or set-username page
    await page.waitForURL(/\/(set-username|$)/, { timeout: 10000 });

    // Step 5: Verify user is authenticated by checking navbar
    // Look for logout button which indicates user is logged in
    const logoutButton = page.locator('button:has-text("Logout")');
    await expect(logoutButton).toBeVisible({ timeout: 5000 });

    // Step 6: Navigate to login page (to test login flow)
    await page.goto("/login");
    await expect(page).toHaveURL(/.*login/);

    // Step 7: Fill out login form
    await page.fill("#email", testEmail);
    await page.fill("#password", testPassword);

    // Step 8: Submit login form
    await page.click('button[type="submit"]');

    // Step 9: Wait for redirect to home page
    await page.waitForURL(/\//, { timeout: 10000 });

    // Step 10: Verify user is still authenticated
    await expect(logoutButton).toBeVisible({ timeout: 5000 });

    // Step 11: Navigate to user's gallery page
    await page.goto(`/${testUsername}`);

    // Step 12: Verify gallery page loads and shows user's content
    // Check for gallery title or tabs
    await expect(page.locator("h1, h2")).toContainText(
      /gallery|posts|scrapbooks/i,
      { timeout: 5000 }
    );
  });

  test("should handle login with invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill with invalid credentials
    await page.fill("#email", "invalid@example.com");
    await page.fill("#password", "WrongPassword123!");

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator("text=/error|failed|invalid/i")).toBeVisible({
      timeout: 5000,
    });

    // Should still be on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test("should handle signup with existing email", async ({ page }) => {
    // First, create a user
    await page.goto("/signup");
    await page.fill('input[type="text"]', testUsername);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(set-username|$)/, { timeout: 10000 });

    // Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL(/\//, { timeout: 5000 });

    // Try to signup with same email
    await page.goto("/signup");
    await page.fill("#username", "differentusername");
    await page.fill("#email", testEmail);
    await page.fill("#password", testPassword);
    await page.click('button[type="submit"]');

    // Should show error about email already existing
    await expect(
      page.locator("text=/email.*already|already.*registered/i")
    ).toBeVisible({ timeout: 5000 });
  });
});
