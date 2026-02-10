const express = require("express");
const { verifyToken } = require("../middleware/auth");
const router = express.Router();

// Get all posts (feed)
router.get("/", async (req, res) => {
  try {
    const db = global.db;
    const posts = await db.all(`
      SELECT p.id, p.user_id, p.content, p.image_url, p.created_at, 
             u.username, u.avatar_url, 
             COUNT(DISTINCT f.user_id) as likes,
             COUNT(DISTINCT c.id) as comments
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN favorites f ON p.id = f.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 50
    `);
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Get single post
router.get("/:id", async (req, res) => {
  try {
    const db = global.db;
    const post = await db.get(
      `
      SELECT p.id, p.user_id, p.content, p.image_url, p.created_at, 
             u.username, u.avatar_url,
             COUNT(DISTINCT f.user_id) as likes,
             COUNT(DISTINCT c.id) as comments
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN favorites f ON p.id = f.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.id = ?
      GROUP BY p.id
    `,
      [req.params.id],
    );

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// Create post
router.post("/", verifyToken, async (req, res) => {
  try {
    const { content, image_url } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Content is required" });
    }

    const db = global.db;
    const result = await db.run(
      "INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)",
      [userId, content, image_url || null],
    );

    res.status(201).json({
      message: "Post created",
      post: { id: result.lastID, user_id: userId, content, image_url },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Update post
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { content, image_url } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Content is required" });
    }

    const db = global.db;

    // Check ownership
    const post = await db.get("SELECT user_id FROM posts WHERE id = ?", [
      postId,
    ]);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await db.run("UPDATE posts SET content = ?, image_url = ? WHERE id = ?", [
      content,
      image_url || null,
      postId,
    ]);

    res.json({
      message: "Post updated",
      post: { id: postId, content, image_url },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update post" });
  }
});

// Delete post
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const db = global.db;

    // Check ownership
    const post = await db.get("SELECT user_id FROM posts WHERE id = ?", [
      postId,
    ]);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await db.run("DELETE FROM posts WHERE id = ?", [postId]);

    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

module.exports = router;
