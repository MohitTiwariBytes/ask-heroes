import { existsSync } from "node:fs";

// Licensed Osmo components live in a gitignored folder. If the file is
// missing (fresh clone, CI), alias to a null stub so <Button> falls back.
const osmoButtonPath = "./src/app/Components/Premium/OsmoButton009/OsmoButton009.jsx";
const osmoButton = existsSync(new URL(osmoButtonPath, import.meta.url))
  ? osmoButtonPath
  : "./src/app/Components/Button/osmoFallback.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  devIndicators: false,
  turbopack: {
    resolveAlias: {
      "@premium/osmo-button": osmoButton,
    },
  },
};

export default nextConfig;
