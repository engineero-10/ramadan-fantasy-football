import axios from 'axios';

// Use environment variable or fallback to Railway API
const API_URL = process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.startsWith('http')
  ? process.env.REACT_APP_API_URL
  : process.env.NODE_ENV === 'production'
    ? 'https://ramadan-fantasy-football-production.up.railway.app/api'
    : 'http://localhost:5000/api';

// Log the API URL for debugging (remove in production)
console.log('🔗 API URL:', API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
});

// ==================== IN-MEMORY CACHE (GET requests) ====================
const CACHE_TTL_MS = 60 * 1000; // 1 minute
const CACHE_MAX_ENTRIES = 200;
const cache = new Map(); // key -> { data, expiry }

function getCacheKey(config) {
  const params = config.params && Object.keys(config.params).length
    ? JSON.stringify(config.params)
    : '';
  return `${config.method}:${config.url}${params ? `?${params}` : ''}`;
}

function isCacheable(config) {
  if (config.method !== 'get') return false;
  const url = (config.url || '').toLowerCase();
  if (url.includes('/auth/me') || url.includes('/auth/login')) return false;
  return true;
}

function invalidateCache() {
  cache.clear();
}

api.invalidateCache = invalidateCache;

// Add token to requests & serve from cache for GET
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (isCacheable(config)) {
    const key = getCacheKey(config);
    const entry = cache.get(key);
    if (entry && entry.expiry > Date.now()) {
      config.adapter = () => Promise.resolve(entry.data);
    }
  }
  return config;
});

// Store GET responses in cache; invalidate cache on mutations
api.interceptors.response.use(
  (response) => {
    const config = response.config;
    if (config.method === 'get' && isCacheable(config) && !response.config.adapter) {
      const key = getCacheKey(config);
      if (cache.size >= CACHE_MAX_ENTRIES) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) cache.delete(firstKey);
      }
      cache.set(key, {
        data: response,
        expiry: Date.now() + CACHE_TTL_MS
      });
    }
    if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      invalidateCache();
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      invalidateCache();
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
  getMyAdminLeagues: () => api.get('/leagues/my-admin-leagues'),
  create: (data) => api.post('/leagues', data),
  update: (id, data) => api.put(`/leagues/${id}`, data),
  delete: (id) => api.delete(`/leagues/${id}`),
  join: (code) => api.post('/leagues/join', { code }),
  getMembers: (id) => api.get(`/leagues/${id}/members`),
  updateMemberRole: (leagueId, userId, role) => api.put(`/leagues/${leagueId}/members/${userId}/role`, { role }),
  getFantasyTeams: (id) => api.get(`/leagues/${id}/fantasy-teams`)
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
  getByLeague: (leagueId) => api.get('/rounds', { params: { leagueId } }),
  getById: (id) => api.get(`/rounds/${id}`),
  getCurrent: (leagueId) => api.get(`/rounds/current/${leagueId}`),
  getStats: (id) => api.get(`/rounds/${id}/stats`),
  getMyStats: (id) => api.get(`/rounds/${id}/my-stats`),
  create: (data) => api.post('/rounds', data),
  update: (id, data) => api.put(`/rounds/${id}`, data),
  toggleTransfers: (id, transfersOpen) => api.put(`/rounds/${id}/transfers`, { transfersOpen }),
  complete: (id) => api.put(`/rounds/${id}/complete`),
  delete: (id) => api.delete(`/rounds/${id}`)
};

// ==================== FANTASY TEAMS ====================
export const fantasyTeamAPI = {
  getMyTeams: () => api.get('/fantasy-teams/my-all'),
  getMyTeam: (leagueId) => api.get(leagueId ? `/fantasy-teams/${leagueId}` : '/fantasy-teams/my'),
  getById: (id) => api.get(`/fantasy-teams/team/${id}`),
  create: (data) => api.post('/fantasy-teams', data),
  update: (id, data) => api.put(`/fantasy-teams/${id}`, data),
  updateLineup: (id, players) => api.put(`/fantasy-teams/${id}/lineup`, { players }),
  setCaptain: (id, playerId, captainType) => api.put(`/fantasy-teams/${id}/captain`, { playerId, captainType }),
  getRoundPoints: (id, roundId) => api.get(`/fantasy-teams/${id}/points/${roundId}`),
  getHistory: (id) => api.get(`/fantasy-teams/${id}/history`)
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

// ==================== ADMIN MANAGEMENT (Owner only) ====================
export const adminManagementAPI = {
  getAll: (params) => api.get('/admin-management', { params }),
  getById: (id) => api.get(`/admin-management/${id}`),
  create: (data) => api.post('/admin-management', data),
  update: (id, data) => api.put(`/admin-management/${id}`, data),
  delete: (id) => api.delete(`/admin-management/${id}`),
  getStats: () => api.get('/admin-management/stats')
};

export default api;
