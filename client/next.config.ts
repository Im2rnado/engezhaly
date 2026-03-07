import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/projects', destination: '/offers', permanent: true },
      { source: '/projects/:id', destination: '/offers/:id', permanent: true },
      { source: '/dashboard/freelancer/projects/create', destination: '/dashboard/freelancer/offers/create', permanent: true },
      { source: '/dashboard/freelancer/projects/:id/edit', destination: '/dashboard/freelancer/offers/:id/edit', permanent: true },
      { source: '/dashboard/freelancer/projects/:id/view', destination: '/dashboard/freelancer/offers/:id/view', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.engezhaly.com", pathname: "/uploads/**" },
      { protocol: "http", hostname: "localhost", pathname: "/uploads/**", port: "" },
      { protocol: "http", hostname: "127.0.0.1", pathname: "/uploads/**" },
    ],
  },
};

export default nextConfig;
