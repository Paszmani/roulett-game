/**
 * Cria um fallback SPA para hospedagens estáticas (GitHub Pages).
 * Copia dist/index.html -> dist/404.html para que recarregar uma rota
 * profunda (ex.: /roleta/settings) não retorne 404, e adiciona .nojekyll
 * (impede o Jekyll de ignorar a pasta _expo/).
 */
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const index = path.join(dist, 'index.html');
const notFound = path.join(dist, '404.html');
const nojekyll = path.join(dist, '.nojekyll');

if (!fs.existsSync(index)) {
  console.error('dist/index.html não encontrado. Rode "expo export -p web" antes.');
  process.exit(1);
}

fs.copyFileSync(index, notFound);
fs.writeFileSync(nojekyll, '');
console.log('SPA fallback criado: 404.html + .nojekyll');
