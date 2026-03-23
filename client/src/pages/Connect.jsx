import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiUserPlus, FiCheck, FiX, FiExternalLink, FiUsers, FiUserCheck, FiClock, FiMessageCircle, FiUserX } from 'react-icons/fi';
import './Connect.css';

const API = 'http://localhost:5000/api';

const Connect = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [myConnections, setMyConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [filters, setFilters] = useState({ role: '', department: '', search: '' });
  const [activeTab, setActiveTab] = useState('discover');
  const [loading, setLoading] = useState(true);

  // Fetch all connection-related data on mount
  const fetchAllConnectionData = useCallback(async () => {
    if (!token) return;
    try {
      const [connectionsRes, pendingRes, sentRes] = await Promise.all([
        axios.get(`${API}/connect/my`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/connect/pending`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/connect/sent`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setMyConnections(connectionsRes.data);
      setPendingRequests(pendingRes.data);
      setSentRequests(sentRes.data);
    } catch (err) {
      console.error('Failed to fetch connection data:', err);
    }
  }, [token]);

  // Initial load of all connection data
  useEffect(() => {
    fetchAllConnectionData();
  }, [fetchAllConnectionData]);

  // Fetch users when filters change or when on discover tab
  useEffect(() => {
    if (activeTab === 'discover') {
      fetchUsers();
    }
  }, [filters, activeTab, token]);

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await axios.get(`${API}/connect/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (userId) => {
    try {
      await axios.post(`${API}/connect/request/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh sent requests
      const res = await axios.get(`${API}/connect/sent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSentRequests(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    }
  };

  const respondToRequest = async (connectionId, status) => {
    try {
      await axios.put(`${API}/connect/request/${connectionId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh all connection data
      await fetchAllConnectionData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to respond');
    }
  };

  const removeConnection = async (connectionId) => {
    if (!confirm('Are you sure you want to remove this connection?')) return;
    try {
      await axios.delete(`${API}/connect/${connectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh connections
      const res = await axios.get(`${API}/connect/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyConnections(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove connection');
    }
  };

  const getConnectionStatus = (userId) => {
    // Check if already connected
    const isConnected = myConnections.some(c =>
      c.requester_id === userId || c.receiver_id === userId
    );
    if (isConnected) return 'connected';

    // Check if request sent
    const isSent = sentRequests.some(r => r.receiver_id === userId);
    if (isSent) return 'pending';

    // Check if request received
    const isReceived = pendingRequests.some(r => r.requester_id === userId);
    if (isReceived) return 'received';

    return 'none';
  };

  const getConnectionFromUser = (connection) => {
    // Get the other user from a connection
    if (connection.requester_id === user?.id) {
      return {
        id: connection.receiver_id,
        connectionId: connection.id,
        first_name: connection.rec_first,
        last_name: connection.rec_last,
        avatar_url: connection.rec_avatar,
        role: connection.rec_role,
        department: connection.rec_dept,
        is_online: connection.rec_online,
        bio: connection.rec_bio,
        linkedin_url: connection.rec_linkedin
      };
    } else {
      return {
        id: connection.requester_id,
        connectionId: connection.id,
        first_name: connection.req_first,
        last_name: connection.req_last,
        avatar_url: connection.req_avatar,
        role: connection.req_role,
        department: connection.req_dept,
        is_online: connection.req_online,
        bio: connection.req_bio,
        linkedin_url: connection.req_linkedin
      };
    }
  };

  const getDeptChipClass = (dept) => `chip chip-dept-${dept?.toLowerCase()}`;
  const getRoleIcon = (role) => ({ faculty: '👨‍🏫', alumni: '🎓', student: '👨‍🎓' }[role] || '👤');

  const filteredUsers = users.filter(u => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return `${u.first_name} ${u.last_name}`.toLowerCase().includes(search) || u.bio?.toLowerCase().includes(search);
    }
    return true;
  });

  const UserCard = ({ u, showActions = true, isConnection = false, connectionId = null }) => {
    const status = getConnectionStatus(u.id);

    return (
      <div className="user-card card animate-fade-in" id={`user-card-${u.id}`}>
        <div className="user-card-header">
          <div className={`avatar avatar-lg ${u.is_online ? 'online-badge' : ''}`}>
            {u.first_name?.[0]}{u.last_name?.[0]}
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

        {showActions && (
          <div className="user-card-actions">
            {status === 'connected' ? (
              <button className="btn btn-success btn-sm" disabled>
                <FiUserCheck /> Connected
              </button>
            ) : status === 'pending' ? (
              <button className="btn btn-ghost btn-sm" disabled>
                <FiClock /> Request Sent
              </button>
            ) : status === 'received' ? (
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('pending')}>
                <FiClock /> Respond to Request
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => sendRequest(u.id)}>
                <FiUserPlus /> Connect
              </button>
            )}
            {u.linkedin_url && (
              <a href={u.linkedin_url} className="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer">
                <FiExternalLink /> LinkedIn
              </a>
            )}
          </div>
        )}

        {isConnection && (
          <div className="user-card-actions">
            <button className="btn btn-primary btn-sm">
              <FiMessageCircle /> Message
            </button>
            {u.linkedin_url && (
              <a href={u.linkedin_url} className="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer">
                <FiExternalLink /> LinkedIn
              </a>
            )}
            <button className="btn btn-ghost btn-sm btn-remove" onClick={() => removeConnection(connectionId)} title="Remove connection">
              <FiUserX />
            </button>
          </div>
        )}
      </div>
    );
  };

  const PendingRequestCard = ({ request }) => (
    <div className="user-card card animate-fade-in pending-card">
      <div className="user-card-header">
        <div className={`avatar avatar-lg ${request.is_online ? 'online-badge' : ''}`}>
          {request.first_name?.[0]}{request.last_name?.[0]}
        </div>
        <span className="user-role-emoji">{getRoleIcon(request.role)}</span>
      </div>
      <h4 className="user-card-name">{request.first_name} {request.last_name}</h4>
      <div className="user-card-tags">
        <span className={getDeptChipClass(request.department)}>{request.department}</span>
        <span className="chip chip-outline">{request.role}</span>
      </div>
      <p className="user-card-bio pending-text">wants to connect with you</p>
      <div className="user-card-actions pending-actions">
        <button className="btn btn-primary btn-sm" onClick={() => respondToRequest(request.id, 'accepted')}>
          <FiCheck /> Accept
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => respondToRequest(request.id, 'rejected')}>
          <FiX /> Decline
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper" id="connect-page">
      <div className="container">
        <div className="connect-header animate-fade-in">
          <h1>Connect</h1>
          <p>Find and connect with students, faculty, and alumni across all departments</p>
        </div>

        {/* Main Tabs */}
        <div className="connect-main-tabs animate-fade-in" style={{ animationDelay: '100ms' }}>
          <button
            className={`main-tab ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            <FiUsers /> Discover
          </button>
          <button
            className={`main-tab ${activeTab === 'connections' ? 'active' : ''}`}
            onClick={() => { setActiveTab('connections'); setLoading(false); }}
          >
            <FiUserCheck /> My Connections
            {myConnections.length > 0 && <span className="tab-badge">{myConnections.length}</span>}
          </button>
          <button
            className={`main-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pending'); setLoading(false); }}
          >
            <FiClock /> Pending Requests
            {pendingRequests.length > 0 && <span className="tab-badge pending">{pendingRequests.length}</span>}
          </button>
        </div>

        {/* Discover Tab Content */}
        {activeTab === 'discover' && (
          <>
            {/* Role Filter Tabs */}
            <div className="connect-tabs animate-fade-in" style={{ animationDelay: '150ms' }}>
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
            <div className="connect-filters card animate-fade-in" style={{ animationDelay: '200ms' }}>
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
                Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 280, borderRadius: '1.5rem' }} />)
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => <UserCard key={u.id} u={u} />)
              ) : (
                <div className="connect-empty" style={{ gridColumn: '1 / -1' }}>
                  <FiSearch size={48} />
                  <h3>No people found</h3>
                  <p>Try adjusting your filters or search query</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* My Connections Tab Content */}
        {activeTab === 'connections' && (
          <div className="connect-grid stagger">
            {myConnections.length > 0 ? (
              myConnections.map((conn) => {
                const otherUser = getConnectionFromUser(conn);
                return <UserCard key={conn.id} u={otherUser} showActions={false} isConnection={true} connectionId={conn.id} />;
              })
            ) : (
              <div className="connect-empty" style={{ gridColumn: '1 / -1' }}>
                <FiUsers size={48} />
                <h3>No connections yet</h3>
                <p>Start connecting with people in the Discover tab</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('discover')}>
                  Discover People
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pending Requests Tab Content */}
        {activeTab === 'pending' && (
          <div className="connect-grid stagger">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => <PendingRequestCard key={request.id} request={request} />)
            ) : (
              <div className="connect-empty" style={{ gridColumn: '1 / -1' }}>
                <FiClock size={48} />
                <h3>No pending requests</h3>
                <p>When someone sends you a connection request, it will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Connect;
