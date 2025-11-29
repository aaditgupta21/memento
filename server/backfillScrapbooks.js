/**
 * Backfill Scrapbooks
 *
 * One-time script to generate scrapbooks for existing users who have 6+ posts
 * but no scrapbooks created yet. This handles the migration when deploying the
 * automatic scrapbook system.
 *
 * Creates:
 * - Monthly scrapbooks (e.g., "November 2025") for months with 6+ posts
 * - Genre scrapbooks (e.g., "My Travel Memories") for categories with 6+ posts
 *
 * Usage:
 *   node backfillScrapbooks.js [options]
 *
 * Options:
 *   --user=USER_ID           Only backfill for specific user
 *   --min-posts=N           Minimum posts to create scrapbook (default: 6)
 *   --dry-run               Preview what would be created without creating
 *   --monthly-only          Only create monthly scrapbooks
 *   --genre-only            Only create genre scrapbooks
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

const GENRE_DESCRIPTIONS = {
  'Travel': 'Your travel adventures and explorations.',
  'Sports': 'Your sports and athletic activities.',
  'Gaming': 'Your gaming moments and achievements.',
  'Lifestyle': 'Your lifestyle and daily moments.',
  'Food': 'Your culinary adventures and delicious moments.',
  'Fitness': 'Your fitness journey and workout moments.',
  'Fashion': 'Your style and fashion moments.',
  'Beauty': 'Your beauty and self-care moments.',
  'Wellness': 'Your wellness and mindfulness journey.',
  'Home': 'Your home and living space moments.',
  'Family': 'Your family moments and memories.',
  'Art': 'Your artistic creations and inspirations.',
  'Music': 'Your musical moments and experiences.',
  'Photography': 'Your photography and visual stories.',
  'Nature': 'Your nature and outdoor experiences.'
};

async function backfillMonthlyScrapbooks(userId, minPosts, dryRun) {
  const query = userId ? { author: userId } : {};
  const posts = await Post.find(query).sort({ createdAt: 1 });

  if (posts.length === 0) {
    console.log('  No posts found');
    return { created: 0, skipped: 0 };
  }

  // Group posts by month
  const monthGroups = {};
  for (const post of posts) {
    const date = new Date(post.createdAt);
    const year = date.getFullYear();
    const month = date.getMonth();
    const key = `${year}-${month}`;
    const monthName = MONTH_NAMES[month];
    const title = `${monthName} ${year}`;

    if (!monthGroups[key]) {
      monthGroups[key] = {
        title,
        monthName,
        year,
        month,
        author: post.author,
        posts: []
      };
    }

    monthGroups[key].posts.push(post);
  }

  // Check existing scrapbooks
  const authors = [...new Set(posts.map(p => p.author.toString()))];
  const existingScrapbooks = await Scrapbook.find({
    author: { $in: authors }
  }).select('author title');

  const existingTitles = new Set();
  for (const sb of existingScrapbooks) {
    existingTitles.add(`${sb.author}_${sb.title}`);
  }

  // Create scrapbooks for months meeting threshold
  let created = 0;
  let skipped = 0;

  for (const [key, group] of Object.entries(monthGroups)) {
    const lookupKey = `${group.author}_${group.title}`;

    if (existingTitles.has(lookupKey)) {
      console.log(`  ⊘ Skipping "${group.title}" (already exists, ${group.posts.length} posts)`);
      skipped++;
      continue;
    }

    if (group.posts.length < minPosts) {
      console.log(`  ⊘ Skipping "${group.title}" (only ${group.posts.length} posts, need ${minPosts})`);
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`  ✓ Would create "${group.title}" (${group.posts.length} posts)`);
      created++;
    } else {
      const scrapbook = new Scrapbook({
        title: group.title,
        author: group.author,
        posts: group.posts.map(p => p._id),
        coverImage: group.posts[0].images?.[0]?.url || '',
        description: `Your memories from ${group.monthName} ${group.year}. ${group.posts.length} posts captured.`
      });

      await scrapbook.save();
      console.log(`  ✓ Created "${group.title}" (${group.posts.length} posts)`);
      created++;
    }
  }

  return { created, skipped };
}

async function backfillGenreScrapbooks(userId, minPosts, dryRun) {
  const query = userId ? { author: userId } : {};
  const posts = await Post.find(query).sort({ createdAt: -1 });

  if (posts.length === 0) {
    console.log('  No posts found');
    return { created: 0, skipped: 0 };
  }

  // Group posts by genre
  const genreGroups = {};
  for (const post of posts) {
    if (!post.categories || post.categories.length === 0) continue;

    for (const category of post.categories) {
      const title = `My ${category} Memories`;
      const key = `${post.author}_${title}`;

      if (!genreGroups[key]) {
        genreGroups[key] = {
          title,
          category,
          author: post.author,
          posts: []
        };
      }

      // Avoid duplicates
      if (!genreGroups[key].posts.some(p => p._id.equals(post._id))) {
        genreGroups[key].posts.push(post);
      }
    }
  }

  // Check existing scrapbooks
  const authors = [...new Set(posts.map(p => p.author.toString()))];
  const existingScrapbooks = await Scrapbook.find({
    author: { $in: authors }
  }).select('author title');

  const existingTitles = new Set();
  for (const sb of existingScrapbooks) {
    existingTitles.add(`${sb.author}_${sb.title}`);
  }

  // Create scrapbooks for genres meeting threshold
  let created = 0;
  let skipped = 0;

  for (const [key, group] of Object.entries(genreGroups)) {
    if (existingTitles.has(key)) {
      console.log(`  ⊘ Skipping "${group.title}" (already exists, ${group.posts.length} posts)`);
      skipped++;
      continue;
    }

    if (group.posts.length < minPosts) {
      console.log(`  ⊘ Skipping "${group.title}" (only ${group.posts.length} posts, need ${minPosts})`);
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`  ✓ Would create "${group.title}" (${group.posts.length} posts)`);
      created++;
    } else {
      const baseDesc = GENRE_DESCRIPTIONS[group.category] || `Your ${group.category} memories.`;
      const scrapbook = new Scrapbook({
        title: group.title,
        author: group.author,
        posts: group.posts.map(p => p._id),
        coverImage: group.posts[0].images?.[0]?.url || '',
        description: `${baseDesc} ${group.posts.length} posts captured.`
      });

      await scrapbook.save();
      console.log(`  ✓ Created "${group.title}" (${group.posts.length} posts)`);
      created++;
    }
  }

  return { created, skipped };
}

async function backfillScrapbooks() {
  console.log('\n=== SCRAPBOOK BACKFILL ===\n');

  // Parse CLI arguments
  const args = process.argv.slice(2);
  let userId = null;
  let minPosts = 6;
  let dryRun = false;
  let monthlyOnly = false;
  let genreOnly = false;

  for (const arg of args) {
    if (arg.startsWith('--user=')) {
      userId = arg.split('=')[1];
      if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
        console.error('Error: Invalid user ID format');
        process.exit(1);
      }
    } else if (arg.startsWith('--min-posts=')) {
      minPosts = parseInt(arg.split('=')[1], 10);
      if (isNaN(minPosts) || minPosts < 1) {
        console.error('Error: Invalid min-posts value');
        process.exit(1);
      }
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--monthly-only') {
      monthlyOnly = true;
    } else if (arg === '--genre-only') {
      genreOnly = true;
    }
  }

  // Connect to MongoDB
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB\n');

  try {
    console.log('Configuration:');
    console.log(`  User filter: ${userId || 'All users'}`);
    console.log(`  Minimum posts: ${minPosts}`);
    console.log(`  Dry run: ${dryRun ? 'Yes (preview only)' : 'No (will create scrapbooks)'}`);
    console.log(`  Mode: ${monthlyOnly ? 'Monthly only' : genreOnly ? 'Genre only' : 'Both monthly and genre'}`);
    console.log('');

    if (dryRun) {
      console.log('⚠️  DRY RUN MODE - No scrapbooks will be created\n');
    }

    let totalCreated = 0;
    let totalSkipped = 0;

    // Backfill monthly scrapbooks
    if (!genreOnly) {
      console.log('📅 Backfilling monthly scrapbooks...');
      const monthlyResults = await backfillMonthlyScrapbooks(userId, minPosts, dryRun);
      totalCreated += monthlyResults.created;
      totalSkipped += monthlyResults.skipped;
      console.log(`  Summary: ${monthlyResults.created} created, ${monthlyResults.skipped} skipped\n`);
    }

    // Backfill genre scrapbooks
    if (!monthlyOnly) {
      console.log('🎯 Backfilling genre scrapbooks...');
      const genreResults = await backfillGenreScrapbooks(userId, minPosts, dryRun);
      totalCreated += genreResults.created;
      totalSkipped += genreResults.skipped;
      console.log(`  Summary: ${genreResults.created} created, ${genreResults.skipped} skipped\n`);
    }

    // Final summary
    console.log('=== BACKFILL COMPLETE ===');
    console.log(`Total scrapbooks ${dryRun ? 'would be' : ''} created: ${totalCreated}`);
    console.log(`Total scrapbooks skipped: ${totalSkipped}`);

    if (dryRun && totalCreated > 0) {
      console.log('\nRun without --dry-run to create these scrapbooks');
    }

    console.log('');

  } catch (error) {
    console.error('\nError during backfill:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB\n');
  }
}

// Run backfill
backfillScrapbooks().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
