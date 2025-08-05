module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testMatch: ['<rootDir>/src/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@repo/(.*)$': '<rootDir>/../$1/src'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  }
}
