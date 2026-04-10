const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

const defaultConfig = getSentryExpoConfig(__dirname);
defaultConfig.resolver.sourceExts.push('cjs');

// Add alias resolver
defaultConfig.resolver.extraNodeModules = {
  '@': path.resolve(__dirname, './'),
};

// Add project root to watch folders
defaultConfig.watchFolders = [
  path.resolve(__dirname),
];

module.exports = defaultConfig;