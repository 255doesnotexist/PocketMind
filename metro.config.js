const defaultAssetExts = require('metro-config/src/defaults/defaults').assetExts;

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    assetExts: [
      ...defaultAssetExts,
      'bin', // for llama.cpp GGUF and whisper.cpp ggml models
      'gguf', // Explicitly for GGUF if not covered by bin
      'mil', // for whisper.rn CoreML model assets
    ],
  },
};
