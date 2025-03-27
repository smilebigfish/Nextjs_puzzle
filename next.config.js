/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // 禁用伺服器組件中的 webpack 加載器
  webpack: (config, { isServer }) => {
    // 避免在伺服器端引入僅限瀏覽器的模組
    if (isServer) {
      config.externals.push({
        'canvas': 'commonjs canvas',
      });
    }
    
    return config;
  },
};

module.exports = nextConfig; 