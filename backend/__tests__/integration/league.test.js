/**
 * Integration Tests for League Endpoints
 * Tests for /api/leagues routes
 */

const request = require('supertest');
const app = require('../../src/server');
const prisma = require('../../src/config/database');
const {
  createMockUser,
  createMockAdmin,
  createMockLeague,
  generateTestToken
} = require('../testUtils');

describe('League API', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== GET /api/leagues ====================
  describe('GET /api/leagues', () => {
    
    it('should return paginated list of user leagues', async () => {
      const mockUser = createMockUser();
      const mockLeagues = [
        createMockLeague({ id: 1, name: 'League 1' }),
        createMockLeague({ id: 2, name: 'League 2' })
      ];
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.league.findMany.mockResolvedValue(mockLeagues);
      prisma.league.count.mockResolvedValue(2);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/leagues')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.leagues).toHaveLength(2);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/leagues');

      expect(res.status).toBe(401);
    });

    it('should support pagination parameters', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.league.findMany.mockResolvedValue([]);
      prisma.league.count.mockResolvedValue(0);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/leagues?page=2&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  // ==================== GET /api/leagues/:id ====================
  describe('GET /api/leagues/:id', () => {
    
    it('should return league details', async () => {
      const mockUser = createMockUser();
      const mockLeague = createMockLeague();
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.league.findUnique.mockResolvedValue(mockLeague);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/leagues/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(mockLeague.name);
    });

    it('should return 404 for non-existent league', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.league.findUnique.mockResolvedValue(null);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/leagues/9999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ==================== GET /api/leagues/code/:code ====================
  describe('GET /api/leagues/code/:code', () => {
    
    it('should return league by code (public)', async () => {
      const mockLeague = createMockLeague({ code: 'TEST1234' });
      prisma.league.findUnique.mockResolvedValue(mockLeague);

      const res = await request(app)
        .get('/api/leagues/code/TEST1234');

      expect(res.status).toBe(200);
      expect(res.body.data.code).toBe('TEST1234');
    });

    it('should return 404 for invalid code', async () => {
      prisma.league.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/leagues/code/INVALID');

      expect(res.status).toBe(404);
    });
  });

  // ==================== POST /api/leagues (Admin) ====================
  describe('POST /api/leagues', () => {
    
    const newLeague = {
      name: 'New League',
      description: 'A new fantasy league',
      maxTeams: 10,
      playersPerTeam: 12,
      budget: 100
    };

    it('should create league when admin', async () => {
      const mockAdmin = createMockAdmin();
      const createdLeague = createMockLeague(newLeague);
      
      prisma.user.findUnique.mockResolvedValue(mockAdmin);
      prisma.league.create.mockResolvedValue(createdLeague);
      
      const token = generateTestToken({ userId: mockAdmin.id });

      const res = await request(app)
        .post('/api/leagues')
        .set('Authorization', `Bearer ${token}`)
        .send(newLeague);

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe(newLeague.name);
    });

    it('should return 403 when non-admin tries to create league', async () => {
      const mockUser = createMockUser({ role: 'USER' });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .post('/api/leagues')
        .set('Authorization', `Bearer ${token}`)
        .send(newLeague);

      expect(res.status).toBe(403);
    });

    it('should return 400 if league name is missing', async () => {
      const mockAdmin = createMockAdmin();
      prisma.user.findUnique.mockResolvedValue(mockAdmin);
      
      const token = generateTestToken({ userId: mockAdmin.id });

      const res = await request(app)
        .post('/api/leagues')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'No name' });

      expect(res.status).toBe(400);
    });
  });

  // ==================== POST /api/leagues/join ====================
  describe('POST /api/leagues/join', () => {
    
    it('should join league with valid code', async () => {
      const mockUser = createMockUser();
      const mockLeague = { 
        ...createMockLeague({ code: 'RMDN2026' }), // 8 characters
        _count: { members: 5 } // League not full
      };
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.league.findUnique.mockResolvedValue(mockLeague);
      prisma.leagueMember.findUnique.mockResolvedValue(null); // Not already member
      prisma.leagueMember.create.mockResolvedValue({
        id: 1,
        userId: mockUser.id,
        leagueId: mockLeague.id
      });
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .post('/api/leagues/join')
        .set('Authorization', `Bearer ${token}`)
        .send({ code: 'RMDN2026' }); // 8 characters

      expect(res.status).toBe(200);
    });

    it('should return 404 for invalid code', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.league.findUnique.mockResolvedValue(null);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .post('/api/leagues/join')
        .set('Authorization', `Bearer ${token}`)
        .send({ code: 'XXXXXXXX' }); // 8-character invalid code

      expect(res.status).toBe(404);
    });

    it('should return 400 if already a member', async () => {
      const mockUser = createMockUser();
      const mockLeague = createMockLeague();
      const existingMembership = { id: 1, userId: mockUser.id, leagueId: mockLeague.id };
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.league.findUnique.mockResolvedValue(mockLeague);
      prisma.leagueMember.findUnique.mockResolvedValue(existingMembership);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .post('/api/leagues/join')
        .set('Authorization', `Bearer ${token}`)
        .send({ code: mockLeague.code });

      expect(res.status).toBe(400);
    });
  });

  // ==================== PUT /api/leagues/:id (Admin) ====================
  describe('PUT /api/leagues/:id', () => {
    
    it('should update league when admin', async () => {
      const mockAdmin = createMockAdmin();
      const mockLeague = createMockLeague();
      const updatedLeague = { ...mockLeague, name: 'Updated Name' };
      
      prisma.user.findUnique.mockResolvedValue(mockAdmin);
      prisma.league.findUnique.mockResolvedValue(mockLeague);
      prisma.league.update.mockResolvedValue(updatedLeague);
      
      const token = generateTestToken({ userId: mockAdmin.id });

      const res = await request(app)
        .put('/api/leagues/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
    });

    it('should return 403 when non-admin tries to update', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .put('/api/leagues/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(403);
    });
  });

  // ==================== DELETE /api/leagues/:id (Admin) ====================
  describe('DELETE /api/leagues/:id', () => {
    
    it('should delete league when admin', async () => {
      const mockAdmin = createMockAdmin();
      const mockLeague = createMockLeague();
      
      prisma.user.findUnique.mockResolvedValue(mockAdmin);
      prisma.league.findUnique.mockResolvedValue(mockLeague);
      prisma.league.delete.mockResolvedValue(mockLeague);
      
      const token = generateTestToken({ userId: mockAdmin.id });

      const res = await request(app)
        .delete('/api/leagues/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 403 when non-admin tries to delete', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .delete('/api/leagues/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  // ==================== GET /api/leagues/:id/members ====================
  describe('GET /api/leagues/:id/members', () => {
    
    it('should return league members', async () => {
      const mockUser = createMockUser();
      const mockMembers = [
        { id: 1, userId: 1, user: { name: 'User 1' } },
        { id: 2, userId: 2, user: { name: 'User 2' } }
      ];
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.leagueMember.findMany.mockResolvedValue(mockMembers);
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/leagues/1/members')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });
});
