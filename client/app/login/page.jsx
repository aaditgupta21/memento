"use client";
import React from "react";

export default function LoginPage() {
  return (
    <main>
      <form>
        <h1>Sign in</h1>

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>

        <button type="submit">Log in</button>
      </form>
    </main>
  );
}
