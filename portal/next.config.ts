import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/phdplacement",
  output: "standalone",
  async headers() {
    // JSON from the API should never show up in search results.
    return [{ source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
