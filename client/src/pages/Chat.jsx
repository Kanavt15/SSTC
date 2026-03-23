import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { io } from 'socket.io-client';
import { FiSend, FiUsers, FiHash, FiLock, FiGlobe, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import './Chat.css';

const API = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// All available channels
const allChannels = [
  { code: 'GENERAL', name: 'General', color: '#6366f1', bg: '#eef2ff', icon: FiGlobe, description: 'Campus-wide discussion' },
  { code: 'AIDS', name: 'AI & Data Science', color: '#0369a1', bg: '#e0f2fe', icon: FiHash, description: 'AIDS department' },
  { code: 'COMPS', name: 'Computer Science', color: '#be185d', bg: '#fce7f3', icon: FiHash, description: 'COMPS department' },
  { code: 'IT', name: 'Information Technology', color: '#047857', bg: '#ecfdf5', icon: FiHash, description: 'IT department' },
  { code: 'EXTC', name: 'Electronics & Telecom', color: '#92400e', bg: '#fef3c7', icon: FiHash, description: 'EXTC department' },
];

const Chat = () => {
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeChannel, setActiveChannel] = useState('GENERAL');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typing, setTyping] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Determine which channels the user can access
  const canAccessChannel = useCallback((channelCode) => {
    if (!user) return false;
    if (user.role === 'faculty' || user.role === 'alumni') {
      return true; // Faculty and alumni can access all channels
    }
    // Students can only access GENERAL and their own department
    return channelCode === 'GENERAL' || channelCode === user.department;
  }, [user]);

  // Get channels with accessibility info
  const channelsWithAccess = allChannels.map(ch => ({
    ...ch,
    accessible: canAccessChannel(ch.code),
    isUserDepartment: ch.code === user?.department
  }));

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setError('Connection failed. Using REST fallback.');
      setIsConnected(false);
    });

    newSocket.on('error', (data) => {
      console.error('Socket error:', data.message);
      setError(data.message);
    });

    newSocket.on('new_message', (msg) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    newSocket.on('online_users', (data) => {
      if (data.channel === activeChannel) {
        setOnlineUsers(data.users || []);
      }
    });

    newSocket.on('user_typing', (data) => {
      if (data.channel === activeChannel && data.user.id !== user?.id) {
        setTyping(data.user);
      }
    });

    newSocket.on('user_stop_typing', (data) => {
      if (data.channel === activeChannel) {
        setTyping(null);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // Join channel when active channel changes
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Leave previous channels and join new one
    socket.emit('join_channel', { channel: activeChannel });

    return () => {
      socket.emit('leave_channel', { channel: activeChannel });
    };
  }, [socket, isConnected, activeChannel]);

  // Set initial channel based on params or user department
  useEffect(() => {
    const deptParam = searchParams.get('dept');
    if (deptParam && canAccessChannel(deptParam)) {
      setActiveChannel(deptParam);
    } else if (user?.department && canAccessChannel(user.department)) {
      setActiveChannel('GENERAL'); // Default to general for safety
    }
  }, [searchParams, user, canAccessChannel]);

  // Load messages when channel changes
  useEffect(() => {
    loadMessages();
  }, [activeChannel, token]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    if (!canAccessChannel(activeChannel)) {
      setMessages([]);
      return;
    }

    try {
      const res = await axios.get(`${API}/chat/${activeChannel}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You do not have access to this channel');
        setMessages([]);
      } else {
        console.error('Failed to load messages:', err);
        // Demo messages for fallback
        setMessages([
          { id: 1, user_id: 999, first_name: 'Welcome', last_name: 'Bot', role: 'faculty', message: `Welcome to #${activeChannel.toLowerCase()}! Start chatting with your peers.`, created_at: new Date().toISOString() },
        ]);
      }
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !canAccessChannel(activeChannel)) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // Send via Socket if connected
    if (socket && isConnected) {
      socket.emit('send_message', {
        channel: activeChannel,
        message: messageText,
        message_type: 'text'
      });
      socket.emit('stop_typing', { channel: activeChannel });
    }

    // Also save to database via REST
    try {
      const res = await axios.post(`${API}/chat/${activeChannel}`,
        { message: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // If socket isn't connected, add message manually
      if (!isConnected) {
        setMessages(prev => [...prev, res.data]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      if (err.response?.status === 403) {
        setError('You cannot send messages to this channel');
      }
    }

    inputRef.current?.focus();
  };

  const deleteMessage = async (messageId) => {
    try {
      await axios.delete(`${API}/chat/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
      setError('Failed to delete message');
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (socket && isConnected) {
      socket.emit('typing', { channel: activeChannel });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { channel: activeChannel });
      }, 2000);
    }
  };

  const handleChannelChange = (channelCode) => {
    if (!canAccessChannel(channelCode)) {
      setError(`Students can only access General and their department (${user?.department}) channels`);
      return;
    }
    setActiveChannel(channelCode);
    setTyping(null);
    setError(null);
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getRoleBadge = (role) => {
    const styles = {
      faculty: { bg: '#fef3c7', color: '#92400e', label: 'Faculty' },
      alumni: { bg: '#ecfdf5', color: '#047857', label: 'Alumni' },
      student: null,
    };
    const style = styles[role];
    if (!style) return null;
    return <span className="chat-role-badge" style={{ background: style.bg, color: style.color }}>{style.label}</span>;
  };

  const canDeleteMessage = (msg) => {
    return msg.user_id === user?.id || user?.role === 'faculty';
  };

  const currentChannel = allChannels.find(c => c.code === activeChannel);
  const ChannelIcon = currentChannel?.icon || FiHash;

  return (
    <div className="page-wrapper" id="chat-page">
      <div className="container">
        <div className="chat-layout">
          {/* Sidebar */}
          <div className="chat-sidebar card">
            <h3 className="chat-sidebar-title">
              <FiHash /> Channels
            </h3>

            {/* User Role Badge */}
            <div className="user-role-info">
              <span className={`role-indicator ${user?.role}`}>
                {user?.role === 'faculty' ? '👨‍🏫 Faculty' : user?.role === 'alumni' ? '🎓 Alumni' : '📚 Student'}
              </span>
              <span className="dept-indicator">{user?.department}</span>
            </div>

            <div className="dept-channels">
              {channelsWithAccess.map((ch) => (
                <button
                  key={ch.code}
                  className={`dept-channel ${activeChannel === ch.code ? 'active' : ''} ${!ch.accessible ? 'locked' : ''}`}
                  onClick={() => handleChannelChange(ch.code)}
                  id={`channel-btn-${ch.code.toLowerCase()}`}
                  disabled={!ch.accessible}
                  title={!ch.accessible ? 'Students can only access General and their department channel' : ch.description}
                >
                  <div className="dept-channel-badge" style={{ background: ch.bg, color: ch.color }}>
                    {ch.code === 'GENERAL' ? <FiGlobe size={14} /> : ch.code.substring(0, 2)}
                  </div>
                  <div className="dept-channel-info">
                    <span className="dept-channel-name">{ch.name}</span>
                    {ch.isUserDepartment && <span className="your-dept-badge">Your Dept</span>}
                  </div>
                  {!ch.accessible && <FiLock className="lock-icon" size={14} />}
                </button>
              ))}
            </div>

            {/* Online Users */}
            <div className="chat-sidebar-online">
              <FiUsers />
              <span>Online ({onlineUsers.length})</span>
            </div>
            <div className="online-users-list">
              {onlineUsers.slice(0, 5).map((u, i) => (
                <div key={i} className="online-user">
                  <div className="online-dot"></div>
                  <span>{u.first_name} {u.last_name?.[0]}.</span>
                  {u.role !== 'student' && <span className="online-role">{u.role}</span>}
                </div>
              ))}
              {onlineUsers.length > 5 && (
                <div className="online-user more">+{onlineUsers.length - 5} more</div>
              )}
              {onlineUsers.length === 0 && (
                <div className="online-user empty">No one else online</div>
              )}
            </div>

            {/* Connection Status */}
            <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              <div className={`status-dot ${isConnected ? 'online' : 'offline'}`}></div>
              {isConnected ? 'Live' : 'Reconnecting...'}
            </div>
          </div>

          {/* Chat Area */}
          <div className="chat-main card">
            <div className="chat-header">
              <div className="chat-header-info">
                <ChannelIcon className="chat-header-hash" style={{ color: currentChannel?.color }} />
                <div>
                  <h4>{currentChannel?.name || activeChannel}</h4>
                  <span className="chat-header-sub">{currentChannel?.description || 'Chat room'}</span>
                </div>
              </div>
              {!canAccessChannel(activeChannel) && (
                <div className="access-denied-badge">
                  <FiLock /> No Access
                </div>
              )}
            </div>

            {/* Error Banner */}
            {error && (
              <div className="chat-error-banner">
                <FiAlertCircle />
                <span>{error}</span>
                <button onClick={() => setError(null)}>×</button>
              </div>
            )}

            <div className="chat-messages" id="chat-messages-container">
              {!canAccessChannel(activeChannel) ? (
                <div className="chat-no-access">
                  <FiLock size={48} />
                  <h3>Channel Restricted</h3>
                  <p>Students can only access the General channel and their department channel ({user?.department}).</p>
                  <button className="btn btn-primary" onClick={() => setActiveChannel('GENERAL')}>
                    Go to General
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-empty">
                  <FiHash size={48} />
                  <h3>No messages yet</h3>
                  <p>Be the first to say something in #{activeChannel.toLowerCase()}!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const showDate = idx === 0 || formatDate(messages[idx - 1].created_at) !== formatDate(msg.created_at);
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="chat-date-divider">
                          <span>{formatDate(msg.created_at)}</span>
                        </div>
                      )}
                      <div className={`chat-message ${msg.user_id === user?.id ? 'own' : ''}`}>
                        <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.7rem' }}>
                          {msg.first_name?.[0]}{msg.last_name?.[0]}
                        </div>
                        <div className="chat-message-content">
                          <div className="chat-message-header">
                            <span className="chat-author">{msg.first_name} {msg.last_name}</span>
                            {getRoleBadge(msg.role)}
                            <span className="chat-time">{formatTime(msg.created_at)}</span>
                            {canDeleteMessage(msg) && (
                              <button
                                className="chat-delete-btn"
                                onClick={() => deleteMessage(msg.id)}
                                title="Delete message"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            )}
                          </div>
                          <p className="chat-text">{msg.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {typing && (
                <div className="typing-indicator">
                  <span>{typing.first_name} is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={sendMessage} id="chat-input-form">
              <input
                ref={inputRef}
                type="text"
                className="input-field chat-input"
                placeholder={canAccessChannel(activeChannel)
                  ? `Message #${activeChannel.toLowerCase()}...`
                  : 'You cannot send messages to this channel'}
                value={newMessage}
                onChange={handleTyping}
                disabled={!canAccessChannel(activeChannel)}
                id="chat-message-input"
              />
              <button
                type="submit"
                className="btn btn-primary btn-icon"
                id="chat-send-btn"
                disabled={!newMessage.trim() || !canAccessChannel(activeChannel)}
              >
                <FiSend />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
