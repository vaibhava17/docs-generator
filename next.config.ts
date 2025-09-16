import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable source maps for better debugging
  productionBrowserSourceMaps: true,
  
  // Enable compression for better performance
  compress: true,
  
  // Configure headers for better SEO and security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  
  // Configure redirects if needed
  async redirects() {
    return [
      {
        source: '/docs',
        destination: '/documentation',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
