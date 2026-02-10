/**
 * Test Utilities
 * Helper functions for testing
 */

const jwt = require('jsonwebtoken');

/**
 * Generate test JWT token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
function generateTestToken(payload = { userId: 1 }) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
}

/**
 * Create mock user data
 * @param {Object} overrides - Data overrides
 * @returns {Object} Mock user
 */
function createMockUser(overrides = {}) {
  return {
    id: 1,
    email: 'test@example.com',
    password: '$2a$12$hashedPasswordExample',
    name: 'Test User',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Create mock admin user data
 * @param {Object} overrides - Data overrides
 * @returns {Object} Mock admin user
 */
function createMockAdmin(overrides = {}) {
  return createMockUser({
    id: 999,
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
    ...overrides
  });
}

/**
 * Create mock league data
 * @param {Object} overrides - Data overrides
 * @returns {Object} Mock league
 */
function createMockLeague(overrides = {}) {
  return {
    id: 1,
    name: 'Test League',
    description: 'Test league description',
    code: 'TEST1234',
    maxTeams: 10,
    playersPerTeam: 12,
    startingPlayers: 8,
    substitutes: 4,
    maxPlayersPerRealTeam: 2,
    budget: 100.00,
    maxTransfersPerRound: 2,
    isActive: true,
    createdById: 999,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Create mock team data
 * @param {Object} overrides - Data overrides
 * @returns {Object} Mock team
 */
function createMockTeam(overrides = {}) {
  return {
    id: 1,
    name: 'Test Team',
    shortName: 'TST',
    logo: 'https://example.com/logo.png',
    leagueId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Create mock player data
 * @param {Object} overrides - Data overrides
 * @returns {Object} Mock player
 */
function createMockPlayer(overrides = {}) {
  return {
    id: 1,
    name: 'Test Player',
    position: 'FORWARD',
    price: 10.00,
    teamId: 1,
    leagueId: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Create mock round data
 * @param {Object} overrides - Data overrides
 * @returns {Object} Mock round
 */
function createMockRound(overrides = {}) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  return {
    id: 1,
    name: 'Round 1',
    roundNumber: 1,
    leagueId: 1,
    startDate: now,
    endDate: tomorrow,
    transfersOpen: true,
    lockTime: now,
    isCompleted: false,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

/**
 * Create mock match data
 * @param {Object} overrides - Data overrides
 * @returns {Object} Mock match
 */
function createMockMatch(overrides = {}) {
  return {
    id: 1,
    homeTeamId: 1,
    awayTeamId: 2,
    roundId: 1,
    matchDate: new Date(),
    homeScore: null,
    awayScore: null,
    status: 'SCHEDULED',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Create mock match stats data
 * @param {Object} overrides - Data overrides
 * @returns {Object} Mock match stats
 */
function createMockMatchStats(overrides = {}) {
  return {
    id: 1,
    playerId: 1,
    matchId: 1,
    minutesPlayed: 90,
    goals: 1,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    cleanSheet: false,
    penaltySaves: 0,
    points: 6,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Create mock fantasy team data
 * @param {Object} overrides - Data overrides
 * @returns {Object} Mock fantasy team
 */
function createMockFantasyTeam(overrides = {}) {
  return {
    id: 1,
    name: 'My Fantasy Team',
    userId: 1,
    leagueId: 1,
    totalPoints: 0,
    budget: 50.00,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Create mock request object
 * @param {Object} options - Request options
 * @returns {Object} Mock request
 */
function createMockRequest(options = {}) {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    user: options.user || createMockUser(),
    headers: options.headers || {}
  };
}

/**
 * Create mock response object
 * @returns {Object} Mock response with jest.fn() methods
 */
function createMockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

/**
 * Create mock next function
 * @returns {Function} Mock next
 */
function createMockNext() {
  return jest.fn();
}

module.exports = {
  generateTestToken,
  createMockUser,
  createMockAdmin,
  createMockLeague,
  createMockTeam,
  createMockPlayer,
  createMockRound,
  createMockMatch,
  createMockMatchStats,
  createMockFantasyTeam,
  createMockRequest,
  createMockResponse,
  createMockNext
};
