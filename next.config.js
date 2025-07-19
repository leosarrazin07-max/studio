
/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      console.warn("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set. API rewrites will not work.");
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: `https://us-central1-${projectId}.cloudfunctions.net/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
