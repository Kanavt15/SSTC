import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiBookOpen, FiUsers, FiMessageSquare, FiUpload, FiTrendingUp, FiCpu, FiFileText, FiArrowRight } from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const quickActions = [
    { icon: <FiUpload />, label: 'Upload Notes', path: '/notes', color: '#b70011' },
    { icon: <FiMessageSquare />, label: 'Join Chat', path: '/chat', color: '#005e8d' },
    { icon: <FiUsers />, label: 'Find People', path: '/connect', color: '#047857' },
    { icon: <FiCpu />, label: 'AI Study Bot', path: '/chatbot', color: '#92400e' },
  ];

  const stats = [
    { icon: <FiBookOpen />, label: 'Notes Shared', value: '500+', trend: '+12%' },
    { icon: <FiUsers />, label: 'Connections', value: '1,200+', trend: '+8%' },
    { icon: <FiMessageSquare />, label: 'Messages Today', value: '340', trend: '+25%' },
    { icon: <FiFileText />, label: 'PYQs Available', value: '200+', trend: '+5%' },
  ];

  const deptChats = [
    { code: 'AIDS', name: 'AI & Data Science', online: 42, color: '#0369a1', bg: '#e0f2fe' },
    { code: 'COMPS', name: 'Computer Science', online: 67, color: '#be185d', bg: '#fce7f3' },
    { code: 'IT', name: 'Information Technology', online: 53, color: '#047857', bg: '#ecfdf5' },
    { code: 'EXTC', name: 'Electronics & Telecom', online: 31, color: '#92400e', bg: '#fef3c7' },
  ];

  const recentNotes = [
    { title: 'Data Structures & Algorithms Notes', subject: 'DSA', dept: 'COMPS', year: 'SE', type: 'notes' },
    { title: 'Machine Learning PYQ 2025', subject: 'ML', dept: 'AIDS', year: 'TE', type: 'pyq' },
    { title: 'Computer Networks Assignment 3', subject: 'CN', dept: 'IT', year: 'TE', type: 'assignment' },
    { title: 'Digital Signal Processing Notes', subject: 'DSP', dept: 'EXTC', year: 'SE', type: 'notes' },
  ];

  const getDeptChipClass = (dept) => `chip chip-dept-${dept.toLowerCase()}`;

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
          {stats.map((s, i) => (
            <div key={i} className="stat-card card animate-fade-in">
              <div className="stat-card-icon">{s.icon}</div>
              <div className="stat-card-info">
                <span className="stat-card-value">{s.value}</span>
                <span className="stat-card-label">{s.label}</span>
              </div>
              <span className="stat-card-trend">
                <FiTrendingUp /> {s.trend}
              </span>
            </div>
          ))}
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
              {recentNotes.map((n, i) => (
                <div key={i} className="note-item">
                  <div className="note-icon">
                    <FiFileText />
                  </div>
                  <div className="note-info">
                    <span className="note-title">{n.title}</span>
                    <div className="note-tags">
                      <span className={getDeptChipClass(n.dept)}>{n.dept}</span>
                      <span className="chip chip-outline">{n.year}</span>
                      <span className="chip chip-outline">{n.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Chats */}
          <div className="dash-section card animate-fade-in" id="dept-chats" style={{ animationDelay: '100ms' }}>
            <div className="dash-section-header">
              <h3>Department Chats</h3>
              <Link to="/chat" className="btn btn-ghost btn-sm">Open Chat <FiArrowRight /></Link>
            </div>
            <div className="dept-chat-list">
              {deptChats.map((d, i) => (
                <Link key={i} to={`/chat?dept=${d.code}`} className="dept-chat-item">
                  <div className="dept-chat-badge" style={{ background: d.bg, color: d.color }}>
                    {d.code}
                  </div>
                  <div className="dept-chat-info">
                    <span className="dept-chat-name">{d.name}</span>
                    <span className="dept-chat-online">
                      <span className="online-dot" style={{ background: '#22c55e' }} />
                      {d.online} online
                    </span>
                  </div>
                  <FiArrowRight className="dept-chat-arrow" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
