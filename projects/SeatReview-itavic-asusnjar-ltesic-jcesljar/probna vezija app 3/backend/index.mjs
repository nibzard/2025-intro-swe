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
      price REAL,
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

  // Favorites table
  db.run(`
    CREATE TABLE IF NOT EXISTS Favorite (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      venue_id INTEGER,
      section TEXT,
      row TEXT,
      seat_number TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES User(id),
      FOREIGN KEY (venue_id) REFERENCES Venue(id),
      UNIQUE(user_id, venue_id, section, row, seat_number)
    );
  `);

  // View history table
  db.run(`
    CREATE TABLE IF NOT EXISTS ViewHistory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      venue_id INTEGER NOT NULL,
      section TEXT,
      row TEXT,
      seat_number TEXT,
      viewed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES User(id),
      FOREIGN KEY (venue_id) REFERENCES Venue(id)
    );
  `);

  // Comments on reviews
  db.run(`
    CREATE TABLE IF NOT EXISTS Comment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment_text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (review_id) REFERENCES Review(id),
      FOREIGN KEY (user_id) REFERENCES User(id)
    );
  `);

  // User following system
  db.run(`
    CREATE TABLE IF NOT EXISTS UserFollow (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (follower_id) REFERENCES User(id),
      FOREIGN KEY (following_id) REFERENCES User(id),
      UNIQUE(follower_id, following_id)
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

      // Seed sample user and reviews with prices
      setTimeout(() => {
        const userStmt = db.prepare(
          "INSERT INTO User (email, password_hash, is_verified) VALUES (?, ?, ?)"
        );
        // Simple demo user (password: demo123)
        userStmt.run("demo@example.com", "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDE", 1);
        userStmt.finalize();

        setTimeout(() => {
          db.get("SELECT id FROM User WHERE email = ?", ["demo@example.com"], (err, user) => {
            if (err || !user) return;

            db.get("SELECT id FROM Venue WHERE name = ?", ["National Stadium"], (err, venue) => {
              if (err || !venue) return;

              // Seed sample reviews with prices for different sections
              const reviewStmt = db.prepare(
                `INSERT INTO Review (venue_id, user_id, section, row, seat_number, price,
                 rating_comfort, rating_legroom, rating_visibility, rating_cleanliness, text_review)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              );

              // Section A - Cheap seats (50-70€)
              reviewStmt.run(venue.id, user.id, "A", "1", "5", 50, 4, 3, 4, 4, "Great view for the price!");
              reviewStmt.run(venue.id, user.id, "A", "2", "12", 55, 3, 3, 4, 4, "Good seats, comfortable.");
              reviewStmt.run(venue.id, user.id, "A", "3", "8", 60, 4, 4, 5, 4, "Amazing visibility!");
              reviewStmt.run(venue.id, user.id, "A", "4", "15", 65, 3, 3, 3, 3, "Decent seats.");
              reviewStmt.run(venue.id, user.id, "A", "5", "20", 70, 4, 4, 4, 5, "Very clean area!");

              // Section B - Medium seats (80-110€)
              reviewStmt.run(venue.id, user.id, "B", "1", "3", 80, 4, 4, 5, 4, "Excellent side view!");
              reviewStmt.run(venue.id, user.id, "B", "2", "9", 90, 4, 4, 4, 4, "Great seats!");
              reviewStmt.run(venue.id, user.id, "B", "3", "14", 95, 5, 4, 5, 4, "Perfect for watching!");
              reviewStmt.run(venue.id, user.id, "B", "4", "7", 100, 4, 5, 4, 5, "Lots of legroom!");
              reviewStmt.run(venue.id, user.id, "B", "5", "18", 110, 5, 5, 5, 5, "Premium experience!");

              // Section C - Expensive seats (120-160€)
              reviewStmt.run(venue.id, user.id, "C", "1", "10", 120, 5, 5, 5, 5, "Best seats in the house!");
              reviewStmt.run(venue.id, user.id, "C", "2", "6", 130, 5, 5, 5, 4, "Luxury seating!");
              reviewStmt.run(venue.id, user.id, "C", "3", "12", 140, 5, 5, 4, 5, "Worth every penny!");
              reviewStmt.run(venue.id, user.id, "C", "4", "8", 150, 5, 4, 5, 5, "VIP experience!");
              reviewStmt.run(venue.id, user.id, "C", "5", "15", 160, 5, 5, 5, 5, "Absolutely amazing!");

              // Section D - Mid-range seats (70-95€)
              reviewStmt.run(venue.id, user.id, "D", "1", "4", 70, 4, 3, 4, 4, "Good value seats.");
              reviewStmt.run(venue.id, user.id, "D", "2", "11", 75, 3, 4, 4, 4, "Nice angle.");
              reviewStmt.run(venue.id, user.id, "D", "3", "9", 80, 4, 4, 4, 3, "Comfortable enough.");
              reviewStmt.run(venue.id, user.id, "D", "4", "16", 90, 4, 4, 5, 4, "Great view!");
              reviewStmt.run(venue.id, user.id, "D", "5", "13", 95, 4, 5, 4, 4, "Spacious seats!");

              reviewStmt.finalize();
              console.log("Seeded 20 sample reviews with prices.");
            });
          });
        }, 100);
      }, 100);
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

// Validate strong password
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!hasLowerCase) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!hasNumber) {
    errors.push("Password must contain at least one number");
  }
  if (!hasSpecialChar) {
    errors.push("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
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

    // Validate strong password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: "Password is not strong enough",
        details: passwordValidation.errors
      });
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

// Get all seats for a venue with prices and ratings
app.get("/api/venues/:venueId/seats", async (req, res) => {
  try {
    const { venueId } = req.params;

    const seats = await allAsync(
      `SELECT
        section,
        row,
        seat_number,
        price,
        AVG(rating_comfort) as avg_comfort,
        AVG(rating_legroom) as avg_legroom,
        AVG(rating_visibility) as avg_visibility,
        AVG(rating_cleanliness) as avg_cleanliness,
        COUNT(*) as review_count
      FROM Review
      WHERE venue_id = ? AND price IS NOT NULL
      GROUP BY section, row, seat_number
      ORDER BY section, row, seat_number`,
      [venueId]
    );

    // Calculate overall rating for each seat
    const seatsWithRating = seats.map(seat => ({
      ...seat,
      overall_rating: (
        (seat.avg_comfort || 0) +
        (seat.avg_legroom || 0) +
        (seat.avg_visibility || 0) +
        (seat.avg_cleanliness || 0)
      ) / 4
    }));

    res.json({ seats: seatsWithRating });
  } catch (err) {
    console.error("Error fetching seats:", err);
    res.status(500).json({ error: "Failed to fetch seats" });
  }
});

// Find best seat within budget
app.get("/api/venues/:venueId/best-seat", async (req, res) => {
  try {
    const { venueId } = req.params;
    const { budget } = req.query;

    if (!budget) {
      return res.status(400).json({ error: "Budget parameter required" });
    }

    const seats = await allAsync(
      `SELECT
        section,
        row,
        seat_number,
        price,
        AVG(rating_comfort) as avg_comfort,
        AVG(rating_legroom) as avg_legroom,
        AVG(rating_visibility) as avg_visibility,
        AVG(rating_cleanliness) as avg_cleanliness,
        COUNT(*) as review_count
      FROM Review
      WHERE venue_id = ? AND price IS NOT NULL AND price <= ?
      GROUP BY section, row, seat_number`,
      [venueId, parseFloat(budget)]
    );

    if (seats.length === 0) {
      return res.json({
        bestSeat: null,
        message: "No seats found within budget"
      });
    }

    // Calculate overall rating and sort by best rating
    const seatsWithRating = seats.map(seat => ({
      ...seat,
      overall_rating: (
        (seat.avg_comfort || 0) +
        (seat.avg_legroom || 0) +
        (seat.avg_visibility || 0) +
        (seat.avg_cleanliness || 0)
      ) / 4,
      value_score: (
        ((seat.avg_comfort || 0) +
         (seat.avg_legroom || 0) +
         (seat.avg_visibility || 0) +
         (seat.avg_cleanliness || 0)) / 4
      ) / (seat.price / 100) // Value = rating per 100 currency units
    }));

    // Sort by value score (best value for money)
    seatsWithRating.sort((a, b) => b.value_score - a.value_score);

    const bestSeat = seatsWithRating[0];

    res.json({
      bestSeat,
      alternativeSeats: seatsWithRating.slice(1, 4) // Top 3 alternatives
    });
  } catch (err) {
    console.error("Error finding best seat:", err);
    res.status(500).json({ error: "Failed to find best seat" });
  }
});


// --- FAVORITES ENDPOINTS ---
// Add favorite
app.post("/api/favorites", authenticateToken, async (req, res) => {
  try {
    const { venue_id, section, row, seat_number } = req.body;
    const user_id = req.user.userId || req.user.id;

    const stmt = db.prepare(
      `INSERT OR IGNORE INTO Favorite (user_id, venue_id, section, row, seat_number)
       VALUES (?, ?, ?, ?, ?)`
    );

    await new Promise((resolve, reject) => {
      stmt.run([user_id, venue_id, section, row, seat_number], (err) => {
        if (err) reject(err);
        else resolve();
      });
      stmt.finalize();
    });

    res.json({ success: true, message: "Added to favorites" });
  } catch (err) {
    console.error("Error adding favorite:", err);
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

// Remove favorite
app.delete("/api/favorites", authenticateToken, async (req, res) => {
  try {
    const { venue_id, section, row, seat_number } = req.body;
    const user_id = req.user.userId || req.user.id;

    const stmt = db.prepare(
      `DELETE FROM Favorite
       WHERE user_id = ? AND venue_id = ? AND section = ? AND row = ? AND seat_number = ?`
    );

    await new Promise((resolve, reject) => {
      stmt.run([user_id, venue_id, section, row, seat_number], (err) => {
        if (err) reject(err);
        else resolve();
      });
      stmt.finalize();
    });

    res.json({ success: true, message: "Removed from favorites" });
  } catch (err) {
    console.error("Error removing favorite:", err);
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});

// Get user favorites
app.get("/api/favorites", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.userId || req.user.id;

    const allAsync = (sql, params) => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    const favorites = await allAsync(
      `SELECT f.*, v.name as venue_name
       FROM Favorite f
       LEFT JOIN Venue v ON f.venue_id = v.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [user_id]
    );

    res.json({ favorites });
  } catch (err) {
    console.error("Error fetching favorites:", err);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

// Check if seat is favorited
app.get("/api/favorites/check", authenticateToken, async (req, res) => {
  try {
    const { venue_id, section, row, seat_number } = req.query;
    const user_id = req.user.userId || req.user.id;

    const getAsync = (sql, params) => {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    };

    const favorite = await getAsync(
      `SELECT id FROM Favorite
       WHERE user_id = ? AND venue_id = ? AND section = ? AND row = ? AND seat_number = ?`,
      [user_id, venue_id, section, row, seat_number]
    );

    res.json({ isFavorite: !!favorite });
  } catch (err) {
    console.error("Error checking favorite:", err);
    res.status(500).json({ error: "Failed to check favorite" });
  }
});

// --- VIEW HISTORY ENDPOINTS ---
// Add view history
app.post("/api/history", authenticateToken, async (req, res) => {
  try {
    const { venue_id, section, row, seat_number } = req.body;
    const user_id = req.user.userId || req.user.id;

    const stmt = db.prepare(
      `INSERT INTO ViewHistory (user_id, venue_id, section, row, seat_number)
       VALUES (?, ?, ?, ?, ?)`
    );

    await new Promise((resolve, reject) => {
      stmt.run([user_id, venue_id, section, row, seat_number], (err) => {
        if (err) reject(err);
        else resolve();
      });
      stmt.finalize();
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error adding history:", err);
    res.status(500).json({ error: "Failed to add history" });
  }
});

// Get user history
app.get("/api/history", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.userId || req.user.id;

    const allAsync = (sql, params) => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    const history = await allAsync(
      `SELECT vh.*, v.name as venue_name, v.category as venue_category
       FROM ViewHistory vh
       LEFT JOIN Venue v ON vh.venue_id = v.id
       WHERE vh.user_id = ?
       ORDER BY vh.viewed_at DESC
       LIMIT 50`,
      [user_id]
    );

    res.json({ history });
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// --- COMMENTS ENDPOINTS ---
// Add comment to review
app.post("/api/comments", authenticateToken, async (req, res) => {
  try {
    const { review_id, comment_text } = req.body;
    const user_id = req.user.userId || req.user.id;

    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const stmt = db.prepare(
      `INSERT INTO Comment (review_id, user_id, comment_text)
       VALUES (?, ?, ?)`
    );

    await new Promise((resolve, reject) => {
      stmt.run([review_id, user_id, comment_text], (err) => {
        if (err) reject(err);
        else resolve();
      });
      stmt.finalize();
    });

    res.json({ success: true, message: "Comment added" });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Get comments for a review
app.get("/api/comments/:reviewId", authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const allAsync = (sql, params) => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    const comments = await allAsync(
      `SELECT c.*, u.email as user_email
       FROM Comment c
       LEFT JOIN User u ON c.user_id = u.id
       WHERE c.review_id = ?
       ORDER BY c.created_at DESC`,
      [reviewId]
    );

    res.json({ comments });
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// --- USER FOLLOWING ENDPOINTS ---
// Follow user
app.post("/api/follow", authenticateToken, async (req, res) => {
  try {
    const { following_id } = req.body;
    const follower_id = req.user.id;

    if (follower_id === following_id) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const stmt = db.prepare(
      `INSERT OR IGNORE INTO UserFollow (follower_id, following_id)
       VALUES (?, ?)`
    );

    await new Promise((resolve, reject) => {
      stmt.run([follower_id, following_id], (err) => {
        if (err) reject(err);
        else resolve();
      });
      stmt.finalize();
    });

    res.json({ success: true, message: "Now following user" });
  } catch (err) {
    console.error("Error following user:", err);
    res.status(500).json({ error: "Failed to follow user" });
  }
});

// Unfollow user
app.delete("/api/follow", authenticateToken, async (req, res) => {
  try {
    const { following_id } = req.body;
    const follower_id = req.user.id;

    const stmt = db.prepare(
      `DELETE FROM UserFollow
       WHERE follower_id = ? AND following_id = ?`
    );

    await new Promise((resolve, reject) => {
      stmt.run([follower_id, following_id], (err) => {
        if (err) reject(err);
        else resolve();
      });
      stmt.finalize();
    });

    res.json({ success: true, message: "Unfollowed user" });
  } catch (err) {
    console.error("Error unfollowing user:", err);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
});

// Get user's followers
app.get("/api/followers", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.userId || req.user.id;

    const allAsync = (sql, params) => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    const followers = await allAsync(
      `SELECT u.id, u.email, uf.created_at
       FROM UserFollow uf
       JOIN User u ON uf.follower_id = u.id
       WHERE uf.following_id = ?`,
      [user_id]
    );

    res.json({ followers });
  } catch (err) {
    console.error("Error fetching followers:", err);
    res.status(500).json({ error: "Failed to fetch followers" });
  }
});

// Get users the current user is following
app.get("/api/following", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.userId || req.user.id;

    const allAsync = (sql, params) => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    const following = await allAsync(
      `SELECT u.id, u.email, uf.created_at
       FROM UserFollow uf
       JOIN User u ON uf.following_id = u.id
       WHERE uf.follower_id = ?`,
      [user_id]
    );

    res.json({ following });
  } catch (err) {
    console.error("Error fetching following:", err);
    res.status(500).json({ error: "Failed to fetch following" });
  }
});

// --- TOP REVIEWERS LEADERBOARD ---
app.get("/api/leaderboard", authenticateToken, async (req, res) => {
  try {
    const allAsync = (sql, params) => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    const topReviewers = await allAsync(
      `SELECT
        u.id,
        u.email,
        COUNT(r.id) as review_count,
        AVG((r.rating_comfort + r.rating_legroom + r.rating_visibility + r.rating_cleanliness) / 4.0) as avg_rating,
        (SELECT COUNT(*) FROM UserFollow WHERE following_id = u.id) as follower_count
       FROM User u
       LEFT JOIN Review r ON u.id = r.user_id
       GROUP BY u.id
       HAVING review_count > 0
       ORDER BY review_count DESC, avg_rating DESC
       LIMIT 20`,
      []
    );

    res.json({ topReviewers });
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 SeatReview Backend listening on http://localhost:${PORT}`);
});
