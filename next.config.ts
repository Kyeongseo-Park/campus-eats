import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/restaurants", destination: "/", permanent: false }];
  },
};

export default nextConfig;
