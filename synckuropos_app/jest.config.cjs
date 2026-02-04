module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: ['**/src/hooks/__tests__/**/*.ts?(x)', '**/src/hooks/**/?(*.)+(spec|test).ts?(x)'],
  collectCoverageFrom: [
    'src/hooks/index.ts',
    'src/hooks/useAuth.tsx',
    'src/hooks/useDatabase.tsx',
    'src/hooks/useToast.tsx',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/__tests__/',
    '/__mocks__/',
    '/src/db/',
    '/src/utils/',
    '/src/features/',
    '/src/types/',
    '/src/config/',
    '/src/layouts/',
    '/src/lib/',
    '/src/styles/',
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^uuid$': '<rootDir>/src/__mocks__/uuid.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
