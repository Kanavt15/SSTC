const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get chat messages for a department
router.get('/:department', auth, async (req, res) => {
  try {
    const { department } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [messages] = await pool.execute(
      `SELECT cm.*, u.first_name, u.last_name, u.avatar_url, u.role, u.department 
       FROM chat_messages cm 
       JOIN users u ON cm.user_id = u.id 
       WHERE cm.department = ? 
       ORDER BY cm.created_at DESC 
       LIMIT ? OFFSET ?`,
      [department, parseInt(limit), offset]
    );

    res.json(messages.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/:department', auth, async (req, res) => {
  try {
    const { department } = req.params;
    const { message, message_type = 'text' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO chat_messages (department, user_id, message, message_type) VALUES (?, ?, ?, ?)',
      [department, req.user.id, message.trim(), message_type]
    );

    // Fetch the full message with user info
    const [messages] = await pool.execute(
      `SELECT cm.*, u.first_name, u.last_name, u.avatar_url, u.role, u.department 
       FROM chat_messages cm 
       JOIN users u ON cm.user_id = u.id 
       WHERE cm.id = ?`,
      [result.insertId]
    );

    res.status(201).json(messages[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get online users count per department
router.get('/online/count', auth, async (req, res) => {
  try {
    const [counts] = await pool.execute(
      `SELECT department, COUNT(*) as count FROM users WHERE is_online = TRUE GROUP BY department`
    );
    res.json(counts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
