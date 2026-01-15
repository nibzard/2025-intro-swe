import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIG ---
const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, "db", "seatreview.db");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// --- OPENAI CLIENT (optional) ---
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// --- EMAIL TRANSPORTER ---
let emailTransporter = null;
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
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
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS User (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      verification_code TEXT,
      is_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Venues with category (stadium/arena)
  db.run(`
    CREATE TABLE IF NOT EXISTS Venue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      type TEXT,
      category TEXT DEFAULT 'stadium'
    );
  `);

  // Reviews linked to users
  db.run(`
    CREATE TABLE IF NOT EXISTS Review (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venue_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      section TEXT,
      row TEXT,
      seat_number TEXT,
      rating_comfort INTEGER,
      rating_legroom INTEGER,
      rating_visibility INTEGER,
      rating_cleanliness INTEGER,
      text_review TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (venue_id) REFERENCES Venue(id),
      FOREIGN KEY (user_id) REFERENCES User(id)
    );
  `);

  // Photos (including 360 photos)
  db.run(`
    CREATE TABLE IF NOT EXISTS Photo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venue_id INTEGER,
      review_id INTEGER,
      file_path TEXT NOT NULL,
      is_360 INTEGER DEFAULT 0,
      section TEXT,
      row TEXT,
      seat_number TEXT,
      FOREIGN KEY (venue_id) REFERENCES Venue(id),
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
        "INSERT INTO Venue (name, address, type, category) VALUES (?, ?, ?, ?)"
      );
      stmt.run("City Arena", "Main Street 1", "arena", "arena");
      stmt.run("Grand Theatre", "Old Town 3", "theatre", "arena");
      stmt.run("National Stadium", "Stadium Road 10", "stadium", "stadium");
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

// Generate 6-digit code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await getAsync("SELECT id FROM User WHERE email = ?", [email]);
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();

    const result = await runAsync(
      "INSERT INTO User (email, password_hash, verification_code) VALUES (?, ?, ?)",
      [email, passwordHash, verificationCode]
    );

    // Send verification code via email
    if (emailTransporter) {
      try {
        await emailTransporter.sendMail({
          from: process.env.EMAIL_FROM || "noreply@seatreview.com",
          to: email,
          subject: "Your SeatReview Verification Code",
          html: `
            <h2>Welcome to SeatReview!</h2>
            <p>Your verification code is:</p>
            <h1 style="font-size: 48px; letter-spacing: 10px; color: #1d4ed8;">${verificationCode}</h1>
            <p>Enter this code to verify your account.</p>
            <p>This code will expire in 15 minutes.</p>
          `
        });
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
      }
    }

    res.status(201).json({
      message: "User registered. Please check your email for verification code.",
      userId: result.lastID,
      verificationCode: emailTransporter ? undefined : verificationCode // Only return code if email not configured (for testing)
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Verify code
app.post("/api/auth/verify", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Email and code required" });
    }

    const user = await getAsync(
      "SELECT id, email FROM User WHERE email = ? AND verification_code = ?",
      [email, code]
    );

    if (!user) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    await runAsync(
      "UPDATE User SET is_verified = 1, verification_code = NULL WHERE id = ?",
      [user.id]
    );

    res.json({ message: "Account verified successfully!" });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await getAsync("SELECT * FROM User WHERE email = ?", [email]);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: "Please verify your email first" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get current user profile
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await getAsync(
      "SELECT id, email, created_at FROM User WHERE id = ?",
      [req.user.userId]
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user's review count
    const reviewCount = await getAsync(
      "SELECT COUNT(*) as count FROM Review WHERE user_id = ?",
      [req.user.userId]
    );

    res.json({
      ...user,
      reviewCount: reviewCount.count
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// --- VENUE ROUTES ---

// Get all venues (with category filter)
app.get("/api/venues", async (req, res) => {
  try {
    const { category } = req.query;
    let sql = "SELECT * FROM Venue";
    let params = [];

    if (category) {
      sql += " WHERE category = ?";
      params.push(category);
    }

    const venues = await allAsync(sql, params);
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

// Get 360 photos for venue
app.get("/api/venues/:id/360-photos", async (req, res) => {
  try {
    const photos = await allAsync(
      "SELECT * FROM Photo WHERE venue_id = ? AND is_360 = 1 ORDER BY section, row, seat_number",
      [req.params.id]
    );
    res.json(photos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load 360 photos" });
  }
});

// Upload 360 photo
app.post("/api/venues/:id/360-photos", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    const { section, row, seat_number } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Photo file required" });
    }

    const relPath = `/uploads/${file.filename}`;
    const result = await runAsync(
      "INSERT INTO Photo (venue_id, file_path, is_360, section, row, seat_number) VALUES (?, ?, 1, ?, ?, ?)",
      [req.params.id, relPath, section || null, row || null, seat_number || null]
    );

    res.status(201).json({
      message: "360 photo uploaded",
      photoId: result.lastID,
      filePath: relPath
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload photo" });
  }
});

// --- REVIEW ROUTES ---

// Create review (requires authentication)
app.post("/api/reviews", authenticateToken, upload.array("photos", 5), async (req, res) => {
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
        venue_id, user_id, section, row, seat_number,
        rating_comfort, rating_legroom, rating_visibility, rating_cleanliness,
        text_review
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        venue_id,
        req.user.userId,
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
        "INSERT INTO Photo (review_id, venue_id, file_path) VALUES (?, ?, ?)",
        [reviewId, venue_id, relPath]
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
    const review = await getAsync(
      `SELECT Review.*, User.email as user_email
       FROM Review
       LEFT JOIN User ON Review.user_id = User.id
       WHERE Review.id = ?`,
      [req.params.id]
    );
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
      SELECT Photo.id, Photo.file_path, Photo.is_360
      FROM Photo
      WHERE Photo.venue_id = ? AND Photo.is_360 = 0
      ORDER BY Photo.id DESC
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
      SELECT Review.*, User.email as user_email
      FROM Review
      LEFT JOIN User ON Review.user_id = User.id
      WHERE Review.venue_id = ?
      ORDER BY Review.created_at DESC
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
      "the", "a", "and", "or", "of", "to", "is", "it", "in", "for", "i",
      "was", "very", "with", "on", "at", "but", "not"
    ]);

    text
      .toLowerCase()
      .split(/[^a-zA-Z]+/)
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

// Generate AI insight (requires authentication)
app.post("/api/venues/:id/insights/generate", authenticateToken, async (req, res) => {
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
      model: "gpt-4o-mini",
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

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 SeatReview Backend listening on http://localhost:${PORT}`);
});
