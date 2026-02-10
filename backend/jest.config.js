/**
 * Jest Configuration for Backend Tests
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/database.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['./__tests__/setup.js'],
  verbose: true,
  testTimeout: 30000,
  modulePathIgnorePatterns: ['<rootDir>/node_modules/']
};
