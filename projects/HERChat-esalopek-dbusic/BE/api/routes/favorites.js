const express = require('express');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Get user's favorite posts
router.get('/', verifyToken, async (req, res) => {
  try {
    const db = global.db;
    const favorites = await db.all(`
      SELECT p.id, p.user_id, p.content, p.image_url, p.created_at,
             u.username, u.avatar_url
      FROM posts p
      JOIN favorites f ON p.id = f.post_id
      JOIN users u ON p.user_id = u.id
      WHERE f.user_id = ?
      ORDER BY p.created_at DESC
    `, [req.user.id]);

    res.json(favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Add to favorites
router.post('/:postId', verifyToken, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const db = global.db;

    // Check if post exists
    const post = await db.get('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if already favorited
    const existing = await db.get(
      'SELECT id FROM favorites WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );

    if (existing) {
      return res.status(400).json({ error: 'Already in favorites' });
    }

    await db.run(
      'INSERT INTO favorites (post_id, user_id) VALUES (?, ?)',
      [postId, userId]
    );

    res.status(201).json({ message: 'Added to favorites' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
});

// Remove from favorites
router.delete('/:postId', verifyToken, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const db = global.db;
    await db.run(
      'DELETE FROM favorites WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );

    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
});

module.exports = router;
