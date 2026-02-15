/**
 * Utility Functions
 */

const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/database');

/**
 * Check if user is a league admin
 * @param {number} userId - User ID
 * @param {number} leagueId - League ID
 * @returns {Promise<boolean>} True if user is admin in the league
 */
async function isLeagueAdmin(userId, leagueId) {
  const membership = await prisma.leagueMember.findUnique({
    where: {
      userId_leagueId: {
        userId: parseInt(userId),
        leagueId: parseInt(leagueId)
      }
    }
  });
  return membership?.role === 'ADMIN';
}

/**
 * Check if user has admin access to league (owner, league creator, or league admin)
 * OWNER has access to everything
 * Each admin can only access their own leagues
 * @param {Object} user - User object with id and role
 * @param {Object} league - League object with id and createdById
 * @returns {Promise<boolean>} True if user has admin access
 */
async function hasLeagueAccess(user, league) {
  // Owner has full access to all leagues
  if (user.role === 'OWNER') return true;
  
  // League creator has access
  if (league.createdById === user.id) return true;
  
  // Check if user is league admin (league member with ADMIN role)
  return await isLeagueAdmin(user.id, league.id);
}

/**
 * Generate unique league code
 * @returns {string} 8-character unique code
 */
function generateLeagueCode() {
  return uuidv4().substring(0, 8).toUpperCase();
}

/**
 * Format API response
 * @param {string} status - 'success' or 'error'
 * @param {string} message - Response message
 * @param {any} data - Response data (spread at top level for easy access)
 * @returns {Object} Formatted response
 */
function formatResponse(status, message, data = null) {
  const response = { status, message };
  if (data !== null) {
    // Spread data at top level for easier frontend access
    // response.data.leagues instead of response.data.data.leagues
    Object.assign(response, data);
  }
  return response;
}

/**
 * Paginate results
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Skip and take values for Prisma
 */
function paginate(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
}

/**
 * Format pagination metadata
 * @param {number} total - Total items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
function paginationMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total
  };
}

/**
 * Check if transfers are locked for a round
 * @param {Date} lockTime - Lock time
 * @returns {boolean} Whether transfers are locked
 */
function isTransfersLocked(lockTime) {
  if (!lockTime) return false;
  return new Date() >= new Date(lockTime);
}

// متطلبات المراكز للفريق
// التشكيلة: 1 حارس، 2 مدافع، 3 وسط، 2 هجوم = 8 أساسيين
// البدلاء: 1 حارس، 1 مدافع، 1 وسط، 1 هجوم = 4 بدلاء
// الإجمالي: 2 حارس، 3 مدافع، 4 وسط، 3 هجوم = 12 لاعب
const POSITION_REQUIREMENTS = {
  GOALKEEPER: { total: 2, starters: 1, substitutes: 1, name: 'حارس مرمى' },
  DEFENDER: { total: 3, starters: 2, substitutes: 1, name: 'مدافع' },
  MIDFIELDER: { total: 4, starters: 3, substitutes: 1, name: 'وسط' },
  FORWARD: { total: 3, starters: 2, substitutes: 1, name: 'مهاجم' },
};

/**
 * Validate fantasy team formation
 * @param {Array} players - Selected players
 * @param {Object} leagueRules - League rules
 * @returns {Object} Validation result
 */
function validateFormation(players, leagueRules) {
  const starters = players.filter(p => p.isStarter);
  const substitutes = players.filter(p => !p.isStarter);
  
  const errors = [];
  
  // Check total players
  if (players.length !== leagueRules.playersPerTeam) {
    errors.push(`يجب اختيار ${leagueRules.playersPerTeam} لاعب بالضبط`);
  }
  
  // Check starters count
  if (starters.length !== leagueRules.startingPlayers) {
    errors.push(`يجب أن يكون عدد اللاعبين الأساسيين ${leagueRules.startingPlayers}`);
  }
  
  // Check substitutes count
  if (substitutes.length !== leagueRules.substitutes) {
    errors.push(`يجب أن يكون عدد البدلاء ${leagueRules.substitutes}`);
  }
  
  // التحقق من متطلبات المراكز
  for (const [position, requirements] of Object.entries(POSITION_REQUIREMENTS)) {
    const totalInPosition = players.filter(p => p.position === position).length;
    const startersInPosition = starters.filter(p => p.position === position).length;
    const substitutesInPosition = substitutes.filter(p => p.position === position).length;
    
    if (totalInPosition !== requirements.total) {
      errors.push(`يجب اختيار ${requirements.total} ${requirements.name}`);
    }
    if (startersInPosition !== requirements.starters) {
      errors.push(`يجب أن يكون عدد ${requirements.name} الأساسيين ${requirements.starters}`);
    }
    if (substitutesInPosition !== requirements.substitutes) {
      errors.push(`يجب أن يكون عدد ${requirements.name} البدلاء ${requirements.substitutes}`);
    }
  }
  
  // Check players per real team
  const teamCounts = {};
  players.forEach(p => {
    teamCounts[p.teamId] = (teamCounts[p.teamId] || 0) + 1;
  });
  
  for (const [teamId, count] of Object.entries(teamCounts)) {
    if (count > leagueRules.maxPlayersPerRealTeam) {
      errors.push(`لا يمكن اختيار أكثر من ${leagueRules.maxPlayersPerRealTeam} لاعبين من نفس الفريق`);
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get position requirements
 * @returns {Object} Position requirements
 */
function getPositionRequirements() {
  return POSITION_REQUIREMENTS;
}

/**
 * Calculate total budget used
 * @param {Array} players - Selected players with prices
 * @returns {number} Total budget used
 */
function calculateBudgetUsed(players) {
  return players.reduce((total, player) => total + parseFloat(player.price), 0);
}

module.exports = {
  generateLeagueCode,
  formatResponse,
  paginate,
  paginationMeta,
  isTransfersLocked,
  validateFormation,
  calculateBudgetUsed,
  isLeagueAdmin,
  hasLeagueAccess,
  getPositionRequirements,
  POSITION_REQUIREMENTS
};
