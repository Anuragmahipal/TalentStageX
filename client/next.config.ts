import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Proxy /api/* → backend so the frontend can use a relative URL in production.
  // Set NEXT_PUBLIC_API_URL to your backend base (e.g. https://api.yourdomain.com).
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
