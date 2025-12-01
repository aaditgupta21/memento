import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Upload flow", () => {
  test("should allow user to upload a post and see their post on feed page", async ({
    page,
  }) => {
    // Go to login page
    await page.goto("http://localhost:3000/login");

    // Sign in with test user
    await page.fill('input[name="email"]', "testexample@example.com");
    await page.fill('input[name="password"]', "TestPassword123!");

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for navigation to feed page
    await page.waitForURL("http://localhost:3000/feed");

    // Go to upload page
    await page.goto("http://localhost:3000/upload");

    // Upload an image
    const filePath = path.resolve("client/public/captionlocstep.png");

    // Set files on the hidden input directly
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Wait for upload to complete and preview to appear
    const previewImage = page.locator('img[alt="image-0"]');
    await expect(previewImage).toBeVisible({ timeout: 15000 });

    // Click to go to next step
    await page.click('button:has-text("Next: Caption & Location")');

    // Fill caption and location
    await page
      .getByPlaceholder("Caption (required)")
      .fill("Test post from Playwright");

    await page.getByPlaceholder("Location (required)").fill("San Francisco");

    // Wait for location suggestion (may take a moment to appear)
    const suggestion = page.locator('[class*="suggestionItem"]').first();
    await expect(suggestion).toBeVisible({ timeout: 10000 });
    await suggestion.click();

    // Click to go to next step
    await page.click('button:has-text("Next: Categories")');

    // Select first category
    const firstCategory = page.locator('input[type="checkbox"]').first();
    if (await firstCategory.isVisible()) {
      await firstCategory.check();
    }

    // Click to go to review step
    await page.click('button:has-text("Review & Submit")');

    // Scroll to bottom of page to find submit button
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300); // Wait for scroll to complete

    // Click submit button
    const submitBtn = page.locator('button:has-text("Create Post")');
    await submitBtn.click();

    // Wait for success alert or redirect to feed
    await page.waitForURL("http://localhost:3000/feed", { timeout: 5000 });

    // Verify we're on the feed page
    expect(page.url()).toBe("http://localhost:3000/feed");

    // Verify the post appears, scroll caption into view
    const postCaption = page.locator("text=Test post from Playwright").first();
    await postCaption.scrollIntoViewIfNeeded();
    await expect(postCaption).toBeVisible({ timeout: 10000 });
  });
});
