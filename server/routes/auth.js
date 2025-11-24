const express = require("express");
const router = express.Router();
const passport = require("../passport");
const User = require("../models/User");
const { RESERVED_USERNAMES } = require("../constants");

// Email/Password signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if username is reserved
    if (RESERVED_USERNAMES.includes(displayName.toLowerCase())) {
      return res.status(400).json({ error: "This username is reserved" });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Check if username (displayName) already exists
    const existingUsername = await User.findOne({ displayName });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      displayName,
    });

    // Log the user in
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: "Login failed after signup" });
      }
      res.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
        },
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Email/Password login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: "Server error" });
    }
    if (!user) {
      return res.status(401).json({ error: info.message || "Login failed" });
    }
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: "Login failed" });
      }
      res.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
        },
      });
    });
  })(req, res, next);
});

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })
);

router.get("/google/failure", (req, res) => {
  res.send("Failed to authenticate..");
});

// Logout
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Failed to logout" });
    }

    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ error: "Failed to destroy session" });
      }

      // Clear the session cookie
      res.clearCookie("connect.sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      res.json({ success: true, message: "Logged out successfully" });
    });
  });
});

module.exports = router;
