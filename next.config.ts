import type { NextConfig } from "next";
import { getPublicEnv } from "./lib/env";

// Next memuat .env* sebelum file ini dievaluasi, jadi URL Supabase sudah tersedia.
const supabaseUrl = new URL(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL);

const nextConfig: NextConfig = {
  images: {
    // Hanya objek publik Supabase Storage; protokol, port, dan query string dikunci.
    remotePatterns: [
      {
        protocol: supabaseUrl.protocol === "http:" ? "http" : "https",
        hostname: supabaseUrl.hostname,
        port: supabaseUrl.port,
        pathname: "/storage/v1/object/public/**",
        search: "",
      },
    ],
  },
  experimental: {
    agentFeedback: true,
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
