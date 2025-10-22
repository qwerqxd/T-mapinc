/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Adding a comment to force a change and cache invalidation.
  devServer: {
    allowedDevOrigins: [
      'https://6000-firebase-studio-1761068031576.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev',
      'https://9000-firebase-studio-1761068031576.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev',
    ],
  },
};

module.exports = nextConfig;
