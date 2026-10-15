import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["192.168.50.65", "**.ngrok-free.app"],
  experimental: {
    turbopackRustReactCompiler: true,
  },
  images: {
    localPatterns: [
      // Photo proxy URLs carry ?name=&w=. The default local pattern rejects
      // any query string, so next/image would 400 these srcs.
      { pathname: "/api/google/photo" },
      // Preserve the default: any local path with no query string.
      { pathname: "**", search: "" },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;