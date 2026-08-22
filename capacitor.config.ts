import type { CapacitorConfig } from '@capacitor/cli';

// 앱은 정적 빌드가 아니라 배포된 Next.js 사이트를 웹뷰로 그대로 불러오는 구조.
// webDir(public)의 내용은 실제로는 쓰이지 않고, cap sync가 요구하는 placeholder 용도.
// TODO: 정식 도메인(campus-eats.co.kr) 연결되면 아래 url 교체
const config: CapacitorConfig = {
  appId: 'com.rainbow.campuseats',
  appName: '학식말고뭐먹지',
  webDir: 'public',
  server: {
    url: 'https://campus-eats-lime.vercel.app',
    cleartext: false,
  },
};

export default config;
