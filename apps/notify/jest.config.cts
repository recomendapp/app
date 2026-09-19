module.exports = {
  displayName: 'notify',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/notify',
  testPathIgnorePatterns: ['/node_modules/', '\\.integration\\.spec\\.ts$'],
};
