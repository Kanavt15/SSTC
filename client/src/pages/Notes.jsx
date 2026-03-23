import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiUpload, FiDownload, FiStar, FiFileText, FiX, FiFile, FiTrash2, FiEye } from 'react-icons/fi';
import './Notes.css';

const API = 'http://localhost:5000/api';

const Notes = () => {
  const { user, token } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [userRatings, setUserRatings] = useState({});
  const [filters, setFilters] = useState({ department: '', year: '', note_type: '', search: '' });
  const [uploadData, setUploadData] = useState({
    title: '', description: '', subject: '', department: user?.department || 'COMPS',
    year: 'SE', semester: '3', note_type: 'notes', file: null
  });

  useEffect(() => {
    fetchNotes();
  }, [filters]);

  useEffect(() => {
    if (user?.department) {
      setUploadData(prev => ({ ...prev, department: user.department }));
    }
  }, [user]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await axios.get(`${API}/notes?${params}`);
      setNotes(res.data.notes || []);
    } catch (err) {
      console.error(err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file) return alert('Please select a file');
    const fd = new FormData();
    Object.entries(uploadData).forEach(([k, v]) => { if (v) fd.append(k, v); });
    try {
      await axios.post(`${API}/notes/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      setShowUpload(false);
      setUploadData({
        title: '', description: '', subject: '', department: user?.department || 'COMPS',
        year: 'SE', semester: '3', note_type: 'notes', file: null
      });
      fetchNotes();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    }
  };

  const handleDownload = async (note) => {
    try {
      const res = await axios.post(`${API}/notes/${note.id}/download`);
      const fileUrl = `http://localhost:5000${res.data.file_url}`;

      // Create download link
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = res.data.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Update local state
      setNotes(prev => prev.map(n =>
        n.id === note.id ? { ...n, download_count: n.download_count + 1 } : n
      ));
    } catch (err) {
      console.error(err);
      alert('Download failed');
    }
  };

  const handleRate = async (noteId, rating) => {
    if (!token) return alert('Please login to rate');
    try {
      await axios.post(`${API}/notes/${noteId}/rate`, { rating }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRatings(prev => ({ ...prev, [noteId]: rating }));

      // Refresh notes to get updated rating
      fetchNotes();
    } catch (err) {
      alert(err.response?.data?.message || 'Rating failed');
    }
  };

  const handleDelete = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await axios.delete(`${API}/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(prev => prev.filter(n => n.id !== noteId));
      setSelectedNote(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const canDelete = (note) => {
    return user && (note.upload_by === user.id || user.role === 'faculty');
  };

  const getRating = (note) => note.rating_count > 0 ? (note.rating_sum / note.rating_count).toFixed(1) : '-';
  const getDeptChipClass = (dept) => `chip chip-dept-${dept?.toLowerCase()}`;
  const getTypeLabel = (type) => ({ notes: '📝 Notes', pyq: '📄 PYQ', assignment: '📋 Assignment', other: '📁 Other' }[type] || type);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const StarRating = ({ noteId, currentRating }) => {
    const [hoverRating, setHoverRating] = useState(0);
    const userRating = userRatings[noteId] || 0;

    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            className={`star-btn ${star <= (hoverRating || userRating) ? 'filled' : ''}`}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={(e) => { e.stopPropagation(); handleRate(noteId, star); }}
          >
            <FiStar />
          </button>
        ))}
        <span className="rating-value">{currentRating}</span>
      </div>
    );
  };

  return (
    <div className="page-wrapper" id="notes-page">
      <div className="container">
        {/* Header */}
        <div className="notes-header animate-fade-in">
          <div>
            <h1>Notes Library</h1>
            <p>Share and access study materials across all departments</p>
          </div>
          {user && (
            <button className="btn btn-primary" onClick={() => setShowUpload(true)} id="upload-notes-btn">
              <FiUpload /> Upload Notes
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="notes-filters card animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="filter-search">
            <FiSearch />
            <input type="text" placeholder="Search notes, subjects..." className="input-field"
              value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </div>
          <div className="filter-selects">
            <select className="select-field" value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
              <option value="">All Departments</option>
              <option value="AIDS">AI & DS</option>
              <option value="COMPS">Comps</option>
              <option value="IT">IT</option>
              <option value="EXTC">EXTC</option>
            </select>
            <select className="select-field" value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}>
              <option value="">All Years</option>
              <option value="FE">FE</option>
              <option value="SE">SE</option>
              <option value="TE">TE</option>
              <option value="BE">BE</option>
            </select>
            <select className="select-field" value={filters.note_type}
              onChange={(e) => setFilters({ ...filters, note_type: e.target.value })}>
              <option value="">All Types</option>
              <option value="notes">Notes</option>
              <option value="pyq">PYQ</option>
              <option value="assignment">Assignments</option>
            </select>
          </div>
        </div>

        {/* Notes Grid */}
        <div className="notes-grid stagger">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="note-card-skeleton skeleton" style={{ height: 280 }} />
            ))
          ) : notes.length > 0 ? (
            notes.map((note) => (
              <div key={note.id} className="note-card card animate-fade-in" id={`note-${note.id}`}>
                <div className="note-card-header">
                  <div className="note-card-type">{getTypeLabel(note.note_type)}</div>
                  <div className="note-card-actions-top">
                    {canDelete(note) && (
                      <button className="btn-icon-sm delete" onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }} title="Delete">
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                </div>
                <h4 className="note-card-title">{note.title}</h4>
                <p className="note-card-subject">{note.subject}</p>
                <div className="note-card-tags">
                  <span className={getDeptChipClass(note.department)}>{note.department}</span>
                  <span className="chip chip-outline">{note.year} • Sem {note.semester}</span>
                </div>

                {/* Rating */}
                <div className="note-card-rating-section">
                  <StarRating noteId={note.id} currentRating={getRating(note)} />
                  <span className="rating-count">({note.rating_count} ratings)</span>
                </div>

                <div className="note-card-footer">
                  <div className="note-card-author">
                    <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.65rem' }}>
                      {note.first_name?.[0]}{note.last_name?.[0]}
                    </div>
                    <span>{note.first_name} {note.last_name}</span>
                  </div>
                  <div className="note-card-buttons">
                    <button className="btn btn-sm btn-ghost" onClick={() => setSelectedNote(note)} title="View Details">
                      <FiEye />
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={() => handleDownload(note)} title="Download">
                      <FiDownload /> {note.download_count}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="notes-empty">
              <FiFileText size={48} />
              <h3>No notes found</h3>
              <p>Try adjusting your filters or be the first to upload!</p>
            </div>
          )}
        </div>

        {/* Note Details Modal */}
        {selectedNote && (
          <div className="modal-overlay" onClick={() => setSelectedNote(null)}>
            <div className="modal-content note-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <h3>{selectedNote.title}</h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setSelectedNote(null)}><FiX /></button>
              </div>

              <div className="note-detail-info">
                <div className="note-detail-row">
                  <span className="label">Subject:</span>
                  <span className="value">{selectedNote.subject}</span>
                </div>
                <div className="note-detail-row">
                  <span className="label">Type:</span>
                  <span className="value">{getTypeLabel(selectedNote.note_type)}</span>
                </div>
                <div className="note-detail-row">
                  <span className="label">Department:</span>
                  <span className={getDeptChipClass(selectedNote.department)}>{selectedNote.department}</span>
                </div>
                <div className="note-detail-row">
                  <span className="label">Year / Semester:</span>
                  <span className="value">{selectedNote.year} / Semester {selectedNote.semester}</span>
                </div>
                <div className="note-detail-row">
                  <span className="label">Uploaded by:</span>
                  <span className="value">{selectedNote.first_name} {selectedNote.last_name}</span>
                </div>
                <div className="note-detail-row">
                  <span className="label">Uploaded on:</span>
                  <span className="value">{formatDate(selectedNote.created_at)}</span>
                </div>
                <div className="note-detail-row">
                  <span className="label">File Size:</span>
                  <span className="value">{formatFileSize(selectedNote.file_size)}</span>
                </div>
                <div className="note-detail-row">
                  <span className="label">Downloads:</span>
                  <span className="value">{selectedNote.download_count}</span>
                </div>
                <div className="note-detail-row">
                  <span className="label">Rating:</span>
                  <span className="value">
                    <FiStar className="star-icon filled" /> {getRating(selectedNote)} ({selectedNote.rating_count} ratings)
                  </span>
                </div>
                {selectedNote.description && (
                  <div className="note-detail-description">
                    <span className="label">Description:</span>
                    <p>{selectedNote.description}</p>
                  </div>
                )}
              </div>

              <div className="note-detail-actions">
                <button className="btn btn-primary" onClick={() => handleDownload(selectedNote)}>
                  <FiDownload /> Download
                </button>
                {canDelete(selectedNote) && (
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedNote.id)}>
                    <FiTrash2 /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUpload && (
          <div className="modal-overlay" onClick={() => setShowUpload(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} id="upload-modal">
              <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <h3>Upload Notes</h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setShowUpload(false)}><FiX /></button>
              </div>
              <form onSubmit={handleUpload} className="upload-form">
                <div className="input-group">
                  <label>Title</label>
                  <input className="input-field" placeholder="e.g., DSA Complete Notes" required
                    value={uploadData.title} onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Subject</label>
                  <input className="input-field" placeholder="e.g., Data Structures" required
                    value={uploadData.subject} onChange={(e) => setUploadData({ ...uploadData, subject: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Description (Optional)</label>
                  <textarea className="input-field" placeholder="Brief description..."
                    value={uploadData.description} onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>Department</label>
                    <select className="select-field" value={uploadData.department}
                      onChange={(e) => setUploadData({ ...uploadData, department: e.target.value })}>
                      <option value="AIDS">AIDS</option>
                      <option value="COMPS">Comps</option>
                      <option value="IT">IT</option>
                      <option value="EXTC">EXTC</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Year</label>
                    <select className="select-field" value={uploadData.year}
                      onChange={(e) => setUploadData({ ...uploadData, year: e.target.value })}>
                      <option value="FE">FE</option>
                      <option value="SE">SE</option>
                      <option value="TE">TE</option>
                      <option value="BE">BE</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>Semester</label>
                    <select className="select-field" value={uploadData.semester}
                      onChange={(e) => setUploadData({ ...uploadData, semester: e.target.value })}>
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Type</label>
                    <select className="select-field" value={uploadData.note_type}
                      onChange={(e) => setUploadData({ ...uploadData, note_type: e.target.value })}>
                      <option value="notes">Notes</option>
                      <option value="pyq">PYQ</option>
                      <option value="assignment">Assignment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="file-upload-area">
                  <input type="file" id="note-file" hidden
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.png"
                    onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })} />
                  <label htmlFor="note-file" className="file-upload-label">
                    <FiFile size={24} />
                    <span>{uploadData.file ? uploadData.file.name : 'Click to select file (PDF, DOC, PPT)'}</span>
                  </label>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <FiUpload /> Upload Note
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
