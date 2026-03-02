import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.engezhaly.com", pathname: "/uploads/**" },
      { protocol: "http", hostname: "localhost", pathname: "/uploads/**", port: "" },
      { protocol: "http", hostname: "127.0.0.1", pathname: "/uploads/**" },
    ],
  },
};

export default nextConfig;
