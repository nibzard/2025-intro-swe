const express = require('express');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Get followers
router.get('/followers/:userId', async (req, res) => {
  try {
    const db = global.db;
    const followers = await db.all(`
      SELECT u.id, u.username, u.avatar_url, u.bio
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
    `, [req.params.userId]);

    res.json(followers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// Get following
router.get('/following/:userId', async (req, res) => {
  try {
    const db = global.db;
    const following = await db.all(`
      SELECT u.id, u.username, u.avatar_url, u.bio
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
    `, [req.params.userId]);

    res.json(following);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// Follow user
router.post('/:userId', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const followerId = req.user.id;

    if (userId === followerId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const db = global.db;

    // Check if user exists
    const user = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const existing = await db.get(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, userId]
    );

    if (existing) {
      return res.status(400).json({ error: 'Already following' });
    }

    await db.run(
      'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
      [followerId, userId]
    );

    res.status(201).json({ message: 'User followed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow user
router.delete('/:userId', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const followerId = req.user.id;

    const db = global.db;
    await db.run(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, userId]
    );

    res.json({ message: 'User unfollowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

module.exports = router;
