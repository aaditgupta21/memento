const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
require("dotenv").config();
const passport = require("./passport");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 4000;

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "random-secret-key12ojifjerijfjijoejroioinfg",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Auth routes - Email/Password
app.post("/auth/signup", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "All fields are required" });
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

app.post("/auth/login", (req, res, next) => {
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

// Auth routes - Google OAuth
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })
);

app.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    failureRedirect: "/auth/google/failure",
  })
);

app.get("/logout", (req, res, next) => {
  req.logout(req.user, (err) => {
    if (err) return next(err);
    req.session.destroy();
    res.json({ success: true });
  });
});

app.get("/auth/google/failure", (req, res) => {
  res.send("Failed to authenticate..");
});

// Session check helper
app.get("/api/me", (req, res) => {
  if (req.user) {
    res.json({
      authenticated: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        displayName: req.user.displayName,
      },
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
