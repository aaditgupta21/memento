"use client";
import { prepareFlightRouterStateForRequest } from "next/dist/client/flight-data-helpers";
import styles from "./CaptionLocationStep.module.css";
import { useEffect, useRef, useState } from "react";

export default function CaptionLocationStep({
  caption,
  setCaption,
  location,
  setLocation,
  onBack,
  onNext,
}) {
  const [locationQuery, setLocationQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  // Fetch location suggestions from backend
  useEffect(() => {
    if (locationQuery.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setIsTyping(false);
      setIsLoading(false);
      return;
    }

    // Show typing indicator immediately
    setIsTyping(true);
    setShowDropdown(false);

    const timeoutId = setTimeout(async () => {
      // User stopped typing, now loading from API
      setIsTyping(false);
      setIsLoading(true);

      try {
        const response = await fetch(
          `${API_BASE}/api/posts/locations/search?query=${encodeURIComponent(
            locationQuery
          )}`,
          { credentials: "include" }
        );

        if (!response.ok) throw new Error("Failed to fetch locations");

        const data = await response.json();
        setSuggestions(data.locations || []);
        setShowDropdown(true);
      } catch (error) {
        console.error("Error fetching locations:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 400); // Wait 400ms after user stops typing

    return () => {
      clearTimeout(timeoutId);
      setIsTyping(false);
    };
  }, [locationQuery, API_BASE]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocationSelect = (selectedLocation) => {
    // Format: "City, State, Country" or just "City, Country"
    const { address, name, displayName } = selectedLocation;
    let formattedLocation = "";

    if (address.city && address.state && address.country) {
      formattedLocation = `${address.city}, ${address.state}, ${address.country}`;
    } else if (address.city && address.country) {
      formattedLocation = `${address.city}, ${address.country}`;
    } else if (name && address.country) {
      formattedLocation = `${name}, ${address.country}`;
    } else {
      formattedLocation = displayName;
    }

    setLocation(formattedLocation);
    setLocationQuery(formattedLocation);
    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <>
      <h2>Step 2: Caption & Location</h2>
      <input
        type="text"
        placeholder="Caption (required)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className={styles.input}
      />
      <div className={styles.locationDropdown} ref={dropdownRef}>
        <input
          type="text"
          placeholder="Location (required)"
          value={locationQuery}
          onChange={(e) => {
            setLocationQuery(e.target.value);
            setLocation(""); // Clear selected location
          }}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          className={styles.input}
        />

        {/* Typing indicator */}
        {isTyping && <div className={styles.typingIndicator}>Typing...</div>}

        {/* Loading indicator */}
        {isLoading && (
          <div className={styles.loadingIndicator}>Searching...</div>
        )}

        {/* Suggestions dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className={styles.suggestionsDropdown}>
            {suggestions.map((loc, index) => (
              <button
                key={index}
                type="button"
                className={styles.suggestionItem}
                onClick={() => handleLocationSelect(loc)}
              >
                <div className={styles.suggestionName}>{loc.name}</div>
                <div className={styles.suggestionAddress}>
                  {loc.displayName}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={styles.stepButtons}>
        <button onClick={onBack} className={styles.backBtn}>
          Back
        </button>
        <button
          onClick={onNext}
          className={styles.saveBtn}
          disabled={caption.trim() === "" || location.trim() === ""}
        >
          Next: Categories
        </button>
      </div>
    </>
  );
}
