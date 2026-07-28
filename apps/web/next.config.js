/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Linting is run as its own workspace task (`pnpm --filter web lint`) with the
  // repo's shared flat config; Next's bundled eslint runner would need its own
  // legacy-style config, so it stays out of the build.
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
