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
};

export default nextConfig;