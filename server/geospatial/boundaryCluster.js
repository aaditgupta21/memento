"use strict";

const fs = require("fs/promises");
const path = require("path");
const {
  
} = require("./geospatial/boundaryCluster");
require("dotenv").config();
/**
 * Flattens nested coordinate arrays from GeoJSON geometry into a simple array of [lng, lat] pairs.
 * @param {Array} coords
 * @returns {Array<[number, number]>}
 */
function flattenCoordinates(coords) {
  if (!Array.isArray(coords)) return [];
  if (typeof coords[0] === "number") {
    return [coords];
  }
  return coords.reduce(
    (acc, value) => acc.concat(flattenCoordinates(value)),
    [],
  );
}

async function fetchBigDataCloudBoundary({ latitude, longitude, localityLanguage = "en", level = "city" }) {
  if (!process.env.BIGDATACLOUD_API_KEY) {
    throw new Error("BIGDATACLOUD_API_KEY is missing");
  }

  const url = new URL(`${BIGDATACLOUD_BASE_URL}/reverse-geocode-client`);
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("localityLanguage", localityLanguage);
  url.searchParams.set("polygonGeoJson", "true");
  url.searchParams.set("key", process.env.BIGDATACLOUD_API_KEY);

  const res = await fetch(url, { headers: { "User-Agent": "memento-scrapbook/1.0" } });
  if (!res.ok) {
    throw new Error(`BigDataCloud error ${res.status}`);
  }

  const data = await res.json();
  const polygon = data?.localityInfo?.administrative?.find((adm) => adm.order === level)?.geoShape?.geometry;
  if (!polygon) return null;

  return {
    id: `${level}:${data.city || data.locality || `${latitude},${longitude}`}`,
    level,
    geometry: polygon,
  };
}

/**
 * parse geocode from EXIF GPS data 
 * Find smallest non null boundary option
 * Find grouping of 5 photos fulfilling lowest level shared boundary
 */

async function findGroupingPhotos(entries) {
  // Implementation here
  const groups = [];
}



module.exports = {
  flattenCoordinates,
  fetchBigDataCloudBoundary,
  findGroupingPhotos,
};


