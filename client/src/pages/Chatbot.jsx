import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiSend, FiCpu, FiFileText, FiList, FiHelpCircle, FiClipboard } from 'react-icons/fi';
import './Chatbot.css';

const API = 'http://localhost:5000/api';

const Chatbot = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! 👋 I'm the **KJSIT Study Bot**. I can help you with:\n\n📝 **Summarize** - Paste your notes for a concise summary\n📋 **Key Points** - Extract important bullet points\n🎓 **Explain** - Simplify complex topics\n📊 **Quiz** - Generate practice questions\n\nHow can I help you study today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('chat');
  const [loading, setLoading] = useState(false);
  const [notesText, setNotesText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const modes = [
    { key: 'chat', icon: <FiCpu />, label: 'Chat' },
    { key: 'summarize', icon: <FiFileText />, label: 'Summarize' },
    { key: 'keypoints', icon: <FiList />, label: 'Key Points' },
    { key: 'explain', icon: <FiHelpCircle />, label: 'Explain' },
    { key: 'quiz', icon: <FiClipboard />, label: 'Quiz' },
  ];

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = mode === 'chat' ? input : notesText;
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      let res;
      if (mode === 'chat') {
        res = await axios.post(`${API}/chatbot/chat`, { message: text }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(prev => [...prev, res.data]);
      } else {
        res = await axios.post(`${API}/chatbot/summarize`, { text, mode }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: res.data.content,
          meta: res.data
        }]);
        setNotesText('');
      }
    } catch {
      // Simulated response
      const simulated = getSimulatedResponse(text, mode);
      setMessages(prev => [...prev, { role: 'assistant', content: simulated }]);
    } finally {
      setLoading(false);
    }
  };

  const getSimulatedResponse = (text, mode) => {
    if (mode === 'summarize') {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      return `📝 **Summary:**\n\n${sentences.slice(0, 3).join(' ').trim()}\n\n_Original: ${text.split(/\s+/).length} words → Summary: ${sentences.slice(0, 3).join(' ').split(/\s+/).length} words_`;
    }
    if (mode === 'keypoints') {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const points = sentences.slice(0, 5).map(s => `• ${s.trim()}`).join('\n');
      return `📋 **Key Points:**\n\n${points}`;
    }
    if (mode === 'explain') {
      return `🎓 **Simplified Explanation:**\n\n${text.substring(0, 300)}...\n\n**Key Takeaway:** This content covers fundamental concepts. Focus on understanding the relationships between the core ideas presented.`;
    }
    if (mode === 'quiz') {
      return `📊 **Practice Quiz:**\n\n**Q1:** What is the main topic discussed in the notes?\n\n**Q2:** List two key concepts mentioned.\n\n**Q3:** How does the first concept relate to the second?\n\n_Try answering these from memory first, then check your notes!_`;
    }
    return "I'm here to help! Try pasting some notes and selecting a mode above. 🎯";
  };

  const formatMessage = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="page-wrapper" id="chatbot-page">
      <div className="container">
        <div className="chatbot-layout">
          {/* Header */}
          <div className="chatbot-header card animate-fade-in">
            <div className="chatbot-info">
              <div className="chatbot-avatar">
                <FiCpu />
              </div>
              <div>
                <h3>KJSIT Study Bot</h3>
                <span className="chatbot-status">
                  <span className="online-dot" style={{ background: '#22c55e' }} /> Online
                </span>
              </div>
            </div>
            <div className="chatbot-modes">
              {modes.map((m) => (
                <button
                  key={m.key}
                  className={`mode-btn ${mode === m.key ? 'active' : ''}`}
                  onClick={() => setMode(m.key)}
                  id={`mode-${m.key}`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages card">
            <div className="chatbot-scroll">
              {messages.map((msg, i) => (
                <div key={i} className={`bot-message ${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="bot-avatar-small">
                      <FiCpu />
                    </div>
                  )}
                  <div className="bot-message-bubble">
                    <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                    {msg.meta && (
                      <div className="bot-meta">
                        {msg.meta.reductionPercent && (
                          <span className="chip chip-outline">📉 {msg.meta.reductionPercent}% reduction</span>
                        )}
                        {msg.meta.totalPoints && (
                          <span className="chip chip-outline">📋 {msg.meta.totalPoints} points</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="bot-message assistant">
                  <div className="bot-avatar-small"><FiCpu /></div>
                  <div className="bot-message-bubble">
                    <div className="typing-indicator">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="chatbot-input card animate-fade-in">
            {mode !== 'chat' ? (
              <form onSubmit={sendMessage} className="notes-input-area">
                <textarea
                  className="input-field notes-textarea"
                  placeholder={`Paste your notes here for ${mode === 'summarize' ? 'summarization' : mode === 'keypoints' ? 'key point extraction' : mode === 'explain' ? 'simplified explanation' : 'quiz generation'}...`}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  rows={4}
                />
                <button type="submit" className="btn btn-primary" disabled={!notesText.trim() || loading}>
                  {modes.find(m => m.key === mode)?.icon} {modes.find(m => m.key === mode)?.label}
                </button>
              </form>
            ) : (
              <form onSubmit={sendMessage} className="chat-form">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ask me anything about studying..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  id="chatbot-input"
                />
                <button type="submit" className="btn btn-primary btn-icon" disabled={!input.trim() || loading}>
                  <FiSend />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
