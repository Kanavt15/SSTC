import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FiBookOpen, FiUsers, FiMessageSquare, FiUpload, FiTrendingUp, FiCpu, FiFileText, FiArrowRight, FiRefreshCw, FiUserCheck, FiBell } from 'react-icons/fi';
import './Dashboard.css';

const API = 'http://localhost:5000/api';

const Dashboard = () => {
  const { user, token } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(() => fetchDashboardData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const quickActions = [
    { icon: <FiUpload />, label: 'Upload Notes', path: '/notes', color: '#b70011' },
    { icon: <FiMessageSquare />, label: 'Join Chat', path: '/chat', color: '#005e8d' },
    { icon: <FiUsers />, label: 'Find People', path: '/connect', color: '#047857' },
    { icon: <FiCpu />, label: 'AI Study Bot', path: '/chatbot', color: '#92400e' },
  ];

  const stats = dashboardData ? [
    { icon: <FiBookOpen />, label: 'Notes Shared', value: dashboardData.stats.totalNotes, color: '#b70011' },
    { icon: <FiUserCheck />, label: 'Your Connections', value: dashboardData.userStats.connections, color: '#047857' },
    { icon: <FiMessageSquare />, label: 'Messages Today', value: dashboardData.stats.messagesToday, color: '#005e8d' },
    { icon: <FiFileText />, label: 'PYQs Available', value: dashboardData.stats.totalPYQs, color: '#92400e' },
  ] : [];

  const deptChats = [
    { code: 'GENERAL', name: 'General Chat', color: '#6366f1', bg: '#eef2ff' },
    { code: 'AIDS', name: 'AI & Data Science', color: '#0369a1', bg: '#e0f2fe' },
    { code: 'COMPS', name: 'Computer Science', color: '#be185d', bg: '#fce7f3' },
    { code: 'IT', name: 'Information Technology', color: '#047857', bg: '#ecfdf5' },
    { code: 'EXTC', name: 'Electronics & Telecom', color: '#92400e', bg: '#fef3c7' },
  ];

  const getDeptChipClass = (dept) => `chip chip-dept-${dept?.toLowerCase()}`;
  const getTypeLabel = (type) => ({ notes: '📝', pyq: '📄', assignment: '📋', other: '📁' }[type] || '📁');

  return (
    <div className="page-wrapper" id="dashboard-page">
      <div className="container">
        {/* Welcome Section */}
        <div className="dashboard-welcome animate-fade-in">
          <div className="welcome-content">
            <span className="welcome-greeting">{greeting} 👋</span>
            <h1 className="welcome-name">{user?.first_name} {user?.last_name}</h1>
            <div className="welcome-meta">
              <span className={getDeptChipClass(user?.department || 'COMPS')}>{user?.department}</span>
              <span className="chip chip-outline">{user?.role}</span>
              {user?.year_of_study && user.year_of_study !== 'NA' && (
                <span className="chip chip-outline">{user.year_of_study}</span>
              )}
            </div>
          </div>
          <div className="welcome-actions">
            {dashboardData?.userStats.pendingRequests > 0 && (
              <Link to="/connect" className="pending-badge">
                <FiBell />
                <span>{dashboardData.userStats.pendingRequests} pending requests</span>
              </Link>
            )}
            <button
              className={`btn btn-ghost btn-sm refresh-btn ${refreshing ? 'spinning' : ''}`}
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
            >
              <FiRefreshCw />
            </button>
          </div>
          <div className="welcome-art">
            <div className="welcome-circle c1" />
            <div className="welcome-circle c2" />
            <div className="welcome-circle c3" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions stagger">
          {quickActions.map((a, i) => (
            <Link key={i} to={a.path} className="quick-action-card card animate-fade-in">
              <div className="qa-icon" style={{ background: `${a.color}12`, color: a.color }}>
                {a.icon}
              </div>
              <span className="qa-label">{a.label}</span>
              <FiArrowRight className="qa-arrow" />
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="dashboard-stats stagger">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="stat-card card skeleton" style={{ height: 100 }} />
            ))
          ) : (
            stats.map((s, i) => (
              <div key={i} className="stat-card card animate-fade-in">
                <div className="stat-card-icon" style={{ color: s.color, background: `${s.color}12` }}>{s.icon}</div>
                <div className="stat-card-info">
                  <span className="stat-card-value">{s.value}</span>
                  <span className="stat-card-label">{s.label}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Recent Notes */}
          <div className="dash-section card animate-fade-in" id="recent-notes">
            <div className="dash-section-header">
              <h3>Recent Notes</h3>
              <Link to="/notes" className="btn btn-ghost btn-sm">View All <FiArrowRight /></Link>
            </div>
            <div className="notes-list">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="note-item skeleton" style={{ height: 60 }} />
                ))
              ) : dashboardData?.recentNotes?.length > 0 ? (
                dashboardData.recentNotes.map((n, i) => (
                  <Link key={i} to="/notes" className="note-item">
                    <div className="note-icon">
                      <span>{getTypeLabel(n.note_type)}</span>
                    </div>
                    <div className="note-info">
                      <span className="note-title">{n.title}</span>
                      <div className="note-tags">
                        <span className={getDeptChipClass(n.department)}>{n.department}</span>
                        <span className="chip chip-outline">{n.year}</span>
                        <span className="chip chip-outline">{n.note_type}</span>
                      </div>
                    </div>
                    <span className="note-downloads">{n.download_count} downloads</span>
                  </Link>
                ))
              ) : (
                <div className="empty-state">
                  <FiFileText />
                  <p>No notes yet. Be the first to upload!</p>
                </div>
              )}
            </div>
          </div>

          {/* Department Chats */}
          <div className="dash-section card animate-fade-in" id="dept-chats" style={{ animationDelay: '100ms' }}>
            <div className="dash-section-header">
              <h3>Chat Channels</h3>
              <Link to="/chat" className="btn btn-ghost btn-sm">Open Chat <FiArrowRight /></Link>
            </div>
            <div className="dept-chat-list">
              {deptChats.map((d, i) => {
                const online = dashboardData?.onlineUsers?.[d.code] || 0;
                const isAccessible = user?.role === 'faculty' || user?.role === 'alumni' ||
                  d.code === 'GENERAL' || d.code === user?.department;

                return (
                  <Link
                    key={i}
                    to={isAccessible ? `/chat?dept=${d.code}` : '#'}
                    className={`dept-chat-item ${!isAccessible ? 'locked' : ''}`}
                  >
                    <div className="dept-chat-badge" style={{ background: d.bg, color: d.color }}>
                      {d.code === 'GENERAL' ? '🌐' : d.code.substring(0, 2)}
                    </div>
                    <div className="dept-chat-info">
                      <span className="dept-chat-name">{d.name}</span>
                      <span className="dept-chat-online">
                        {online > 0 && <span className="online-dot" style={{ background: '#22c55e' }} />}
                        {online > 0 ? `${online} online` : 'No one online'}
                      </span>
                    </div>
                    {isAccessible ? (
                      <FiArrowRight className="dept-chat-arrow" />
                    ) : (
                      <span className="locked-badge">🔒</span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Total Online */}
            <div className="total-online">
              <FiUsers />
              <span>{dashboardData?.onlineUsers?.total || 0} users online campus-wide</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
