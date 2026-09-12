import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'export', trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // The local preview is commonly opened as 127.0.0.1 instead of localhost.
  // Allow Next's development chunks to load from that same-origin preview.
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: { unoptimized: true },
};
export default config;
