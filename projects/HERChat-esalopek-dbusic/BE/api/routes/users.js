const express = require("express");
const { verifyToken } = require("../middleware/auth");
const router = express.Router();
// Get current user
router.get("/me", verifyToken, async (req, res) => {
  try {
    const db = global.db;
    const user = await db.get(
      `
      SELECT id, username, email, bio, avatar_url, theme, created_at
      FROM users
      WHERE id = ?
    `,
      [req.user.id],
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});
// Get user profile
router.get("/:username", async (req, res) => {
  try {
    const db = global.db;
    const user = await db.get(
      `
      SELECT id, username, email, bio, avatar_url, theme, created_at
      FROM users
      WHERE username = ?
    `,
      [req.params.username],
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user's posts
    const posts = await db.all(
      `
      SELECT id, content, image_url, created_at
      FROM posts
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `,
      [user.id],
    );

    res.json({ ...user, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Update user profile
router.put("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { bio, avatar_url, theme } = req.body;
    const db = global.db;

    await db.run(
      "UPDATE users SET bio = ?, avatar_url = ?, theme = ? WHERE id = ?",
      [bio, avatar_url, theme, req.user.id],
    );

    res.json({ message: "Profile updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

module.exports = router;
