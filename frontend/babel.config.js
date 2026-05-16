module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      // css-interop class transform (replaces nativewind/babel, skips worklets plugin)
      require('react-native-css-interop/dist/babel-plugin').default,
    ],
  };
};
