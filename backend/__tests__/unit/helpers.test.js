/**
 * Unit Tests for Utility Helpers
 * Tests for helper functions
 */

const {
  generateLeagueCode,
  formatResponse,
  paginate,
  paginationMeta,
  isTransfersLocked,
  validateFormation,
  calculateBudgetUsed
} = require('../../src/utils/helpers');

describe('Helper Utilities', () => {
  
  // ==================== generateLeagueCode ====================
  describe('generateLeagueCode', () => {
    it('should generate an 8-character code', () => {
      const code = generateLeagueCode();
      expect(code).toHaveLength(8);
    });

    it('should generate uppercase code', () => {
      const code = generateLeagueCode();
      expect(code).toBe(code.toUpperCase());
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateLeagueCode());
      }
      // All codes should be unique (or very close to it)
      expect(codes.size).toBeGreaterThan(95);
    });
  });

  // ==================== formatResponse ====================
  describe('formatResponse', () => {
    it('should format success response without data', () => {
      const result = formatResponse('success', 'Operation completed');
      expect(result).toEqual({
        status: 'success',
        message: 'Operation completed'
      });
    });

    it('should format success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const result = formatResponse('success', 'Data retrieved', data);
      expect(result).toEqual({
        status: 'success',
        message: 'Data retrieved',
        data: { id: 1, name: 'Test' }
      });
    });

    it('should format error response', () => {
      const result = formatResponse('error', 'Something went wrong');
      expect(result).toEqual({
        status: 'error',
        message: 'Something went wrong'
      });
    });

    it('should handle null data correctly', () => {
      const result = formatResponse('success', 'Message', null);
      expect(result).not.toHaveProperty('data');
    });

    it('should handle empty object data', () => {
      const result = formatResponse('success', 'Message', {});
      expect(result).toHaveProperty('data');
      expect(result.data).toEqual({});
    });

    it('should handle array data', () => {
      const result = formatResponse('success', 'List', [1, 2, 3]);
      expect(result.data).toEqual([1, 2, 3]);
    });
  });

  // ==================== paginate ====================
  describe('paginate', () => {
    it('should calculate correct skip and take for page 1', () => {
      const result = paginate(1, 10);
      expect(result).toEqual({ skip: 0, take: 10 });
    });

    it('should calculate correct skip and take for page 2', () => {
      const result = paginate(2, 10);
      expect(result).toEqual({ skip: 10, take: 10 });
    });

    it('should calculate correct skip and take for page 5 with limit 20', () => {
      const result = paginate(5, 20);
      expect(result).toEqual({ skip: 80, take: 20 });
    });

    it('should use default values when no parameters provided', () => {
      const result = paginate();
      expect(result).toEqual({ skip: 0, take: 10 });
    });

    it('should handle large page numbers', () => {
      const result = paginate(100, 50);
      expect(result).toEqual({ skip: 4950, take: 50 });
    });
  });

  // ==================== paginationMeta ====================
  describe('paginationMeta', () => {
    it('should calculate correct pagination metadata', () => {
      const result = paginationMeta(100, 1, 10);
      expect(result).toEqual({
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10,
        hasMore: true
      });
    });

    it('should return hasMore: false on last page', () => {
      const result = paginationMeta(100, 10, 10);
      expect(result.hasMore).toBe(false);
    });

    it('should handle partial last page', () => {
      const result = paginationMeta(95, 1, 10);
      expect(result.totalPages).toBe(10);
      expect(result.hasMore).toBe(true);
    });

    it('should handle single item total', () => {
      const result = paginationMeta(1, 1, 10);
      expect(result).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasMore: false
      });
    });

    it('should handle zero items', () => {
      const result = paginationMeta(0, 1, 10);
      expect(result.totalPages).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  // ==================== isTransfersLocked ====================
  describe('isTransfersLocked', () => {
    it('should return false when lockTime is null', () => {
      const result = isTransfersLocked(null);
      expect(result).toBe(false);
    });

    it('should return false when lockTime is undefined', () => {
      const result = isTransfersLocked(undefined);
      expect(result).toBe(false);
    });

    it('should return true when lockTime is in the past', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      const result = isTransfersLocked(pastDate);
      expect(result).toBe(true);
    });

    it('should return false when lockTime is in the future', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
      const result = isTransfersLocked(futureDate);
      expect(result).toBe(false);
    });

    it('should handle string date format', () => {
      const pastDateStr = new Date(Date.now() - 1000 * 60 * 60).toISOString();
      const result = isTransfersLocked(pastDateStr);
      expect(result).toBe(true);
    });
  });

  // ==================== validateFormation ====================
  describe('validateFormation', () => {
    const defaultRules = {
      playersPerTeam: 12,
      startingPlayers: 8,
      substitutes: 4,
      maxPlayersPerRealTeam: 2
    };

    const createPlayers = (starterCount, subCount, teamDistribution = {}) => {
      const players = [];
      let playerId = 1;
      
      for (let i = 0; i < starterCount; i++) {
        const teamId = teamDistribution[i] || (i + 1);
        players.push({ playerId: playerId++, isStarter: true, teamId });
      }
      
      for (let i = 0; i < subCount; i++) {
        const teamId = teamDistribution[starterCount + i] || (starterCount + i + 1);
        players.push({ playerId: playerId++, isStarter: false, teamId });
      }
      
      return players;
    };

    it('should validate a correct formation', () => {
      const players = createPlayers(8, 4);
      const result = validateFormation(players, defaultRules);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when total players is wrong', () => {
      const players = createPlayers(8, 3); // Only 11 players
      const result = validateFormation(players, defaultRules);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail when starters count is wrong', () => {
      const players = createPlayers(7, 5); // 7 starters, 5 subs
      const result = validateFormation(players, defaultRules);
      expect(result.isValid).toBe(false);
    });

    it('should fail when too many players from same team', () => {
      // All players from team 1
      const players = [];
      for (let i = 0; i < 8; i++) {
        players.push({ playerId: i + 1, isStarter: true, teamId: 1 });
      }
      for (let i = 0; i < 4; i++) {
        players.push({ playerId: 9 + i, isStarter: false, teamId: 1 });
      }
      
      const result = validateFormation(players, defaultRules);
      expect(result.isValid).toBe(false);
    });

    it('should pass when exactly max players from same team', () => {
      // 2 players from each of 6 teams
      const players = [];
      for (let i = 0; i < 12; i++) {
        players.push({
          playerId: i + 1,
          isStarter: i < 8,
          teamId: Math.floor(i / 2) + 1
        });
      }
      
      const result = validateFormation(players, defaultRules);
      expect(result.isValid).toBe(true);
    });
  });

  // ==================== calculateBudgetUsed ====================
  describe('calculateBudgetUsed', () => {
    it('should calculate total budget correctly', () => {
      const players = [
        { price: 10.5 },
        { price: 15.0 },
        { price: 8.25 }
      ];
      const result = calculateBudgetUsed(players);
      expect(result).toBe(33.75);
    });

    it('should handle empty array', () => {
      const result = calculateBudgetUsed([]);
      expect(result).toBe(0);
    });

    it('should handle string prices', () => {
      const players = [
        { price: '10.5' },
        { price: '15.0' }
      ];
      const result = calculateBudgetUsed(players);
      expect(result).toBe(25.5);
    });

    it('should handle large number of players', () => {
      const players = Array(50).fill({ price: 2.0 });
      const result = calculateBudgetUsed(players);
      expect(result).toBe(100);
    });

    it('should handle decimal precision', () => {
      const players = [
        { price: 10.123 },
        { price: 20.456 },
        { price: 30.789 }
      ];
      const result = calculateBudgetUsed(players);
      expect(result).toBeCloseTo(61.368, 2);
    });
  });
});
