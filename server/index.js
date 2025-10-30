const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
require("dotenv").config();
const passport = require("./passport");

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

// Auth routes
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
    res.redirect("/login");
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
