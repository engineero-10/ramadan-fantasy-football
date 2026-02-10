/**
 * Tests for AuthContext
 * Unit tests for authentication context
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

// Mock the API module
jest.mock('../../services/api', () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn()
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('AuthContext', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  const wrapper = ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('useAuth hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
      
      consoleSpy.mockRestore();
    });

    it('should return initial state', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.user).toBeNull();
      expect(result.current.isAdmin).toBe(false);
    });

    it('should load user from token on init', async () => {
      const mockUser = { id: 1, name: 'Test', email: 'test@test.com', role: 'USER' };
      localStorageMock.getItem.mockReturnValue('valid-token');
      authAPI.getProfile.mockResolvedValue({
        data: { data: mockUser }
      });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('login function', () => {
    it('should login successfully', async () => {
      const mockUser = { id: 1, name: 'Test', email: 'test@test.com', role: 'USER' };
      const mockToken = 'test-jwt-token';
      
      authAPI.login.mockResolvedValue({
        data: { data: { user: mockUser, token: mockToken } }
      });
      authAPI.getProfile.mockRejectedValue(new Error('No token'));
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      await act(async () => {
        await result.current.login('test@test.com', 'password');
      });
      
      expect(result.current.user).toEqual(mockUser);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
    });

    it('should throw error on failed login', async () => {
      authAPI.login.mockRejectedValue(new Error('Invalid credentials'));
      authAPI.getProfile.mockRejectedValue(new Error('No token'));
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      await expect(
        act(async () => {
          await result.current.login('test@test.com', 'wrong-password');
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register function', () => {
    it('should register successfully', async () => {
      const mockUser = { id: 1, name: 'New User', email: 'new@test.com', role: 'USER' };
      const mockToken = 'new-jwt-token';
      
      authAPI.register.mockResolvedValue({
        data: { data: { user: mockUser, token: mockToken } }
      });
      authAPI.getProfile.mockRejectedValue(new Error('No token'));
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      await act(async () => {
        await result.current.register('New User', 'new@test.com', 'password');
      });
      
      expect(result.current.user).toEqual(mockUser);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
    });
  });

  describe('logout function', () => {
    it('should logout successfully', async () => {
      const mockUser = { id: 1, name: 'Test', email: 'test@test.com', role: 'USER' };
      localStorageMock.getItem.mockReturnValue('valid-token');
      authAPI.getProfile.mockResolvedValue({
        data: { data: mockUser }
      });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });
      
      act(() => {
        result.current.logout();
      });
      
      expect(result.current.user).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('isAdmin flag', () => {
    it('should return true for admin users', async () => {
      const mockAdmin = { id: 1, name: 'Admin', email: 'admin@test.com', role: 'ADMIN' };
      localStorageMock.getItem.mockReturnValue('admin-token');
      authAPI.getProfile.mockResolvedValue({
        data: { data: mockAdmin }
      });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.isAdmin).toBe(true);
    });

    it('should return false for regular users', async () => {
      const mockUser = { id: 1, name: 'User', email: 'user@test.com', role: 'USER' };
      localStorageMock.getItem.mockReturnValue('user-token');
      authAPI.getProfile.mockResolvedValue({
        data: { data: mockUser }
      });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe('updateUser function', () => {
    it('should update user data', async () => {
      const mockUser = { id: 1, name: 'Test', email: 'test@test.com', role: 'USER' };
      localStorageMock.getItem.mockReturnValue('valid-token');
      authAPI.getProfile.mockResolvedValue({
        data: { data: mockUser }
      });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });
      
      act(() => {
        result.current.updateUser({ name: 'Updated Name' });
      });
      
      expect(result.current.user.name).toBe('Updated Name');
    });
  });
});
