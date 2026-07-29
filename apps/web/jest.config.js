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
          paths: {
            '#web/*': ['./src/*'],
            '@repo/ui/server': ['../../packages/ui/src/server.ts'],
          },
        },
      },
    ],
  },
  moduleNameMapper: {
    '^#web/(.*)$': '<rootDir>/src/$1',
    '^@repo/ui/server$': '<rootDir>/../../packages/ui/src/server.ts',
    '^react-native$': 'react-native-web',
  },
  transformIgnorePatterns: [
    'node_modules/(?!\\.pnpm|((jest-)?react-native|@react-native(-community)?)|react-native-web|nativewind|react-native-css-interop|@repo/ui)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};
