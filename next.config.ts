import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'polymarket.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.polymarket.com', pathname: '/**' },
      { protocol: 'https', hostname: 'polymarket-upload.s3.us-east-2.amazonaws.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.amazonaws.com', pathname: '/**' },
      { protocol: 'https', hostname: 'pbs.twimg.com', pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
    ],
  },
  // Optimize client bundle
  experimental: {
    optimizePackageImports: [
      '@tanstack/react-virtual',
      '@tanstack/react-query',
      'three',
      'react-globe.gl',
    ],
  },
};

export default nextConfig;
