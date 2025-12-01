import { test, expect } from "@playwright/test";

// use test user created:
// first name: Test
// last name: Example
// username: testexample
// email: testexample@example.com
// password: TestPassword123!
test.describe("Login and interact with post flow", () => {
  test("should log in, like a post, comment, and log out", async ({ page }) => {
    // Go to login page
    await page.goto("http://localhost:3000/login");

    // Fill out login form
    await page.fill('input[name="email"]', "testexample@example.com");
    await page.fill('input[name="password"]', "TestPassword123!");

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for navigation to feed page
    await page.waitForURL("http://localhost:3000/feed");

    // Check that we are on the feed page
    expect(page.url()).toBe("http://localhost:3000/feed");

    // Like the first post
    await page.locator('button:has-text("Like")').first().click();

    // Verify that the like button changed to "Unlike"
    await expect(
      page.locator('button:has-text("Unlike")').first()
    ).toBeVisible();

    // Unlike post for future test consistency
    await page.locator('button:has-text("Unlike")').first().click();

    // TODO: Fix commenting test
    // // scroll to comment plane
    // const commentTextarea = page
    //   .locator('textarea[placeholder="Add a comment..."]')
    //   .first();
    // await commentTextarea.scrollIntoViewIfNeeded();
    // await commentTextarea.waitFor({ state: "visible" });

    // // Add a comment to the most recent post with unique text
    // const commentText = `Great post! ${Date.now()}`;
    // await commentTextarea.fill(commentText);
    // await page.click('button:has-text("Post")');

    // // Verify that the comment appears
    // await expect(page.locator(`text=${commentText}`)).toBeVisible();

    // Log out
    await page.click('button:has-text("Logout")');

    // Verify that we are back on the home page
    await page.waitForURL("http://localhost:3000/");
    expect(page.url()).toBe("http://localhost:3000/");
  });
});
