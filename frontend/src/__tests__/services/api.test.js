/**
 * Tests for API Service
 * Unit tests for API utility functions
 */

import axios from 'axios';
import {
  authAPI,
  leagueAPI,
  teamAPI,
  playerAPI,
  matchAPI,
  roundAPI,
  fantasyTeamAPI,
  transferAPI,
  leaderboardAPI
} from '../../services/api';

// Mock axios
jest.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(function() { return this; }),
  };
  return {
    ...mockAxiosInstance,
    default: mockAxiosInstance,
  };
});

describe('API Service', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== Auth API ====================
  describe('authAPI', () => {
    it('should call register endpoint', async () => {
      const userData = { name: 'Test', email: 'test@test.com', password: 'pass' };
      axios.post.mockResolvedValue({ data: { status: 'success' } });
      
      await authAPI.register(userData);
      
      expect(axios.post).toHaveBeenCalledWith('/auth/register', userData);
    });

    it('should call login endpoint', async () => {
      const credentials = { email: 'test@test.com', password: 'pass' };
      axios.post.mockResolvedValue({ data: { status: 'success' } });
      
      await authAPI.login(credentials);
      
      expect(axios.post).toHaveBeenCalledWith('/auth/login', credentials);
    });

    it('should call getProfile endpoint', async () => {
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await authAPI.getProfile();
      
      expect(axios.get).toHaveBeenCalledWith('/auth/me');
    });

    it('should call updateProfile endpoint', async () => {
      const data = { name: 'Updated' };
      axios.put.mockResolvedValue({ data: { status: 'success' } });
      
      await authAPI.updateProfile(data);
      
      expect(axios.put).toHaveBeenCalledWith('/auth/me', data);
    });
  });

  // ==================== League API ====================
  describe('leagueAPI', () => {
    it('should call getAll with params', async () => {
      const params = { page: 1, limit: 10 };
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await leagueAPI.getAll(params);
      
      expect(axios.get).toHaveBeenCalledWith('/leagues', { params });
    });

    it('should call getById', async () => {
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await leagueAPI.getById(1);
      
      expect(axios.get).toHaveBeenCalledWith('/leagues/1');
    });

    it('should call getByCode', async () => {
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await leagueAPI.getByCode('TEST1234');
      
      expect(axios.get).toHaveBeenCalledWith('/leagues/code/TEST1234');
    });

    it('should call create', async () => {
      const data = { name: 'New League' };
      axios.post.mockResolvedValue({ data: { status: 'success' } });
      
      await leagueAPI.create(data);
      
      expect(axios.post).toHaveBeenCalledWith('/leagues', data);
    });

    it('should call join', async () => {
      axios.post.mockResolvedValue({ data: { status: 'success' } });
      
      await leagueAPI.join('TEST1234');
      
      expect(axios.post).toHaveBeenCalledWith('/leagues/join', { code: 'TEST1234' });
    });

    it('should call delete', async () => {
      axios.delete.mockResolvedValue({ data: { status: 'success' } });
      
      await leagueAPI.delete(1);
      
      expect(axios.delete).toHaveBeenCalledWith('/leagues/1');
    });
  });

  // ==================== Team API ====================
  describe('teamAPI', () => {
    it('should call getAll with leagueId', async () => {
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await teamAPI.getAll(1);
      
      expect(axios.get).toHaveBeenCalledWith('/teams', { params: { leagueId: 1 } });
    });

    it('should call create', async () => {
      const data = { name: 'New Team', leagueId: 1 };
      axios.post.mockResolvedValue({ data: { status: 'success' } });
      
      await teamAPI.create(data);
      
      expect(axios.post).toHaveBeenCalledWith('/teams', data);
    });
  });

  // ==================== Player API ====================
  describe('playerAPI', () => {
    it('should call getAll with params', async () => {
      const params = { leagueId: 1, position: 'FORWARD' };
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await playerAPI.getAll(params);
      
      expect(axios.get).toHaveBeenCalledWith('/players', { params });
    });

    it('should call getTop with leagueId and limit', async () => {
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await playerAPI.getTop(1, 5);
      
      expect(axios.get).toHaveBeenCalledWith('/players/top/1', { params: { limit: 5 } });
    });

    it('should use default limit for getTop', async () => {
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await playerAPI.getTop(1);
      
      expect(axios.get).toHaveBeenCalledWith('/players/top/1', { params: { limit: 10 } });
    });
  });

  // ==================== Match API ====================
  describe('matchAPI', () => {
    it('should call getAll with params', async () => {
      const params = { leagueId: 1, roundId: 1 };
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await matchAPI.getAll(params);
      
      expect(axios.get).toHaveBeenCalledWith('/matches', { params });
    });

    it('should call updateResult', async () => {
      const data = { homeScore: 2, awayScore: 1 };
      axios.put.mockResolvedValue({ data: { status: 'success' } });
      
      await matchAPI.updateResult(1, data);
      
      expect(axios.put).toHaveBeenCalledWith('/matches/1/result', data);
    });

    it('should call updateStats', async () => {
      const stats = [{ playerId: 1, goals: 2 }];
      axios.put.mockResolvedValue({ data: { status: 'success' } });
      
      await matchAPI.updateStats(1, stats);
      
      expect(axios.put).toHaveBeenCalledWith('/matches/1/stats', { stats });
    });
  });

  // ==================== Round API ====================
  describe('roundAPI', () => {
    it('should call getCurrent', async () => {
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await roundAPI.getCurrent(1);
      
      expect(axios.get).toHaveBeenCalledWith('/rounds/current/1');
    });

    it('should call toggleTransfers', async () => {
      axios.put.mockResolvedValue({ data: { status: 'success' } });
      
      await roundAPI.toggleTransfers(1, true);
      
      expect(axios.put).toHaveBeenCalledWith('/rounds/1/transfers', { transfersOpen: true });
    });

    it('should call complete', async () => {
      axios.put.mockResolvedValue({ data: { status: 'success' } });
      
      await roundAPI.complete(1);
      
      expect(axios.put).toHaveBeenCalledWith('/rounds/1/complete');
    });
  });

  // ==================== Fantasy Team API ====================
  describe('fantasyTeamAPI', () => {
    it('should call getMyTeam with leagueId', async () => {
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await fantasyTeamAPI.getMyTeam(1);
      
      expect(axios.get).toHaveBeenCalledWith('/fantasy-teams/1');
    });

    it('should call getMyTeam without leagueId', async () => {
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await fantasyTeamAPI.getMyTeam();
      
      expect(axios.get).toHaveBeenCalledWith('/fantasy-teams/my');
    });

    it('should call updateLineup', async () => {
      const players = [{ playerId: 1, isStarter: true }];
      axios.put.mockResolvedValue({ data: { status: 'success' } });
      
      await fantasyTeamAPI.updateLineup(1, players);
      
      expect(axios.put).toHaveBeenCalledWith('/fantasy-teams/1/lineup', { players });
    });

    it('should call getRoundPoints', async () => {
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await fantasyTeamAPI.getRoundPoints(1, 2);
      
      expect(axios.get).toHaveBeenCalledWith('/fantasy-teams/1/points/2');
    });
  });

  // ==================== Transfer API ====================
  describe('transferAPI', () => {
    it('should call create', async () => {
      const data = { fantasyTeamId: 1, playerOutId: 5, playerInId: 10 };
      axios.post.mockResolvedValue({ data: { status: 'success' } });
      
      await transferAPI.create(data);
      
      expect(axios.post).toHaveBeenCalledWith('/transfers', data);
    });

    it('should call getHistory', async () => {
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await transferAPI.getHistory(1);
      
      expect(axios.get).toHaveBeenCalledWith('/transfers/1');
    });

    it('should call getRemaining', async () => {
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await transferAPI.getRemaining(1);
      
      expect(axios.get).toHaveBeenCalledWith('/transfers/1/remaining');
    });
  });

  // ==================== Leaderboard API ====================
  describe('leaderboardAPI', () => {
    it('should call get with leagueId', async () => {
      const params = { page: 1 };
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await leaderboardAPI.get(1, params);
      
      expect(axios.get).toHaveBeenCalledWith('/leaderboard/1', { params });
    });

    it('should call getRound', async () => {
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await leaderboardAPI.getRound(1, 2);
      
      expect(axios.get).toHaveBeenCalledWith('/leaderboard/1/round/2');
    });

    it('should call getMyRank', async () => {
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await leaderboardAPI.getMyRank(1);
      
      expect(axios.get).toHaveBeenCalledWith('/leaderboard/1/my-rank');
    });

    it('should call getStats', async () => {
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await leaderboardAPI.getStats(1);
      
      expect(axios.get).toHaveBeenCalledWith('/leaderboard/1/stats');
    });

    it('should call getH2H', async () => {
      axios.get.mockResolvedValue({ data: { status: 'success' } });
      
      await leaderboardAPI.getH2H(1, 2);
      
      expect(axios.get).toHaveBeenCalledWith('/leaderboard/h2h/1/2');
    });
  });
});
