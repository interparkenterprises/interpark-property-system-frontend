/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  output: "standalone",

  typescript: {
    ignoreBuildErrors: false,
  },

  staticPageGenerationTimeout: 120,
};

module.exports = nextConfig;