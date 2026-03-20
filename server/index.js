const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const chatRoutes = require('./routes/chat');
const connectRoutes = require('./routes/connect');
const chatbotRoutes = require('./routes/chatbot');

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KJSIT Connect API is running' });
});

// Socket.IO for real-time chat
const onlineUsers = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_department', ({ department, user }) => {
    socket.join(department);
    if (!onlineUsers[department]) onlineUsers[department] = {};
    onlineUsers[department][socket.id] = user;
    io.to(department).emit('online_users', Object.values(onlineUsers[department]));
    console.log(`${user.first_name} joined ${department} chat`);
  });

  socket.on('send_message', (data) => {
    io.to(data.department).emit('new_message', data);
  });

  socket.on('typing', ({ department, user }) => {
    socket.to(department).emit('user_typing', user);
  });

  socket.on('stop_typing', ({ department }) => {
    socket.to(department).emit('user_stop_typing');
  });

  socket.on('disconnect', () => {
    // Remove user from all departments
    Object.keys(onlineUsers).forEach(dept => {
      if (onlineUsers[dept][socket.id]) {
        delete onlineUsers[dept][socket.id];
        io.to(dept).emit('online_users', Object.values(onlineUsers[dept]));
      }
    });
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 KJSIT Connect Server running on port ${PORT}`);
});
