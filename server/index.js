const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
require("dotenv").config();
const passport = require("./passport");
const User = require("./models/User");
const Post = require("./models/Post");

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

// Session configuration with MongoDB store for persistence
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "random-secret-key12ojifjerijfjijoejroioinfg",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 60 * 60 * 24 * 7, // 7 days in seconds
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
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
    failureRedirect: "/auth/google/failure",
  }),
  (req, res) => {
    // Check if user needs to set username
    const user = req.user;
    if (user.displayName === user.email) {
      // User needs to set a username
      res.redirect(
        `${process.env.CLIENT_ORIGIN || "http://localhost:3000"}/set-username`
      );
    } else {
      // User already has a username
      res.redirect(process.env.CLIENT_ORIGIN || "http://localhost:3000");
    }
  }
);

app.get("/logout", (req, res) => {
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

// Update username endpoint
app.post("/api/update-username", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { displayName } = req.body;

    if (!displayName || displayName.trim() === "") {
      return res.status(400).json({ error: "Username is required" });
    }

    // Check if username is already taken
    const existingUser = await User.findOne({
      displayName,
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // Update user's displayName
    req.user.displayName = displayName;
    await req.user.save();

    res.json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        displayName: req.user.displayName,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create post endpoint
app.post("/api/posts", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { images, caption, location, categories } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    // Validate categories if provided
    const allowedCategories = [
      "Travel",
      "Sports",
      "Gaming",
      "Lifestyle",
      "Food",
      "Fitness",
      "Fashion",
      "Beauty",
      "Wellness",
      "Home",
      "Family",
      "Art",
      "Music",
      "Photography",
      "Nature",
    ];

    let safeCategories = [];
    if (Array.isArray(categories)) {
      safeCategories = categories
        .map((c) => (typeof c === "string" ? c.trim() : ""))
        .filter((c) => allowedCategories.includes(c));
    }

    // Create post in database
    const post = await Post.create({
      images: images.map((img, idx) => ({
        url: typeof img === "string" ? img : img.url,
        order:
          typeof img === "object" && img.order !== undefined ? img.order : idx,
      })),
      caption: caption ? caption.trim() : "",
      location: location ? location.trim() : undefined,
      categories: safeCategories,
      author: req.user._id,
    });

    // Populate author info
    await post.populate("author", "displayName email");

    res.status(201).json({
      success: true,
      post,
    });
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Get all posts for a specific user
app.get("/api/users/:userId/posts", async (req, res) => {
  const { userId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate("author", "displayName email");

    return res.json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (err) {
    console.error("Error fetching user posts:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get all usernames with profile photos
app.get("/api/users/usernames", async (req, res) => {
  try {
    const users = await User.find({}, "displayName profilePicture").sort({
      displayName: 1,
    });

    return res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    console.error("Error fetching usernames:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
