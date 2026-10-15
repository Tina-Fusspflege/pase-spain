import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() { return [{source:"/:path*",headers:[
    {key:"X-Content-Type-Options",value:"nosniff"},
    {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
    {key:"X-Frame-Options",value:"SAMEORIGIN"},
    {key:"Permissions-Policy",value:"camera=(), geolocation=()"},
    {key:"Content-Security-Policy",value:"object-src 'none'; base-uri 'self'; frame-ancestors 'self'; upgrade-insecure-requests"}
  ]}]; },
  distDir: process.env.VERCEL ? ".next" : ".next-pasespain",
};

export default nextConfig;
