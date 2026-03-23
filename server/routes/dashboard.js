const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    // Get total notes count
    const [notesCount] = await pool.execute('SELECT COUNT(*) as count FROM notes');

    // Get total connections count
    const [connectionsCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM connections WHERE status = 'accepted'"
    );

    // Get messages today count
    const [messagesToday] = await pool.execute(
      "SELECT COUNT(*) as count FROM chat_messages WHERE DATE(created_at) = CURDATE()"
    );

    // Get PYQs count
    const [pyqCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM notes WHERE note_type = 'pyq'"
    );

    // Get online users per department
    const [onlineByDept] = await pool.execute(
      `SELECT department, COUNT(*) as count FROM users WHERE is_online = TRUE GROUP BY department`
    );

    // Get recent notes (top 5)
    const [recentNotes] = await pool.execute(
      `SELECT n.id, n.title, n.subject, n.department, n.year, n.note_type, n.download_count,
              u.first_name, u.last_name
       FROM notes n
       JOIN users u ON n.upload_by = u.id
       ORDER BY n.created_at DESC
       LIMIT 5`
    );

    // Get user's connections count
    const [userConnections] = await pool.execute(
      "SELECT COUNT(*) as count FROM connections WHERE (requester_id = ? OR receiver_id = ?) AND status = 'accepted'",
      [req.user.id, req.user.id]
    );

    // Get pending requests count for current user
    const [pendingCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM connections WHERE receiver_id = ? AND status = 'pending'",
      [req.user.id]
    );

    // Format online users by department
    const onlineUsers = {
      AIDS: 0,
      COMPS: 0,
      IT: 0,
      EXTC: 0,
      total: 0
    };
    onlineByDept.forEach(row => {
      onlineUsers[row.department] = row.count;
      onlineUsers.total += row.count;
    });

    res.json({
      stats: {
        totalNotes: notesCount[0].count,
        totalConnections: connectionsCount[0].count,
        messagesToday: messagesToday[0].count,
        totalPYQs: pyqCount[0].count
      },
      userStats: {
        connections: userConnections[0].count,
        pendingRequests: pendingCount[0].count
      },
      onlineUsers,
      recentNotes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get public stats (no auth required)
router.get('/public', async (req, res) => {
  try {
    const [notesCount] = await pool.execute('SELECT COUNT(*) as count FROM notes');
    const [usersCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [connectionsCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM connections WHERE status = 'accepted'"
    );

    res.json({
      notes: notesCount[0].count,
      users: usersCount[0].count,
      connections: connectionsCount[0].count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
