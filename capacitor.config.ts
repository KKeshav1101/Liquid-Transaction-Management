import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.liquid.financial',
  appName: 'Liquid',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;