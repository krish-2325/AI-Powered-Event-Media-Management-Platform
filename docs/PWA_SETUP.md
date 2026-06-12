// next.config.mjs additions for PWA
// This file documents the withPWA wrapper - apply to next.config.mjs

/*
To enable the PWA service worker, install next-pwa and wrap the config:

  npm install next-pwa

Then update next.config.mjs:

  import withPWA from "next-pwa";

  const pwaConfig = withPWA({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        // Cache API responses for gallery (stale-while-revalidate)
        urlPattern: /\/api\/media/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "api-media",
          expiration: { maxEntries: 100, maxAgeSeconds: 300 },
        },
      },
      {
        // Cache static assets (images, fonts)
        urlPattern: /\.(png|jpg|jpeg|webp|avif|svg|gif|ico|woff2?)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: { maxEntries: 500, maxAgeSeconds: 86400 * 30 },
        },
      },
      {
        // Cache CDN media (S3/CloudFront)
        urlPattern: /amazonaws\.com|cloudfront\.net/,
        handler: "CacheFirst",
        options: {
          cacheName: "cdn-media",
          expiration: { maxEntries: 200, maxAgeSeconds: 86400 * 7 },
        },
      },
      {
        // Default: network-first for pages
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  });

  export default pwaConfig(nextConfig);
*/
