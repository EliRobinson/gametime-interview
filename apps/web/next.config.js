/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Linting is run as its own workspace task (`pnpm --filter web lint`) with the
  // repo's shared flat config; Next's bundled eslint runner would need its own
  // legacy-style config, so it stays out of the build.
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: [
    '@repo/ui',
    '@repo/tokens',
    '@repo/utils',
    '@repo/api-contracts',
    'react-native-web',
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native$': 'react-native-web',
    };
    config.resolve.extensions = [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      ...config.resolve.extensions,
    ];
    return config;
  },
};

module.exports = nextConfig;
