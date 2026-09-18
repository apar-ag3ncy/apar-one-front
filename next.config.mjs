import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app is its own workspace. Without this, a stray lockfile in a parent
  // folder makes Next infer the wrong root (build warning + wrong file tracing).
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
};

export default nextConfig;
