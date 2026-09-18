module.exports = {
  displayName: 'notify-integration',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/notify-integration',
  testMatch: ['<rootDir>/src/**/*.integration.spec.ts'],
  globalSetup: '../../libs/testing/src/lib/db/global-setup.ts',
  globalTeardown: '../../libs/testing/src/lib/db/global-teardown.ts',
  maxWorkers: 1,
  testTimeout: 60000,
};
