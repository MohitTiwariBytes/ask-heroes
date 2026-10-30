import { existsSync } from "node:fs";

// Licensed Osmo components live in a gitignored folder.
const osmoButtonPath =
  "./src/components/Premium/OsmoButton009/OsmoButton009.jsx";

const osmoButton = existsSync(new URL(osmoButtonPath, import.meta.url))
  ? osmoButtonPath
  : "./src/components/Button/osmoFallback.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,

  allowedDevOrigins: ["cdn.hackclub.com"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.hackclub.com",
        pathname: "/**",
      },
    ],
  },

  turbopack: {
    resolveAlias: {
      "@premium/osmo-button": osmoButton,
    },
  },
};

export default nextConfig;
