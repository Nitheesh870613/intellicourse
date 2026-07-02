/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "**.clerk.com" },
    ],
  },
  serverExternalPackages: ["pdf-parse", "tesseract.js"],
  // Workaround for Html import error in Next.js 15
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
