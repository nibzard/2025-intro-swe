
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIG ---
const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, "db", "seatreview.db");

// --- OPENAI CLIENT (optional) ---
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// --- EXPRESS APP ---
const app = express();
app.use(cors());
app.use(express.json());

// ensure dirs
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// serve uploads as static
app.use("/uploads", express.static(uploadsDir));

// --- MULTER (file upload) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});
const upload = multer({ storage });

// --- SQLITE INIT ---
sqlite3.verbose();
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS Venue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      type TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Review (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venue_id INTEGER NOT NULL,
      section TEXT,
      row TEXT,
      seat_number TEXT,
      rating_comfort INTEGER,
      rating_legroom INTEGER,
      rating_visibility INTEGER,
      rating_cleanliness INTEGER,
      text_review TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (venue_id) REFERENCES Venue(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Photo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      FOREIGN KEY (review_id) REFERENCES Review(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS AIInsight (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venue_id INTEGER NOT NULL,
      summary_text TEXT,
      top_issues_json TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (venue_id) REFERENCES Venue(id)
    );
  `);

  // Seed example venues
  db.get("SELECT COUNT(*) AS count FROM Venue", (err, row) => {
    if (err) {
      console.error("Error checking venues:", err);
      return;
    }
    if (row.count === 0) {
      const stmt = db.prepare(
        "INSERT INTO Venue (name, address, type) VALUES (?, ?, ?)"
      );
      stmt.run("City Arena", "Main Street 1", "arena");
      stmt.run("Grand Theatre", "Old Town 3", "theatre");
      stmt.run("National Stadium", "Stadium Road 10", "stadium");
      stmt.finalize();
      console.log("Seeded sample venues.");
    }
  });
});

// --- HELPERS ---
const runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const allAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const getAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

// --- ROUTES ---

// Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Get all venues
app.get("/api/venues", async (req, res) => {
  try {
    const venues = await allAsync("SELECT * FROM Venue");
    res.json(venues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load venues" });
  }
});

// Get single venue
app.get("/api/venues/:id", async (req, res) => {
  try {
    const venue = await getAsync("SELECT * FROM Venue WHERE id = ?", [
      req.params.id
    ]);
    if (!venue) return res.status(404).json({ error: "Venue not found" });
    res.json(venue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load venue" });
  }
});

// Create review (multipart, with photos field)
app.post("/api/reviews", upload.array("photos", 5), async (req, res) => {
  try {
    const {
      venue_id,
      section,
      row,
      seat_number,
      rating_comfort,
      rating_legroom,
      rating_visibility,
      rating_cleanliness,
      text_review
    } = req.body;

    if (!venue_id) {
      return res.status(400).json({ error: "venue_id is required" });
    }

    const toInt = (v) => (v ? parseInt(v, 10) : null);
    const ratings = [
      toInt(rating_comfort),
      toInt(rating_legroom),
      toInt(rating_visibility),
      toInt(rating_cleanliness)
    ];

    for (const r of ratings) {
      if (r !== null && (r < 1 || r > 5)) {
        return res.status(400).json({ error: "Ratings must be 1–5" });
      }
    }

    const result = await runAsync(
      `
      INSERT INTO Review (
        venue_id, section, row, seat_number,
        rating_comfort, rating_legroom, rating_visibility, rating_cleanliness,
        text_review
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        venue_id,
        section || null,
        row || null,
        seat_number || null,
        ratings[0],
        ratings[1],
        ratings[2],
        ratings[3],
        text_review || null
      ]
    );

    const reviewId = result.lastID;

    const files = req.files || [];
    for (const file of files) {
      const relPath = `/uploads/${file.filename}`;
      await runAsync(
        "INSERT INTO Photo (review_id, file_path) VALUES (?, ?)",
        [reviewId, relPath]
      );
    }

    res.status(201).json({
      message: "Review created",
      review_id: reviewId,
      photos_count: files.length
    });
  } catch (err) {
    console.error("Error creating review:", err);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// Get review + photos
app.get("/api/reviews/:id", async (req, res) => {
  try {
    const review = await getAsync("SELECT * FROM Review WHERE id = ?", [
      req.params.id
    ]);
    if (!review) return res.status(404).json({ error: "Review not found" });

    const photos = await allAsync(
      "SELECT id, file_path FROM Photo WHERE review_id = ?",
      [req.params.id]
    );

    res.json({ review, photos });
  } catch (err) {
    console.error("Error fetching review:", err);
    res.status(500).json({ error: "Failed to fetch review" });
  }
});

// Venue photos
app.get("/api/venues/:id/photos", async (req, res) => {
  try {
    const rows = await allAsync(
      `
      SELECT Photo.id, Photo.file_path
      FROM Photo
      JOIN Review ON Photo.review_id = Review.id
      WHERE Review.venue_id = ?
      ORDER BY Review.created_at DESC
      LIMIT 50
      `,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching photos:", err);
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

// Venue reviews list
app.get("/api/venues/:id/reviews", async (req, res) => {
  try {
    const reviews = await allAsync(
      `
      SELECT * FROM Review
      WHERE venue_id = ?
      ORDER BY created_at DESC
      LIMIT 100
      `,
      [req.params.id]
    );
    res.json(reviews);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Stats for venue
app.get("/api/venues/:id/stats", async (req, res) => {
  try {
    const venueId = req.params.id;

    const averages = await getAsync(
      `
      SELECT
        COUNT(*) as total_reviews,
        AVG(rating_comfort) as avg_comfort,
        AVG(rating_legroom) as avg_legroom,
        AVG(rating_visibility) as avg_visibility,
        AVG(rating_cleanliness) as avg_cleanliness
      FROM Review
      WHERE venue_id = ?
      `,
      [venueId]
    );

    const reviews = await allAsync(
      "SELECT text_review FROM Review WHERE venue_id = ? AND text_review IS NOT NULL",
      [venueId]
    );

    const text = reviews.map((r) => r.text_review).join(" ");
    const freqMap = {};
    const stopWords = new Set([
      "the",
      "a",
      "and",
      "or",
      "of",
      "to",
      "is",
      "it",
      "in",
      "for",
      "i",
      "was",
      "very",
      "with",
      "on",
      "at",
      "but",
      "not",
      "je",
      "bio",
      "bila",
      "sam",
      "nije"
    ]);

    text
      .toLowerCase()
      .split(/[^a-zA-ZčćšđžČĆŠĐŽ]+/)
      .filter((w) => w && w.length > 2 && !stopWords.has(w))
      .forEach((w) => {
        freqMap[w] = (freqMap[w] || 0) + 1;
      });

    const topWords = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    res.json({
      ...averages,
      top_words: topWords
    });
  } catch (err) {
    console.error("Error computing stats:", err);
    res.status(500).json({ error: "Failed to compute stats" });
  }
});

// Get latest AI insight
app.get("/api/venues/:id/insights", async (req, res) => {
  try {
    const insight = await getAsync(
      `
      SELECT * FROM AIInsight
      WHERE venue_id = ?
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [req.params.id]
    );
    if (!insight) {
      return res.status(404).json({ error: "No insights yet" });
    }
    res.json(insight);
  } catch (err) {
    console.error("Error fetching insights:", err);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

// Generate AI insight
app.post("/api/venues/:id/insights/generate", async (req, res) => {
  if (!openai) {
    return res
      .status(500)
      .json({ error: "OPENAI_API_KEY not configured on server" });
  }

  try {
    const venueId = req.params.id;

    const venue = await getAsync("SELECT * FROM Venue WHERE id = ?", [
      venueId
    ]);
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    const reviews = await allAsync(
      "SELECT * FROM Review WHERE venue_id = ? ORDER BY created_at DESC LIMIT 100",
      [venueId]
    );

    if (reviews.length === 0) {
      return res
        .status(400)
        .json({ error: "No reviews available for AI insights" });
    }

    const promptText = reviews
      .map((r) => {
        return `Comfort: ${r.rating_comfort}, Legroom: ${r.rating_legroom}, Visibility: ${r.rating_visibility}, Cleanliness: ${r.rating_cleanliness}, Text: ${r.text_review || ""}`;
      })
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You summarize seat comfort issues for venue managers. Be concise, structured, and practical."
        },
        {
          role: "user",
          content:
            `Summarize the main seat comfort issues and recurring complaints based on the following reviews:\n\n${promptText}\n\nReturn:\n1) Short summary (3–5 sentences)\n2) Bullet list of top recurring issues.`
        }
      ]
    });

    const summaryText =
      completion.choices[0]?.message?.content ||
      "No summary generated (unexpected error).";

    const stats = await getAsync(
      `
      SELECT
        COUNT(*) as total_reviews,
        AVG(rating_comfort) as avg_comfort
      FROM Review
      WHERE venue_id = ?
      `,
      [venueId]
    );

    const topIssues = {
      total_reviews: stats.total_reviews,
      avg_comfort: stats.avg_comfort,
      note: "See summary_text for detailed issues."
    };

    const result = await runAsync(
      "INSERT INTO AIInsight (venue_id, summary_text, top_issues_json) VALUES (?, ?, ?)",
      [venueId, summaryText, JSON.stringify(topIssues)]
    );

    const insightId = result.lastID;
    const savedInsight = await getAsync("SELECT * FROM AIInsight WHERE id = ?", [
      insightId
    ]);

    res.status(201).json(savedInsight);
  } catch (err) {
    console.error("Error generating insights:", err);
    res.status(500).json({ error: "Failed to generate AI insights" });
  }
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
