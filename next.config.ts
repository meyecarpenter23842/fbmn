import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    // Vercel already sends each apex to www; consolidate www.fbmn.com.vn into the primary host.
    // Keep the path and query string for both legacy/brand domain hosts.
    return [{
      source: "/:path*",
      has: [{ type: "host" as const, value: "www.fbmn.com.vn" }],
      destination: "https://www.fbmn.vn/:path*",
      permanent: true,
    },{
      source: "/:path*",
      has: [{ type: "host" as const, value: "fbmn.com.vn" }],
      destination: "https://www.fbmn.vn/:path*",
      permanent: true,
    }];
  },
};

export default nextConfig;
