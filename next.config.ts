import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    staleTimes: {
      dynamic: 1000 * 60 * 60 * 24,
      static: 1000 * 60 * 60 * 24,
    },
  },
};

export default nextConfig;
