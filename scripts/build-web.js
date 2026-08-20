/**
 * Build web (GitHub Pages / Electron) com o baseUrl correto.
 *
 * Define EXPO_BASE_URL para TODA a cadeia (export + spa-fallback), de forma
 * cross-platform (Windows/macOS/Linux) — sem depender da sintaxe de env inline
 * do shell (que difere no PowerShell/cmd). O `app.config.js` lê essa variável e
 * só então aplica o `experiments.baseUrl`.
 *
 * O build NATIVO nunca passa por aqui, então nunca recebe o baseUrl — é assim
 * que o APK deixa de travar na splash.
 *
 * Uso:
 *   node ./scripts/build-web.js              # GitHub Pages (dist/) + PWA + SW
 *   node ./scripts/build-web.js --electron   # bundle para a casca Electron
 */
const { execSync } = require('node:child_process');

process.env.EXPO_BASE_URL = '/roulett-game';

const electron = process.argv.includes('--electron');
const run = (cmd) => execSync(cmd, { stdio: 'inherit', env: process.env });

run(`npx expo export -p web${electron ? ' --output-dir electron/web' : ''}`);

if (!electron) {
  run('node ./scripts/spa-fallback.js');
  run('npx workbox generateSW workbox-config.js');
}
