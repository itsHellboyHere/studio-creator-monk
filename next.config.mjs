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

  // Whitelists your AWS S3 Bucket so Next.js allows the images to load
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'creatormonk-assets-prod.s3.ap-south-1.amazonaws.com',
        port: '',
        pathname: '/**', // Allows any file inside the bucket
      },
    ],
  },
};

export default nextConfig;