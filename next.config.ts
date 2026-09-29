import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Artwork is resized by each provider's CDN (see src/lib/image-loader.ts).
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1920],
    imageSizes: [96, 128, 185, 256, 342, 500],
  },
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
