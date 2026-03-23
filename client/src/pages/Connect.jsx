import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiUserPlus, FiCheck, FiX, FiExternalLink, FiUsers, FiUserCheck, FiClock, FiMessageCircle, FiUserX, FiSend, FiArrowLeft } from 'react-icons/fi';
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

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUser, setChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  // Accepted request animation state
  const [acceptedRequests, setAcceptedRequests] = useState(new Set());

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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const respondToRequest = async (connectionId, status, requesterId) => {
    try {
      await axios.put(`${API}/connect/request/${connectionId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (status === 'accepted') {
        // Show accepted animation
        setAcceptedRequests(prev => new Set([...prev, connectionId]));

        // After animation, refresh all data
        setTimeout(async () => {
          await fetchAllConnectionData();
          setAcceptedRequests(prev => {
            const newSet = new Set(prev);
            newSet.delete(connectionId);
            return newSet;
          });
        }, 1500);
      } else {
        // Just refresh pending requests
        await fetchAllConnectionData();
      }
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

  // Chat functions
  const openChat = async (targetUser) => {
    setChatUser(targetUser);
    setChatOpen(true);
    setLoadingMessages(true);
    setMessages([]);

    try {
      const res = await axios.get(`${API}/messages/${targetUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const closeChat = () => {
    setChatOpen(false);
    setChatUser(null);
    setMessages([]);
    setNewMessage('');
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatUser || sendingMessage) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);

    // Optimistic update
    const tempMessage = {
      id: Date.now(),
      sender_id: user.id,
      receiver_id: chatUser.id,
      message: messageText,
      created_at: new Date().toISOString(),
      sender_first: user.first_name,
      sender_last: user.last_name,
      isTemp: true
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const res = await axios.post(`${API}/messages/${chatUser.id}`,
        { message: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Replace temp message with real one
      setMessages(prev => prev.map(m =>
        m.isTemp && m.id === tempMessage.id ? res.data : m
      ));
    } catch (err) {
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const getConnectionStatus = (userId) => {
    const isConnected = myConnections.some(c =>
      c.requester_id === userId || c.receiver_id === userId
    );
    if (isConnected) return 'connected';

    const isSent = sentRequests.some(r => r.receiver_id === userId);
    if (isSent) return 'pending';

    const isReceived = pendingRequests.some(r => r.requester_id === userId);
    if (isReceived) return 'received';

    return 'none';
  };

  const getConnectionFromUser = (connection) => {
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

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

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
            <button className="btn btn-primary btn-sm" onClick={() => openChat(u)}>
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

  const PendingRequestCard = ({ request }) => {
    const isAccepted = acceptedRequests.has(request.id);

    return (
      <div className={`user-card card animate-fade-in pending-card ${isAccepted ? 'accepted-animation' : ''}`}>
        {isAccepted ? (
          // Accepted state
          <div className="accepted-state">
            <div className="accepted-icon">
              <FiUserCheck size={32} />
            </div>
            <h4>Connected!</h4>
            <p>You are now connected with {request.first_name}</p>
          </div>
        ) : (
          // Normal pending state
          <>
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
              <button className="btn btn-primary btn-sm" onClick={() => respondToRequest(request.id, 'accepted', request.requester_id)}>
                <FiCheck /> Accept
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => respondToRequest(request.id, 'rejected', request.requester_id)}>
                <FiX /> Decline
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

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

        {/* Chat Modal */}
        {chatOpen && chatUser && (
          <div className="chat-modal-overlay" onClick={closeChat}>
            <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
              {/* Chat Header */}
              <div className="chat-modal-header">
                <button className="btn btn-ghost btn-icon" onClick={closeChat}>
                  <FiArrowLeft />
                </button>
                <div className={`avatar ${chatUser.is_online ? 'online-badge' : ''}`}>
                  {chatUser.first_name?.[0]}{chatUser.last_name?.[0]}
                </div>
                <div className="chat-modal-user-info">
                  <h4>{chatUser.first_name} {chatUser.last_name}</h4>
                  <span className={chatUser.is_online ? 'online' : 'offline'}>
                    {chatUser.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="chat-modal-messages">
                {loadingMessages ? (
                  <div className="chat-loading">Loading messages...</div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`dm-message ${msg.sender_id === user.id ? 'own' : ''}`}
                    >
                      <div className="dm-message-content">
                        <p>{msg.message}</p>
                        <span className="dm-time">{formatTime(msg.created_at)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="chat-empty">
                    <FiMessageCircle size={48} />
                    <p>No messages yet. Say hi!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form className="chat-modal-input" onSubmit={sendMessage}>
                <input
                  type="text"
                  className="input-field"
                  placeholder={`Message ${chatUser.first_name}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="btn btn-primary btn-icon" disabled={!newMessage.trim() || sendingMessage}>
                  <FiSend />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Connect;
