"use client";
import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import styles from "./SignupPage.module.css";

export default function SignupPage() {
  // use states for user signing up to track relevant info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });

  // router for navigation
  const router = useRouter();
  const { setUser, setAuthenticated } = useUser();

  // handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setErrors({
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
    });
    try {
      const nameRegex = /^[A-Za-z\s-]+$/;
      const usernameRegex = /^[a-z0-9_.]+$/;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const strongPassword =
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
      
      // trim inputs to remove extra whitespace
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const trimmedUsername = username.trim();
      const trimmedEmail = email.trim();

      if (!nameRegex.test(trimmedFirstName)) {
        setErrors((prev) => ({
          ...prev,
          firstName: "First name can only include letters, spaces, and dashes",
        }));
        setLoading(false);
        return;
      }

      if (!nameRegex.test(trimmedLastName)) {
        setErrors((prev) => ({
          ...prev,
          lastName: "Last name can only include letters, spaces, and dashes",
        }));
        setLoading(false);
        return;
      }

      if (!usernameRegex.test(trimmedUsername)) {
        setErrors((prev) => ({
          ...prev,
          username:
            "Username can only contain lowercase letters, numbers, underscores, and periods",
        }));
        setLoading(false);
        return;
      }

      if (!emailRegex.test(trimmedEmail)) {
        setErrors((prev) => ({
          ...prev,
          email: "Please enter a valid email address",
        }));
        setLoading(false);
        return;
      }

      if (!strongPassword.test(password)) {
        setErrors((prev) => ({
          ...prev,
          password:
            "Password must be 8+ characters and include a letter, number, and special character (!@#$%^&*)",
        }));
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for cookies
        body: JSON.stringify({
          email: trimmedEmail,
          password,
          displayName: trimmedUsername,
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
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
        router.push("/feed");
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
        <form
          onSubmit={handleSubmit}
          className={`${styles.form} ${styles.focusHintsOnly}`}
        >
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
          <div className={styles.field}>
            <label htmlFor="firstName">First Name</label>
            <p className={styles.hint}>(Letters, spaces, and dashes only)</p>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={errors.firstName ? styles.errorInput : ""}
            />
            {errors.firstName && (
              <p className={styles.error}>{errors.firstName}</p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="lastName">Last Name</label>
            <p className={styles.hint}>(Letters, spaces, and dashes only)</p>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={errors.lastName ? styles.errorInput : ""}
            />
            {errors.lastName && <p className={styles.error}>{errors.lastName}</p>}
          </div>

          <div className={styles.field}>
            <label htmlFor="username">Username</label>
            <p className={styles.hint}>
              (Lowercase letters, numbers, underscores, and periods only)
            </p>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={errors.username ? styles.errorInput : ""}
            />
            {errors.username && (
              <p className={styles.error}>{errors.username}</p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <p className={styles.hint}>(Enter a valid email like name@example.com)</p>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? styles.errorInput : ""}
            />
            {errors.email && <p className={styles.error}>{errors.email}</p>}
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <p className={styles.hint}>
              (8+ characters with at least one letter, number, and special character !@#$%^&*)
            </p>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? styles.errorInput : ""}
            />
            {errors.password && <p className={styles.error}>{errors.password}</p>}
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Signing up..." : "Sign up"}
          </button>
          <button
            type="button"
            style={{ color: "black", border: "1px solid #e8e0d8" }}
            onClick={() => {
              const API_URL = process.env.NEXT_PUBLIC_API_URL;
              window.location.href = `${API_URL}/auth/google`;
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
