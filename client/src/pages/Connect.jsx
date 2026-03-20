import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiUserPlus, FiCheck, FiX, FiExternalLink } from 'react-icons/fi';
import './Connect.css';

const API = 'http://localhost:5000/api';

const Connect = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ role: '', department: '', search: '' });
  const [activeTab, setActiveTab] = useState('discover');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [filters, activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await axios.get(`${API}/connect/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch {
      setUsers([
        { id: 1, first_name: 'Dr. Anand', last_name: 'Kumari', role: 'faculty', department: 'COMPS', bio: 'Professor of Computer Science. Research in AI/ML.', is_online: true, linkedin_url: '#' },
        { id: 2, first_name: 'Rohan', last_name: 'Mehta', role: 'alumni', department: 'AIDS', bio: 'Class of 2024. SDE at Google.', year_of_study: 'graduated', is_online: true, linkedin_url: '#' },
        { id: 3, first_name: 'Sneha', last_name: 'Patil', role: 'student', department: 'IT', bio: 'TE IT student. Full-stack web dev. Open source enthusiast.', year_of_study: 'TE', is_online: false },
        { id: 4, first_name: 'Prof. Ravi', last_name: 'Sharma', role: 'faculty', department: 'EXTC', bio: 'Associate Professor. IoT and Embedded Systems.', is_online: true },
        { id: 5, first_name: 'Aisha', last_name: 'Khan', role: 'student', department: 'COMPS', bio: 'SE COMPS. Competitive programmer. 1800+ on Codeforces.', year_of_study: 'SE', is_online: false },
        { id: 6, first_name: 'Vikram', last_name: 'Joshi', role: 'alumni', department: 'IT', bio: 'Class of 2023. Product Manager at Microsoft.', year_of_study: 'graduated', is_online: false, linkedin_url: '#' },
        { id: 7, first_name: 'Priya', last_name: 'Deshmukh', role: 'student', department: 'AIDS', bio: 'TE AIDS. Data science and ML enthusiast.', year_of_study: 'TE', is_online: true },
        { id: 8, first_name: 'Dr. Meera', last_name: 'Nair', role: 'faculty', department: 'AIDS', bio: 'Head of AI&DS Department. NLP research.', is_online: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (userId) => {
    try {
      await axios.post(`${API}/connect/request/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Connection request sent!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    }
  };

  const getDeptChipClass = (dept) => `chip chip-dept-${dept.toLowerCase()}`;
  const getRoleIcon = (role) => ({ faculty: '👨‍🏫', alumni: '🎓', student: '👨‍🎓' }[role] || '👤');

  const filteredUsers = users.filter(u => {
    if (filters.role && u.role !== filters.role) return false;
    if (filters.department && u.department !== filters.department) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return `${u.first_name} ${u.last_name}`.toLowerCase().includes(search) || u.bio?.toLowerCase().includes(search);
    }
    return true;
  });

  return (
    <div className="page-wrapper" id="connect-page">
      <div className="container">
        <div className="connect-header animate-fade-in">
          <h1>Connect</h1>
          <p>Find and connect with students, faculty, and alumni across all departments</p>
        </div>

        {/* Role Filter Tabs */}
        <div className="connect-tabs animate-fade-in" style={{ animationDelay: '100ms' }}>
          {[
            { value: '', label: 'All' },
            { value: 'student', label: '👨‍🎓 Students' },
            { value: 'faculty', label: '👨‍🏫 Faculty' },
            { value: 'alumni', label: '🎓 Alumni' },
          ].map((tab) => (
            <button
              key={tab.value}
              className={`connect-tab ${filters.role === tab.value ? 'active' : ''}`}
              onClick={() => setFilters({ ...filters, role: tab.value })}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="connect-filters card animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div className="filter-search">
            <FiSearch />
            <input type="text" className="input-field" placeholder="Search by name, bio..."
              value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </div>
          <select className="select-field" value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
            <option value="">All Departments</option>
            <option value="AIDS">AI & DS</option>
            <option value="COMPS">Comps</option>
            <option value="IT">IT</option>
            <option value="EXTC">EXTC</option>
          </select>
        </div>

        {/* Users Grid */}
        <div className="connect-grid stagger">
          {loading ? (
            Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 260, borderRadius: '1.5rem' }} />)
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((u) => (
              <div key={u.id} className="user-card card animate-fade-in" id={`user-card-${u.id}`}>
                <div className="user-card-header">
                  <div className={`avatar avatar-lg ${u.is_online ? 'online-badge' : ''}`}>
                    {u.first_name[0]}{u.last_name?.[0]}
                  </div>
                  <span className="user-role-emoji">{getRoleIcon(u.role)}</span>
                </div>
                <h4 className="user-card-name">{u.first_name} {u.last_name}</h4>
                <div className="user-card-tags">
                  <span className={getDeptChipClass(u.department)}>{u.department}</span>
                  <span className="chip chip-outline">{u.role}</span>
                  {u.year_of_study && u.year_of_study !== 'NA' && u.year_of_study !== 'graduated' && (
                    <span className="chip chip-outline">{u.year_of_study}</span>
                  )}
                </div>
                {u.bio && <p className="user-card-bio">{u.bio}</p>}
                <div className="user-card-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => sendRequest(u.id)}>
                    <FiUserPlus /> Connect
                  </button>
                  {u.linkedin_url && (
                    <a href={u.linkedin_url} className="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer">
                      <FiExternalLink /> LinkedIn
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="notes-empty" style={{ gridColumn: '1 / -1' }}>
              <FiSearch size={48} />
              <h3>No people found</h3>
              <p>Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Connect;
