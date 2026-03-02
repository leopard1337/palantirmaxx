import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Optimize client bundle
  experimental: {
    optimizePackageImports: ['@tanstack/react-virtual', '@tanstack/react-query'],
  },
};

export default nextConfig;
