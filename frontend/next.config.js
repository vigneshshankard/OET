/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['socket.io-client']
  },
  images: {
    domains: ['localhost'],
    unoptimized: false
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  webpack: (config, { isServer }) => {
    // Fix for socket.io-client on the server
    if (isServer) {
      config.externals.push('socket.io-client')
    }
    return config
  }
}

module.exports = nextConfig