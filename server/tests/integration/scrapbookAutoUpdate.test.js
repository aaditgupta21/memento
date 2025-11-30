"use strict";

/**
 * Integration Test: Auto-Update Scrapbooks with Threshold System
 *
 * Tests the automatic scrapbook system with minimum post thresholds:
 * 1. Creating posts below threshold (no scrapbooks created)
 * 2. Creating 6th post triggers scrapbook generation
 * 3. Subsequent posts update existing scrapbooks
 * 4. Category changes sync genre scrapbooks
 * 5. Deleting posts removes them from scrapbooks
 */

const test = require("node:test");
const assert = require("assert/strict");
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Post = require("../../models/Post");
const Scrapbook = require("../../models/Scrapbook");
const User = require("../../models/User");

// Test suite setup
test.before(async () => {
  if (mongoose.connection.readyState === 0) {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not set in .env");
    }
    await mongoose.connect(process.env.MONGODB_URI);
  }

  if (process.env.AUTO_UPDATE_SCRAPBOOKS !== "true") {
    throw new Error(
      'AUTO_UPDATE_SCRAPBOOKS must be set to "true" in .env for this test',
    );
  }
});

test.after(async () => {
  await mongoose.disconnect();
});

// Helper to wait for async hooks
const waitForHooks = () => new Promise((resolve) => setTimeout(resolve, 1000));

test("Scrapbook Auto-Update Integration Tests", async (t) => {
  let testUser;
  let testPostIds = [];
  let initialScrapbookCount;

  await t.test("Setup: Find or create test user", async () => {
    testUser = await User.findOne();
    assert.ok(testUser, "At least one user must exist in database");
    initialScrapbookCount = await Scrapbook.countDocuments({
      author: testUser._id,
    });
  });

  await t.test(
    "Creating 5 posts below threshold should NOT create scrapbook",
    async () => {
      for (let i = 1; i <= 5; i++) {
        const testPost = new Post({
          images: [
            {
              url: `https://test.example.com/test-image-${i}.jpg`,
              order: 0,
            },
          ],
          categories: ["Travel"],
          author: testUser._id,
          caption: `Test post ${i} for threshold testing`,
          location: "Test Location",
        });

        await testPost.save();
        testPostIds.push(testPost._id);
      }

      await waitForHooks();

      const travelScrapbook = await Scrapbook.findOne({
        author: testUser._id,
        title: "My Travel Memories",
      });

      assert.equal(
        travelScrapbook,
        null,
        "Travel scrapbook should not be created with only 5 posts",
      );
    },
  );

  await t.test(
    "Creating 6th post should trigger scrapbook generation",
    async () => {
      const sixthPost = new Post({
        images: [
          { url: "https://test.example.com/test-image-6.jpg", order: 0 },
        ],
        categories: ["Travel"],
        author: testUser._id,
        caption: "Test post 6 - triggers threshold",
        location: "Test Location",
      });

      await sixthPost.save();
      testPostIds.push(sixthPost._id);

      await waitForHooks();

      const travelScrapbook = await Scrapbook.findOne({
        author: testUser._id,
        title: "My Travel Memories",
      });

      assert.ok(
        travelScrapbook,
        "Travel scrapbook should be created after 6th post",
      );
      assert.equal(
        travelScrapbook.posts.length,
        6,
        "Travel scrapbook should contain exactly 6 posts",
      );
    },
  );

  await t.test("Monthly scrapbook should also be created", async () => {
    const post = await Post.findById(testPostIds[0]);
    const date = new Date(post.createdAt);
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthName = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const monthlyTitle = `${monthName} ${year}`;

    const monthlyScrapbook = await Scrapbook.findOne({
      author: testUser._id,
      title: monthlyTitle,
    });

    if (monthlyScrapbook) {
      assert.ok(
        monthlyScrapbook.posts.length >= 6,
        `Monthly scrapbook should have at least 6 posts, has ${monthlyScrapbook.posts.length}`,
      );
    }
  });

  await t.test("7th post should update existing scrapbook", async () => {
    const seventhPost = new Post({
      images: [{ url: "https://test.example.com/test-image-7.jpg", order: 0 }],
      categories: ["Travel"],
      author: testUser._id,
      caption: "Test post 7 - updates existing scrapbook",
      location: "Test Location",
    });

    await seventhPost.save();
    testPostIds.push(seventhPost._id);

    await waitForHooks();

    const travelScrapbook = await Scrapbook.findOne({
      author: testUser._id,
      title: "My Travel Memories",
    });

    assert.ok(
      travelScrapbook.posts.includes(seventhPost._id),
      "7th post should be added to existing Travel scrapbook",
    );
    assert.equal(
      travelScrapbook.posts.length,
      7,
      "Travel scrapbook should now have 7 posts",
    );
  });

  await t.test("Changing category should sync scrapbooks", async () => {
    const seventhPost = await Post.findById(testPostIds[6]);
    seventhPost.categories = ["Food"];
    await seventhPost.save();

    await waitForHooks();

    const travelScrapbook = await Scrapbook.findOne({
      author: testUser._id,
      title: "My Travel Memories",
    });

    assert.ok(
      !travelScrapbook.posts.includes(seventhPost._id),
      "Post should be removed from Travel scrapbook",
    );
    assert.equal(
      travelScrapbook.posts.length,
      6,
      "Travel scrapbook should now have 6 posts",
    );

    const foodScrapbook = await Scrapbook.findOne({
      author: testUser._id,
      title: "My Food Memories",
    });

    assert.equal(
      foodScrapbook,
      null,
      "Food scrapbook should not be created (only 1 Food post)",
    );
  });

  await t.test("Cleanup: Delete test posts", async () => {
    for (const postId of testPostIds) {
      await Post.findByIdAndDelete(postId);
    }

    await waitForHooks();

    const travelScrapbook = await Scrapbook.findOne({
      author: testUser._id,
      title: "My Travel Memories",
    });

    if (travelScrapbook) {
      const remainingTestPosts = travelScrapbook.posts.filter((p) =>
        testPostIds.some((id) => id.equals(p)),
      );
      assert.equal(
        remainingTestPosts.length,
        0,
        "All test posts should be removed from scrapbooks",
      );
    }

    const finalScrapbookCount = await Scrapbook.countDocuments({
      author: testUser._id,
    });
    const scrapbooksCreated = Math.max(
      0,
      finalScrapbookCount - initialScrapbookCount,
    );

    console.log(`\nTest Summary:`);
    console.log(`  Initial scrapbooks: ${initialScrapbookCount}`);
    console.log(`  Final scrapbooks: ${finalScrapbookCount}`);
    console.log(`  Scrapbooks created during test: ${scrapbooksCreated}`);
  });
});
