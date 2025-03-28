import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Needed for Web Bluetooth
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Permissions-Policy",
          value: "bluetooth=()",
        },
      ],
    },
  ],
};

export default nextConfig;
