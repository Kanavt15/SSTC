const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Valid channels
const VALID_CHANNELS = ['GENERAL', 'AIDS', 'COMPS', 'IT', 'EXTC'];
const DEPARTMENT_CHANNELS = ['AIDS', 'COMPS', 'IT', 'EXTC'];

// Helper function to check if user can access a channel
const canAccessChannel = (user, channel) => {
  // Faculty and alumni can access all channels
  if (user.role === 'faculty' || user.role === 'alumni') {
    return true;
  }
  // Students can only access GENERAL and their own department
  if (user.role === 'student') {
    return channel === 'GENERAL' || channel === user.department;
  }
  return false;
};

// Helper to get all accessible channels for a user
const getAccessibleChannels = (user) => {
  if (user.role === 'faculty' || user.role === 'alumni') {
    return VALID_CHANNELS;
  }
  // Students: GENERAL + their department
  return ['GENERAL', user.department];
};

// Get user's accessible channels
router.get('/channels', auth, async (req, res) => {
  try {
    const channels = getAccessibleChannels(req.user);
    const allChannels = [
      { code: 'GENERAL', name: 'General', color: '#6366f1', bg: '#eef2ff', description: 'Campus-wide discussion' },
      { code: 'AIDS', name: 'AI & Data Science', color: '#0369a1', bg: '#e0f2fe', description: 'AIDS department chat' },
      { code: 'COMPS', name: 'Computer Science', color: '#be185d', bg: '#fce7f3', description: 'COMPS department chat' },
      { code: 'IT', name: 'Information Technology', color: '#047857', bg: '#ecfdf5', description: 'IT department chat' },
      { code: 'EXTC', name: 'Electronics & Telecom', color: '#92400e', bg: '#fef3c7', description: 'EXTC department chat' },
    ];

    const accessibleChannels = allChannels.map(ch => ({
      ...ch,
      accessible: channels.includes(ch.code),
      isUserDepartment: ch.code === req.user.department
    }));

    res.json({
      channels: accessibleChannels,
      userRole: req.user.role,
      userDepartment: req.user.department
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get online users count per channel (must be before /:channel route)
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

// Get chat messages for a channel
router.get('/:channel', auth, async (req, res) => {
  try {
    const { channel } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Validate channel
    if (!VALID_CHANNELS.includes(channel)) {
      return res.status(400).json({ message: 'Invalid channel' });
    }

    // Check access permission
    if (!canAccessChannel(req.user, channel)) {
      return res.status(403).json({
        message: 'Access denied. Students can only access General and their department channel.',
        allowed: getAccessibleChannels(req.user)
      });
    }

    const [messages] = await pool.execute(
      `SELECT cm.*, u.first_name, u.last_name, u.avatar_url, u.role, u.department
       FROM chat_messages cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.channel = ?
       ORDER BY cm.created_at DESC
       LIMIT ? OFFSET ?`,
      [channel, parseInt(limit), offset]
    );

    res.json(messages.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message to a channel
router.post('/:channel', auth, async (req, res) => {
  try {
    const { channel } = req.params;
    const { message, message_type = 'text' } = req.body;

    // Validate channel
    if (!VALID_CHANNELS.includes(channel)) {
      return res.status(400).json({ message: 'Invalid channel' });
    }

    // Check access permission
    if (!canAccessChannel(req.user, channel)) {
      return res.status(403).json({
        message: 'Access denied. Students can only send messages to General and their department channel.',
        allowed: getAccessibleChannels(req.user)
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO chat_messages (channel, user_id, message, message_type) VALUES (?, ?, ?, ?)',
      [channel, req.user.id, message.trim(), message_type]
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

// Delete a message (only own messages or faculty can delete any)
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    // Get the message first
    const [messages] = await pool.execute(
      'SELECT * FROM chat_messages WHERE id = ?',
      [messageId]
    );

    if (messages.length === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const msg = messages[0];

    // Check if user can delete (own message or faculty)
    if (msg.user_id !== req.user.id && req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    await pool.execute('DELETE FROM chat_messages WHERE id = ?', [messageId]);
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
