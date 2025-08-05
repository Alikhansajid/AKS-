import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**', // ✅ For Cloudinary
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        pathname: '/images/**', // ✅ For existing placeholder URLs
      },
    ],
  },
};

export default nextConfig;