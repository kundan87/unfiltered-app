/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TypeScript check errors ko Vercel build me ignore karega
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint errors ko bhi build ke waqt ignore karega
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;