import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // Disable static optimization for pages that use client-side only features
  output: 'standalone',
  // Ensure dynamic routes are not pre-rendered at build time
  typescript: {
    ignoreBuildErrors: false,
  },
  // Disable static generation for pages that use server-side features
  staticPageGenerationTimeout: 120,
  
  // Add API proxy rewrites
  async rewrites() {
    // Get the base URL without /api
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    // Remove trailing /api if present
    const baseUrl = apiBaseUrl.replace(/\/api$/, '');
    
    return [
      {
        source: '/api/:path*',
        destination: `${baseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;