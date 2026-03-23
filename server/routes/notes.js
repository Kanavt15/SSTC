const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/notes'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.jpg', '.png', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Upload note
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const { title, description, subject, department, year, semester, note_type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const [result] = await pool.execute(
      'INSERT INTO notes (title, description, subject, department, year, semester, file_url, file_name, file_size, upload_by, note_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, subject, department, year, parseInt(semester), `/uploads/notes/${file.filename}`, file.originalname, file.size, req.user.id, note_type || 'notes']
    );

    res.status(201).json({ message: 'Note uploaded successfully', noteId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notes with filters
router.get('/', async (req, res) => {
  try {
    const { department, year, semester, subject, note_type, search, page = 1, limit = 12 } = req.query;
    let query = `SELECT n.*, u.first_name, u.last_name, u.avatar_url 
                 FROM notes n 
                 JOIN users u ON n.upload_by = u.id 
                 WHERE 1=1`;
    const params = [];

    if (department) { query += ' AND n.department = ?'; params.push(department); }
    if (year) { query += ' AND n.year = ?'; params.push(year); }
    if (semester) { query += ' AND n.semester = ?'; params.push(parseInt(semester)); }
    if (subject) { query += ' AND n.subject LIKE ?'; params.push(`%${subject}%`); }
    if (note_type) { query += ' AND n.note_type = ?'; params.push(note_type); }
    if (search) { query += ' AND (n.title LIKE ? OR n.subject LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    // Get total count
    const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    // Add pagination - use string interpolation for LIMIT/OFFSET since mysql2 has issues with these
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY n.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const [notes] = await pool.execute(query, params);

    res.json({
      notes,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single note
router.get('/:id', async (req, res) => {
  try {
    const [notes] = await pool.execute(
      `SELECT n.*, u.first_name, u.last_name, u.avatar_url 
       FROM notes n JOIN users u ON n.upload_by = u.id WHERE n.id = ?`,
      [req.params.id]
    );
    if (notes.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json(notes[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download note (increment count)
router.post('/:id/download', async (req, res) => {
  try {
    await pool.execute('UPDATE notes SET download_count = download_count + 1 WHERE id = ?', [req.params.id]);
    const [notes] = await pool.execute('SELECT file_url, file_name FROM notes WHERE id = ?', [req.params.id]);
    if (notes.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json(notes[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Rate a note
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const { rating } = req.body;
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check for existing rating
    const [existing] = await pool.execute(
      'SELECT id FROM note_ratings WHERE note_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (existing.length > 0) {
      await pool.execute(
        'UPDATE note_ratings SET rating = ? WHERE note_id = ? AND user_id = ?',
        [rating, req.params.id, req.user.id]
      );
    } else {
      await pool.execute(
        'INSERT INTO note_ratings (note_id, user_id, rating) VALUES (?, ?, ?)',
        [req.params.id, req.user.id, rating]
      );
    }

    // Update aggregate
    const [agg] = await pool.execute(
      'SELECT SUM(rating) as rating_sum, COUNT(*) as rating_count FROM note_ratings WHERE note_id = ?',
      [req.params.id]
    );
    await pool.execute(
      'UPDATE notes SET rating_sum = ?, rating_count = ? WHERE id = ?',
      [agg[0].rating_sum, agg[0].rating_count, req.params.id]
    );

    res.json({ message: 'Rating submitted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
  try {
    const [notes] = await pool.execute('SELECT upload_by FROM notes WHERE id = ?', [req.params.id]);
    if (notes.length === 0) return res.status(404).json({ message: 'Note not found' });
    if (notes[0].upload_by !== req.user.id && req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await pool.execute('DELETE FROM notes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
