const path = require('path')
const BACKEND = process.env.BACKEND_URL || 'http://localhost:8000'
module.exports = {
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${BACKEND}/api/:path*` }]
  },
}
