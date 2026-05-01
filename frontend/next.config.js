/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'knowlytics-hub-media.s3.amazonaws.com',
      'knowlytics-hub-media.s3.us-east-1.amazonaws.com',
      'images.unsplash.com',
    ],
  },
  // Prevent right-click and DevTools shortcuts via CSP headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
