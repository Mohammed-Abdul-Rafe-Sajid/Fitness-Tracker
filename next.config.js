const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
});

// /** @type {import('next').NextConfig} */
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   disable: process.env.NODE_ENV === 'development',
//   register: true,
//   skipWaiting: true,
// });

// // const nextConfig = {
// //   output: 'standalone',
// //   reactStrictMode: true,
// //   eslint: {
// //     ignoreDuringBuilds: true,
// //   },
// //   typescript: {
// //     ignoreBuildErrors: true,
// //     tsconfigPath: './tsconfig.json',
// //   },
// //   serverExternalPackages: ['@prisma/client', 'prisma'],
// //   outputFileTracingIncludes: {
// //     '/api/**/*': ['./node_modules/.prisma/client/**/*'],
// //     '/*': ['./node_modules/.prisma/client/**/*'],
// //   }
// const nextConfig = {
//   reactStrictMode: true,
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
//   typescript: {
//     ignoreBuildErrors: true,
//   },
// };

// module.exports = withPWA(nextConfig);
