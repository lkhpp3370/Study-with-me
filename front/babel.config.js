// babel.config.js (Expo에서 환경변수 사용을 위한 설정)
module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        ['module:react-native-dotenv', {
          moduleName: '@env',    // ➡️ @env로 import 가능
          path: '.env',          // ➡️ study-main/.env 파일 사용
        }]
      ]
    };
  };
  