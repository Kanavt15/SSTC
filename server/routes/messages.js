const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get conversations list (users you've chatted with)
router.get('/conversations', auth, async (req, res) => {
  try {
    const [conversations] = await pool.execute(
      `SELECT
        u.id, u.first_name, u.last_name, u.avatar_url, u.role, u.department, u.is_online,
        dm.message as last_message,
        dm.created_at as last_message_time,
        (SELECT COUNT(*) FROM direct_messages
         WHERE sender_id = u.id AND receiver_id = ? AND is_read = FALSE) as unread_count
       FROM users u
       INNER JOIN (
         SELECT
           CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as user_id,
           MAX(id) as max_id
         FROM direct_messages
         WHERE sender_id = ? OR receiver_id = ?
         GROUP BY user_id
       ) latest ON u.id = latest.user_id
       INNER JOIN direct_messages dm ON dm.id = latest.max_id
       ORDER BY dm.created_at DESC`,
      [req.user.id, req.user.id, req.user.id, req.user.id]
    );
    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count (must be before /:userId)
router.get('/unread/count', auth, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM direct_messages WHERE receiver_id = ? AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ count: result[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages with a specific user
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // First check if users are connected
    const [connection] = await pool.execute(
      `SELECT * FROM connections
       WHERE ((requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?))
       AND status = 'accepted'`,
      [req.user.id, userId, userId, req.user.id]
    );

    if (connection.length === 0) {
      return res.status(403).json({ message: 'You can only message your connections' });
    }

    // Get messages
    const [messages] = await pool.execute(
      `SELECT dm.*,
              s.first_name as sender_first, s.last_name as sender_last, s.avatar_url as sender_avatar,
              r.first_name as receiver_first, r.last_name as receiver_last
       FROM direct_messages dm
       JOIN users s ON dm.sender_id = s.id
       JOIN users r ON dm.receiver_id = r.id
       WHERE (dm.sender_id = ? AND dm.receiver_id = ?)
          OR (dm.sender_id = ? AND dm.receiver_id = ?)
       ORDER BY dm.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      [req.user.id, userId, userId, req.user.id]
    );

    // Mark messages as read
    await pool.execute(
      'UPDATE direct_messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
      [userId, req.user.id]
    );

    // Get the other user's info
    const [userInfo] = await pool.execute(
      'SELECT id, first_name, last_name, avatar_url, role, department, is_online FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      messages: messages.reverse(),
      user: userInfo[0],
      hasMore: messages.length === parseInt(limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a direct message
router.post('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Check if users are connected
    const [connection] = await pool.execute(
      `SELECT * FROM connections
       WHERE ((requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?))
       AND status = 'accepted'`,
      [req.user.id, userId, userId, req.user.id]
    );

    if (connection.length === 0) {
      return res.status(403).json({ message: 'You can only message your connections' });
    }

    // Insert message
    const [result] = await pool.execute(
      'INSERT INTO direct_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
      [req.user.id, userId, message.trim()]
    );

    // Get the inserted message with user info
    const [newMessage] = await pool.execute(
      `SELECT dm.*,
              s.first_name as sender_first, s.last_name as sender_last, s.avatar_url as sender_avatar
       FROM direct_messages dm
       JOIN users s ON dm.sender_id = s.id
       WHERE dm.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newMessage[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all messages from a user as read
router.put('/:userId/read', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    await pool.execute(
      'UPDATE direct_messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ?',
      [userId, req.user.id]
    );
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
