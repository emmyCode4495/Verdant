module.exports = function (api) {
  api.cache(true);
  // babel-preset-expo auto-adds the Reanimated/worklets plugin (SDK 54+)
  return { presets: ['babel-preset-expo'] };
};
