"use client";
import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import styles from "./SetUsername.module.css";

export default function SetUsernamePage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();
  const { user, authenticated, loading: userLoading, fetchUser } = useUser();

  // Check if user is authenticated and needs username
  useEffect(() => {
    if (!userLoading) {
      if (!authenticated) {
        // Not logged in, redirect to login
        router.push("/login");
      } else if (user && user.displayName && user.displayName !== user.email) {
        // Already has username, redirect to home
        router.push("/");
      }
    }
  }, [authenticated, user, userLoading, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/users/update-username`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          displayName: username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to set username");
      }

      // Update global user state
      await fetchUser();
      setSuccess("Username set successfully! Redirecting...");
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (userLoading) {
    return (
      <main className={styles.main}>
        <div>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div>
        <h1>Welcome to your memories</h1>
        <form onSubmit={handleSubmit}>
          <h2>Choose a username</h2>
          <p className={styles.subtitle}>
            Please set a username to complete your profile
          </p>
          {error && (
            <div className="error-message" style={{ color: "red" }}>
              {error}
            </div>
          )}
          {success && (
            <div
              className="success-message"
              style={{ color: "green", fontWeight: "500" }}
            >
              {success}
            </div>
          )}

          <div>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Setting username..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}

