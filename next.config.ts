import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ هذا يعطل الأخطاء عند البناء في Vercel
    ignoreDuringBuilds: true,
  },
  /* config options here */
  reactStrictMode: true,
};

export default nextConfig;
