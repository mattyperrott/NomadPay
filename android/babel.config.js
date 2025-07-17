module.exports = {
  presets: ['module:@react-native/babel-preset'],
  overrides: [{
    "plugins": [
      ["@babel/plugin-transform-private-methods", {
      "loose": true
    }]
    ]
  }],
  plugins: [
    [
      'react-native-reanimated/plugin',
      {
        globals: ['__scanCodes'],
      },
    ],
    [
      'module:react-native-dotenv',
      {
        envName: 'APP_ENV',
        moduleName: '@env',
        path: '.env',
      },
    ],
  ],
};
