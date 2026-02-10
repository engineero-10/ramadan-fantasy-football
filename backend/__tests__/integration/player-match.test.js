/**
 * Integration Tests for Player Endpoints
 * Tests for /api/players routes
 */

const request = require('supertest');
const app = require('../../src/server');
const prisma = require('../../src/config/database');
const {
  createMockUser,
  createMockAdmin,
  createMockPlayer,
  createMockTeam,
  generateTestToken
} = require('../testUtils');

describe('Player API', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== GET /api/players ====================
  describe('GET /api/players', () => {
    
    it('should return paginated list of players', async () => {
      const mockUser = createMockUser();
      const mockPlayers = [
        createMockPlayer({ id: 1, name: 'Player 1' }),
        createMockPlayer({ id: 2, name: 'Player 2' }),
        createMockPlayer({ id: 3, name: 'Player 3' })
      ];
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.player.findMany.mockResolvedValue(mockPlayers);
      prisma.player.count.mockResolvedValue(3);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/players')
        .query({ leagueId: 1 })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should filter players by position', async () => {
      const mockUser = createMockUser();
      const mockPlayers = [
        createMockPlayer({ id: 1, position: 'GOALKEEPER' })
      ];
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.player.findMany.mockResolvedValue(mockPlayers);
      prisma.player.count.mockResolvedValue(1);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/players')
        .query({ leagueId: 1, position: 'GOALKEEPER' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should filter players by team', async () => {
      const mockUser = createMockUser();
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.player.findMany.mockResolvedValue([]);
      prisma.player.count.mockResolvedValue(0);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/players')
        .query({ leagueId: 1, teamId: 1 })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should search players by name', async () => {
      const mockUser = createMockUser();
      const mockPlayers = [
        createMockPlayer({ name: 'محمد صلاح' })
      ];
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.player.findMany.mockResolvedValue(mockPlayers);
      prisma.player.count.mockResolvedValue(1);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/players')
        .query({ leagueId: 1, search: 'محمد' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/players')
        .query({ leagueId: 1 });

      expect(res.status).toBe(401);
    });
  });

  // ==================== GET /api/players/top/:leagueId ====================
  describe('GET /api/players/top/:leagueId', () => {
    
    it('should return top players by points', async () => {
      const mockUser = createMockUser();
      const mockPlayers = [
        createMockPlayer({ 
          id: 1, 
          name: 'Top Player', 
          totalPoints: 100,
          team: createMockTeam(),
          matchStats: [{ points: 10, minutesPlayed: 90 }]
        }),
        createMockPlayer({ 
          id: 2, 
          name: 'Second Player', 
          totalPoints: 80,
          team: createMockTeam(),
          matchStats: [{ points: 8, minutesPlayed: 90 }]
        })
      ];
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.player.findMany.mockResolvedValue(mockPlayers);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/players/top/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should limit results with query parameter', async () => {
      const mockUser = createMockUser();
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.player.findMany.mockResolvedValue([]);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/players/top/1')
        .query({ limit: 5 })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  // ==================== GET /api/players/:id ====================
  describe('GET /api/players/:id', () => {
    
    it('should return player details with stats', async () => {
      const mockUser = createMockUser();
      const mockPlayer = createMockPlayer({
        team: createMockTeam(),
        matchStats: []
      });
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.player.findUnique.mockResolvedValue(mockPlayer);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/players/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent player', async () => {
      const mockUser = createMockUser();
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.player.findUnique.mockResolvedValue(null);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/players/9999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ==================== POST /api/players (Admin) ====================
  describe('POST /api/players', () => {
    
    const newPlayer = {
      name: 'New Player',
      position: 'FORWARD',
      price: 10.5,
      teamId: 1,
      leagueId: 1
    };

    it('should create player when admin', async () => {
      const mockAdmin = createMockAdmin();
      const mockLeague = { id: 1, name: 'Test League', createdById: mockAdmin.id };
      const mockTeam = createMockTeam({ leagueId: 1 });
      const createdPlayer = createMockPlayer(newPlayer);
      
      prisma.user.findUnique.mockResolvedValue(mockAdmin);
      prisma.league.findUnique.mockResolvedValue(mockLeague);
      prisma.team.findFirst.mockResolvedValue(mockTeam);
      prisma.player.create.mockResolvedValue(createdPlayer);
      
      const token = generateTestToken({ userId: mockAdmin.id });

      const res = await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${token}`)
        .send(newPlayer);

      expect(res.status).toBe(201);
    });

    it('should return 403 when non-admin tries to create', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${token}`)
        .send(newPlayer);

      expect(res.status).toBe(403);
    });

    it('should return 400 if required fields are missing', async () => {
      const mockAdmin = createMockAdmin();
      prisma.user.findUnique.mockResolvedValue(mockAdmin);
      
      const token = generateTestToken({ userId: mockAdmin.id });

      const res = await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Player Only' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid position', async () => {
      const mockAdmin = createMockAdmin();
      prisma.user.findUnique.mockResolvedValue(mockAdmin);
      
      const token = generateTestToken({ userId: mockAdmin.id });

      const res = await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...newPlayer, position: 'INVALID' });

      expect(res.status).toBe(400);
    });
  });

  // ==================== PUT /api/players/:id (Admin) ====================
  describe('PUT /api/players/:id', () => {
    
    it('should update player when admin', async () => {
      const mockAdmin = createMockAdmin();
      const mockLeague = { id: 1, name: 'Test League', createdById: mockAdmin.id };
      const mockPlayer = { ...createMockPlayer(), league: mockLeague };
      
      prisma.user.findUnique.mockResolvedValue(mockAdmin);
      prisma.player.findUnique.mockResolvedValue(mockPlayer);
      prisma.player.update.mockResolvedValue({
        ...mockPlayer,
        price: 15.0
      });
      
      const token = generateTestToken({ userId: mockAdmin.id });

      const res = await request(app)
        .put('/api/players/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ price: 15.0 });

      expect(res.status).toBe(200);
    });

    it('should return 403 when non-admin tries to update', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .put('/api/players/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ price: 15.0 });

      expect(res.status).toBe(403);
    });
  });

  // ==================== DELETE /api/players/:id (Admin) ====================
  describe('DELETE /api/players/:id', () => {
    
    it('should delete player when admin', async () => {
      const mockAdmin = createMockAdmin();
      const mockLeague = { id: 1, name: 'Test League', createdById: mockAdmin.id };
      const mockPlayer = { ...createMockPlayer(), league: mockLeague };
      
      prisma.user.findUnique.mockResolvedValue(mockAdmin);
      prisma.player.findUnique.mockResolvedValue(mockPlayer);
      prisma.player.update.mockResolvedValue({ ...mockPlayer, isActive: false });
      
      const token = generateTestToken({ userId: mockAdmin.id });

      const res = await request(app)
        .delete('/api/players/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 403 when non-admin tries to delete', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .delete('/api/players/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});


/**
 * Integration Tests for Match Endpoints
 * Tests for /api/matches routes
 */

describe('Match API', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const {
    createMockMatch,
    createMockMatchStats,
    createMockRound
  } = require('../testUtils');

  // ==================== GET /api/matches ====================
  describe('GET /api/matches', () => {
    
    it('should return matches for a league', async () => {
      const mockUser = createMockUser();
      const mockMatches = [
        createMockMatch({ id: 1 }),
        createMockMatch({ id: 2 })
      ];
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.match.findMany.mockResolvedValue(mockMatches);
      prisma.match.count.mockResolvedValue(2);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/matches')
        .query({ leagueId: 1 })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should filter matches by round', async () => {
      const mockUser = createMockUser();
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.match.findMany.mockResolvedValue([]);
      prisma.match.count.mockResolvedValue(0);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/matches')
        .query({ leagueId: 1, roundId: 1 })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should filter matches by status', async () => {
      const mockUser = createMockUser();
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.match.findMany.mockResolvedValue([]);
      prisma.match.count.mockResolvedValue(0);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/matches')
        .query({ leagueId: 1, status: 'COMPLETED' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  // ==================== GET /api/matches/:id ====================
  describe('GET /api/matches/:id', () => {
    
    it('should return match details with stats', async () => {
      const mockUser = createMockUser();
      const mockMatch = createMockMatch({
        homeTeam: createMockTeam({ name: 'Home Team' }),
        awayTeam: createMockTeam({ id: 2, name: 'Away Team' }),
        round: createMockRound(),
        matchStats: []
      });
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.match.findUnique.mockResolvedValue(mockMatch);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/matches/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent match', async () => {
      const mockUser = createMockUser();
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.match.findUnique.mockResolvedValue(null);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/matches/9999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ==================== POST /api/matches (Admin) ====================
  describe('POST /api/matches', () => {
    
    const newMatch = {
      homeTeamId: 1,
      awayTeamId: 2,
      roundId: 1,
      matchDate: new Date().toISOString()
    };

    it('should create match when admin', async () => {
      const mockAdmin = createMockAdmin();
      const mockLeague = { id: 1, name: 'Test League', createdById: mockAdmin.id };
      const mockRound = { ...createMockRound(), league: mockLeague, leagueId: 1 };
      const mockHomeTeam = createMockTeam({ id: 1 });
      const mockAwayTeam = createMockTeam({ id: 2 });
      
      prisma.user.findUnique.mockResolvedValue(mockAdmin);
      prisma.round.findUnique.mockResolvedValue(mockRound);
      prisma.team.findFirst
        .mockResolvedValueOnce(mockHomeTeam)
        .mockResolvedValueOnce(mockAwayTeam);
      prisma.match.create.mockResolvedValue(createMockMatch(newMatch));
      
      const token = generateTestToken({ userId: mockAdmin.id });

      const res = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${token}`)
        .send(newMatch);

      expect(res.status).toBe(201);
    });

    it('should return 403 when non-admin tries to create', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${token}`)
        .send(newMatch);

      expect(res.status).toBe(403);
    });
  });

  // ==================== PUT /api/matches/:id/result (Admin) ====================
  describe('PUT /api/matches/:id/result', () => {
    
    it('should update match result when admin', async () => {
      const mockAdmin = createMockAdmin();
      const mockLeague = { id: 1, name: 'Test League', createdById: mockAdmin.id };
      const mockRound = { id: 1, name: 'Round 1', league: mockLeague };
      const mockMatch = { ...createMockMatch(), round: mockRound };
      
      prisma.user.findUnique.mockResolvedValue(mockAdmin);
      prisma.match.findUnique.mockResolvedValue(mockMatch);
      prisma.match.update.mockResolvedValue({
        ...mockMatch,
        homeScore: 2,
        awayScore: 1,
        status: 'COMPLETED'
      });
      
      const token = generateTestToken({ userId: mockAdmin.id });

      const res = await request(app)
        .put('/api/matches/1/result')
        .set('Authorization', `Bearer ${token}`)
        .send({ homeScore: 2, awayScore: 1, status: 'COMPLETED' });

      expect(res.status).toBe(200);
    });
  });

  // ==================== PUT /api/matches/:id/stats (Admin) ====================
  describe('PUT /api/matches/:id/stats', () => {
    
    it('should update match stats when admin', async () => {
      const mockAdmin = createMockAdmin();
      const mockLeague = { id: 1, name: 'Test League', createdById: mockAdmin.id };
      const mockRound = { id: 1, name: 'Round 1', league: mockLeague };
      const mockHomeTeam = createMockTeam({ id: 1 });
      const mockAwayTeam = createMockTeam({ id: 2 });
      const mockMatch = { 
        ...createMockMatch(), 
        round: mockRound,
        homeTeam: mockHomeTeam,
        awayTeam: mockAwayTeam
      };
      const mockPlayer = createMockPlayer({ id: 1, teamId: 1 });
      
      prisma.user.findUnique.mockResolvedValue(mockAdmin);
      prisma.match.findUnique.mockResolvedValue(mockMatch);
      prisma.player.findUnique.mockResolvedValue(mockPlayer);
      prisma.matchStat.upsert.mockResolvedValue(createMockMatchStats());
      
      const token = generateTestToken({ userId: mockAdmin.id });

      const res = await request(app)
        .put('/api/matches/1/stats')
        .set('Authorization', `Bearer ${token}`)
        .send({
          stats: [
            {
              playerId: 1,
              minutesPlayed: 90,
              goals: 2,
              assists: 1
            }
          ]
        });

      expect(res.status).toBe(200);
    });
  });
});
