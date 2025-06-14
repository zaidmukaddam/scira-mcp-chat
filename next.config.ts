// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
      bodySizeLimit: "2mb"
    },
  },
  env: {
    DATABASE_URL: (() => {
      const url = process.env.DATABASE_URL;
      if (!url) {
        console.error("DATABASE_URL is not defined in environment variables");
      }
      return url;
    })(),
    GROQ_API_KEY: process.env.GROQ_API_KEY
  },
}

module.exports = nextConfig