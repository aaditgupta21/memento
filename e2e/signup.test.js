// end to end test that goes to sign up page, signs up with first name, last name, email, password, then checks that user is redirected to feed page
import { test, expect } from "@playwright/test";

test.describe("Sign Up Flow", () => {
  test("should sign up a new user and redirect to feed page", async ({
    page,
  }) => {
    // Go to sign up page
    await page.goto("http://localhost:3000/signup");

    // Fill out sign up form
    await page.fill('input[name="firstName"]', "Test");
    await page.fill('input[name="lastName"]', "User");
    const email = `testuser${Date.now()}@example.com`;
    await page.fill('input[name="username"]', `playwrightuser${Date.now()}`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "TestPassword123!");

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for navigation to feed page
    await page.waitForURL("http://localhost:3000/feed");

    // Check that we are on the feed page
    expect(page.url()).toBe("http://localhost:3000/feed");
  });
});
