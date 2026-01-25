import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIG ---
const PORT = process.env.PORT || 5000;
const isVercel = process.env.VERCEL === "1";
const DB_PATH = isVercel
  ? "/tmp/seatreview.db"
  : path.join(__dirname, "db", "seatreview.db");
const JWT_SECRET = process.env.JWT_SECRET || "seatreview-secret-key-2024";

// --- OPENAI CLIENT (optional) ---
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// --- EXPRESS APP ---
const app = express();
app.use(cors());
app.use(express.json());

// ensure dirs
const uploadsDir = isVercel ? "/tmp/uploads" : path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!isVercel && !fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// serve uploads as static
app.use("/uploads", express.static(uploadsDir));

// --- MULTER (file upload) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
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
  // User table
  db.run(`
    CREATE TABLE IF NOT EXISTS User (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      verification_code TEXT,
      is_verified INTEGER DEFAULT 1,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Venue table (extended)
  db.run(`
    CREATE TABLE IF NOT EXISTS Venue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      type TEXT,
      category TEXT DEFAULT 'stadium',
      virtual_tour_url TEXT
    );
  `);

  // Review table (extended with user_id and price)
  db.run(`
    CREATE TABLE IF NOT EXISTS Review (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venue_id INTEGER NOT NULL,
      user_id INTEGER,
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

  // Photo table (extended)
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

  // ReviewVote table (like/dislike)
  db.run(`
    CREATE TABLE IF NOT EXISTS ReviewVote (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      vote_type TEXT NOT NULL CHECK(vote_type IN ('like', 'dislike')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (review_id) REFERENCES Review(id),
      FOREIGN KEY (user_id) REFERENCES User(id),
      UNIQUE(review_id, user_id)
    );
  `);

  // Favorite table
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

  // ViewHistory table
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

  // Comment table
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

  // UserFollow table
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

  // AIInsight table
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

  // Seed venues with virtual tours
  db.get("SELECT COUNT(*) AS count FROM Venue", (err, row) => {
    if (err) return console.error("Error checking venues:", err);
    if (row.count === 0) {
      const stmt = db.prepare(
        "INSERT INTO Venue (name, address, type, category, virtual_tour_url) VALUES (?, ?, ?, ?, ?)"
      );
      stmt.run("Stadion Poljud", "Mediteranskih igara 2, Split", "stadium", "stadium",
        "https://hajduk.hr/sadrzaj/stadion/virtualna-setnja/");
      stmt.run("Arena Zagreb", "Vice Vukova 6, Zagreb", "arena", "arena", null);
      stmt.run("HNK Split", "Trg Gaje Bulata 1, Split", "theatre", "theatre", null);
      stmt.run("Spaladium Arena", "Zrinsko-Frankopanska 211, Split", "arena", "arena", null);
      stmt.finalize();
      console.log("Seeded sample venues with Poljud virtual tour.");
    }
  });

  // Seed admin user
  db.get("SELECT COUNT(*) AS count FROM User", async (err, row) => {
    if (err) return console.error("Error checking users:", err);
    if (row.count === 0) {
      const hash = await bcrypt.hash("Admin123!", 10);
      db.run(
        "INSERT INTO User (email, password_hash, is_verified, is_admin) VALUES (?, ?, 1, 1)",
        ["admin@seatreview.hr", hash],
        () => console.log("Seeded admin user: admin@seatreview.hr / Admin123!")
      );
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

// --- AUTH MIDDLEWARE ---
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getAsync("SELECT * FROM User WHERE id = ?", [decoded.userId]);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await getAsync("SELECT * FROM User WHERE id = ?", [decoded.userId]);
    } catch (err) {}
  }
  next();
};

// ==================== AUTH ROUTES ====================

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    // Password validation
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!pwdRegex.test(password)) {
      return res.status(400).json({
        error: "Password must be 8+ chars with uppercase, lowercase, number, and special char"
      });
    }
    const existing = await getAsync("SELECT id FROM User WHERE email = ?", [email]);
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const hash = await bcrypt.hash(password, 10);
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const result = await runAsync(
      "INSERT INTO User (email, password_hash, verification_code) VALUES (?, ?, ?)",
      [email, hash, verificationCode]
    );
    const token = jwt.sign({ userId: result.lastID }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({
      message: "Registration successful",
      token,
      user: { id: result.lastID, email, is_admin: 0 },
      verification_code: verificationCode
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Verify email
app.post("/api/auth/verify", async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await getAsync(
      "SELECT * FROM User WHERE email = ? AND verification_code = ?",
      [email, code]
    );
    if (!user) {
      return res.status(400).json({ error: "Invalid verification code" });
    }
    await runAsync("UPDATE User SET is_verified = 1, verification_code = NULL WHERE id = ?", [user.id]);
    res.json({ message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getAsync("SELECT * FROM User WHERE email = ?", [email]);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin,
        is_verified: user.is_verified
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Get current user
app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    is_admin: req.user.is_admin,
    is_verified: req.user.is_verified,
    created_at: req.user.created_at
  });
});

// ==================== USER PROFILE ROUTES ====================

// Get user profile by email
app.get("/api/users/profile/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const user = await getAsync(
      "SELECT id, email, created_at FROM User WHERE email = ?",
      [email]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get review count
    const reviewStats = await getAsync(
      "SELECT COUNT(*) as review_count, AVG(rating_comfort) as avg_comfort, AVG(rating_visibility) as avg_visibility, AVG(rating_legroom) as avg_legroom FROM Review WHERE user_id = ?",
      [user.id]
    );

    // Get recent reviews
    const recentReviews = await allAsync(
      `SELECT r.*, v.name as venue_name
       FROM Review r
       JOIN Venue v ON r.venue_id = v.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [user.id]
    );

    // Get favorite count
    const favoriteCount = await getAsync(
      "SELECT COUNT(*) as count FROM Favorite WHERE user_id = ?",
      [user.id]
    );

    res.json({
      id: user.id,
      email: user.email,
      username: user.email.split('@')[0],
      member_since: user.created_at,
      review_count: reviewStats.review_count || 0,
      avg_ratings: {
        comfort: reviewStats.avg_comfort ? parseFloat(reviewStats.avg_comfort.toFixed(1)) : null,
        visibility: reviewStats.avg_visibility ? parseFloat(reviewStats.avg_visibility.toFixed(1)) : null,
        legroom: reviewStats.avg_legroom ? parseFloat(reviewStats.avg_legroom.toFixed(1)) : null
      },
      favorite_count: favoriteCount.count || 0,
      recent_reviews: recentReviews
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ error: "Failed to load user profile" });
  }
});

// ==================== VENUE ROUTES ====================

// Get all venues
app.get("/api/venues", async (req, res) => {
  try {
    const { category } = req.query;
    let sql = "SELECT * FROM Venue";
    const params = [];
    if (category) {
      // Include both "arena" and "theatre" when filtering for arenas
      if (category === "arena") {
        sql += " WHERE category IN ('arena', 'theatre')";
      } else {
        sql += " WHERE category = ?";
        params.push(category);
      }
    }
    const venues = await allAsync(sql, params);
    res.json(venues);
  } catch (err) {
    res.status(500).json({ error: "Failed to load venues" });
  }
});

// Get single venue
app.get("/api/venues/:id", async (req, res) => {
  try {
    const venue = await getAsync("SELECT * FROM Venue WHERE id = ?", [req.params.id]);
    if (!venue) return res.status(404).json({ error: "Venue not found" });
    res.json(venue);
  } catch (err) {
    res.status(500).json({ error: "Failed to load venue" });
  }
});

// Get venue stats
app.get("/api/venues/:id/stats", async (req, res) => {
  try {
    const venueId = req.params.id;
    const averages = await getAsync(`
      SELECT COUNT(*) as total_reviews,
        AVG(rating_comfort) as avg_comfort,
        AVG(rating_legroom) as avg_legroom,
        AVG(rating_visibility) as avg_visibility,
        AVG(rating_cleanliness) as avg_cleanliness,
        AVG(price) as avg_price
      FROM Review WHERE venue_id = ?
    `, [venueId]);

    const reviews = await allAsync(
      "SELECT text_review FROM Review WHERE venue_id = ? AND text_review IS NOT NULL",
      [venueId]
    );
    const text = reviews.map(r => r.text_review).join(" ");
    const freqMap = {};
    const stopWords = new Set(["the","a","and","or","of","to","is","it","in","for","i","was","very","with","on","at","but","not","je","bio","bila","sam","nije","su","se","na","za","od"]);
    text.toLowerCase().split(/[^a-zA-ZčćšđžČĆŠĐŽ]+/)
      .filter(w => w && w.length > 2 && !stopWords.has(w))
      .forEach(w => { freqMap[w] = (freqMap[w] || 0) + 1; });
    const topWords = Object.entries(freqMap).sort((a,b) => b[1]-a[1]).slice(0,10).map(([word,count]) => ({word,count}));

    res.json({ ...averages, top_words: topWords });
  } catch (err) {
    res.status(500).json({ error: "Failed to compute stats" });
  }
});

// Get venue reviews
app.get("/api/venues/:id/reviews", async (req, res) => {
  try {
    const reviews = await allAsync(`
      SELECT r.*, u.email as user_email,
        (SELECT COUNT(*) FROM ReviewVote WHERE review_id = r.id AND vote_type = 'like') as likes,
        (SELECT COUNT(*) FROM ReviewVote WHERE review_id = r.id AND vote_type = 'dislike') as dislikes
      FROM Review r
      LEFT JOIN User u ON r.user_id = u.id
      WHERE r.venue_id = ?
      ORDER BY r.created_at DESC LIMIT 100
    `, [req.params.id]);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Get venue gallery (photos with review info)
app.get("/api/venues/:id/gallery", async (req, res) => {
  try {
    const rows = await allAsync(`
      SELECT p.id, p.file_path, p.is_360, p.section, p.row, p.seat_number,
        r.text_review, r.rating_comfort, r.rating_visibility, r.rating_legroom, r.rating_cleanliness,
        u.email as user_email
      FROM Photo p
      LEFT JOIN Review r ON p.review_id = r.id
      LEFT JOIN User u ON r.user_id = u.id
      WHERE p.venue_id = ? OR r.venue_id = ?
      ORDER BY p.id DESC LIMIT 100
    `, [req.params.id, req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch gallery" });
  }
});

// Get venue photos
app.get("/api/venues/:id/photos", async (req, res) => {
  try {
    const rows = await allAsync(`
      SELECT Photo.id, Photo.file_path, Photo.is_360, Photo.section, Photo.row, Photo.seat_number
      FROM Photo
      LEFT JOIN Review ON Photo.review_id = Review.id
      WHERE Photo.venue_id = ? OR Review.venue_id = ?
      ORDER BY Photo.id DESC LIMIT 50
    `, [req.params.id, req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

// Get 360 photos for venue
app.get("/api/venues/:id/360-photos", async (req, res) => {
  try {
    const rows = await allAsync(
      "SELECT * FROM Photo WHERE venue_id = ? AND is_360 = 1",
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch 360 photos" });
  }
});

// Get seats with ratings and prices
app.get("/api/venues/:id/seats", async (req, res) => {
  try {
    const seats = await allAsync(`
      SELECT section, row, seat_number,
        AVG(rating_comfort) as avg_comfort,
        AVG(rating_legroom) as avg_legroom,
        AVG(rating_visibility) as avg_visibility,
        AVG(rating_cleanliness) as avg_cleanliness,
        AVG(price) as avg_price,
        COUNT(*) as review_count
      FROM Review
      WHERE venue_id = ? AND section IS NOT NULL
      GROUP BY section, row, seat_number
    `, [req.params.id]);
    res.json(seats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch seats" });
  }
});

// Get best seat for budget
app.get("/api/venues/:id/best-seat", async (req, res) => {
  try {
    const { maxPrice } = req.query;
    let sql = `
      SELECT section, row, seat_number,
        AVG(rating_comfort + rating_legroom + rating_visibility + rating_cleanliness) / 4 as avg_rating,
        AVG(price) as avg_price,
        COUNT(*) as review_count
      FROM Review
      WHERE venue_id = ? AND section IS NOT NULL
    `;
    const params = [req.params.id];
    if (maxPrice) {
      sql += " AND price <= ?";
      params.push(parseFloat(maxPrice));
    }
    sql += " GROUP BY section, row, seat_number HAVING review_count >= 1 ORDER BY avg_rating DESC LIMIT 5";
    const seats = await allAsync(sql, params);
    res.json(seats);
  } catch (err) {
    res.status(500).json({ error: "Failed to find best seat" });
  }
});

// Get/Generate AI insights
app.get("/api/venues/:id/insights", async (req, res) => {
  try {
    const insight = await getAsync(
      "SELECT * FROM AIInsight WHERE venue_id = ? ORDER BY created_at DESC LIMIT 1",
      [req.params.id]
    );
    if (!insight) return res.status(404).json({ error: "No insights yet" });
    res.json(insight);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

app.post("/api/venues/:id/insights/generate", async (req, res) => {
  if (!openai) {
    return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
  }
  try {
    const venueId = req.params.id;
    const reviews = await allAsync(
      "SELECT * FROM Review WHERE venue_id = ? ORDER BY created_at DESC LIMIT 100",
      [venueId]
    );
    if (reviews.length === 0) {
      return res.status(400).json({ error: "No reviews for AI analysis" });
    }
    const promptText = reviews.map(r =>
      `Comfort:${r.rating_comfort}, Legroom:${r.rating_legroom}, Visibility:${r.rating_visibility}, Text:${r.text_review||""}`
    ).join("\n");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You summarize seat comfort issues for venue managers. Be concise." },
        { role: "user", content: `Summarize issues:\n${promptText}\n\nReturn: 1) Summary 2) Top issues list` }
      ]
    });
    const summaryText = completion.choices[0]?.message?.content || "No summary generated.";
    const result = await runAsync(
      "INSERT INTO AIInsight (venue_id, summary_text) VALUES (?, ?)",
      [venueId, summaryText]
    );
    const saved = await getAsync("SELECT * FROM AIInsight WHERE id = ?", [result.lastID]);
    res.status(201).json(saved);
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

// ==================== REVIEW ROUTES ====================

// Create review
app.post("/api/reviews", optionalAuth, upload.array("photos", 5), async (req, res) => {
  try {
    const { venue_id, section, row, seat_number, price, rating_comfort, rating_legroom, rating_visibility, rating_cleanliness, text_review } = req.body;
    if (!venue_id) return res.status(400).json({ error: "venue_id required" });

    const toInt = v => v ? parseInt(v, 10) : null;
    const ratings = [toInt(rating_comfort), toInt(rating_legroom), toInt(rating_visibility), toInt(rating_cleanliness)];
    for (const r of ratings) {
      if (r !== null && (r < 1 || r > 5)) return res.status(400).json({ error: "Ratings must be 1-5" });
    }

    const result = await runAsync(`
      INSERT INTO Review (venue_id, user_id, section, row, seat_number, price, rating_comfort, rating_legroom, rating_visibility, rating_cleanliness, text_review)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [venue_id, req.user?.id || null, section||null, row||null, seat_number||null, price ? parseFloat(price) : null, ...ratings, text_review||null]);

    const reviewId = result.lastID;
    for (const file of (req.files || [])) {
      await runAsync(
        "INSERT INTO Photo (review_id, venue_id, file_path, section, row, seat_number) VALUES (?, ?, ?, ?, ?, ?)",
        [reviewId, venue_id, `/uploads/${file.filename}`, section||null, row||null, seat_number||null]
      );
    }
    res.status(201).json({ message: "Review created", review_id: reviewId });
  } catch (err) {
    console.error("Review error:", err);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// Get review
app.get("/api/reviews/:id", async (req, res) => {
  try {
    const review = await getAsync(`
      SELECT r.*, u.email as user_email FROM Review r
      LEFT JOIN User u ON r.user_id = u.id WHERE r.id = ?
    `, [req.params.id]);
    if (!review) return res.status(404).json({ error: "Review not found" });
    const photos = await allAsync("SELECT * FROM Photo WHERE review_id = ?", [req.params.id]);
    const votes = await getAsync(`
      SELECT
        (SELECT COUNT(*) FROM ReviewVote WHERE review_id = ? AND vote_type = 'like') as likes,
        (SELECT COUNT(*) FROM ReviewVote WHERE review_id = ? AND vote_type = 'dislike') as dislikes
    `, [req.params.id, req.params.id]);
    res.json({ ...review, photos, ...votes });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch review" });
  }
});

// Vote on review
app.post("/api/reviews/:id/vote", authMiddleware, async (req, res) => {
  try {
    const { vote_type } = req.body;
    if (!["like", "dislike"].includes(vote_type)) {
      return res.status(400).json({ error: "vote_type must be 'like' or 'dislike'" });
    }
    const existing = await getAsync(
      "SELECT * FROM ReviewVote WHERE review_id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (existing) {
      if (existing.vote_type === vote_type) {
        await runAsync("DELETE FROM ReviewVote WHERE id = ?", [existing.id]);
        return res.json({ message: "Vote removed" });
      } else {
        await runAsync("UPDATE ReviewVote SET vote_type = ? WHERE id = ?", [vote_type, existing.id]);
        return res.json({ message: "Vote updated" });
      }
    }
    await runAsync(
      "INSERT INTO ReviewVote (review_id, user_id, vote_type) VALUES (?, ?, ?)",
      [req.params.id, req.user.id, vote_type]
    );
    res.json({ message: "Vote added" });
  } catch (err) {
    res.status(500).json({ error: "Failed to vote" });
  }
});

// Get vote counts for review
app.get("/api/reviews/:id/votes", async (req, res) => {
  try {
    const votes = await getAsync(`
      SELECT
        (SELECT COUNT(*) FROM ReviewVote WHERE review_id = ? AND vote_type = 'like') as likes,
        (SELECT COUNT(*) FROM ReviewVote WHERE review_id = ? AND vote_type = 'dislike') as dislikes
    `, [req.params.id, req.params.id]);
    res.json(votes);
  } catch (err) {
    res.status(500).json({ error: "Failed to get votes" });
  }
});

// Get my vote on review
app.get("/api/reviews/:id/my-vote", authMiddleware, async (req, res) => {
  try {
    const vote = await getAsync(
      "SELECT vote_type FROM ReviewVote WHERE review_id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    res.json({ vote_type: vote?.vote_type || null });
  } catch (err) {
    res.status(500).json({ error: "Failed to get vote" });
  }
});

// ==================== FAVORITES ROUTES ====================

app.get("/api/favorites", authMiddleware, async (req, res) => {
  try {
    const favorites = await allAsync(`
      SELECT f.*, v.name as venue_name FROM Favorite f
      JOIN Venue v ON f.venue_id = v.id
      WHERE f.user_id = ? ORDER BY f.created_at DESC
    `, [req.user.id]);
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

app.post("/api/favorites", authMiddleware, async (req, res) => {
  try {
    const { venue_id, section, row, seat_number } = req.body;
    await runAsync(
      "INSERT OR IGNORE INTO Favorite (user_id, venue_id, section, row, seat_number) VALUES (?, ?, ?, ?, ?)",
      [req.user.id, venue_id, section||null, row||null, seat_number||null]
    );
    res.json({ message: "Added to favorites" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

app.delete("/api/favorites", authMiddleware, async (req, res) => {
  try {
    const { venue_id, section, row, seat_number } = req.body;
    await runAsync(
      "DELETE FROM Favorite WHERE user_id = ? AND venue_id = ? AND section IS ? AND row IS ? AND seat_number IS ?",
      [req.user.id, venue_id, section||null, row||null, seat_number||null]
    );
    res.json({ message: "Removed from favorites" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});

// ==================== HISTORY ROUTES ====================

app.get("/api/history", authMiddleware, async (req, res) => {
  try {
    const history = await allAsync(`
      SELECT h.*, v.name as venue_name FROM ViewHistory h
      JOIN Venue v ON h.venue_id = v.id
      WHERE h.user_id = ? ORDER BY h.viewed_at DESC LIMIT 50
    `, [req.user.id]);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.post("/api/history", authMiddleware, async (req, res) => {
  try {
    const { venue_id, section, row, seat_number } = req.body;
    await runAsync(
      "INSERT INTO ViewHistory (user_id, venue_id, section, row, seat_number) VALUES (?, ?, ?, ?, ?)",
      [req.user.id, venue_id, section||null, row||null, seat_number||null]
    );
    res.json({ message: "Added to history" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add history" });
  }
});

// ==================== LEADERBOARD ====================

app.get("/api/leaderboard", async (req, res) => {
  try {
    const leaders = await allAsync(`
      SELECT u.id, u.email, COUNT(r.id) as review_count,
        (SELECT COUNT(*) FROM ReviewVote rv JOIN Review r2 ON rv.review_id = r2.id WHERE r2.user_id = u.id AND rv.vote_type = 'like') as total_likes
      FROM User u
      LEFT JOIN Review r ON u.id = r.user_id
      GROUP BY u.id
      HAVING review_count > 0
      ORDER BY total_likes DESC, review_count DESC
      LIMIT 20
    `);
    res.json(leaders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// ==================== ADMIN ROUTES ====================

app.get("/api/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await allAsync("SELECT id, email, is_verified, is_admin, created_at FROM User");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.put("/api/admin/users/:id/toggle-admin", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await getAsync("SELECT * FROM User WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: "User not found" });
    await runAsync("UPDATE User SET is_admin = ? WHERE id = ?", [user.is_admin ? 0 : 1, req.params.id]);
    res.json({ message: "Admin status toggled" });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle admin" });
  }
});

app.delete("/api/admin/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (req.params.id == req.user.id) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }
    await runAsync("DELETE FROM User WHERE id = ?", [req.params.id]);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

app.post("/api/admin/venues", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, address, type, category, virtual_tour_url } = req.body;
    const result = await runAsync(
      "INSERT INTO Venue (name, address, type, category, virtual_tour_url) VALUES (?, ?, ?, ?, ?)",
      [name, address, type, category || "stadium", virtual_tour_url]
    );
    res.status(201).json({ id: result.lastID, message: "Venue created" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create venue" });
  }
});

app.put("/api/admin/venues/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, address, type, category, virtual_tour_url } = req.body;
    await runAsync(
      "UPDATE Venue SET name = ?, address = ?, type = ?, category = ?, virtual_tour_url = ? WHERE id = ?",
      [name, address, type, category, virtual_tour_url, req.params.id]
    );
    res.json({ message: "Venue updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update venue" });
  }
});

app.delete("/api/admin/venues/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await runAsync("DELETE FROM Venue WHERE id = ?", [req.params.id]);
    res.json({ message: "Venue deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete venue" });
  }
});

// Make user admin by email (for setup purposes)
app.post("/api/admin/make-admin", async (req, res) => {
  try {
    const { email, secret } = req.body;
    // Simple secret check for security
    if (secret !== "seatreview-admin-2024") {
      return res.status(403).json({ error: "Invalid secret" });
    }
    const user = await getAsync("SELECT * FROM User WHERE email = ?", [email]);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    await runAsync("UPDATE User SET is_admin = 1 WHERE id = ?", [user.id]);
    res.json({ message: `User ${email} is now admin` });
  } catch (err) {
    res.status(500).json({ error: "Failed to make admin" });
  }
});

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// --- START SERVER (only when not on Vercel) ---
if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
    console.log(`Admin login: admin@seatreview.hr / Admin123!`);
  });
}

// Export for Vercel
export default app;
