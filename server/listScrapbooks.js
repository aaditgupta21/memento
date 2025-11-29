/**
 * List Scrapbooks Helper
 *
 * Displays scrapbooks from the database with details
 *
 * Usage:
 *   node server/listScrapbooks.js                    # List all scrapbooks
 *   node server/listScrapbooks.js USER_ID            # List scrapbooks for specific user
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Scrapbook = require('./models/Scrapbook');
const User = require('./models/User');

async function listScrapbooks(userId = null) {
  // Connect to MongoDB
  if (mongoose.connection.readyState === 0) {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set in .env');
    }
    await mongoose.connect(process.env.MONGODB_URI);
  }

  // Build query
  let query = {};
  if (userId) {
    // Validate user ID format
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      console.error('Error: Invalid user ID format. Must be 24-character hex string.');
      process.exit(1);
    }
    query.author = userId;
  }

  // Fetch scrapbooks
  const scrapbooks = await Scrapbook.find(query)
    .populate('author', 'email username')
    .sort({ createdAt: -1 })
    .exec();

  console.log(`\n=== SCRAPBOOKS ===`);
  console.log(`Found ${scrapbooks.length} scrapbook(s)\n`);

  if (scrapbooks.length === 0) {
    console.log('No scrapbooks found.\n');
    await mongoose.disconnect();
    return;
  }

  // Display scrapbooks
  for (const scrapbook of scrapbooks) {
    console.log(`ID: ${scrapbook._id}`);
    console.log(`  Title: ${scrapbook.title}`);
    console.log(`  Description: ${scrapbook.description}`);
    console.log(`  Author: ${scrapbook.author?.email || scrapbook.author?.username || scrapbook.author}`);
    console.log(`  Posts: ${scrapbook.posts.length}`);
    console.log(`  Cover Image: ${scrapbook.coverImage ? scrapbook.coverImage.substring(0, 50) + '...' : 'N/A'}`);
    console.log(`  Created: ${scrapbook.createdAt.toISOString()}`);
    console.log(`  Updated: ${scrapbook.updatedAt.toISOString()}`);
    console.log('');
  }

  await mongoose.disconnect();
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node server/listScrapbooks.js [USER_ID]

Arguments:
  USER_ID    Optional: Show scrapbooks for specific user only

Examples:
  # List all scrapbooks
  node server/listScrapbooks.js

  # List scrapbooks for specific user
  node server/listScrapbooks.js 507f1f77bcf86cd799439011
    `);
    process.exit(0);
  }

  const userId = args[0] || null;

  try {
    await listScrapbooks(userId);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { listScrapbooks };
