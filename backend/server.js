const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const redis = require('redis');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const socketHandler = require('./socket/socketHandler');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Redis Client (optional)
let redisClient = null;
if (process.env.REDIS_URL) {
  try {
    redisClient = redis.createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    // attempt to connect but don't crash the server if redis is unavailable
    redisClient.connect().then(() => console.log('✅ Redis Connected')).catch(err => {
      console.warn('⚠️ Redis unavailable, continuing without Redis');
      redisClient = null;
    });
  } catch (err) {
    console.warn('⚠️ Failed to initialize Redis client, continuing without Redis');
    redisClient = null;
  }
} else {
  console.log('⚠️ REDIS_URL not set — running without Redis');
}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/live-education', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io Connection
socketHandler(io, redisClient);

// Error Handling
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
  🚀 Server running on port ${PORT}
  📚 Environment: ${process.env.NODE_ENV || 'development'}
  🔗 API URL: http://localhost:${PORT}
  `);
});

module.exports = { app, server, io };