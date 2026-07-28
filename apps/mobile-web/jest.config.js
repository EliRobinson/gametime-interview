module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!\\.pnpm|((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop)',
  ],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/e2e/'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  // jest-expo's first render pays a cold-start compilation cost that, combined
  // with --coverage instrumentation on a loaded CI runner, can exceed 15s when
  // turbo is also running other package suites — headroom, not a regression signal.
  testTimeout: 30000,
};
