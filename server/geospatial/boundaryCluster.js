"use strict";

require("dotenv").config();

const BIGDATACLOUD_BASE_URL =
  process.env.BIGDATACLOUD_BASE_URL || "https://api.bigdatacloud.net/data";

/**
 * Call BigDataCloud reverse geocoding API to get location names
 * @param {Object} options - Geocoding options
 * @param {number} options.latitude - Latitude
 * @param {number} options.longitude - Longitude
 * @param {string} options.localityLanguage - Language for locality names (default: "en")
 * @returns {Promise<Object>} Reverse geocoding response
 */
async function reverseGeocode({
  latitude,
  longitude,
  localityLanguage = "en",
}) {
  if (!process.env.BIGDATACLOUD_API_KEY) {
    throw new Error("BIGDATACLOUD_API_KEY is missing");
  }

  const url = new URL(`${BIGDATACLOUD_BASE_URL}/reverse-geocode-client`);
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("localityLanguage", localityLanguage);
  url.searchParams.set("key", process.env.BIGDATACLOUD_API_KEY);

  const res = await fetch(url, {
    headers: { "User-Agent": "memento-scrapbook/1.0" },
  });

  if (!res.ok) {
    throw new Error(`BigDataCloud error ${res.status}`);
  }

  return res.json();
}

/**
 * Extract location levels from BigDataCloud reverse geocode response
 * Returns hierarchical location data (country, state, city, etc.)
 * @param {Object} data - BigDataCloud reverse-geocode JSON response
 * @returns {Array<{level: string, locationId: string, name: string, code: string|null}>}
 */
function extractLocationLevels(data) {
  const admin = data?.localityInfo?.administrative || [];
  const locations = [];

  admin.forEach((adm) => {
    // Determine the level (order is more reliable than adminLevel)
    const level = String(adm.order || adm.adminLevel || "unknown");

    // Create a unique location ID from isoCode or name
    const locationId =
      adm.isoCode ||
      adm.wikidataId ||
      `${level}:${adm.name}`;

    const name = adm.name || adm.description || "Unknown";
    const code = adm.isoCode || null;

    locations.push({
      level,
      locationId,
      name,
      code,
      description: adm.description || null,
    });
  });

  return locations;
}

/**
 * Reverse geocode entries and cluster by text-based location names
 * Groups photos by shared location at each administrative level (country, state, city, etc.)
 *
 * @param {Array<{gps?: {latitude:number, longitude:number}}>} entries - Photo entries with GPS data
 * @param {Map<string, Map<string, any>>} existingClustersByLevel - Optional existing clusters to append to
 * @returns {Promise<{annotatedEntries: Array, clustersByLevel: Map<string, Map<string, any>>, withoutLocation: Array}>}
 */
async function mapEntriesWithReverseGeocode(entries, existingClustersByLevel) {
  const clustersByLevel = existingClustersByLevel || new Map();
  const withoutLocation = [];
  const annotatedEntries = [];

  for (const entry of entries || []) {
    const lat = entry?.gps?.latitude;
    const lon = entry?.gps?.longitude;
    const matches = [];

    // Skip entries without GPS data
    if (typeof lat !== "number" || typeof lon !== "number") {
      withoutLocation.push(entry);
      annotatedEntries.push({ ...entry, boundaryMatches: matches });
      continue;
    }

    // Call reverse geocoding API
    let reverseData = null;
    try {
      reverseData = await reverseGeocode({
        latitude: lat,
        longitude: lon,
      });
    } catch (error) {
      console.warn(
        `[Geospatial] Reverse geocode failed for ${lat},${lon}: ${error.message}`,
      );
      annotatedEntries.push({ ...entry, boundaryMatches: matches });
      continue;
    }

    // Extract location levels from response
    const locations = extractLocationLevels(reverseData);

    // Add entry to clusters for each location level
    for (const location of locations) {
      const { level, locationId, name, code, description } = location;

      // Get or create cluster map for this level
      let clusterMap = clustersByLevel.get(level);
      if (!clusterMap) {
        clusterMap = new Map();
        clustersByLevel.set(level, clusterMap);
      }

      // Get or create cluster for this specific location
      let cluster = clusterMap.get(locationId);
      if (!cluster) {
        cluster = {
          boundaryId: locationId,
          level,
          name,
          code,
          description,
          entries: [],
        };
        clusterMap.set(locationId, cluster);
      }

      // Add entry to cluster
      cluster.entries.push(entry);

      // Track match for this entry
      matches.push({
        level,
        boundaryId: locationId,
        name,
        code,
      });
    }

    annotatedEntries.push({ ...entry, boundaryMatches: matches });
  }

  return { annotatedEntries, clustersByLevel, withoutLocation };
}

module.exports = {
  reverseGeocode,
  extractLocationLevels,
  mapEntriesWithReverseGeocode,
};
