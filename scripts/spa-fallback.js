/**
 * Finalização do build web para hospedagem estática (GitHub Pages):
 *
 * 1. Injeta no <head> do index.html as tags de PWA que o Expo NÃO gera no modo
 *    `output: "single"` (o `+html.tsx` só vale para SSR/static): link do
 *    manifest, apple-touch-icon, metas de instalação e o registro do Service
 *    Worker. A injeção é idempotente (não duplica se a tag já existir).
 * 2. Copia index.html -> 404.html (fallback de rota: recarregar /…/settings
 *    não retorna 404).
 * 3. Cria .nojekyll (impede o Jekyll de ignorar a pasta _expo/).
 */
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const indexPath = path.join(dist, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html não encontrado. Rode "expo export -p web" antes.');
  process.exit(1);
}

// baseUrl do app.json (ex.: "/roulett-game"); vazio em deploy na raiz.
let base = '';
try {
  base = (require('../app.json').expo?.experiments?.baseUrl || '').replace(/\/$/, '');
} catch {
  base = '';
}

let html = fs.readFileSync(indexPath, 'utf8');

const tags = [
  { test: /rel="manifest"/, tag: `<link rel="manifest" href="${base}/manifest.json" />` },
  { test: /apple-touch-icon/, tag: `<link rel="apple-touch-icon" href="${base}/icon-192.png" />` },
  {
    test: /mobile-web-app-capable/,
    tag:
      '<meta name="mobile-web-app-capable" content="yes" />' +
      '<meta name="apple-mobile-web-app-capable" content="yes" />' +
      '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  },
  {
    test: /serviceWorker/,
    tag:
      `<script>if('serviceWorker' in navigator){window.addEventListener('load',function(){` +
      `navigator.serviceWorker.register('${base}/sw.js').catch(function(e){` +
      `console.warn('Falha ao registrar o Service Worker:',e)})})}</script>`,
  },
];

const inject = tags
  .filter(({ test }) => !test.test(html))
  .map(({ tag }) => tag)
  .join('\n  ');

if (inject) {
  html = html.replace('</head>', `  ${inject}\n</head>`);
  fs.writeFileSync(indexPath, html);
}

// Fallback SPA + .nojekyll
fs.copyFileSync(indexPath, path.join(dist, '404.html'));
fs.writeFileSync(path.join(dist, '.nojekyll'), '');

console.log(`Finalizado: PWA tags injetadas (${inject ? 'sim' : 'já presentes'}), 404.html + .nojekyll`);
