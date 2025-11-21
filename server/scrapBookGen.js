const path = require("path");
const fs = require("fs/promises");
const { existsSync } = require("fs");
const mongoose = require("mongoose");
const exifr = require("exifr");
const {
} = require("./geospatial/boundaryCluster");
require("dotenv").config();




async function geoGroupByLocation(entries) {
  const locationMap = new Map();

  for (const entry of entries) {
    if (entry.gps && entry.gps.latitude && entry.gps.longitude) {
      const key = `${entry.gps.latitude.toFixed(4)},${entry.gps.longitude.toFixed(4)}`;
      if (!locationMap.has(key)) {
        locationMap.set(key, []);
      }
      locationMap.get(key).push(entry);
    }
  }

  return locationMap;
}

async function resolveBoundaryLayersFromEnv() {
  const configPath = process.env.SCRAPBOOK_BOUNDARY_CONFIG;
  if (!configPath) {
    return [];
  }
  try {
    const layerConfigs = await loadBoundaryConfig(configPath);
    const requestedLevels = normalizeLevels(
      process.env.SCRAPBOOK_BOUNDARY_LEVELS
        ? process.env.SCRAPBOOK_BOUNDARY_LEVELS.split(",")
        : [],
    );
    const filteredConfigs =
      requestedLevels.length === 0
        ? layerConfigs
        : layerConfigs.filter((cfg) => requestedLevels.includes(cfg.level));
    if (!filteredConfigs.length) {
      console.warn(
        "[Geospatial] No boundary layers match SCRAPBOOK_BOUNDARY_LEVELS. Skipping clustering.",
      );
      return [];
    }
    return buildBoundaryLayers(filteredConfigs);
  } catch (error) {
    console.error(
      `[Geospatial] Failed to load boundary configuration: ${error.message}`,
    );
    return [];
  }
}