/** @type {import('next').NextConfig} */
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.walletconnect.com https://*.walletconnect.org;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' blob: data:
      https://*.walletconnect.com 
      https://*.walletconnect.org 
      https://*.coinbase.com
      https://*.walletlink.org
      wss://*.walletlink.org
      https://rpc-gel.inkonchain.com 
      https://rpc.soneium.org 
      https://mainnet.base.org 
      https://mainnet.unichain.org 
      https://mainnet.megaeth.com
      https://soneium.blockscout.com
      https://explorer.inkonchain.com
      https://base.blockscout.com
      https://unichain.blockscout.com
      https://megaeth.blockscout.com
      https://carrot.megaeth.com
      https://www.megaexplorer.xyz
      https://liteforge.explorer.caldera.xyz
      https://liteforge.rpc.caldera.xyz
      wss://liteforge.rpc.caldera.xyz
      https://testnet.arcscan.app
      https://rpc.testnet.arc.network
      wss://rpc.testnet.arc.network
      https://rpc.blockdaemon.testnet.arc.network
      https://rpc.drpc.testnet.arc.network
      https://rpc.quicknode.testnet.arc.network
      https://eth-sepolia.blockscout.com
      wss://eth-sepolia.blockscout.com
      https://ethereum-sepolia-rpc.publicnode.com
      https://rpc2.sepolia.org
      https://rpc.sepolia.org;
    block-all-mixed-content;
    upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim()

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspHeader },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
]

const nextConfig = {
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default nextConfig
