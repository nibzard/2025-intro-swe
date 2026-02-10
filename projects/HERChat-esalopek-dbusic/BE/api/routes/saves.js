const express = require("express");
const { verifyToken } = require("../middleware/auth");
const router = express.Router();

// Get user's saved posts
router.get("/", verifyToken, async (req, res) => {
  try {
    const db = global.db;
    const saves = await db.all(
      `
      SELECT p.id, p.user_id, p.content, p.image_url, p.created_at,
             u.username, u.avatar_url
      FROM posts p
      JOIN saves s ON p.id = s.post_id
      JOIN users u ON p.user_id = u.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `,
      [req.user.id],
    );

    res.json(saves);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch saved posts" });
  }
});

// Add save
router.post("/:postId", verifyToken, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const db = global.db;

    // Check post exists
    const post = await db.get("SELECT id FROM posts WHERE id = ?", [postId]);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const existing = await db.get(
      "SELECT id FROM saves WHERE post_id = ? AND user_id = ?",
      [postId, userId],
    );
    if (existing) return res.status(400).json({ error: "Already saved" });

    await db.run("INSERT INTO saves (post_id, user_id) VALUES (?, ?)", [
      postId,
      userId,
    ]);
    res.status(201).json({ message: "Post saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save post" });
  }
});

// Remove save
router.delete("/:postId", verifyToken, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const db = global.db;
    await db.run("DELETE FROM saves WHERE post_id = ? AND user_id = ?", [
      postId,
      userId,
    ]);
    res.json({ message: "Save removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove save" });
  }
});

module.exports = router;
