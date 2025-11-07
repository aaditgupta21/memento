"use client";
import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./SetUsername.module.css";

export default function SetUsernamePage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  const router = useRouter();

  // Check if user is authenticated and needs username
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("http://localhost:4000/api/me", {
          credentials: "include",
        });
        const data = await response.json();

        if (!data.authenticated) {
          // Not logged in, redirect to login
          router.push("/login");
        } else if (data.user.displayName && data.user.displayName !== data.user.email) {
          // Already has username, redirect to home
          router.push("/");
        }
        // Otherwise, show the form
        setCheckingAuth(false);
      } catch (err) {
        console.error(err);
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:4000/api/update-username", {
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

  if (checkingAuth) {
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
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
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

