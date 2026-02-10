/**
 * Unit Tests for Points Calculation
 * Tests for fantasy points system
 */

const { POINTS_CONFIG, calculatePlayerPoints } = require('../../src/config/points');

describe('Points Configuration', () => {
  
  // ==================== POINTS_CONFIG Constants ====================
  describe('POINTS_CONFIG', () => {
    it('should have correct goal points', () => {
      expect(POINTS_CONFIG.GOAL).toBe(5);
    });

    it('should have correct assist points', () => {
      expect(POINTS_CONFIG.ASSIST).toBe(3);
    });

    it('should have correct played match points', () => {
      expect(POINTS_CONFIG.PLAYED_MATCH).toBe(1);
    });

    it('should have negative yellow card points', () => {
      expect(POINTS_CONFIG.YELLOW_CARD).toBe(-1);
    });

    it('should have negative red card points', () => {
      expect(POINTS_CONFIG.RED_CARD).toBe(-4);
    });

    it('should have correct goalkeeper clean sheet points', () => {
      expect(POINTS_CONFIG.CLEAN_SHEET_GOALKEEPER).toBe(5);
    });

    it('should have correct defender clean sheet points', () => {
      expect(POINTS_CONFIG.CLEAN_SHEET_DEFENDER).toBe(3);
    });

    it('should have correct midfielder clean sheet points', () => {
      expect(POINTS_CONFIG.CLEAN_SHEET_MIDFIELDER).toBe(1);
    });

    it('should have correct penalty save points', () => {
      expect(POINTS_CONFIG.PENALTY_SAVE).toBe(5);
    });
  });

  // ==================== calculatePlayerPoints ====================
  describe('calculatePlayerPoints', () => {
    
    // Base stats object
    const createStats = (overrides = {}) => ({
      minutesPlayed: 90,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      cleanSheet: false,
      penaltySaves: 0,
      ...overrides
    });

    // ----- Basic Points -----
    describe('Basic Points', () => {
      it('should award 1 point for playing', () => {
        const stats = createStats({ minutesPlayed: 1 });
        const points = calculatePlayerPoints(stats, 'FORWARD');
        expect(points).toBe(1);
      });

      it('should award 0 points for not playing', () => {
        const stats = createStats({ minutesPlayed: 0 });
        const points = calculatePlayerPoints(stats, 'FORWARD');
        expect(points).toBe(0);
      });

      it('should calculate points for a goal', () => {
        const stats = createStats({ goals: 1 });
        const points = calculatePlayerPoints(stats, 'FORWARD');
        expect(points).toBe(6); // 1 (played) + 5 (goal)
      });

      it('should calculate points for multiple goals', () => {
        const stats = createStats({ goals: 3 });
        const points = calculatePlayerPoints(stats, 'FORWARD');
        expect(points).toBe(16); // 1 + (3 * 5)
      });

      it('should calculate points for an assist', () => {
        const stats = createStats({ assists: 1 });
        const points = calculatePlayerPoints(stats, 'MIDFIELDER');
        expect(points).toBe(4); // 1 (played) + 3 (assist)
      });

      it('should calculate points for multiple assists', () => {
        const stats = createStats({ assists: 2 });
        const points = calculatePlayerPoints(stats, 'MIDFIELDER');
        expect(points).toBe(7); // 1 + (2 * 3)
      });
    });

    // ----- Card Penalties -----
    describe('Card Penalties', () => {
      it('should deduct points for yellow card', () => {
        const stats = createStats({ yellowCards: 1 });
        const points = calculatePlayerPoints(stats, 'DEFENDER');
        expect(points).toBe(0); // 1 (played) - 1 (yellow)
      });

      it('should deduct points for red card', () => {
        const stats = createStats({ redCards: 1 });
        const points = calculatePlayerPoints(stats, 'DEFENDER');
        expect(points).toBe(-3); // 1 (played) - 4 (red)
      });

      it('should deduct points for multiple cards', () => {
        const stats = createStats({ yellowCards: 2 }); // Two yellows = red usually
        const points = calculatePlayerPoints(stats, 'MIDFIELDER');
        expect(points).toBe(-1); // 1 - 2
      });

      it('should handle yellow and red cards together', () => {
        const stats = createStats({ yellowCards: 1, redCards: 1 });
        const points = calculatePlayerPoints(stats, 'FORWARD');
        expect(points).toBe(-4); // 1 - 1 - 4
      });
    });

    // ----- Goalkeeper Points -----
    describe('Goalkeeper Points', () => {
      it('should award clean sheet points for goalkeeper', () => {
        const stats = createStats({ cleanSheet: true });
        const points = calculatePlayerPoints(stats, 'GOALKEEPER');
        expect(points).toBe(6); // 1 (played) + 5 (clean sheet)
      });

      it('should award penalty save points for goalkeeper', () => {
        const stats = createStats({ penaltySaves: 1 });
        const points = calculatePlayerPoints(stats, 'GOALKEEPER');
        expect(points).toBe(6); // 1 + 5
      });

      it('should award multiple penalty save points', () => {
        const stats = createStats({ penaltySaves: 2 });
        const points = calculatePlayerPoints(stats, 'GOALKEEPER');
        expect(points).toBe(11); // 1 + (2 * 5)
      });

      it('should calculate full goalkeeper game correctly', () => {
        const stats = createStats({
          cleanSheet: true,
          penaltySaves: 1,
          goals: 0, // Unlikely but possible
          assists: 1
        });
        const points = calculatePlayerPoints(stats, 'GOALKEEPER');
        expect(points).toBe(14); // 1 + 5 + 5 + 3
      });

      it('should NOT award penalty saves to non-goalkeepers', () => {
        const stats = createStats({ penaltySaves: 1 });
        const points = calculatePlayerPoints(stats, 'FORWARD');
        expect(points).toBe(1); // Only played points
      });
    });

    // ----- Defender Points -----
    describe('Defender Points', () => {
      it('should award clean sheet points for defender', () => {
        const stats = createStats({ cleanSheet: true });
        const points = calculatePlayerPoints(stats, 'DEFENDER');
        expect(points).toBe(4); // 1 + 3
      });

      it('should calculate defender with goal and clean sheet', () => {
        const stats = createStats({ goals: 1, cleanSheet: true });
        const points = calculatePlayerPoints(stats, 'DEFENDER');
        expect(points).toBe(9); // 1 + 5 + 3
      });
    });

    // ----- Midfielder Points -----
    describe('Midfielder Points', () => {
      it('should award clean sheet points for midfielder', () => {
        const stats = createStats({ cleanSheet: true });
        const points = calculatePlayerPoints(stats, 'MIDFIELDER');
        expect(points).toBe(2); // 1 + 1
      });

      it('should calculate midfielder with goal, assist, clean sheet', () => {
        const stats = createStats({
          goals: 1,
          assists: 2,
          cleanSheet: true
        });
        const points = calculatePlayerPoints(stats, 'MIDFIELDER');
        expect(points).toBe(13); // 1 + 5 + 6 + 1
      });
    });

    // ----- Forward Points -----
    describe('Forward Points', () => {
      it('should NOT award clean sheet points for forward', () => {
        const stats = createStats({ cleanSheet: true });
        const points = calculatePlayerPoints(stats, 'FORWARD');
        expect(points).toBe(1); // Only played points
      });

      it('should calculate full forward game correctly', () => {
        const stats = createStats({
          goals: 2,
          assists: 1,
          yellowCards: 1
        });
        const points = calculatePlayerPoints(stats, 'FORWARD');
        expect(points).toBe(13); // 1 + 10 + 3 - 1
      });
    });

    // ----- Complex Scenarios -----
    describe('Complex Scenarios', () => {
      it('should calculate hat-trick with assist', () => {
        const stats = createStats({ goals: 3, assists: 1 });
        const points = calculatePlayerPoints(stats, 'FORWARD');
        expect(points).toBe(19); // 1 + 15 + 3
      });

      it('should calculate player sent off with a goal', () => {
        const stats = createStats({
          goals: 1,
          redCards: 1,
          minutesPlayed: 45
        });
        const points = calculatePlayerPoints(stats, 'MIDFIELDER');
        expect(points).toBe(2); // 1 + 5 - 4
      });

      it('should handle all stats combined', () => {
        const stats = {
          minutesPlayed: 90,
          goals: 1,
          assists: 2,
          yellowCards: 1,
          redCards: 0,
          cleanSheet: true,
          penaltySaves: 0
        };
        // Midfielder: 1 (played) + 5 (goal) + 6 (assists) - 1 (yellow) + 1 (clean) = 12
        const points = calculatePlayerPoints(stats, 'MIDFIELDER');
        expect(points).toBe(12);
      });

      it('should return negative points for terrible game', () => {
        const stats = createStats({
          minutesPlayed: 30,
          yellowCards: 1,
          redCards: 1
        });
        const points = calculatePlayerPoints(stats, 'DEFENDER');
        expect(points).toBe(-4); // 1 - 1 - 4
      });

      it('should calculate perfect goalkeeper game', () => {
        const stats = createStats({
          cleanSheet: true,
          penaltySaves: 2,
          assists: 1 // Goalkeeper assist from a long kick
        });
        const points = calculatePlayerPoints(stats, 'GOALKEEPER');
        expect(points).toBe(19); // 1 + 5 + 10 + 3
      });
    });

    // ----- Edge Cases -----
    describe('Edge Cases', () => {
      it('should handle zero minutes played with other stats', () => {
        const stats = createStats({
          minutesPlayed: 0,
          goals: 2 // Should not happen but handle it
        });
        const points = calculatePlayerPoints(stats, 'FORWARD');
        expect(points).toBe(10); // No played bonus, just goals
      });

      it('should handle negative values gracefully', () => {
        const stats = createStats({
          goals: -1 // Invalid but should handle
        });
        const points = calculatePlayerPoints(stats, 'FORWARD');
        // Will calculate as -4 (1 - 5 for negative goal)
        expect(points).toBe(-4);
      });

      it('should handle unknown position', () => {
        const stats = createStats({ cleanSheet: true });
        const points = calculatePlayerPoints(stats, 'UNKNOWN');
        expect(points).toBe(1); // Only played bonus, no clean sheet
      });

      it('should handle floating point stats', () => {
        const stats = createStats({ goals: 2.5 });
        const points = calculatePlayerPoints(stats, 'FORWARD');
        // 1 + 2.5 * 5 = 13.5
        expect(points).toBe(13.5);
      });
    });
  });
});
