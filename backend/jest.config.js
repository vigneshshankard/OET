module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  projects: [
    './gateway',
    './services/user-service',
    './services/session-service', 
    './services/content-service',
    './services/billing-service',
    './services/webrtc-server',
    './ai-services',
    './shared'
  ],
  collectCoverageFrom: [
    '**/*.{ts,js}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ]
};