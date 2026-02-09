/**
 * Utility Functions
 */

const { v4: uuidv4 } = require('uuid');

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
 * @param {any} data - Response data
 * @returns {Object} Formatted response
 */
function formatResponse(status, message, data = null) {
  const response = { status, message };
  if (data !== null) {
    response.data = data;
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
  calculateBudgetUsed
};
