"use client";

import React, { useState, useEffect, useRef } from "react";
import Map, { Source, Layer, Popup, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import styles from "./map.module.css";
import { useUser } from "@/context/UserContext";

// Mapbox token from env
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const clusterLayer = {
  id: "clusters",
  type: "circle",
  source: "posts",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": [
      "step",
      ["get", "point_count"],
      "#51bbd6",
      10,
      "#f1f075",
      50,
      "#f28cb1",
    ],
    "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
  },
};

const clusterCountLayer = {
  id: "cluster-count",
  type: "symbol",
  source: "posts",
  filter: ["has", "point_count"],
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
    "text-size": 12,
  },
};

const unclusteredPointLayer = {
  id: "unclustered-point",
  type: "circle",
  source: "posts",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": "#11b4da",
    "circle-radius": 6,
    "circle-stroke-width": 1,
    "circle-stroke-color": "#fff",
  },
};

export default function MapPage() {
  const [posts, setPosts] = useState([]);
  const [popupInfo, setPopupInfo] = useState(null);
  const mapRef = useRef(null);
  const { user, loading } = useUser();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/posts");
        const data = await res.json();
        if (data.success) {
          const validPosts = data.posts.filter(
            (p) => p.geolocation && p.geolocation.lat && p.geolocation.lng
          );
          setPosts(validPosts);
        }
      } catch (err) {
        console.error("Failed to fetch posts", err);
      }
    };

    fetchPosts();
  }, []);

  const postsGeoJSON = {
    type: "FeatureCollection",
    features: posts.map((post) => ({
      type: "Feature",
      properties: {
        id: post._id,
        caption: post.caption,
        imageUrl: post.images[0]?.url,
        location: post.location,
        cluster: false,
      },
      geometry: {
        type: "Point",
        coordinates: [post.geolocation.lng, post.geolocation.lat],
      },
    })),
  };

  const onClick = (event) => {
    const feature = event.features[0];
    if (!feature) return;

    const clusterId = feature.properties.cluster_id;

    if (clusterId) {
      const mapboxSource = mapRef.current.getSource("posts");

      mapboxSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        mapRef.current.easeTo({
          center: feature.geometry.coordinates,
          zoom,
          duration: 500,
        });
      });
    } else {
      // Clicked on a single point
      const { caption, imageUrl, location } = feature.properties;
      setPopupInfo({
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
        caption,
        imageUrl,
        location,
      });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to view the map.</div>;
  if (!MAPBOX_TOKEN)
    return (
      <div style={{ padding: 20 }}>
        Please set NEXT_PUBLIC_MAPBOX_TOKEN in client/.env
      </div>
    );

  return (
    <div className={styles.mapContainer}>
      <Map
        initialViewState={{
          latitude: 20,
          longitude: 0,
          zoom: 1.5,
        }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={[clusterLayer.id, unclusteredPointLayer.id]}
        onClick={onClick}
        ref={mapRef}
      >
        <Source
          id="posts"
          type="geojson"
          data={postsGeoJSON}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...unclusteredPointLayer} />
        </Source>
        {popupInfo && (
          <Popup
            anchor="top"
            longitude={Number(popupInfo.longitude)}
            latitude={Number(popupInfo.latitude)}
            onClose={() => setPopupInfo(null)}
            className={styles.popup}
          >
            <div className={styles.popupContent}>
              {popupInfo.imageUrl && (
                <img
                  src={popupInfo.imageUrl}
                  alt="Post"
                  className={styles.popupImage}
                />
              )}
              <p>
                <strong>{popupInfo.location}</strong>
              </p>
              <p>{popupInfo.caption}</p>
            </div>
          </Popup>
        )}
        <NavigationControl position="top-left" />
      </Map>
    </div>
  );
}
