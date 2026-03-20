import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FiSend, FiUsers, FiHash } from 'react-icons/fi';
import './Chat.css';

const API = 'http://localhost:5000/api';

const departments = [
  { code: 'AIDS', name: 'AI & Data Science', color: '#0369a1', bg: '#e0f2fe' },
  { code: 'COMPS', name: 'Computer Science', color: '#be185d', bg: '#fce7f3' },
  { code: 'IT', name: 'Information Technology', color: '#047857', bg: '#ecfdf5' },
  { code: 'EXTC', name: 'Electronics & Telecom', color: '#92400e', bg: '#fef3c7' },
];

const Chat = () => {
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeDept, setActiveDept] = useState(searchParams.get('dept') || user?.department || 'COMPS');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    // In production, connect Socket.IO here
  }, [activeDept]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const res = await axios.get(`${API}/chat/${activeDept}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch {
      // Demo messages
      const demoMessages = [
        { id: 1, user_id: 999, first_name: 'Aman', last_name: 'Singh', role: 'student', message: `Hey everyone! Anyone has notes for tomorrow's ${activeDept} exam?`, created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 2, user_id: 998, first_name: 'Riya', last_name: 'Shah', role: 'student', message: 'I uploaded them in the notes section yesterday! Check it out 📝', created_at: new Date(Date.now() - 3000000).toISOString() },
        { id: 3, user_id: 997, first_name: 'Prof. Kumar', last_name: '', role: 'faculty', message: 'Good luck for the exam everyone! Focus on chapters 3 and 5. 🎯', created_at: new Date(Date.now() - 2400000).toISOString() },
        { id: 4, user_id: 996, first_name: 'Vikram', last_name: 'Joshi', role: 'student', message: 'Thanks Prof! Can you also share the formula sheet?', created_at: new Date(Date.now() - 1800000).toISOString() },
        { id: 5, user_id: 995, first_name: 'Neha', last_name: 'Patel', role: 'alumni', message: "I graduated last year. Pro tip: focus on practical applications. That's what they test the most! 💪", created_at: new Date(Date.now() - 1200000).toISOString() },
      ];
      setMessages(demoMessages);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempMsg = {
      id: Date.now(),
      user_id: user?.id,
      first_name: user?.first_name,
      last_name: user?.last_name,
      role: user?.role,
      message: newMessage,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');

    try {
      await axios.post(`${API}/chat/${activeDept}`, { message: newMessage }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      // Message already shown optimistically
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
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

  return (
    <div className="page-wrapper" id="chat-page">
      <div className="container">
        <div className="chat-layout">
          {/* Sidebar */}
          <div className="chat-sidebar card">
            <h3 className="chat-sidebar-title">
              <FiHash /> Departments
            </h3>
            <div className="dept-channels">
              {departments.map((d) => (
                <button
                  key={d.code}
                  className={`dept-channel ${activeDept === d.code ? 'active' : ''}`}
                  onClick={() => setActiveDept(d.code)}
                  id={`dept-btn-${d.code.toLowerCase()}`}
                >
                  <div className="dept-channel-badge" style={{ background: d.bg, color: d.color }}>{d.code}</div>
                  <div className="dept-channel-info">
                    <span className="dept-channel-name">{d.name}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="chat-sidebar-online">
              <FiUsers />
              <span>Online Members</span>
            </div>
          </div>

          {/* Chat Area */}
          <div className="chat-main card">
            <div className="chat-header">
              <div className="chat-header-info">
                <FiHash className="chat-header-hash" />
                <div>
                  <h4>{departments.find(d => d.code === activeDept)?.name || activeDept}</h4>
                  <span className="chat-header-sub">Department chat room</span>
                </div>
              </div>
            </div>

            <div className="chat-messages" id="chat-messages-container">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.user_id === user?.id ? 'own' : ''}`}
                >
                  <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.7rem' }}>
                    {msg.first_name?.[0]}{msg.last_name?.[0]}
                  </div>
                  <div className="chat-message-content">
                    <div className="chat-message-header">
                      <span className="chat-author">{msg.first_name} {msg.last_name}</span>
                      {getRoleBadge(msg.role)}
                      <span className="chat-time">{formatTime(msg.created_at)}</span>
                    </div>
                    <p className="chat-text">{msg.message}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={sendMessage} id="chat-input-form">
              <input
                type="text"
                className="input-field chat-input"
                placeholder={`Message #${activeDept.toLowerCase()}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                id="chat-message-input"
              />
              <button type="submit" className="btn btn-primary btn-icon" id="chat-send-btn" disabled={!newMessage.trim()}>
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
