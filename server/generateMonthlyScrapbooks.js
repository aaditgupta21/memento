/**
 * Automatic Monthly Scrapbook Generator
 *
 * Groups user posts by month and automatically creates Scrapbook documents
 * when a month has 5+ posts (configurable threshold).
 *
 * Usage:
 *   node server/generateMonthlyScrapbooks.js --dry-run
 *   node server/generateMonthlyScrapbooks.js --user=USER_ID
 *   node server/generateMonthlyScrapbooks.js --min-posts=3
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Post = require('./models/Post');
const Scrapbook = require('./models/Scrapbook');
const User = require('./models/User');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Group posts by month based on createdAt
 * @param {Array<Post>} posts - Array of Post documents
 * @returns {Map<string, Array<Post>>} Map of "YYYY-MM" -> posts
 */
function groupPostsByMonth(posts) {
  const postsByMonth = new Map();

  for (const post of posts) {
    if (!post.createdAt) continue;

    const date = new Date(post.createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;

    if (!postsByMonth.has(monthKey)) {
      postsByMonth.set(monthKey, []);
    }

    postsByMonth.get(monthKey).push(post);
  }

  return postsByMonth;
}

/**
 * Check which months already have scrapbooks for a user
 * @param {string} userId - User ID
 * @param {Array<string>} monthKeys - Array of "YYYY-MM" month keys
 * @returns {Promise<Set<string>>} Set of month keys that already have scrapbooks
 */
async function checkExistingScrapbooks(userId, monthKeys) {
  const existingSet = new Set();

  for (const monthKey of monthKeys) {
    const [year, month] = monthKey.split('-');
    const monthName = MONTH_NAMES[parseInt(month) - 1];
    const expectedTitle = `${monthName} ${year}`;

    const existing = await Scrapbook.findOne({
      author: userId,
      title: expectedTitle
    });

    if (existing) {
      existingSet.add(monthKey);
    }
  }

  return existingSet;
}

/**
 * Create a scrapbook for a specific month
 * @param {string} userId - User ID
 * @param {string} monthKey - "YYYY-MM" format
 * @param {Array<Post>} posts - Posts for this month
 * @param {Object} options
 * @param {boolean} options.dryRun - Preview without creating
 * @returns {Promise<Scrapbook|Object>} Created scrapbook or preview object
 */
async function createScrapbookForMonth(userId, monthKey, posts, options = {}) {
  const { dryRun = false } = options;

  // Parse month key
  const [year, month] = monthKey.split('-');
  const monthName = MONTH_NAMES[parseInt(month) - 1];

  // Generate title and description
  const title = `${monthName} ${year}`;
  const description = `Your memories from ${monthName} ${year}. ${posts.length} post${posts.length === 1 ? '' : 's'} captured.`;

  // Get cover image from first post's first image
  const coverImage = posts[0]?.images?.[0]?.url || '';

  // Extract post IDs
  const postIds = posts.map(p => p._id);

  if (dryRun) {
    // Preview mode - return object without saving
    return {
      title,
      description,
      author: userId,
      posts: postIds,
      coverImage,
      postCount: posts.length,
      monthKey,
      preview: true
    };
  }

  // Create scrapbook document
  const scrapbook = new Scrapbook({
    title,
    description,
    author: userId,
    posts: postIds,
    coverImage
  });

  await scrapbook.save();

  return scrapbook;
}

/**
 * Generate monthly scrapbooks for a user or all users
 * @param {Object} options
 * @param {string} options.userId - Optional: specific user ID
 * @param {number} options.minPosts - Minimum posts per month (default: 5)
 * @param {boolean} options.dryRun - Preview without creating (default: false)
 * @param {boolean} options.skipExisting - Skip months that already have scrapbooks (default: true)
 * @returns {Promise<Object>} Statistics object
 */
async function generateMonthlyScrapbooks(options = {}) {
  const {
    userId = null,
    minPosts = 5,
    dryRun = false,
    skipExisting = true
  } = options;

  console.log('\n=== MONTHLY SCRAPBOOK GENERATOR ===');
  console.log(`Minimum posts per month: ${minPosts}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (preview only)' : 'CREATE'}`);
  console.log(`Skip existing: ${skipExisting}`);

  // Connect to MongoDB
  if (mongoose.connection.readyState === 0) {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set in .env');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
  }

  // Determine which users to process
  let userIds = [];
  if (userId) {
    // Specific user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    userIds = [userId];
    console.log(`Processing user: ${user.email || user.username || userId}\n`);
  } else {
    // All users who have posts
    const usersWithPosts = await Post.distinct('author');
    userIds = usersWithPosts;
    console.log(`Processing ${userIds.length} users\n`);
  }

  // Track statistics
  const stats = {
    usersProcessed: 0,
    scrapbooksCreated: 0,
    scrapbooksSkipped: 0,
    monthsBelowThreshold: 0
  };

  // Process each user
  for (const currentUserId of userIds) {
    stats.usersProcessed++;

    // Get user info for display
    const user = await User.findById(currentUserId).select('email username');
    const userDisplay = user?.email || user?.username || currentUserId;

    console.log(`\n[${stats.usersProcessed}/${userIds.length}] Processing: ${userDisplay}`);

    // Fetch all posts for this user
    const posts = await Post.find({ author: currentUserId })
      .sort({ createdAt: -1 })
      .exec();

    if (posts.length === 0) {
      console.log('  No posts found');
      continue;
    }

    console.log(`  Found ${posts.length} total posts`);

    // Group posts by month
    const postsByMonth = groupPostsByMonth(posts);
    console.log(`  Posts span ${postsByMonth.size} month(s)`);

    // Check for existing scrapbooks if skipExisting is true
    let existingMonths = new Set();
    if (skipExisting) {
      existingMonths = await checkExistingScrapbooks(
        currentUserId,
        Array.from(postsByMonth.keys())
      );
      if (existingMonths.size > 0) {
        console.log(`  Skipping ${existingMonths.size} month(s) with existing scrapbooks`);
      }
    }

    // Create scrapbooks for eligible months
    const sortedMonths = Array.from(postsByMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    for (const [monthKey, monthPosts] of sortedMonths) {
      const [year, month] = monthKey.split('-');
      const monthName = MONTH_NAMES[parseInt(month) - 1];
      const displayName = `${monthName} ${year}`;

      // Skip if below threshold
      if (monthPosts.length < minPosts) {
        console.log(`  ⊘ ${displayName}: ${monthPosts.length} posts (below threshold)`);
        stats.monthsBelowThreshold++;
        continue;
      }

      // Skip if already exists
      if (skipExisting && existingMonths.has(monthKey)) {
        console.log(`  ⊗ ${displayName}: ${monthPosts.length} posts (already exists)`);
        stats.scrapbooksSkipped++;
        continue;
      }

      // Create scrapbook
      const result = await createScrapbookForMonth(
        currentUserId,
        monthKey,
        monthPosts,
        { dryRun }
      );

      if (dryRun) {
        console.log(`  ○ ${displayName}: ${monthPosts.length} posts (would create)`);
      } else {
        console.log(`  ✓ ${displayName}: ${monthPosts.length} posts (created: ${result._id})`);
      }
      stats.scrapbooksCreated++;
    }
  }

  // Print summary
  console.log('\n=== SUMMARY ===');
  console.log(`Users processed: ${stats.usersProcessed}`);
  console.log(`Scrapbooks ${dryRun ? 'previewed' : 'created'}: ${stats.scrapbooksCreated}`);
  if (skipExisting) {
    console.log(`Scrapbooks skipped (already exist): ${stats.scrapbooksSkipped}`);
  }
  console.log(`Months below threshold (${minPosts} posts): ${stats.monthsBelowThreshold}`);

  return stats;
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
Usage: node server/generateMonthlyScrapbooks.js [options]

Options:
  --user=USER_ID           Generate scrapbooks for specific user only
  --user-id=USER_ID        Alias for --user
  --min-posts=N            Minimum posts per month to create scrapbook (default: 5)
  --dry-run                Preview without creating scrapbooks
  --no-skip-existing       Recreate scrapbooks even if they already exist
  --help, -h               Show this help message

Examples:
  # Generate monthly scrapbooks for all users
  node server/generateMonthlyScrapbooks.js

  # Preview for all users (dry run)
  node server/generateMonthlyScrapbooks.js --dry-run

  # Generate for specific user
  node server/generateMonthlyScrapbooks.js --user=507f1f77bcf86cd799439011

  # Generate for specific user with lower threshold
  node server/generateMonthlyScrapbooks.js --user=507f1f77bcf86cd799439011 --min-posts=3

  # Recreate all scrapbooks (override existing)
  node server/generateMonthlyScrapbooks.js --no-skip-existing

Environment:
  MONGODB_URI              MongoDB connection string (required)
  `);
}

/**
 * Main function - parse CLI args and execute
 */
async function main() {
  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const options = {
    userId: null,
    minPosts: 5,
    dryRun: false,
    skipExisting: true
  };

  // Parse arguments
  for (const arg of args) {
    if (arg.startsWith('--user=') || arg.startsWith('--user-id=')) {
      const value = arg.split('=')[1];
      if (!value || !/^[0-9a-fA-F]{24}$/.test(value)) {
        console.error('Error: Invalid user ID format. Must be 24-character hex string.');
        process.exit(1);
      }
      options.userId = value;
    } else if (arg.startsWith('--min-posts=')) {
      const value = parseInt(arg.split('=')[1], 10);
      if (isNaN(value) || value < 1) {
        console.error('Error: --min-posts must be a positive number');
        process.exit(1);
      }
      options.minPosts = value;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--no-skip-existing') {
      options.skipExisting = false;
    } else {
      console.error(`Error: Unknown option: ${arg}`);
      printUsage();
      process.exit(1);
    }
  }

  try {
    await generateMonthlyScrapbooks(options);
    await mongoose.disconnect();
    console.log('\n✅ Done!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { generateMonthlyScrapbooks };
