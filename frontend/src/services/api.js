import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data)
};

// ==================== LEAGUES ====================
export const leagueAPI = {
  getAll: (params) => api.get('/leagues', { params }),
  getById: (id) => api.get(`/leagues/${id}`),
  getByCode: (code) => api.get(`/leagues/code/${code}`),
  create: (data) => api.post('/leagues', data),
  update: (id, data) => api.put(`/leagues/${id}`, data),
  delete: (id) => api.delete(`/leagues/${id}`),
  join: (code) => api.post('/leagues/join', { code }),
  getMembers: (id) => api.get(`/leagues/${id}/members`)
};

// ==================== TEAMS ====================
export const teamAPI = {
  getAll: (params) => api.get('/teams', { params }),
  getById: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`)
};

// ==================== PLAYERS ====================
export const playerAPI = {
  getAll: (params) => api.get('/players', { params }),
  getById: (id) => api.get(`/players/${id}`),
  getTop: (leagueId, limit = 10) => api.get(`/players/top/${leagueId}`, { params: { limit } }),
  create: (data) => api.post('/players', data),
  update: (id, data) => api.put(`/players/${id}`, data),
  delete: (id) => api.delete(`/players/${id}`)
};

// ==================== MATCHES ====================
export const matchAPI = {
  getAll: (params) => api.get('/matches', { params }),
  getById: (id) => api.get(`/matches/${id}`),
  create: (data) => api.post('/matches', data),
  update: (id, data) => api.put(`/matches/${id}`, data),
  updateResult: (id, data) => api.put(`/matches/${id}/result`, data),
  updateStats: (id, stats) => api.put(`/matches/${id}/stats`, { stats }),
  delete: (id) => api.delete(`/matches/${id}`)
};

// ==================== ROUNDS ====================
export const roundAPI = {
  getAll: (leagueId) => api.get('/rounds', { params: { leagueId } }),
  getById: (id) => api.get(`/rounds/${id}`),
  getCurrent: (leagueId) => api.get(`/rounds/current/${leagueId}`),
  create: (data) => api.post('/rounds', data),
  update: (id, data) => api.put(`/rounds/${id}`, data),
  toggleTransfers: (id, transfersOpen) => api.put(`/rounds/${id}/transfers`, { transfersOpen }),
  complete: (id) => api.put(`/rounds/${id}/complete`),
  delete: (id) => api.delete(`/rounds/${id}`)
};

// ==================== FANTASY TEAMS ====================
export const fantasyTeamAPI = {
  getMyTeam: (leagueId) => api.get(leagueId ? `/fantasy-teams/${leagueId}` : '/fantasy-teams/my'),
  getById: (id) => api.get(`/fantasy-teams/team/${id}`),
  create: (data) => api.post('/fantasy-teams', data),
  update: (id, data) => api.put(`/fantasy-teams/${id}`, data),
  updateLineup: (id, players) => api.put(`/fantasy-teams/${id}/lineup`, { players }),
  getRoundPoints: (id, roundId) => api.get(`/fantasy-teams/${id}/points/${roundId}`)
};

// ==================== TRANSFERS ====================
export const transferAPI = {
  create: (data) => api.post('/transfers', data),
  getHistory: (fantasyTeamId) => api.get(`/transfers/${fantasyTeamId}`),
  getRemaining: (fantasyTeamId) => api.get(`/transfers/${fantasyTeamId}/remaining`),
  getRoundTransfers: (roundId) => api.get(`/transfers/round/${roundId}`)
};

// ==================== LEADERBOARD ====================
export const leaderboardAPI = {
  get: (leagueId, params) => api.get(`/leaderboard/${leagueId}`, { params }),
  getRound: (leagueId, roundId) => api.get(`/leaderboard/${leagueId}/round/${roundId}`),
  getMyRank: (leagueId) => api.get(`/leaderboard/${leagueId}/my-rank`),
  getStats: (leagueId) => api.get(`/leaderboard/${leagueId}/stats`),
  getH2H: (teamId1, teamId2) => api.get(`/leaderboard/h2h/${teamId1}/${teamId2}`)
};

export default api;
