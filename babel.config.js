module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    '@babel/plugin-transform-private-methods',
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-transform-private-property-in-object',
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@components': './src/components',
          '@features': './src/features',
          '@utils': './src/utils',
          '@services': './src/services',
          '@hooks': './src/hooks',
          '@constants': './src/constants',
          '@theme': './src/theme',
          '@store': './src/store',
          '@navigation': './src/navigation',
          '@config': './src/config',
          '@api': './src/api',
          '@assets': './src/assets'
        }
      }
    ],
    'react-native-reanimated/plugin'
  ]
};
