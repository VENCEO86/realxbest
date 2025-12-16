/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Docker 배포를 위한 standalone 빌드
  // Prisma 클라이언트를 standalone 빌드에 포함
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yt3.ggpht.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "www.google.com",
      },
      {
        protocol: "https",
        hostname: "**.s2.googleusercontent.com",
      },
    ],
    unoptimized: false,
    minimumCacheTTL: 86400, // 24시간 캐시
  },
  experimental: {
    optimizePackageImports: ["recharts"],
  },
  // 성능 최적화
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;


