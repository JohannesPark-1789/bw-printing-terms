import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages 배포용 base path
// 레포명에 맞게 수정 필요 (예: /bw-printing-terms/)
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/bw-printing-terms/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: '인쇄용어 학습 - BW',
        short_name: '印刷용어',
        description: '베러웨이시스템즈 인쇄 용어 다국어 학습 (한·中·日·EN, 280 terms)',
        theme_color: '#1c1917',
        background_color: '#f5f5f4',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/bw-printing-terms/',
        start_url: '/bw-printing-terms/',
        lang: 'ko',
        categories: ['education', 'productivity', 'reference'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cdn-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
