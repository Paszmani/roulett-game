/**
 * Gera o APK release rodando o Gradle com um JDK COMPATÍVEL.
 *
 * O Gradle do React Native 0.81 suporta JDK 17–21; um JAVA_HOME apontando para
 * um JDK mais novo (ex.: 26) derruba o build com erro de "unsupported class
 * file version". Este script prefere o JBR que acompanha o Android Studio
 * (sempre compatível) e cai no JAVA_HOME apenas se for 17–21.
 *
 * Override manual: defina JAVA_HOME_ANDROID com o caminho de um JDK 17–21.
 */

const { execFileSync } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');

if (!existsSync(androidDir)) {
  console.error('Pasta android/ não encontrada. Rode primeiro: npm run android:sync');
  process.exit(1);
}

/** Major version de um JDK via release file (sem executar java). */
function jdkMajor(home) {
  try {
    const release = readFileSync(path.join(home, 'release'), 'utf8');
    const m = release.match(/JAVA_VERSION="(\d+)/);
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}

function pickJdk() {
  const candidates = [];
  if (process.env.JAVA_HOME_ANDROID) candidates.push(process.env.JAVA_HOME_ANDROID);

  const pf = process.env.ProgramFiles || 'C:\\Program Files';
  if (process.platform === 'win32') {
    candidates.push(path.join(pf, 'Android', 'Android Studio', 'jbr'));
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Android Studio.app/Contents/jbr/Contents/Home');
  } else {
    candidates.push('/opt/android-studio/jbr');
  }

  if (process.env.JAVA_HOME) candidates.push(process.env.JAVA_HOME);

  for (const home of candidates) {
    if (!existsSync(home)) continue;
    const major = jdkMajor(home);
    if (major !== null && major >= 17 && major <= 21) return { home, major };
  }
  return null;
}

const jdk = pickJdk();

if (!jdk) {
  console.error(
    'Nenhum JDK 17–21 encontrado (o Gradle do RN não suporta JDKs mais novos).\n' +
      'Instale o Android Studio (que traz um JBR compatível) ou defina\n' +
      'JAVA_HOME_ANDROID apontando para um JDK 17–21.',
  );
  process.exit(1);
}

console.log(`Usando JDK ${jdk.major} em ${jdk.home}`);

// No Windows o Node bloqueia execFile direto em .bat (EINVAL) — vai via cmd /c,
// com `.\` explícito (sem ele o cmd não resolve o .bat pelo cwd do spawn).
const [cmd, args] =
  process.platform === 'win32'
    ? ['cmd.exe', ['/c', '.\\gradlew.bat', 'assembleRelease']]
    : ['./gradlew', ['assembleRelease']];

try {
  execFileSync(cmd, args, {
    cwd: androidDir,
    stdio: 'inherit',
    env: { ...process.env, JAVA_HOME: jdk.home },
  });
} catch (e) {
  console.error('\nBuild Gradle falhou:', e && e.message);
  process.exit(1);
}

const apk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
console.log(existsSync(apk) ? `\nAPK gerado: ${apk}` : '\nBuild terminou, mas o APK não foi encontrado no caminho padrão.');
