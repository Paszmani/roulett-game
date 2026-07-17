# 🎯 Roleta Personalizável

Roleta de prêmios totalmente personalizável, com **captura de leads**, feita em
**Expo (SDK 54) + React Native + TypeScript**. Um único código roda em três alvos, todos **offline**:

| Alvo | Formato | Como |
| --- | --- | --- |
| **Android** | APK nativo | `npm run android:apk` |
| **Windows** | `.exe` (Electron) | `npm run electron:dist` |
| **Web/Totem** | PWA no GitHub Pages | push na `main` (GitHub Actions) |

Site publicado: <https://paszmani.github.io/roulett-game/>

---

## ✨ Recursos

**Roleta**
- SVG + Reanimated 4 (animações na thread de UI — fluidas em qualquer alvo)
- Giro **justo e ponderado**: cada setor tem um peso (1–10×) que define a chance
  E o tamanho do arco; o vencedor é derivado do ângulo final (validado por
  simulação com 600 mil giros). Editor mostra a chance em % por setor.
- Giro por **toque** (no ↻ central ou em qualquer parte da roda), **arraste**
  (a roda segue o dedo) ou **flick** (soltar com impulso)
- Tamanho **proporcional à tela** em qualquer dispositivo (totem, tablet, celular)

**Personalização (Configurações ⚙︎)**
- Título, opções (texto, cor, imagem, peso), 4 fontes, tema claro/escuro
- Cores globais de texto e botões, arredondamento de cantos, **tamanho do texto**
- Rótulos com **auto-ajuste**: a fonte encolhe para caber na fatia (nº de
  setores × comprimento do texto) antes de truncar
- Logo, cor OU imagem de fundo, ponteiro (entalhe/emoji/imagem)
- Imagens otimizadas automaticamente: só reduz (nunca amplia), PNG se a origem
  tem transparência, senão JPEG nítido
- 6 animações de vitória (confete, fogos, estrelas, moedas, corações, fogo)
- Duração do giro, escala da roleta, vibração
- **Tema como arquivo**: exportar/importar toda a personalização em JSON
  (para replicar em outro totem/evento)

**Leads**
- Formulário opcional após o resultado (ativar em Configurações → Captura de leads)
- Campos **configuráveis** (texto, e-mail, telefone, seleção, checkbox — o
  checkbox serve de consentimento LGPD), obrigatoriedade por campo
- Planilha **CSV pronta para o Excel pt-BR** (separador `;`, BOM UTF-8,
  data/hora locais em colunas próprias) com **cabeçalhos = rótulos dos campos
  configurados** + coluna do prêmio sorteado
- Exportação por plataforma:
  - **Windows (.exe)**: leads gravados em `data/leads/` ao lado do exe
    (JSON por lead + `leads.csv` consolidado); botão abre a pasta no Explorador
  - **Android (APK)**: botão abre a folha de compartilhamento nativa
    (e-mail, Drive, WhatsApp…) com o CSV
  - **Web/PWA**: botão baixa o CSV
- Multi-terminal: abra com `?terminal=<id>` para identificar a máquina na planilha

---

## 🚀 Desenvolvimento

```bash
npm install                 # uma vez
npm start                   # Expo (Android via Expo Go / emulador)
npm run web                 # dev server web
npx tsc --noEmit            # checagem de tipos
```

Requisitos: Node 20+, npm. Para Android: Android Studio (traz JDK e SDK).
Para o .exe: `npm --prefix electron install` (uma vez).

---

## 📦 Build Android (APK offline)

```bash
npm run android:apk        # APK direto por linha de comando
# ou, pelo Android Studio:
npm run android:sync       # expo prebuild (gera/atualiza android/)
npm run android:open       # abre android/ no Android Studio -> Run / Build APK(s)
```

O `android:sync`/`android:apk` fazem `expo prebuild` **sem `--clean`**: a pasta
`android/` (descartável, no .gitignore) é REAPROVEITADA entre builds — os caches
do Gradle sobrevivem e o Android Studio não volta a baixar as dependências a
cada sync. O primeiro build ainda baixa tudo (normal); dos seguintes em diante
é incremental (`org.gradle.caching` ligado no `gradle.properties`). Se o
projeto nativo corromper ou após upgrade do Expo, regenere do zero com
`npm run android:sync:clean` (aí sim o próximo build re-resolve tudo).

O build usa um **JDK compatível (17–21)** — o script procura o JBR do Android
Studio sozinho; para usar outro JDK, defina `JAVA_HOME_ANDROID`.

APK gerado em: `android/app/build/outputs/apk/release/app-release.apk`

Passos no aparelho: copie o APK, permita "instalar apps desconhecidos" e instale.
O app é 100% offline (config e leads ficam no dispositivo).

Solução de problemas:
- **`resource drawable/splashscreen_logo not found`** → a splash precisa de
  imagem; já configurado em `app.json` (`expo-splash-screen.image`). Não remova.
- **`unsupported class file version`** → JDK novo demais; instale o Android
  Studio ou aponte `JAVA_HOME_ANDROID` para um JDK 17–21.
- Assinatura: o `assembleRelease` usa a keystore de debug do Expo por padrão —
  suficiente para distribuição direta (fora da Play Store). Para publicar na
  Play Store, gere uma keystore própria e configure em `android/app/build.gradle`
  (ou use `eas build`).

---

## 🖥️ Build Windows (.exe offline)

```bash
npm --prefix electron install   # uma vez
npm run electron:dist
```

Sai em `electron/release/win-unpacked/` (pasta portátil com o exe) e um `.zip`.
Copie a pasta para o totem e rode o exe — sem instalação.

Como funciona / decisões que NÃO devem ser desfeitas:
- O exe serve o bundle web por HTTP local em **porta fixa 39217** — porta fixa
  garante o mesmo origin e, portanto, a **persistência** do localStorage
  (config/leads) entre aberturas. Instância única via lock.
- O bundle web vai como `extraResources` (`resources/web`), **nunca** em
  `files`/asar — o electron-builder filtra `node_modules` dentro do asar e
  derruba as fontes silenciosamente (sintoma: `OTS parsing error`).
- Layout ao lado do exe: `config.json` (opcional, `{ "terminalId": "..." }`) e
  `data/leads/` (criada sozinha).

Smoke test (valida bundle + persistência sem abrir janela):

```powershell
$env:KIOSK_SMOKE='1'; npm run electron:start   # rodar 2x; a 2ª deve logar persistiu: "v1"
```

---

## 🌐 Deploy Web / PWA (GitHub Pages)

Automático: **push na `main`** dispara `.github/workflows/deploy.yml`
(Pages Source deve ser "GitHub Actions"). Manual: `npm run build:web` + `npm run deploy`.

Decisões que NÃO devem ser desfeitas:
- `web.output: "single"` (SPA) — `"static"` quebra a hidratação no Pages.
- Com `output: single` o Expo ignora o `+html.tsx` no build: manifest, ícones,
  registro do Service Worker e o CSS global (fundo preto + `overscroll-behavior`,
  que evita a faixa branca ao arrastar no Android) são injetados no pós-build
  por `scripts/spa-fallback.js`.
- Service Worker (Workbox): precache só do app shell (~2 MB); fontes cacheiam
  sob demanda. Após o primeiro acesso o PWA funciona offline.
- `experiments.baseUrl: "/roulett-game"` deve casar com o nome do repositório.

No totem Android: abra o site no Chrome → menu → "Instalar app" (ou "Adicionar
à tela inicial"). Atualizações chegam ao reabrir o app com internet.

---

## 📁 Estrutura

```
src/
  app/            # Rotas (Expo Router): index (jogo), settings, _layout, +html
  components/     # Wheel, WinAnimation, WinFlames, LeadFormModal, LeadFieldEditor,
                  # SegmentEditor, ColorPickerModal, ImageField
  constants/      # theme (paletas/fontes), defaults (config padrão + limites)
  contexts/       # RouletteContext (config + paleta efetiva)
  domain/         # roulette.ts — giro ponderado puro (arcos, sorteio, rotação)
  hooks/          # useRouletteStorage (persistência debounced)
  leads/          # leadStore.ts — salvar/exportar leads por plataforma
  types/          # tipos compartilhados
  utils/          # geometry (SVG), colors, imagePicker, configIO (tema JSON)
electron/         # Casca desktop (subprojeto isolado: main/preload/csv .cjs)
scripts/          # build-android.js, spa-fallback.js, open-android.js
public/           # manifest.json + ícones do PWA
.github/workflows # deploy.yml (Pages)
```

---

## 🧭 Roadmap (da pesquisa de apps profissionais)

Já coberto: pesos por setor, branding completo, leads configuráveis com
consentimento, exportação de planilha, offline nos três alvos, multi-terminal.

Possíveis próximos passos vistos no mercado (SocialPoint, Eflyn, wheelofnames):
- **Estoque de prêmios** (setor sai da roda quando os prêmios acabam)
- **Sons** no giro e na vitória
- Formulário **antes** do giro (gate de cadastro, comum em feiras)
- Anti-repetição (mesmo e-mail só gira 1×/dia)
