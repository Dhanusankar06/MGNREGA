// Quick fix for language switching issue
// This script updates the Next.js configuration to properly handle i18n

const fs = require('fs');
const path = require('path');

const nextConfigPath = path.join(__dirname, 'frontend', 'next.config.js');

const newConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    unoptimized: true
  },
  
  // Internationalization
  i18n: {
    locales: ['en', 'hi', 'ur'],
    defaultLocale: 'hi',
    localeDetection: true
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002',
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
`;

try {
  fs.writeFileSync(nextConfigPath, newConfig);
  console.log('✅ Next.js configuration updated successfully!');
  console.log('🔄 Please restart your development server for changes to take effect.');
  console.log('');
  console.log('Run these commands:');
  console.log('1. Stop the frontend server (Ctrl+C)');
  console.log('2. cd frontend');
  console.log('3. npm run dev');
} catch (error) {
  console.error('❌ Error updating Next.js configuration:', error.message);
}