/**
 * Frontend Test Setup
 * Configure testing environment
 */

import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.location
delete window.location;
window.location = { href: '', assign: jest.fn() };

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
    create: jest.fn(() => mockAxiosInstance),
  };
  return {
    ...mockAxiosInstance,
    default: mockAxiosInstance,
  };
});

// Suppress console errors in tests
console.error = jest.fn();
console.warn = jest.fn();
