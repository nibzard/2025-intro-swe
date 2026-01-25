const express = require('express');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Get comments for post
router.get('/post/:postId', async (req, res) => {
  try {
    const db = global.db;
    const comments = await db.all(`
      SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
             u.username, u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC
    `, [req.params.postId]);

    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create comment
router.post('/', verifyToken, async (req, res) => {
  try {
    const { post_id, content } = req.body;
    const userId = req.user.id;

    if (!post_id || !content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Post ID and content are required' });
    }

    const db = global.db;

    // Verify post exists
    const post = await db.get('SELECT id FROM posts WHERE id = ?', [post_id]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const result = await db.run(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [post_id, userId, content]
    );

    res.status(201).json({
      message: 'Comment created',
      comment: { id: result.lastID, post_id, user_id: userId, content }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Delete comment
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    const db = global.db;

    const comment = await db.get('SELECT user_id FROM comments WHERE id = ?', [commentId]);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await db.run('DELETE FROM comments WHERE id = ?', [commentId]);

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
