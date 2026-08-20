/**
 * Config dinâmica sobre o app.json.
 *
 * O `experiments.baseUrl` ("/roulett-game") existe para o GitHub Pages, que
 * serve o app numa subpasta. Mas ele SÓ pode valer para a WEB: no build nativo
 * (Android/iOS) o prefixo quebra a resolução dos assets (fontes/imagens) e o
 * app trava na splash (fica só o ícone, nunca entra no jogo).
 *
 * Por isso o baseUrl agora vem da variável de ambiente EXPO_BASE_URL, que
 * APENAS os scripts de build web definem (scripts/build-web.js). O build nativo
 * — `expo prebuild`/`expo run:android` e o `expo export:embed` chamado pelo
 * Gradle — nunca define a variável, então `baseUrl` fica indefinido e o APK
 * carrega os assets da raiz, como deve ser.
 */
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_BASE_URL || undefined,
  },
});
