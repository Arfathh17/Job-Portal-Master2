/**
 * AI Job Portal — Main Server
 * Express + Socket.io + MongoDB (with in-memory fallback)
 */
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const { processChatbotMessage } = require('./services/chatbot');

const app = express();
const server = http.createServer(app);

// Socket.io setup with loose CORS for development
const io = socketIO(server, {
  cors: {
    origin: '*', // Allow all origins to avoid websocket connection errors
    methods: ['GET', 'POST'],
  },
});

// ─── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/resume', require('./routes/resumeRoutes'));
app.use('/api/interview', require('./routes/interview'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/afai', require('./routes/afai'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/api/health', (req, res) => {
  const { getIsConnected } = require('./config/db');
  res.json({
    status: 'ok',
    mode: getIsConnected() ? 'production' : 'demo',
    timestamp: new Date().toISOString(),
  });
});

// ─── Socket.io — Real-time Chat ────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('chat message', async (msg) => {
    try {
      const response = await processChatbotMessage(msg);
      socket.emit('bot reply', response);
    } catch (err) {
      console.error('Socket chat error:', err);
      socket.emit('bot reply', {
        message: 'Sorry, something went wrong. Please try again.',
        error: true,
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Try to connect to MongoDB (will fallback gracefully)
  await connectDB();

  // Ensure uploads directory exists
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, 'uploads', 'resumes');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 AI Job Portal Backend running on port ${PORT}`);
    console.log(`   API Health: http://localhost:${PORT}/api/health\n`);
  });
};

startServer();
