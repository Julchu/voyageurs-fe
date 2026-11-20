import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["192.168.50.65", "**.ngrok-free.app"],
  experimental: {
    turbopackRustReactCompiler: true,
  },
  images: {
    // Google Places photos are paused. Their proxy URLs carry ?name=&w=, so
    // re-add { pathname: "/api/google/photo" } here when re-enabling them.
    localPatterns: [{ pathname: "**", search: "" }],
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