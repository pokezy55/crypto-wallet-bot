/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['t.me', 'cdn4.telegram-cdn.org'],
  },
  env: {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  },
}

module.exports = nextConfig 