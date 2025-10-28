/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable API routes for Vercel deployment
  trailingSlash: true,
  
  // Image optimization
  images: {
    unoptimized: true
  },
  
  // Disable i18n for static export (not compatible)
  // i18n: {
  //   locales: ['en', 'hi', 'ur'],
  //   defaultLocale: 'hi',
  //   localeDetection: true
  // },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://mgnrega-beta.vercel.app',
    NEXT_PUBLIC_ENABLE_GEOLOCATION: process.env.NEXT_PUBLIC_ENABLE_GEOLOCATION || 'true'
  },
  
  // PWA configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ];
  },
  
  // Compression and optimization
  compress: true,
  
  // Custom webpack config for bundle optimization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false
      };
    }
    
    return config;
  }
};

module.exports = nextConfig;
