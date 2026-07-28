module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/app', '<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          module: 'CommonJS',
          moduleResolution: 'Node',
          esModuleInterop: true,
          allowJs: true,
          verbatimModuleSyntax: false,
          isolatedModules: false,
          target: 'ES2020',
          lib: ['ESNext', 'DOM'],
          types: ['node', 'jest', '@testing-library/jest-dom'],
          baseUrl: '.',
          paths: { '#web/*': ['./src/*'] },
        },
      },
    ],
  },
  moduleNameMapper: {
    '^#web/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};
