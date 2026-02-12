/**
 * Main Server Entry Point
 * Ramadan Fantasy Football API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const authRoutes = require('./routes/auth.routes');
const leagueRoutes = require('./routes/league.routes');
const teamRoutes = require('./routes/team.routes');
const playerRoutes = require('./routes/player.routes');
const matchRoutes = require('./routes/match.routes');
const roundRoutes = require('./routes/round.routes');
const fantasyTeamRoutes = require('./routes/fantasyTeam.routes');
const transferRoutes = require('./routes/transfer.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ==================== MIDDLEWARE ====================

// Security headers
app.use(helmet());

// CORS configuration - Allow all origins for now
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Ramadan Fantasy Football API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/rounds', roundRoutes);
app.use('/api/fantasy-teams', fantasyTeamRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'الصفحة غير موجودة' // Page not found in Arabic
  });
});

// Global error handler
app.use(errorHandler);

// ==================== SERVER START ====================

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Log environment info for debugging
console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('🔧 PORT:', PORT);
console.log('🔧 DATABASE_URL exists:', !!process.env.DATABASE_URL);

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, () => {
    console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║                                                            ║
  ║   🏆 Ramadan Fantasy Football API                          ║
  ║   🚀 Server running on ${HOST}:${PORT}                         ║
  ║   📅 ${new Date().toISOString()}                   ║
  ║                                                            ║
  ╚════════════════════════════════════════════════════════════╝
    `);
  }).on('error', (err) => {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  });
}

module.exports = app;
