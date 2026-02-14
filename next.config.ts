import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/manual-builder" : "",
  assetPrefix: isProd ? "/manual-builder/" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
