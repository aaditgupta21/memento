const cors = require("cors");
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("../passport");

function setupMiddleware(app) {
  // CORS
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : process.env.CLIENT_ORIGIN,
      credentials: true,
    })
  );

  // Body parsing
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
        secure: false, // Set to true only when using HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
      },
    })
  );

  // Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());
}

module.exports = setupMiddleware;
