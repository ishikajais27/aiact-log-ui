/** Proxy /api/* to the backend (BACKEND_URL, server-side only). Merge into your existing config if you have one. */
const BACKEND_URL = (
  process.env.BACKEND_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '')

/** @type {import('next').NextConfig} */
module.exports = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` }]
  },
}
