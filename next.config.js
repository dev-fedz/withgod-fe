/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    allowedDevOrigins: [
      'shema.ggcofficial.com',
      'localhost:3001',
      'localhost:3000',
      '127.0.0.1:3001',
      '127.0.0.1:3000'
    ]
  },
  images: {
    domains: [
      'shema.ggcofficial.com',
      'api.ggcofficial.com',
      'localhost',
      '127.0.0.1'
    ]
  }
};

module.exports = nextConfig;
