import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.VERCEL ? ".next" : ".next-pasespain",
};

export default nextConfig;
