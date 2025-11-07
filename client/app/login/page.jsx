"use client";
import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for cookies
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Success - show message and redirect
      setSuccess("Logged in successfully! Redirecting...");
      setTimeout(() => {
        router.push("/");
      }, 1500);
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
          {error && (
            <div className="error-message" style={{ color: "red" }}>
              {error}
            </div>
          )}
          {success && (
            <div className="success-message" style={{ color: "green", fontWeight: "500" }}>
              {success}
            </div>
          )}

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
            <button type="button" onClick={() => router.push("/signup")}>
              Sign up
            </button>
          </p>
        </form>
      </div>
    </main>
  );
}
