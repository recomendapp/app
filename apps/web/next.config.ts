import { composePlugins, withNx } from "@nx/next";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig: NextConfig = {
  // nx: {},

  reactStrictMode: true,
  reactCompiler: true,
  output: 'standalone',
  // https://github.com/vercel/next.js/issues/79313#issuecomment-2892288965
  htmlLimitedBots: /Googlebot|Bingbot|DuckDuckBot|YandexBot|Slurp|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot/i,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'supabase.recomend.app' },
      { protocol: 'https', hostname: 'api.recomend.app' },
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'images.justwatch.com' },
      { protocol: 'https', hostname: 's.ltrbxd.com' },
      { protocol: 'https', hostname: 'media.giphy.com' },
    ],
  },

  async redirects() {
    return [
      {
        source: '/settings',
        destination: '/settings/profile',
        permanent: true,
      },
      {
        source: '/legal',
        destination: '/legal/terms-of-use',
        permanent: true,
      },
      {
        source: '/auth',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/user/:username/:path*',
        destination: '/@:username/:path*',
        permanent: true,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/:lang/@:username/:path*',
        destination: '/:lang/user/:username/:path*',
      },
    ];
  },
};

const plugins = [
  withNx,
  withPWA,
  withNextIntl,
];

module.exports = composePlugins(...plugins)(nextConfig);