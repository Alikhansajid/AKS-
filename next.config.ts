
import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Optimize for production
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'images.priceoye.pk',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  webpack: (config: Configuration, { isServer }) => {
    if (!config.resolve) {
      config.resolve = {};
    }

    // ✅ Add node_modules & ./src to module resolution
    config.resolve.modules = ['node_modules', './src'];

    // ✅ Prevent Playwright from being bundled in Next.js
    if (isServer) {
      const externals = config.externals as Configuration['externals'];
      config.externals = [
        ...(Array.isArray(externals) ? externals : externals ? [externals] : []),
        { playwright: 'playwright' },
      ];
    }

    return config;
  },
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['swiper', 'react-toastify'],
  },
};

export default nextConfig;





