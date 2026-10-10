/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
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
