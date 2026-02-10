/**
 * Integration Tests for Authentication Endpoints
 * Tests for /api/auth routes
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import app (will use mocked database)
const app = require('../../src/server');
const prisma = require('../../src/config/database');
const {
  createMockUser,
  createMockAdmin,
  generateTestToken
} = require('../testUtils');

describe('Authentication API', () => {
  
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== POST /api/auth/register ====================
  describe('POST /api/auth/register', () => {
    
    const validUser = {
      name: 'أحمد محمد',
      email: 'ahmed@example.com',
      password: 'SecurePass123'
    };

    it('should register a new user successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(null); // Email not taken
      prisma.user.create.mockResolvedValue({
        id: 1,
        name: validUser.name,
        email: validUser.email,
        role: 'USER',
        createdAt: new Date()
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe(validUser.email);
    });

    it('should return 409 if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(createMockUser());

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('error');
    });

    it('should return 400 if email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          email: 'invalid-email'
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 if password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          password: '123'
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: validUser.email,
          password: validUser.password
        });

      expect(res.status).toBe(400);
    });

    it('should register an admin user when role is ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 1,
        name: validUser.name,
        email: validUser.email,
        role: 'ADMIN',
        createdAt: new Date()
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, role: 'ADMIN' });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('ADMIN');
    });
  });

  // ==================== POST /api/auth/login ====================
  describe('POST /api/auth/login', () => {
    
    const loginCredentials = {
      email: 'ahmed@example.com',
      password: 'SecurePass123'
    };

    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash(loginCredentials.password, 12);
      const mockUser = createMockUser({
        email: loginCredentials.email,
        password: hashedPassword
      });
      
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginCredentials);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe(loginCredentials.email);
    });

    it('should return 401 if email does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginCredentials);

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should return 401 if password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('DifferentPassword', 12);
      prisma.user.findUnique.mockResolvedValue(createMockUser({
        password: hashedPassword
      }));

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginCredentials);

      expect(res.status).toBe(401);
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'somepassword' });

      expect(res.status).toBe(400);
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
    });
  });

  // ==================== GET /api/auth/me ====================
  describe('GET /api/auth/me', () => {
    
    it('should return user profile when authenticated', async () => {
      const mockUser = createMockUser({
        _count: { memberships: 2, fantasyTeams: 2 }
      });
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.email).toBe(mockUser.email);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });

    it('should return 401 with expired token', async () => {
      const token = jwt.sign(
        { userId: 1 },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Already expired
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
    });
  });

  // ==================== PUT /api/auth/me ====================
  describe('PUT /api/auth/me', () => {
    
    it('should update user profile name', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        name: 'Updated Name'
      });
      
      const token = generateTestToken({ userId: mockUser.id });

      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(401);
    });
  });
});
