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
      android: { softwareKeyboardLayoutMode: 'resize' },
      edgeToEdgeEnabled: true,
      package: 'com.anonymous.study',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      BACKEND_URL: process.env.BACKEND_URL,
    },
  },
};
