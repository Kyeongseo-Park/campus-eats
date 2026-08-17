import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rainbow.campuseats',
  appName: '학식말고뭐먹지',
  webDir: 'public',
  server: {
    url: 'https://campus-eats-lime.vercel.app',
    cleartext: false
  }
};

export default config;
