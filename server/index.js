const express = require("express");
require("dotenv").config();

const connectDatabase = require("./config/database");
const setupMiddleware = require("./config/middleware");
const passport = require("./passport");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const scrapbookRoutes = require("./routes/scrapbooks");
const locationAlbumRoutes = require("./routes/locationAlbums");
const exifRoutes = require("./routes/exif");

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDatabase();

// Setup middleware
setupMiddleware(app);

// Routes
app.use("/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/scrapbooks", scrapbookRoutes);
app.use("/api/location-albums", locationAlbumRoutes);
app.use("/api/exif", exifRoutes);

// Google OAuth callback (needs to be at root level, not /auth)
app.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/google/failure",
  }),
  (req, res) => {
    // Check if user needs to set username
    const user = req.user;
    const clientOrigin =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : process.env.CLIENT_ORIGIN;
    if (user.displayName === user.email) {
      // User needs to set a username
      res.redirect(`${clientOrigin}/set-username`);
    } else {
      // User already has a username
      res.redirect(clientOrigin);
    }
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
