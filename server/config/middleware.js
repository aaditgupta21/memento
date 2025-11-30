const cors = require("cors");
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("../passport");

function setupMiddleware(app) {
  // CORS - Allow multiple origins in production
  const allowedOrigins =
    process.env.NODE_ENV === "development"
      ? ["http://localhost:3000"]
      : [
          process.env.CLIENT_ORIGIN,
        ].filter(Boolean); // Remove any undefined values

  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests without origin (same-origin requests, health checks, etc.)
        // But validate origin when present for cross-origin requests
        if (!origin) {
          // Allow same-origin requests and server-to-server requests
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Not allowed by CORS: ${origin}`));
        }
      },
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
