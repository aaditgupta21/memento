/**
 * Scrapbook Auto-Updater
 *
 * Automatically updates scrapbooks when posts are created, updated, or deleted.
 * Used by Post model hooks to maintain scrapbook consistency.
 *
 * Features:
 * - Auto-creates monthly scrapbooks
 * - Auto-creates genre/category scrapbooks
 * - Uses atomic operations (upsert) for performance
 * - Prevents duplicate post references
 * - Graceful error handling
 */

const mongoose = require('mongoose');

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

/**
 * Update monthly scrapbook for a post (only if scrapbook already exists)
 * No longer auto-creates scrapbooks
 *
 * @param {Post} post - The post document
 * @returns {Promise<Scrapbook|null>}
 */
async function updateMonthlyScrapbook(post) {
  if (!post.createdAt || !post.author) {
    return null;
  }

  // Lazy load Scrapbook model to avoid circular dependency
  const Scrapbook = mongoose.model('Scrapbook');

  const date = new Date(post.createdAt);
  const year = date.getFullYear();
  const monthName = MONTH_NAMES[date.getMonth()];
  const title = `${monthName} ${year}`;

  try {
    // Only update if scrapbook already exists (no upsert)
    const scrapbook = await Scrapbook.findOneAndUpdate(
      { author: post.author, title },
      {
        $addToSet: { posts: post._id } // Only add if not exists (prevents duplicates)
      },
      {
        new: true
      }
    );

    if (!scrapbook) {
      // Scrapbook doesn't exist - don't create it
      return null;
    }

    // Update description with current post count
    scrapbook.description = `Your memories from ${monthName} ${year}. ${scrapbook.posts.length} post${scrapbook.posts.length === 1 ? '' : 's'} captured.`;
    await scrapbook.save();

    console.log(`[Scrapbook] ✓ Updated monthly scrapbook: ${title} (${scrapbook.posts.length} posts)`);
    return scrapbook;

  } catch (error) {
    console.error(`[Scrapbook] ✗ Error updating monthly scrapbook:`, error.message);
    return null;
  }
}

/**
 * Update genre scrapbooks for a post (only if scrapbook already exists)
 * Handles multiple categories per post
 *
 * @param {Post} post - The post document
 * @returns {Promise<Array<Scrapbook>>}
 */
async function updateGenreScrapbooks(post) {
  if (!post.categories || post.categories.length === 0 || !post.author) {
    return [];
  }

  const Scrapbook = mongoose.model('Scrapbook');
  const updatedScrapbooks = [];

  for (const category of post.categories) {
    const title = `My ${category} Memories`;
    const baseDesc = GENRE_DESCRIPTIONS[category] || `Your ${category} memories.`;

    try {
      // Only update if scrapbook already exists (no upsert)
      const scrapbook = await Scrapbook.findOneAndUpdate(
        { author: post.author, title },
        {
          $addToSet: { posts: post._id }
        },
        {
          new: true
        }
      );

      if (!scrapbook) {
        // Scrapbook doesn't exist - don't create it
        continue;
      }

      // Update description with current post count
      scrapbook.description = `${baseDesc} ${scrapbook.posts.length} post${scrapbook.posts.length === 1 ? '' : 's'} captured.`;
      await scrapbook.save();

      console.log(`[Scrapbook] ✓ Updated genre scrapbook: ${title} (${scrapbook.posts.length} posts)`);
      updatedScrapbooks.push(scrapbook);

    } catch (error) {
      console.error(`[Scrapbook] ✗ Error updating genre scrapbook (${category}):`, error.message);
    }
  }

  return updatedScrapbooks;
}

/**
 * Check if scrapbooks should be generated based on post count thresholds
 * Creates monthly and genre scrapbooks if minimum post count is met
 *
 * @param {Post} post - The newly created post
 * @param {number} minPosts - Minimum posts required to create a scrapbook (default: 6)
 * @returns {Promise<{monthly: Scrapbook|null, genres: Array<Scrapbook>}>}
 */
async function checkAndGenerateScrapbooks(post, minPosts = 6) {
  if (process.env.AUTO_UPDATE_SCRAPBOOKS !== 'true') {
    return { monthly: null, genres: [] };
  }

  const Post = mongoose.model('Post');
  const Scrapbook = mongoose.model('Scrapbook');
  const created = { monthly: null, genres: [] };

  try {
    // Check monthly scrapbook threshold
    const date = new Date(post.createdAt);
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthName = MONTH_NAMES[month];
    const monthlyTitle = `${monthName} ${year}`;

    // Check if monthly scrapbook already exists
    const existingMonthly = await Scrapbook.findOne({
      author: post.author,
      title: monthlyTitle
    });

    if (!existingMonthly) {
      // Count posts in this month
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const monthlyPostCount = await Post.countDocuments({
        author: post.author,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      if (monthlyPostCount >= minPosts) {
        // Create monthly scrapbook
        const monthlyPosts = await Post.find({
          author: post.author,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }).select('_id images').sort({ createdAt: -1 });

        const monthlyScrapbook = new Scrapbook({
          title: monthlyTitle,
          author: post.author,
          posts: monthlyPosts.map(p => p._id),
          coverImage: monthlyPosts[0]?.images?.[0]?.url || '',
          description: `Your memories from ${monthName} ${year}. ${monthlyPostCount} posts captured.`
        });

        await monthlyScrapbook.save();
        created.monthly = monthlyScrapbook;
        console.log(`[Scrapbook] ✓ Generated monthly scrapbook: ${monthlyTitle} (${monthlyPostCount} posts)`);
      }
    }

    // Check genre scrapbook thresholds
    if (post.categories && post.categories.length > 0) {
      for (const category of post.categories) {
        const genreTitle = `My ${category} Memories`;

        // Check if genre scrapbook already exists
        const existingGenre = await Scrapbook.findOne({
          author: post.author,
          title: genreTitle
        });

        if (!existingGenre) {
          // Count posts in this genre
          const genrePostCount = await Post.countDocuments({
            author: post.author,
            categories: category
          });

          if (genrePostCount >= minPosts) {
            // Create genre scrapbook
            const genrePosts = await Post.find({
              author: post.author,
              categories: category
            }).select('_id images').sort({ createdAt: -1 });

            const baseDesc = GENRE_DESCRIPTIONS[category] || `Your ${category} memories.`;
            const genreScrapbook = new Scrapbook({
              title: genreTitle,
              author: post.author,
              posts: genrePosts.map(p => p._id),
              coverImage: genrePosts[0]?.images?.[0]?.url || '',
              description: `${baseDesc} ${genrePostCount} posts captured.`
            });

            await genreScrapbook.save();
            created.genres.push(genreScrapbook);
            console.log(`[Scrapbook] ✓ Generated genre scrapbook: ${genreTitle} (${genrePostCount} posts)`);
          }
        }
      }
    }

    return created;

  } catch (error) {
    console.error(`[Scrapbook] ✗ Error in checkAndGenerateScrapbooks:`, error.message);
    return { monthly: null, genres: [] };
  }
}

/**
 * Update all relevant scrapbooks for a post
 * Main entry point called by Post model hooks
 *
 * @param {Post} post - The post document
 * @returns {Promise<{monthly: Scrapbook|null, genres: Array<Scrapbook>}>}
 */
async function updateAllScrapbooks(post) {
  // Check if auto-update is enabled
  if (process.env.AUTO_UPDATE_SCRAPBOOKS !== 'true') {
    return { monthly: null, genres: [] };
  }

  try {
    // Update existing scrapbooks in parallel for better performance
    const [monthly, genres] = await Promise.all([
      updateMonthlyScrapbook(post),
      updateGenreScrapbooks(post)
    ]);

    const updatedCount = genres.length + (monthly ? 1 : 0);
    if (updatedCount > 0) {
      console.log(`[Scrapbook] ✓ Updated ${updatedCount} existing scrapbook(s) for post ${post._id}`);
    }

    return { monthly, genres };

  } catch (error) {
    console.error(`[Scrapbook] ✗ Error in updateAllScrapbooks:`, error.message);
    // Don't throw - we don't want to fail post creation if scrapbook update fails
    return { monthly: null, genres: [] };
  }
}

/**
 * Remove post from all scrapbooks (called when post is deleted)
 *
 * @param {string|ObjectId} postId - The post ID to remove
 * @returns {Promise<number>} Number of scrapbooks updated
 */
async function removePostFromScrapbooks(postId) {
  // Check if auto-update is enabled
  if (process.env.AUTO_UPDATE_SCRAPBOOKS !== 'true') {
    return 0;
  }

  const Scrapbook = mongoose.model('Scrapbook');

  try {
    // Remove post from all scrapbooks that contain it
    const result = await Scrapbook.updateMany(
      { posts: postId },
      { $pull: { posts: postId } }
    );

    console.log(`[Scrapbook] ✓ Removed post ${postId} from ${result.modifiedCount} scrapbook(s)`);
    return result.modifiedCount;

  } catch (error) {
    console.error(`[Scrapbook] ✗ Error removing post from scrapbooks:`, error.message);
    return 0;
  }
}

/**
 * Sync genre scrapbooks when post categories change
 * Removes from old categories, adds to new ones
 *
 * @param {Post} post - The updated post
 * @param {Array<string>} oldCategories - Previous categories
 * @returns {Promise<void>}
 */
async function syncGenreScrapbooks(post, oldCategories = []) {
  if (process.env.AUTO_UPDATE_SCRAPBOOKS !== 'true') {
    return;
  }

  const Scrapbook = mongoose.model('Scrapbook');
  const newCategories = post.categories || [];

  try {
    // Find categories that were removed
    const removedCategories = oldCategories.filter(cat => !newCategories.includes(cat));

    // Remove post from scrapbooks for removed categories
    for (const category of removedCategories) {
      const title = `My ${category} Memories`;
      await Scrapbook.updateOne(
        { author: post.author, title },
        { $pull: { posts: post._id } }
      );
      console.log(`[Scrapbook] ✓ Removed post from: ${title}`);
    }

    // Add to new categories (updateGenreScrapbooks handles duplicates)
    await updateGenreScrapbooks(post);

  } catch (error) {
    console.error(`[Scrapbook] ✗ Error syncing genre scrapbooks:`, error.message);
  }
}

module.exports = {
  updateMonthlyScrapbook,
  updateGenreScrapbooks,
  updateAllScrapbooks,
  checkAndGenerateScrapbooks,
  removePostFromScrapbooks,
  syncGenreScrapbooks
};
