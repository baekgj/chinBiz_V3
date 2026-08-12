import type { NextConfig } from "next";

// 개발(로컬)에서 상대경로 /uploads/* 를 BE(9001)로 프록시. 운영에서는 리버스 프록시가
// /uploads 를 BE 로 먼저 라우팅하므로 이 rewrite 는 도달하지 않아 무해하다.
const UPLOADS_TARGET = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/uploads/:path*", destination: `${UPLOADS_TARGET}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
