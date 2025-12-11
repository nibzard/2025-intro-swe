/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    qualities: [75, 85],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Fix for GitHub Codespaces and server actions
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '*.app.github.dev',
        '*.githubpreview.dev',
      ],
      bodySizeLimit: '15mb', // Increase limit for image uploads (default is 1mb)
    },
  },
};

module.exports = nextConfig;
