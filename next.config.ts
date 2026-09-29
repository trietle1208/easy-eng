import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the slim Docker production image (.next/standalone).
  output: "standalone",
};

export default nextConfig;
