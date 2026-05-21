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
dotenv.config({ path: path.join(__dirname, '.env') });

const { connectDB } = require('./config/db');
const { processChatbotMessage } = require('./services/chatbot');

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'https://afai-frontend.onrender.com',
];
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ─── Middleware ─────────────────────────────────────────────────────────────────
// CORS — allow the frontend origins (set your deployed frontend URL)
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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

  // Start the HTTP server and attach socket.io
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 AI Job Portal Backend running on port ${PORT}`);
    console.log(`Server running on port ${PORT}`);
    console.log('   API Health endpoint: /api/health\n');
  });

  const io = socketIO(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
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
};

startServer();
