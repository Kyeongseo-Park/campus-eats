import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TEMP: 안드로이드 에뮬레이터(10.0.2.2)로 로컬 dev 서버 접속 테스트 중. HMR 웹소켓이
  // cross-origin으로 막혀 하이드레이션까지 실패하는 문제 확인됨 — 테스트 끝나면 제거할 것.
  allowedDevOrigins: ["10.0.2.2"],
  async redirects() {
    return [{ source: "/restaurants", destination: "/", permanent: false }];
  },
};

export default nextConfig;
