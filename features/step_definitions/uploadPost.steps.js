import { Given, When, Then, Before, After } from "@cucumber/cucumber";
import { chromium } from "playwright";
import path from "path";
import { expect } from "@playwright/test";

let browser;
let page;

Before(async function () {
  browser = await chromium.launch();
  page = await browser.newPage();
});

After(async function () {
  await page.close();
  await browser.close();
});

// Background step
Given("I am logged in as {string}", async (email) => {
  await page.goto("http://localhost:3000/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "TestPassword123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("http://localhost:3000/feed");
});

// Navigation
When("I navigate to the upload page", async () => {
  await page.goto("http://localhost:3000/upload");
});

// File upload
When("I upload an image file", async () => {
  const filePath = path.resolve("client/public/captionlocstep.png");
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
});

When("I wait for the upload preview to appear", async () => {
  // Wait for the preview container to appear first
  await page.waitForSelector('[class*="previewContainer"]', { timeout: 10000 });
  // Then wait for the image to be visible
  const previewImage = page.locator('img[alt="image-0"]');
  await expect(previewImage).toBeVisible({ timeout: 15000 });
});

Then("the preview image should be visible", async () => {
  const previewImage = page.locator('img[alt="image-0"]');
  await expect(previewImage).toBeVisible();
});

// Navigation through steps
When("I click {string}", async (buttonText) => {
  await page.click(`button:has-text("${buttonText}")`);
});

// Form filling
When("I fill in the caption with {string}", async (caption) => {
  await page.getByPlaceholder("Caption (required)").fill(caption);
});

When("I fill in the location with {string}", async (location) => {
  await page.getByPlaceholder("Location (required)").fill(location);
});

When("I select the first location suggestion", async () => {
  const suggestion = page.locator('[class*="suggestionItem"]').first();
  await expect(suggestion).toBeVisible({ timeout: 10000 });
  await suggestion.click();
});

When("I select the first category", async () => {
  const firstCategory = page.locator('input[type="checkbox"]').first();
  if (await firstCategory.isVisible()) {
    await firstCategory.check();
  }
});

// Page actions
When("I scroll to the bottom of the page", async () => {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
});

// Assertions
Then("I should be redirected to the feed page", async () => {
  await page.waitForURL("http://localhost:3000/feed", { timeout: 5000 });
  expect(page.url()).toBe("http://localhost:3000/feed");
});

Then("the post with caption {string} should be visible", async (caption) => {
  const postCaption = page.locator(`text=${caption}`).first();
  await postCaption.scrollIntoViewIfNeeded();
  await expect(postCaption).toBeVisible({ timeout: 10000 });
});
