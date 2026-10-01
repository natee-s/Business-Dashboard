import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow better-sqlite3 native module in API routes
  serverExternalPackages: ['better-sqlite3'],

  // Increase body size limit for Excel file uploads (10MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Use empty turbopack config to satisfy Next.js 16
  turbopack: {},
};

export default nextConfig;
