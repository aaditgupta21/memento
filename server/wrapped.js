"use strict";

const path = require("path");
const mongoose = require("mongoose");
const Post = require("./models/Post");
const User = require("./models/User");

const HOUR_IN_MS = 36e5;

function normalizeId(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value.toString) return value.toString();
  return null;
}

function getYearBounds(year) {
  return {
    start: new Date(year, 0, 1),
    end: new Date(year + 1, 0, 1),
  };
}

async function ensureDb() {
  if (mongoose.connection.readyState !== 0) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to your environment before running wrapped.",
    );
  }
  await mongoose.connect(uri);
}

function topFromCountMap(countMap, userMap = new Map(), limit = 5) {
  return Array.from(countMap.entries())
    .sort(([, aCount], [, bCount]) => bCount - aCount)
    .slice(0, limit)
    .map(([userId, count]) => ({
      userId,
      count,
      displayName: userMap.get(userId)?.displayName || null,
      email: userMap.get(userId)?.email || null,
    }));
}

async function fetchUsersMap(ids) {
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  if (!uniqueIds.length) return new Map();
  const users = await User.find({ _id: { $in: uniqueIds } })
    .select("displayName email profilePicture")
    .lean();
  return new Map(users.map((u) => [u._id.toString(), u]));
}

function summarizeLocationsFromPosts(posts) {
  const locationCounts = new Map();
  for (const post of posts) {
    if (!post.location) continue;
    const key = post.location.trim();
    if (!key) continue;
    locationCounts.set(key, (locationCounts.get(key) || 0) + 1);
  }
  return Array.from(locationCounts.entries())
    .sort(([, aCount], [, bCount]) => bCount - aCount)
    .map(([location, count]) => ({ location, count }));
}

function addTimestampToBuckets(dateValue, buckets) {
  if (!dateValue) return;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return;
  const month = date.getMonth();
  const hour = date.getHours();
  buckets.months[month] += 1;
  buckets.hours[hour] += 1;
  if (hour >= 5 && hour < 12) buckets.dayparts.morning += 1;
  else if (hour >= 12 && hour < 17) buckets.dayparts.afternoon += 1;
  else if (hour >= 17 && hour < 22) buckets.dayparts.evening += 1;
  else buckets.dayparts.night += 1;
}

function computeTimeframes(posts, exifEntries = []) {
  const buckets = {
    months: Array(12).fill(0),
    hours: Array(24).fill(0),
    dayparts: { morning: 0, afternoon: 0, evening: 0, night: 0 },
  };

  for (const post of posts) {
    const photoCount = Array.isArray(post.images) ? post.images.length : 1;
    for (let i = 0; i < Math.max(1, photoCount); i += 1) {
      addTimestampToBuckets(post.createdAt, buckets);
    }
  }

  for (const entry of exifEntries) {
    addTimestampToBuckets(entry.capturedAt, buckets);
  }

  const busiestMonthIdx = buckets.months.reduce(
    (bestIdx, count, idx, arr) => (count > arr[bestIdx] ? idx : bestIdx),
    0,
  );
  const busiestHour = buckets.hours.reduce(
    (bestIdx, count, idx, arr) => (count > arr[bestIdx] ? idx : bestIdx),
    0,
  );

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return {
    busiestMonth: {
      month: monthNames[busiestMonthIdx],
      photos: buckets.months[busiestMonthIdx],
    },
    peakHour: {
      hour: busiestHour,
      photos: buckets.hours[busiestHour],
    },
    dayparts: buckets.dayparts,
    buckets,
  };
}

function computeCategoryStats(myPosts, likedPosts) {
  const postedCounts = new Map();
  const likedCounts = new Map();

  for (const post of myPosts) {
    for (const category of post.categories || []) {
      postedCounts.set(category, (postedCounts.get(category) || 0) + 1);
    }
  }

  for (const post of likedPosts) {
    for (const category of post.categories || []) {
      likedCounts.set(category, (likedCounts.get(category) || 0) + 1);
    }
  }

  const postedTop = Array.from(postedCounts.entries()).sort(
    ([, aCount], [, bCount]) => bCount - aCount,
  );
  const likedTop = Array.from(likedCounts.entries()).sort(
    ([, aCount], [, bCount]) => bCount - aCount,
  );

  return {
    mostPostedCategory: postedTop[0]?.[0] || null,
    mostLikedCategory: likedTop[0]?.[0] || null,
    posted: postedTop.map(([category, count]) => ({ category, count })),
    liked: likedTop.map(([category, count]) => ({ category, count })),
  };
}

function summarizeSocialCounts(myPosts, commentedPosts, userId) {
  const likerCounts = new Map();
  const commenterCounts = new Map();
  const youCommentOnCounts = new Map();

  for (const post of myPosts) {
    for (const liker of post.likes || []) {
      const likerId = normalizeId(liker._id || liker);
      if (!likerId || likerId === userId) continue;
      likerCounts.set(likerId, (likerCounts.get(likerId) || 0) + 1);
    }
    for (const comment of post.comments || []) {
      const commenterId = normalizeId(comment.author?._id || comment.author);
      if (!commenterId || commenterId === userId) continue;
      commenterCounts.set(
        commenterId,
        (commenterCounts.get(commenterId) || 0) + 1,
      );
    }
  }

  for (const post of commentedPosts) {
    const targetAuthor = normalizeId(post.author?._id || post.author);
    if (!targetAuthor || targetAuthor === userId) continue;
    const commentCount = (post.comments || []).filter(
      (c) => normalizeId(c.author?._id || c.author) === userId,
    ).length;
    if (!commentCount) continue;
    youCommentOnCounts.set(
      targetAuthor,
      (youCommentOnCounts.get(targetAuthor) || 0) + commentCount,
    );
  }

  const involvedUserIds = new Set([
    ...likerCounts.keys(),
    ...commenterCounts.keys(),
    ...youCommentOnCounts.keys(),
  ]);

  return {
    likerCounts,
    commenterCounts,
    youCommentOnCounts,
    involvedUserIds,
  };
}

function haversineDistanceKm(a, b) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function clusterByBoundary(entries, precision = 1) {
  const clusters = new Map();
  for (const entry of entries) {
    const lat = entry?.gps?.latitude;
    const lon = entry?.gps?.longitude;
    if (typeof lat !== "number" || typeof lon !== "number") continue;
    const key = `${lat.toFixed(precision)},${lon.toFixed(precision)}`;
    const cluster =
      clusters.get(key) ||
      {
        boundaryKey: key,
        latitudeSum: 0,
        longitudeSum: 0,
        photoCount: 0,
        firstCapturedAt: null,
        lastCapturedAt: null,
      };
    const capturedAt = entry.capturedAt ? new Date(entry.capturedAt) : null;
    cluster.latitudeSum += lat;
    cluster.longitudeSum += lon;
    cluster.photoCount += 1;
    cluster.firstCapturedAt =
      cluster.firstCapturedAt && capturedAt
        ? capturedAt < cluster.firstCapturedAt
          ? capturedAt
          : cluster.firstCapturedAt
        : capturedAt || cluster.firstCapturedAt;
    cluster.lastCapturedAt =
      cluster.lastCapturedAt && capturedAt
        ? capturedAt > cluster.lastCapturedAt
          ? capturedAt
          : cluster.lastCapturedAt
        : capturedAt || cluster.lastCapturedAt;
    clusters.set(key, cluster);
  }

  return Array.from(clusters.values())
    .map((cluster) => ({
      boundaryKey: cluster.boundaryKey,
      photoCount: cluster.photoCount,
      approxCenter: {
        latitude: cluster.latitudeSum / cluster.photoCount,
        longitude: cluster.longitudeSum / cluster.photoCount,
      },
      firstCapturedAt: cluster.firstCapturedAt,
      lastCapturedAt: cluster.lastCapturedAt,
    }))
    .sort((a, b) => b.photoCount - a.photoCount);
}

function deriveTrips(entries, { gapHours = 48, distanceKm = 100, minPhotos = 3 } = {}) {
  const geoEntries = entries
    .filter(
      (entry) =>
        entry?.gps &&
        typeof entry.gps.latitude === "number" &&
        typeof entry.gps.longitude === "number" &&
        entry.capturedAt,
    )
    .map((entry) => ({
      ...entry,
      capturedAt: new Date(entry.capturedAt),
    }))
    .sort((a, b) => a.capturedAt - b.capturedAt);

  const trips = [];
  let current = null;

  for (const entry of geoEntries) {
    const coord = { latitude: entry.gps.latitude, longitude: entry.gps.longitude };
    if (!current) {
      current = {
        start: entry.capturedAt,
        end: entry.capturedAt,
        photos: [entry],
        lastCoord: coord,
      };
      continue;
    }

    const hourGap = (entry.capturedAt - current.end) / HOUR_IN_MS;
    const distance = haversineDistanceKm(current.lastCoord, coord);
    const isNewTrip = hourGap > gapHours || distance > distanceKm;
    if (isNewTrip) {
      trips.push(current);
      current = {
        start: entry.capturedAt,
        end: entry.capturedAt,
        photos: [entry],
        lastCoord: coord,
      };
    } else {
      current.photos.push(entry);
      current.end = entry.capturedAt > current.end ? entry.capturedAt : current.end;
      current.lastCoord = coord;
    }
  }

  if (current) {
    trips.push(current);
  }

  return trips
    .filter((trip) => trip.photos.length >= minPhotos)
    .map((trip) => {
      const center = trip.photos.reduce(
        (acc, photo) => ({
          latitude: acc.latitude + photo.gps.latitude,
          longitude: acc.longitude + photo.gps.longitude,
        }),
        { latitude: 0, longitude: 0 },
      );
      const photoCount = trip.photos.length;
      return {
        startedAt: trip.start,
        endedAt: trip.end,
        durationDays: Math.max(
          1,
          Math.ceil((trip.end - trip.start) / (24 * HOUR_IN_MS)),
        ),
        photoCount,
        approxCenter: {
          latitude: center.latitude / photoCount,
          longitude: center.longitude / photoCount,
        },
      };
    })
    .sort((a, b) => b.photoCount - a.photoCount);
}

function buildLocationStats(myPosts, exifEntries) {
  const postedLocations = summarizeLocationsFromPosts(myPosts);
  const clusters = clusterByBoundary(exifEntries);
  const trips = deriveTrips(exifEntries);
  return {
    topPostedLocations: postedLocations.slice(0, 5),
    boundaryClusters: clusters.slice(0, 5),
    trips: trips.slice(0, 5),
  };
}

async function loadExifEntries({ photoDir, atlasCollection } = {}) {
  if (!photoDir && !atlasCollection) return [];
  try {
    const {
      loadScrapbookEntries,
      loadScrapbookEntriesFromDb,
    } = require("./geospatial/EXIFReader");
    if (atlasCollection) {
      return await loadScrapbookEntriesFromDb(atlasCollection);
    }
    const resolvedDir = photoDir
      ? path.resolve(photoDir)
      : undefined;
    return await loadScrapbookEntries(resolvedDir);
  } catch (error) {
    console.warn(
      `[Wrapped] Unable to read EXIF data; continuing without trips: ${error.message}`,
    );
    return [];
  }
}

async function buildYearEndWrapped(userId, { year = new Date().getFullYear(), photoDir, atlasCollection } = {}) {
  await ensureDb();
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  const { start, end } = getYearBounds(year);

  const myPostsPromise = Post.find({
    author: userId,
    createdAt: { $gte: start, $lt: end },
  })
    .select("images categories caption location likes comments createdAt author")
    .populate("likes", "displayName email")
    .populate("comments.author", "displayName email")
    .lean();

  const likedPostsPromise = Post.find({
    likes: userId,
    createdAt: { $gte: start, $lt: end },
  })
    .select("categories author createdAt")
    .populate("author", "displayName")
    .lean();

  const commentedPostsPromise = Post.find({
    "comments.author": userId,
    createdAt: { $gte: start, $lt: end },
  })
    .select("author comments createdAt")
    .populate("author", "displayName")
    .lean();

  const [myPosts, likedPosts, commentedPosts, exifEntries] = await Promise.all([
    myPostsPromise,
    likedPostsPromise,
    commentedPostsPromise,
    loadExifEntries({ photoDir, atlasCollection }),
  ]);

  const photoCount = myPosts.reduce(
    (sum, post) => sum + (Array.isArray(post.images) ? post.images.length : 1),
    0,
  );
  const likesReceived = myPosts.reduce(
    (sum, post) => sum + (post.likes?.length || 0),
    0,
  );
  const commentsReceived = myPosts.reduce(
    (sum, post) => sum + (post.comments?.length || 0),
    0,
  );

  const socialCounts = summarizeSocialCounts(myPosts, commentedPosts, userId);
  const userMap = await fetchUsersMap(socialCounts.involvedUserIds);

  const recap = {
    user: {
      id: user._id.toString(),
      displayName: user.displayName,
      email: user.email,
    },
    year,
    totals: {
      posts: myPosts.length,
      photos: photoCount,
      likesReceived,
      commentsReceived,
    },
    social: {
      topLikers: topFromCountMap(socialCounts.likerCounts, userMap),
      topCommenters: topFromCountMap(socialCounts.commenterCounts, userMap),
      peopleYouCommentOn: topFromCountMap(
        socialCounts.youCommentOnCounts,
        userMap,
      ),
    },
    categories: computeCategoryStats(myPosts, likedPosts),
    locations: buildLocationStats(myPosts, exifEntries),
    timeFrames: computeTimeframes(myPosts, exifEntries),
    sources: {
      postsConsidered: myPosts.length,
      likedPostsConsidered: likedPosts.length,
      commentedPostsConsidered: commentedPosts.length,
      exifEntries: exifEntries.length,
    },
  };

  return recap;
}

async function cli() {
  const [, , userId, yearArg, ...flags] = process.argv;
  if (!userId) {
    console.error(
      "Usage: node wrapped.js <userId> [year] [--photos=/path/to/images] [--atlas=collection]",
    );
    process.exit(1);
  }

  const options = {};
  if (yearArg && !yearArg.startsWith("--")) {
    const parsedYear = Number(yearArg);
    options.year = Number.isNaN(parsedYear)
      ? new Date().getFullYear()
      : parsedYear;
  }

  for (const flag of flags) {
    if (flag.startsWith("--photos=")) {
      options.photoDir = flag.replace("--photos=", "");
    } else if (flag.startsWith("--atlas=")) {
      options.atlasCollection = flag.replace("--atlas=", "");
    }
  }

  try {
    const recap = await buildYearEndWrapped(userId, options);
    console.dir(recap, { depth: null });
    await mongoose.connection.close();
  } catch (error) {
    console.error(`Failed to build wrapped: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  cli();
}

module.exports = {
  buildYearEndWrapped,
};
