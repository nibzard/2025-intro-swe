const express = require('express');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Get cycle entries
router.get('/', verifyToken, async (req, res) => {
  try {
    const db = global.db;
    const entries = await db.all(`
      SELECT id, user_id, date, period_start, notes, created_at
      FROM cycle_entries
      WHERE user_id = ?
      ORDER BY date DESC
    `, [req.user.id]);

    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cycle entries' });
  }
});

// Add cycle entry
router.post('/', verifyToken, async (req, res) => {
  try {
    const { date, period_start, notes } = req.body;
    const userId = req.user.id;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const db = global.db;

    const result = await db.run(
      'INSERT INTO cycle_entries (user_id, date, period_start, notes) VALUES (?, ?, ?, ?)',
      [userId, date, period_start ? 1 : 0, notes || null]
    );

    res.status(201).json({
      message: 'Cycle entry added',
      entry: { id: result.lastID, date, period_start, notes }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add cycle entry' });
  }
});

// Update cycle entry
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const entryId = req.params.id;
    const { date, period_start, notes } = req.body;

    const db = global.db;

    // Check ownership
    const entry = await db.get(
      'SELECT user_id FROM cycle_entries WHERE id = ?',
      [entryId]
    );

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (entry.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await db.run(
      'UPDATE cycle_entries SET date = ?, period_start = ?, notes = ? WHERE id = ?',
      [date, period_start ? 1 : 0, notes, entryId]
    );

    res.json({ message: 'Entry updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// Delete cycle entry
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const entryId = req.params.id;

    const db = global.db;

    const entry = await db.get(
      'SELECT user_id FROM cycle_entries WHERE id = ?',
      [entryId]
    );

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (entry.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await db.run('DELETE FROM cycle_entries WHERE id = ?', [entryId]);

    res.json({ message: 'Entry deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

module.exports = router;
