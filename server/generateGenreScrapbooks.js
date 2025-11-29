/**
 * Automatic Genre/Category-Based Scrapbook Generator
 *
 * Groups user posts by categories (genres) and automatically creates Scrapbook documents
 * when a category has 5+ posts (configurable threshold).
 *
 * Supports all Post categories:
 * Travel, Sports, Gaming, Lifestyle, Food, Fitness, Fashion, Beauty,
 * Wellness, Home, Family, Art, Music, Photography, Nature
 *
 * Usage:
 *   node server/generateGenreScrapbooks.js --dry-run
 *   node server/generateGenreScrapbooks.js --user=USER_ID
 *   node server/generateGenreScrapbooks.js --min-posts=3
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Post = require('./models/Post');
const Scrapbook = require('./models/Scrapbook');
const User = require('./models/User');

// All possible categories from Post schema
const VALID_CATEGORIES = [
  'Travel', 'Sports', 'Gaming', 'Lifestyle', 'Food', 'Fitness',
  'Fashion', 'Beauty', 'Wellness', 'Home', 'Family', 'Art',
  'Music', 'Photography', 'Nature'
];

/**
 * Group posts by category/genre
 * Note: Posts can have multiple categories, so a post may appear in multiple groups
 * @param {Array<Post>} posts - Array of Post documents
 * @returns {Map<string, Array<Post>>} Map of category -> posts
 */
function groupPostsByGenre(posts) {
  const postsByGenre = new Map();

  for (const post of posts) {
    if (!post.categories || post.categories.length === 0) {
      // Track uncategorized posts
      if (!postsByGenre.has('Uncategorized')) {
        postsByGenre.set('Uncategorized', []);
      }
      postsByGenre.get('Uncategorized').push(post);
      continue;
    }

    // Add post to each of its categories
    for (const category of post.categories) {
      if (!postsByGenre.has(category)) {
        postsByGenre.set(category, []);
      }
      postsByGenre.get(category).push(post);
    }
  }

  return postsByGenre;
}

/**
 * Check which genres already have scrapbooks for a user
 * @param {string} userId - User ID
 * @param {Array<string>} genres - Array of genre names
 * @returns {Promise<Set<string>>} Set of genres that already have scrapbooks
 */
async function checkExistingGenreScrapbooks(userId, genres) {
  const existingSet = new Set();

  for (const genre of genres) {
    // Look for scrapbooks with title pattern: "My [Genre] Memories"
    const expectedTitle = `My ${genre} Memories`;

    const existing = await Scrapbook.findOne({
      author: userId,
      title: expectedTitle
    });

    if (existing) {
      existingSet.add(genre);
    }
  }

  return existingSet;
}

/**
 * Create a scrapbook for a specific genre
 * @param {string} userId - User ID
 * @param {string} genre - Genre/category name
 * @param {Array<Post>} posts - Posts for this genre
 * @param {Object} options
 * @param {boolean} options.dryRun - Preview without creating
 * @returns {Promise<Scrapbook|Object>} Created scrapbook or preview object
 */
async function createScrapbookForGenre(userId, genre, posts, options = {}) {
  const { dryRun = false } = options;

  // Generate title and description
  const title = `My ${genre} Memories`;

  // Create engaging descriptions based on genre
  const descriptions = {
    'Travel': `Your travel adventures and explorations. ${posts.length} post${posts.length === 1 ? '' : 's'} from around the world.`,
    'Sports': `Your sports and athletic activities. ${posts.length} post${posts.length === 1 ? '' : 's'} of staying active.`,
    'Gaming': `Your gaming moments and achievements. ${posts.length} post${posts.length === 1 ? '' : 's'} of gameplay.`,
    'Lifestyle': `Your lifestyle and daily moments. ${posts.length} post${posts.length === 1 ? '' : 's'} of life.`,
    'Food': `Your culinary adventures and delicious moments. ${posts.length} post${posts.length === 1 ? '' : 's'} of food.`,
    'Fitness': `Your fitness journey and workout moments. ${posts.length} post${posts.length === 1 ? '' : 's'} of staying fit.`,
    'Fashion': `Your style and fashion moments. ${posts.length} post${posts.length === 1 ? '' : 's'} of fashion.`,
    'Beauty': `Your beauty and self-care moments. ${posts.length} post${posts.length === 1 ? '' : 's'} of beauty.`,
    'Wellness': `Your wellness and mindfulness journey. ${posts.length} post${posts.length === 1 ? '' : 's'} of wellness.`,
    'Home': `Your home and living space moments. ${posts.length} post${posts.length === 1 ? '' : 's'} of home life.`,
    'Family': `Your family moments and memories. ${posts.length} post${posts.length === 1 ? '' : 's'} with loved ones.`,
    'Art': `Your artistic creations and inspirations. ${posts.length} post${posts.length === 1 ? '' : 's'} of art.`,
    'Music': `Your musical moments and experiences. ${posts.length} post${posts.length === 1 ? '' : 's'} of music.`,
    'Photography': `Your photography and visual stories. ${posts.length} post${posts.length === 1 ? '' : 's'} captured.`,
    'Nature': `Your nature and outdoor experiences. ${posts.length} post${posts.length === 1 ? '' : 's'} in nature.`,
    'Uncategorized': `Your uncategorized memories. ${posts.length} post${posts.length === 1 ? '' : 's'} captured.`
  };

  const description = descriptions[genre] || `Your ${genre} memories. ${posts.length} post${posts.length === 1 ? '' : 's'} captured.`;

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
      genre,
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
 * Generate genre-based scrapbooks for a user or all users
 * @param {Object} options
 * @param {string} options.userId - Optional: specific user ID
 * @param {number} options.minPosts - Minimum posts per genre (default: 5)
 * @param {boolean} options.dryRun - Preview without creating (default: false)
 * @param {boolean} options.skipExisting - Skip genres that already have scrapbooks (default: true)
 * @param {Array<string>} options.genres - Optional: specific genres to process
 * @returns {Promise<Object>} Statistics object
 */
async function generateGenreScrapbooks(options = {}) {
  const {
    userId = null,
    minPosts = 5,
    dryRun = false,
    skipExisting = true,
    genres = null
  } = options;

  console.log('\n=== GENRE SCRAPBOOK GENERATOR ===');
  console.log(`Minimum posts per genre: ${minPosts}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (preview only)' : 'CREATE'}`);
  console.log(`Skip existing: ${skipExisting}`);
  if (genres && genres.length > 0) {
    console.log(`Filter genres: ${genres.join(', ')}`);
  }

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
    genresBelowThreshold: 0
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

    // Group posts by genre
    const postsByGenre = groupPostsByGenre(posts);
    console.log(`  Posts span ${postsByGenre.size} genre(s)`);

    // Check for existing scrapbooks if skipExisting is true
    let existingGenres = new Set();
    if (skipExisting) {
      existingGenres = await checkExistingGenreScrapbooks(
        currentUserId,
        Array.from(postsByGenre.keys())
      );
      if (existingGenres.size > 0) {
        console.log(`  Skipping ${existingGenres.size} genre(s) with existing scrapbooks`);
      }
    }

    // Create scrapbooks for eligible genres
    const sortedGenres = Array.from(postsByGenre.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    for (const [genre, genrePosts] of sortedGenres) {
      // Skip if filtered out by genres option
      if (genres && genres.length > 0 && !genres.includes(genre)) {
        continue;
      }

      // Skip if below threshold
      if (genrePosts.length < minPosts) {
        console.log(`  ⊘ ${genre}: ${genrePosts.length} posts (below threshold)`);
        stats.genresBelowThreshold++;
        continue;
      }

      // Skip if already exists
      if (skipExisting && existingGenres.has(genre)) {
        console.log(`  ⊗ ${genre}: ${genrePosts.length} posts (already exists)`);
        stats.scrapbooksSkipped++;
        continue;
      }

      // Create scrapbook
      const result = await createScrapbookForGenre(
        currentUserId,
        genre,
        genrePosts,
        { dryRun }
      );

      if (dryRun) {
        console.log(`  ○ ${genre}: ${genrePosts.length} posts (would create)`);
      } else {
        console.log(`  ✓ ${genre}: ${genrePosts.length} posts (created: ${result._id})`);
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
  console.log(`Genres below threshold (${minPosts} posts): ${stats.genresBelowThreshold}`);

  return stats;
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
Usage: node server/generateGenreScrapbooks.js [options]

Options:
  --user=USER_ID           Generate scrapbooks for specific user only
  --user-id=USER_ID        Alias for --user
  --min-posts=N            Minimum posts per genre to create scrapbook (default: 5)
  --genres=genre1,genre2   Only process specific genres (comma-separated)
  --dry-run                Preview without creating scrapbooks
  --no-skip-existing       Recreate scrapbooks even if they already exist
  --help, -h               Show this help message

Valid Genres:
  Travel, Sports, Gaming, Lifestyle, Food, Fitness, Fashion, Beauty,
  Wellness, Home, Family, Art, Music, Photography, Nature

Examples:
  # Generate genre scrapbooks for all users
  node server/generateGenreScrapbooks.js

  # Preview for all users (dry run)
  node server/generateGenreScrapbooks.js --dry-run

  # Generate for specific user
  node server/generateGenreScrapbooks.js --user=507f1f77bcf86cd799439011

  # Generate for specific user with lower threshold
  node server/generateGenreScrapbooks.js --user=507f1f77bcf86cd799439011 --min-posts=3

  # Only create Travel and Food scrapbooks
  node server/generateGenreScrapbooks.js --genres=Travel,Food

  # Recreate all scrapbooks (override existing)
  node server/generateGenreScrapbooks.js --no-skip-existing

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
    skipExisting: true,
    genres: null
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
    } else if (arg.startsWith('--genres=')) {
      const value = arg.split('=')[1];
      const genreList = value.split(',').map(g => g.trim());

      // Validate genres
      const invalid = genreList.filter(g => !VALID_CATEGORIES.includes(g) && g !== 'Uncategorized');
      if (invalid.length > 0) {
        console.error(`Error: Invalid genres: ${invalid.join(', ')}`);
        console.error(`Valid genres: ${VALID_CATEGORIES.join(', ')}, Uncategorized`);
        process.exit(1);
      }

      options.genres = genreList;
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
    await generateGenreScrapbooks(options);
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

module.exports = { generateGenreScrapbooks };
