"use client";
import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import styles from "./SignupPage.module.css";

export default function SignupPage() {
  // use states for user signing up to track relevant info
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // router for navigation
  const router = useRouter();
  const { setUser, setAuthenticated } = useUser();

  // handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("http://localhost:4000/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for cookies
        body: JSON.stringify({
          email,
          password,
          displayName: username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      // Success - update global state and redirect
      setUser(data.user);
      setAuthenticated(true);
      setSuccess("Account created successfully! Redirecting...");
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
        <h1>Welcome to your memories</h1>
        <form onSubmit={handleSubmit}>
          <h2>Sign up</h2>
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
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
            {loading ? "Signing up..." : "Sign up"}
          </button>
          <button
            type="button"
            style={{ color: "black", border: "1px solid #e8e0d8" }}
            onClick={() => {
              window.location.href = "http://localhost:4000/auth/google";
            }}
          >
            Continue with Google
          </button>
          <p>
            Already have an account?{" "}
            <button type="button" onClick={() => router.push("/login")}>
              Sign in
            </button>
          </p>
        </form>
      </div>
    </main>
  );
}
