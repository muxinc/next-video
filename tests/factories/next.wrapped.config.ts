import type { NextConfig } from 'next'

const withSentryConfig = (config: NextConfig) => config;

const nextConfig: NextConfig = {
  /* config options here */
}

export default withSentryConfig(nextConfig)
