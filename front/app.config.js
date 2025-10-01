// app.config.js
import 'dotenv/config';

export default {
  expo: {
    name: 'study',
    slug: 'study',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      softwareKeyboardLayoutMode: 'resize', // ✅ 중복 android 제거
      edgeToEdgeEnabled: true,
      package: 'com.anonymous.study', // ✅ 스토어 배포용 패키지명
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      BACKEND_URL: process.env.BACKEND_URL,
      eas: {
        projectId: "dc899412-e64e-4e15-a195-61017240fbae",
      },
    },
    plugins: [
      [
        "expo-build-properties",
        {
          android: {
            kotlinVersion: "2.0.20"   // ✅ 지원되는 버전으로 강제
          }
        }
      ]
    ]
  }
};
