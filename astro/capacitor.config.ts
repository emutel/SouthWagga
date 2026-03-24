import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'au.com.southwagga.warriors',
  appName: 'Warriors FC',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
  android: {
    backgroundColor: '#090c09',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#090c09',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#090c09',
    },
  },
};

export default config;
