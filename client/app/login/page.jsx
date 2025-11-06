"use client";
import React from "react";
import { useState } from "react";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      console.log("Logging in with:", email, password);
      // API call here for manual auth
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.main}>
      <div>
        <h1>Welcome back to your memories</h1>
        <form onSubmit={handleSubmit}>
          <h2>Sign in</h2>

          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = "http://localhost:4000/auth/google";
            }}
          >
            Continue with Google
          </button>
          <p>
            Don't have an account?{" "}
            <button type="button" onClick={() => console.log("Sign up")}>
              Sign up
            </button>
          </p>
        </form>
      </div>
    </main>
  );
}
