/**
 * Test Auto-Update Scrapbooks with Threshold System
 *
 * Tests the automatic scrapbook system with minimum post thresholds:
 * 1. Creating posts below threshold (no scrapbooks created)
 * 2. Creating 6th post triggers scrapbook generation
 * 3. Subsequent posts update existing scrapbooks
 * 4. Category changes sync genre scrapbooks
 * 5. Deleting posts removes them from scrapbooks
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Post = require('./models/Post');
const Scrapbook = require('./models/Scrapbook');
const User = require('./models/User');

async function testAutoUpdate() {
  console.log('\n=== AUTO-UPDATE SCRAPBOOK TEST (WITH THRESHOLDS) ===\n');

  // Connect to MongoDB
  if (mongoose.connection.readyState === 0) {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set in .env');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
  }

  // Check if auto-update is enabled
  if (process.env.AUTO_UPDATE_SCRAPBOOKS !== 'true') {
    console.log('⚠️  AUTO_UPDATE_SCRAPBOOKS is not set to "true" in .env');
    console.log('   Set AUTO_UPDATE_SCRAPBOOKS=true to enable auto-updates\n');
    process.exit(1);
  }

  console.log('✓ AUTO_UPDATE_SCRAPBOOKS is enabled\n');

  // Get a test user
  const user = await User.findOne();
  if (!user) {
    console.error('✗ No users found in database. Create a user first.');
    process.exit(1);
  }

  console.log(`Test user: ${user.email || user.username || user._id}\n`);

  // Track created resources for cleanup
  const testPostIds = [];
  const initialScrapbookCount = await Scrapbook.countDocuments({ author: user._id });

  try {
    // ========================================================================
    // TEST 1: Create 5 posts - should NOT generate scrapbooks (below threshold)
    // ========================================================================
    console.log('TEST 1: Creating 5 posts with Travel category (below 6-post threshold)...');

    for (let i = 1; i <= 5; i++) {
      const testPost = new Post({
        images: [
          { url: `https://test.example.com/test-image-${i}.jpg`, order: 0 }
        ],
        categories: ['Travel'],
        author: user._id,
        caption: `Test post ${i} for threshold testing`,
        location: 'Test Location'
      });

      await testPost.save();
      testPostIds.push(testPost._id);
      console.log(`  Created post ${i}/5: ${testPost._id}`);
    }

    // Wait a moment for hooks to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify no Travel scrapbook was created
    const travelScrapbookBefore = await Scrapbook.findOne({
      author: user._id,
      title: 'My Travel Memories'
    });

    if (!travelScrapbookBefore) {
      console.log(`✓ No Travel scrapbook created (correctly waiting for threshold)`);
    } else {
      console.log(`✗ Travel scrapbook was created prematurely (should wait for 6 posts)`);
    }

    console.log('');

    // ========================================================================
    // TEST 2: Create 6th post - should trigger scrapbook generation
    // ========================================================================
    console.log('TEST 2: Creating 6th post - should trigger scrapbook generation...');

    const sixthPost = new Post({
      images: [
        { url: 'https://test.example.com/test-image-6.jpg', order: 0 }
      ],
      categories: ['Travel'],
      author: user._id,
      caption: 'Test post 6 - triggers threshold',
      location: 'Test Location'
    });

    await sixthPost.save();
    testPostIds.push(sixthPost._id);
    console.log(`  Created post 6/6: ${sixthPost._id}`);

    // Wait for hooks
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify Travel scrapbook was created
    const travelScrapbookAfter = await Scrapbook.findOne({
      author: user._id,
      title: 'My Travel Memories'
    });

    if (travelScrapbookAfter && travelScrapbookAfter.posts.length === 6) {
      console.log(`✓ Travel scrapbook created with 6 posts`);
    } else if (travelScrapbookAfter) {
      console.log(`⚠️  Travel scrapbook created but has ${travelScrapbookAfter.posts.length} posts (expected 6)`);
    } else {
      console.log(`✗ Travel scrapbook not created after reaching threshold`);
    }

    // Verify monthly scrapbook
    const date = new Date(sixthPost.createdAt);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const monthlyTitle = `${monthName} ${year}`;

    const monthlyScrapbook = await Scrapbook.findOne({
      author: user._id,
      title: monthlyTitle
    });

    if (monthlyScrapbook && monthlyScrapbook.posts.length >= 6) {
      console.log(`✓ Monthly scrapbook "${monthlyTitle}" created with ${monthlyScrapbook.posts.length} posts`);
    } else if (monthlyScrapbook) {
      console.log(`⚠️  Monthly scrapbook exists but has ${monthlyScrapbook.posts.length} posts (expected >= 6)`);
    } else {
      console.log(`⚠️  Monthly scrapbook not created (may not have 6 posts in this month yet)`);
    }

    console.log('');

    // ========================================================================
    // TEST 3: Create 7th post - should update existing scrapbook
    // ========================================================================
    console.log('TEST 3: Creating 7th post - should update existing Travel scrapbook...');

    const seventhPost = new Post({
      images: [
        { url: 'https://test.example.com/test-image-7.jpg', order: 0 }
      ],
      categories: ['Travel'],
      author: user._id,
      caption: 'Test post 7 - updates existing scrapbook',
      location: 'Test Location'
    });

    await seventhPost.save();
    testPostIds.push(seventhPost._id);

    // Wait for hooks
    await new Promise(resolve => setTimeout(resolve, 1000));

    const travelScrapbookUpdated = await Scrapbook.findOne({
      author: user._id,
      title: 'My Travel Memories'
    });

    if (travelScrapbookUpdated && travelScrapbookUpdated.posts.includes(seventhPost._id)) {
      console.log(`✓ Travel scrapbook updated with 7th post (now ${travelScrapbookUpdated.posts.length} posts)`);
    } else {
      console.log(`✗ Travel scrapbook not updated with 7th post`);
    }

    console.log('');

    // ========================================================================
    // TEST 4: Update post category - verify sync
    // ========================================================================
    console.log('TEST 4: Changing 7th post category to Food...');

    seventhPost.categories = ['Food'];
    await seventhPost.save();

    // Wait for hooks
    await new Promise(resolve => setTimeout(resolve, 1000));

    const travelAfterChange = await Scrapbook.findOne({
      author: user._id,
      title: 'My Travel Memories'
    });

    if (travelAfterChange && !travelAfterChange.posts.includes(seventhPost._id)) {
      console.log(`✓ Removed from Travel scrapbook (now ${travelAfterChange.posts.length} posts)`);
    } else if (travelAfterChange && travelAfterChange.posts.includes(seventhPost._id)) {
      console.log(`✗ Still in Travel scrapbook (should be removed)`);
    }

    const foodScrapbook = await Scrapbook.findOne({
      author: user._id,
      title: 'My Food Memories'
    });

    if (!foodScrapbook) {
      console.log(`✓ Food scrapbook not created (only 1 Food post, below threshold)`);
    } else {
      console.log(`⚠️  Food scrapbook exists (might have been created from existing posts)`);
    }

    console.log('');

    // ========================================================================
    // TEST 5: Delete all test posts and verify cleanup
    // ========================================================================
    console.log('TEST 5: Deleting all test posts...');

    for (const postId of testPostIds) {
      await Post.findByIdAndDelete(postId);
    }

    // Wait for hooks
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if Travel scrapbook still has test posts
    const travelFinal = await Scrapbook.findOne({
      author: user._id,
      title: 'My Travel Memories'
    });

    if (travelFinal) {
      const remainingTestPosts = travelFinal.posts.filter(p =>
        testPostIds.some(id => id.equals(p))
      );
      if (remainingTestPosts.length === 0) {
        console.log(`✓ All test posts removed from Travel scrapbook`);
      } else {
        console.log(`✗ ${remainingTestPosts.length} test posts still in Travel scrapbook`);
      }
    }

    console.log('');

    // ========================================================================
    // SUMMARY
    // ========================================================================
    const finalScrapbookCount = await Scrapbook.countDocuments({ author: user._id });

    console.log('=== TEST SUMMARY ===');
    console.log(`Initial scrapbooks: ${initialScrapbookCount}`);
    console.log(`Final scrapbooks: ${finalScrapbookCount}`);
    console.log(`Scrapbooks created during test: ${Math.max(0, finalScrapbookCount - initialScrapbookCount)}`);
    console.log('');
    console.log('✅ Threshold-based auto-update test completed!\n');

  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);

    // Cleanup on error
    if (testPostIds.length > 0) {
      try {
        await Post.deleteMany({ _id: { $in: testPostIds } });
        console.log(`\nCleaned up ${testPostIds.length} test posts`);
      } catch (cleanupError) {
        console.error(`Failed to cleanup test posts:`, cleanupError.message);
      }
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB\n');
  }
}

// Run test
testAutoUpdate().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
