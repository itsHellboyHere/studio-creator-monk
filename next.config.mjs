/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  // Tells Vercel not to bundle these heavy backend binaries
  serverExternalPackages: [
    '@prisma/client',
    '@prisma/adapter-neon',
    '@neondatabase/serverless',
    'bcryptjs',
    'ws',
  ],

  images: {
    remotePatterns: [
      // AWS S3 bucket
      {
        protocol: 'https',
        hostname: 'creatormonk-assets-prod.s3.ap-south-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      // Production domain — needed for Next.js image optimisation on Vercel
      {
        protocol: 'https',
        hostname: 'studio.creatormonk.in',
        port: '',
        pathname: '/**',
      },
      // Local dev
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
