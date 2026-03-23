const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const chatRoutes = require('./routes/chat');
const connectRoutes = require('./routes/connect');
const chatbotRoutes = require('./routes/chatbot');
const dashboardRoutes = require('./routes/dashboard');
const messagesRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/connect', connectRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/messages', messagesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KJSIT Connect API is running' });
});

// Valid channels
const VALID_CHANNELS = ['GENERAL', 'AIDS', 'COMPS', 'IT', 'EXTC'];

// Helper function to check if user can access a channel
const canAccessChannel = (user, channel) => {
  if (!user || !channel) return false;
  // Faculty and alumni can access all channels
  if (user.role === 'faculty' || user.role === 'alumni') {
    return true;
  }
  // Students can only access GENERAL and their own department
  if (user.role === 'student') {
    return channel === 'GENERAL' || channel === user.department;
  }
  return false;
};

// Socket.IO for real-time chat
const onlineUsers = {}; // { channel: { socketId: user } }
const userSockets = {}; // { socketId: { user, channels: Set } }

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const user = socket.user;
  console.log(`User connected: ${user.email} (${user.role}) [${socket.id}]`);

  // Track user's socket
  userSockets[socket.id] = { user, channels: new Set() };

  // Join a channel
  socket.on('join_channel', ({ channel }) => {
    // Validate channel
    if (!VALID_CHANNELS.includes(channel)) {
      socket.emit('error', { message: 'Invalid channel' });
      return;
    }

    // Check permission
    if (!canAccessChannel(user, channel)) {
      socket.emit('error', {
        message: 'Access denied. Students can only access General and their department channel.',
        channel
      });
      return;
    }

    socket.join(channel);
    userSockets[socket.id].channels.add(channel);

    // Track online users per channel
    if (!onlineUsers[channel]) onlineUsers[channel] = {};
    onlineUsers[channel][socket.id] = {
      id: user.id,
      first_name: user.first_name || 'User',
      last_name: user.last_name || '',
      role: user.role,
      department: user.department
    };

    // Broadcast updated online users to channel
    io.to(channel).emit('online_users', {
      channel,
      users: Object.values(onlineUsers[channel]),
      count: Object.keys(onlineUsers[channel]).length
    });

    console.log(`${user.email} joined #${channel}`);
  });

  // Leave a channel
  socket.on('leave_channel', ({ channel }) => {
    socket.leave(channel);
    userSockets[socket.id]?.channels.delete(channel);

    if (onlineUsers[channel]?.[socket.id]) {
      delete onlineUsers[channel][socket.id];
      io.to(channel).emit('online_users', {
        channel,
        users: Object.values(onlineUsers[channel]),
        count: Object.keys(onlineUsers[channel]).length
      });
    }
    console.log(`${user.email} left #${channel}`);
  });

  // Send a message
  socket.on('send_message', (data) => {
    const { channel, message, message_type = 'text' } = data;

    // Validate
    if (!VALID_CHANNELS.includes(channel)) {
      socket.emit('error', { message: 'Invalid channel' });
      return;
    }

    if (!canAccessChannel(user, channel)) {
      socket.emit('error', {
        message: 'You cannot send messages to this channel',
        channel
      });
      return;
    }

    if (!message?.trim()) {
      socket.emit('error', { message: 'Message cannot be empty' });
      return;
    }

    // Broadcast to all users in channel (including sender for confirmation)
    io.to(channel).emit('new_message', {
      id: Date.now(), // Temp ID, will be replaced by DB ID
      channel,
      user_id: user.id,
      first_name: user.first_name || 'User',
      last_name: user.last_name || '',
      role: user.role,
      department: user.department,
      message: message.trim(),
      message_type,
      created_at: new Date().toISOString(),
      isRealtime: true
    });
  });

  // Typing indicator
  socket.on('typing', ({ channel }) => {
    if (!canAccessChannel(user, channel)) return;

    socket.to(channel).emit('user_typing', {
      channel,
      user: {
        id: user.id,
        first_name: user.first_name || 'User',
        last_name: user.last_name || ''
      }
    });
  });

  socket.on('stop_typing', ({ channel }) => {
    socket.to(channel).emit('user_stop_typing', {
      channel,
      userId: user.id
    });
  });

  // Get online users for a channel
  socket.on('get_online_users', ({ channel }) => {
    if (!canAccessChannel(user, channel)) return;

    socket.emit('online_users', {
      channel,
      users: Object.values(onlineUsers[channel] || {}),
      count: Object.keys(onlineUsers[channel] || {}).length
    });
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    // Remove user from all channels they were in
    const userData = userSockets[socket.id];
    if (userData) {
      userData.channels.forEach(channel => {
        if (onlineUsers[channel]?.[socket.id]) {
          delete onlineUsers[channel][socket.id];
          io.to(channel).emit('online_users', {
            channel,
            users: Object.values(onlineUsers[channel]),
            count: Object.keys(onlineUsers[channel]).length
          });
        }
      });
      delete userSockets[socket.id];
    }
    console.log(`User disconnected: ${user.email} [${socket.id}]`);
  });
});

// Make io accessible to routes if needed
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 KJSIT Connect Server running on port ${PORT}`);
});
