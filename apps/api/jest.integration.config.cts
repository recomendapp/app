module.exports = {
  displayName: 'api-integration',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api-integration',
  testMatch: ['<rootDir>/src/**/*.integration.spec.ts'],
  globalSetup: '../../libs/testing/src/lib/db/global-setup.ts',
  globalTeardown: '../../libs/testing/src/lib/db/global-teardown.ts',
  maxWorkers: 1,
  testTimeout: 60000,
};
