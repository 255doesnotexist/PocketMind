const { getDefaultConfig } = require('expo/metro-config');
const defaultAssetExts = require('metro-config/src/defaults/defaults').assetExts;

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

config.resolver = {
  ...config.resolver,
  assetExts: [
    ...defaultAssetExts,
    'bin', // for llama.cpp GGUF and whisper.cpp ggml models
    'gguf', // Explicitly for GGUF if not covered by bin
    'mil', // for whisper.rn CoreML model assets
  ],
  extraNodeModules: {
    'expo': require.resolve('expo'),
  },
};

module.exports = config;
