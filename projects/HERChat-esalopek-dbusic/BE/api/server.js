const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const path = require("path");

dotenv.config({ path: ".env.local" });

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

// Database initialization
let db = null;

async function initDb() {
  const fs = require("fs");

  db = await open({
    filename: path.join(__dirname, "../../herchat.db"),
    driver: sqlite3.Database,
  });

  // Enable foreign keys
  await db.exec("PRAGMA foreign_keys = ON");

  // Initialize schema
  try {
    const schemaPath = path.join(__dirname, "../schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Split by semicolon and execute each statement
    const statements = schema.split(";").filter((s) => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        await db.exec(stmt + ";");
      }
    }
    console.log("✓ Database schema initialized");
  } catch (schemaErr) {
    console.error("Schema initialization warning:", schemaErr.message);
    // Continue even if schema init fails (tables might exist)
  }

  // Make db available globally
  global.db = db;
}

// Initialize database on startup
initDb().catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/users", require("./routes/users"));
app.use("/api/favorites", require("./routes/favorites"));
app.use("/api/follow", require("./routes/follow"));
app.use("/api/cycle", require("./routes/cycle"));
app.use("/api/saves", require("./routes/saves"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "HERChat API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`HERChat API running on port ${PORT}`);
  });
}

module.exports = app;
