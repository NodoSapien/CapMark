import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.capmark.app',
  appName: 'CapMark',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
