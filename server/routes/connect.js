const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get all users (with filters for connecting)
router.get('/users', auth, async (req, res) => {
  try {
    const { role, department, search, page = 1, limit = 20 } = req.query;
    let query = `SELECT id, first_name, last_name, email, role, department, year_of_study, avatar_url, bio, linkedin_url, github_url, is_online 
                 FROM users WHERE id != ?`;
    const params = [req.user.id];

    if (role) { query += ' AND role = ?'; params.push(role); }
    if (department) { query += ' AND department = ?'; params.push(department); }
    if (search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Use string interpolation for LIMIT/OFFSET since mysql2 has issues with these
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY is_online DESC, first_name ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const [users] = await pool.execute(query, params);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send connection request
router.post('/request/:userId', auth, async (req, res) => {
  try {
    const receiverId = req.params.userId;

    // Check existing
    const [existing] = await pool.execute(
      'SELECT * FROM connections WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)',
      [req.user.id, receiverId, receiverId, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Connection already exists' });
    }

    await pool.execute(
      'INSERT INTO connections (requester_id, receiver_id) VALUES (?, ?)',
      [req.user.id, receiverId]
    );

    res.status(201).json({ message: 'Connection request sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept/Reject connection request
router.put('/request/:connectionId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await pool.execute(
      'UPDATE connections SET status = ? WHERE id = ? AND receiver_id = ?',
      [status, req.params.connectionId, req.user.id]
    );

    res.json({ message: `Connection ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get my connections
router.get('/my', auth, async (req, res) => {
  try {
    const [connections] = await pool.execute(
      `SELECT c.*,
              u1.first_name as req_first, u1.last_name as req_last, u1.avatar_url as req_avatar, u1.role as req_role, u1.department as req_dept, u1.is_online as req_online, u1.bio as req_bio, u1.linkedin_url as req_linkedin,
              u2.first_name as rec_first, u2.last_name as rec_last, u2.avatar_url as rec_avatar, u2.role as rec_role, u2.department as rec_dept, u2.is_online as rec_online, u2.bio as rec_bio, u2.linkedin_url as rec_linkedin
       FROM connections c
       JOIN users u1 ON c.requester_id = u1.id
       JOIN users u2 ON c.receiver_id = u2.id
       WHERE (c.requester_id = ? OR c.receiver_id = ?) AND c.status = 'accepted'`,
      [req.user.id, req.user.id]
    );
    res.json(connections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending requests
router.get('/pending', auth, async (req, res) => {
  try {
    const [requests] = await pool.execute(
      `SELECT c.*, u.first_name, u.last_name, u.avatar_url, u.role, u.department, u.is_online
       FROM connections c
       JOIN users u ON c.requester_id = u.id
       WHERE c.receiver_id = ? AND c.status = 'pending'`,
      [req.user.id]
    );
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sent requests (pending requests I sent)
router.get('/sent', auth, async (req, res) => {
  try {
    const [requests] = await pool.execute(
      `SELECT c.*, u.first_name, u.last_name, u.avatar_url, u.role, u.department, u.is_online
       FROM connections c
       JOIN users u ON c.receiver_id = u.id
       WHERE c.requester_id = ? AND c.status = 'pending'`,
      [req.user.id]
    );
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete connection
router.delete('/:connectionId', auth, async (req, res) => {
  try {
    const { connectionId } = req.params;

    // Check if this connection belongs to the user
    const [connection] = await pool.execute(
      'SELECT * FROM connections WHERE id = ? AND (requester_id = ? OR receiver_id = ?)',
      [connectionId, req.user.id, req.user.id]
    );

    if (connection.length === 0) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    await pool.execute('DELETE FROM connections WHERE id = ?', [connectionId]);
    res.json({ message: 'Connection removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
