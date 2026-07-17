/**
 * Abre o projeto android/ no Android Studio — o equivalente do `cap open
 * android` do maze-game. O Expo não tem um comando "open" próprio, então
 * localizamos o Android Studio e o abrimos apontando para a pasta android/
 * gerada por `npm run android:sync` (expo prebuild).
 *
 * Instalação fora do padrão? Defina a variável de ambiente ANDROID_STUDIO com
 * o caminho do executável (ex.: JetBrains Toolbox, outro drive).
 * Teste sem abrir a GUI: OPEN_ANDROID_DRY=1 npm run android:open
 */

const { existsSync } = require('node:fs');
const { spawn } = require('node:child_process');
const path = require('node:path');

const androidDir = path.resolve(__dirname, '..', 'android');

if (!existsSync(androidDir)) {
  console.error('Pasta android/ não encontrada. Rode primeiro: npm run android:sync');
  process.exit(1);
}

const override = process.env.ANDROID_STUDIO || process.env.STUDIO_PATH;

function candidates() {
  if (override) return [override];

  if (process.platform === 'win32') {
    const pf = process.env.ProgramFiles || 'C:\\Program Files';
    const local = process.env.LOCALAPPDATA || '';
    return [
      path.join(pf, 'Android', 'Android Studio', 'bin', 'studio64.exe'),
      path.join(pf, 'Android', 'Android Studio', 'bin', 'studio.exe'),
      local && path.join(local, 'Programs', 'Android Studio', 'bin', 'studio64.exe'),
    ].filter(Boolean);
  }

  if (process.platform === 'darwin') {
    return ['/Applications/Android Studio.app'];
  }

  return ['/opt/android-studio/bin/studio.sh', '/usr/local/bin/studio'];
}

const found = candidates().find((c) => existsSync(c));

if (!found) {
  console.error(
    'Android Studio não encontrado automaticamente.\n' +
      'Abra a pasta android/ manualmente ou defina ANDROID_STUDIO com o caminho do executável.',
  );
  process.exit(1);
}

// macOS: `open -a "<app>" <projeto>`. Demais plataformas: executável direto.
const [cmd, args] =
  process.platform === 'darwin' ? ['open', ['-a', found, androidDir]] : [found, [androidDir]];

if (process.env.OPEN_ANDROID_DRY) {
  console.log(`[dry] ${cmd} ${args.join(' ')}`);
  process.exit(0);
}

const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
child.unref();
console.log(`Abrindo ${androidDir} no Android Studio...`);
