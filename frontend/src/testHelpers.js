/**
 * Frontend Test Utilities
 * Helper functions for React component testing
 */

import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

/**
 * Custom render with providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @returns {Object} Render result with providers
 */
export function renderWithProviders(ui, options = {}) {
  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Custom render with only router
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @returns {Object} Render result with router
 */
export function renderWithRouter(ui, options = {}) {
  function Wrapper({ children }) {
    return <BrowserRouter>{children}</BrowserRouter>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Create mock user data
 * @param {Object} overrides - Data overrides
 * @returns {Object} Mock user
 */
export function createMockUser(overrides = {}) {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER',
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Create mock admin user
 * @param {Object} overrides - Data overrides
 * @returns {Object} Mock admin
 */
export function createMockAdmin(overrides = {}) {
  return createMockUser({
    id: 999,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
    ...overrides
  });
}

/**
 * Create mock league
 * @param {Object} overrides - Data overrides
 * @returns {Object} Mock league
 */
export function createMockLeague(overrides = {}) {
  return {
    id: 1,
    name: 'Test League',
    description: 'Test league description',
    code: 'TEST1234',
    maxTeams: 10,
    playersPerTeam: 12,
    budget: 100,
    isActive: true,
    ...overrides
  };
}

/**
 * Create mock team
 * @param {Object} overrides - Data overrides
 * @returns {Object} Mock team
 */
export function createMockTeam(overrides = {}) {
  return {
    id: 1,
    name: 'Test Team',
    shortName: 'TST',
    logo: null,
    ...overrides
  };
}

/**
 * Create mock player
 * @param {Object} overrides - Data overrides
 * @returns {Object} Mock player
 */
export function createMockPlayer(overrides = {}) {
  return {
    id: 1,
    name: 'Test Player',
    position: 'FORWARD',
    price: 10.0,
    isActive: true,
    team: createMockTeam(),
    ...overrides
  };
}

/**
 * Create mock fantasy team
 * @param {Object} overrides - Data overrides
 * @returns {Object} Mock fantasy team
 */
export function createMockFantasyTeam(overrides = {}) {
  return {
    id: 1,
    name: 'My Fantasy Team',
    totalPoints: 50,
    budget: 45.5,
    players: [],
    league: createMockLeague(),
    ...overrides
  };
}

/**
 * Create mock match
 * @param {Object} overrides - Data overrides
 * @returns {Object} Mock match
 */
export function createMockMatch(overrides = {}) {
  return {
    id: 1,
    homeTeam: createMockTeam({ name: 'Home Team' }),
    awayTeam: createMockTeam({ id: 2, name: 'Away Team' }),
    matchDate: new Date().toISOString(),
    homeScore: null,
    awayScore: null,
    status: 'SCHEDULED',
    ...overrides
  };
}

/**
 * Create mock round
 * @param {Object} overrides - Data overrides
 * @returns {Object} Mock round
 */
export function createMockRound(overrides = {}) {
  return {
    id: 1,
    name: 'Round 1',
    roundNumber: 1,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000).toISOString(),
    transfersOpen: true,
    isCompleted: false,
    ...overrides
  };
}

/**
 * Wait for API mock to be called
 * @param {jest.Mock} mock - Jest mock function
 * @param {number} timeout - Timeout in ms
 * @returns {Promise} Resolves when mock is called
 */
export function waitForApiCall(mock, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (mock.mock.calls.length > 0) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error('API call timeout'));
      }
    }, 100);
  });
}

/**
 * Mock API response
 * @param {Object} data - Response data
 * @param {string} status - Response status
 * @returns {Object} Mock axios response
 */
export function mockApiResponse(data, status = 'success') {
  return {
    data: {
      status,
      data
    }
  };
}

/**
 * Mock API error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Mock axios error
 */
export function mockApiError(message, statusCode = 400) {
  const error = new Error(message);
  error.response = {
    status: statusCode,
    data: {
      status: 'error',
      message
    }
  };
  return error;
}

export * from '@testing-library/react';
