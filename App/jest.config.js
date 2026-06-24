/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',

  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Incluye todos los paquetes nativos que Jest debe transformar
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '(jest-)?react-native' +
      '|@react-native(-community)?' +
      '|expo(nent)?' +
      '|@expo(nent)?/.*' +
      '|@expo-google-fonts/.*' +
      '|react-navigation' +
      '|@react-navigation/.*' +
      '|@unimodules/.*' +
      '|unimodules' +
      '|sentry-expo' +
      '|native-base' +
      '|react-native-svg' +
      '|@gorhom/.*' +
      '|lottie-react-native' +
      '|@rnmapbox/.*' +
      '|react-native-reanimated' +
      '|react-native-screens' +
      '|react-native-safe-area-context' +
      '|react-native-gesture-handler' +
      '|react-native-paper' +
      '|rn-swipe-button' +
      '|react-native-confirmation-code-field' +
      '|react-native-animatable' +
      '|react-native-keyboard-controller' +
      '|@testing-library/.*' +
      '|react-redux' +
      '|@reduxjs/.*' +
      '|immer' +
      '|reselect' +
    '))',
  ],

  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/__tests__/**',
    '!**/__mocks__/**',
    '!**/android/**',
    '!**/ios/**',
    '!**/*.config.*',
    '!**/scripts/**',
    '!**/functions/**',
  ],

  coverageReporters: ['text', 'lcov', 'html'],
};