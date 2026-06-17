module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // O plugin de worklets DEVE ser o último da lista (requisito do Reanimated 4).
    plugins: ['react-native-worklets/plugin'],
  };
};
