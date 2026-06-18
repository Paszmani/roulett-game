/**
 * Configuração do Workbox (generateSW).
 * Gera dist/sw.js para tornar o PWA disponível offline.
 *
 * Estratégia:
 * - PRECACHE (baixado no 1º acesso) apenas o "app shell" essencial:
 *   index.html, bundle JS, manifest e ícones (~2 MB).
 * - As FONTES (@expo-google-fonts traz dezenas de pesos, ~16 MB) NÃO entram no
 *   precache — são cacheadas sob demanda (apenas as realmente usadas) via
 *   StaleWhileRevalidate. Assim o primeiro carregamento continua leve.
 *
 * O SW fica em dist/sw.js (servido em /<baseUrl>/sw.js); as URLs do precache são
 * relativas ao seu escopo, então o baseUrl do GitHub Pages é resolvido sozinho.
 */
module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    // App shell — sem fontes (.ttf/.otf/.woff) de propósito.
    '**/*.{html,js,css,json,ico,png,jpg,jpeg,svg,webp}',
  ],
  // Não precachear o próprio SW, runtime do workbox, o 404 (cópia do index) nem sourcemaps.
  globIgnores: ['sw.js', 'workbox-*.js', '404.html', '**/*.map'],
  swDest: 'dist/sw.js',

  // SPA: qualquer rota navegada cai no index.html (cacheado).
  navigateFallback: 'index.html',
  navigateFallbackDenylist: [/\/_expo\//],

  // Aplica a nova versão assim que disponível (evita ficar preso em cache antigo).
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,

  // O bundle único do SPA passa de 2 MB; eleva o limite para precachear.
  maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,

  runtimeCaching: [
    {
      // Fontes: cacheia só as que forem requisitadas, após o 1º uso.
      urlPattern: /\.(?:ttf|otf|woff2?)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'fonts',
        expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
  ],
};
