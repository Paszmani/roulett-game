  # 🎯 Roleta Personalizável

App de roleta totalmente personalizável feito com **Expo (SDK 54) + React Native + TypeScript**.
Roda em **Android** (app nativo) e na **Web como PWA instalável**. Layout responsivo para qualquer tela.

## ✨ Recursos da base

- Roleta desenhada em **SVG** com animação fluida via **Reanimated 4**
- Giro **justo** (resultado derivado do ângulo final, sem viés)
- Personalização: título, opções (texto + cor), fonte, tema claro/escuro, duração do giro, vibração
- Persistência local automática (**AsyncStorage** / localStorage na web)
- **PWA**: manifest, theme-color e ícones já configurados

## 🧱 Stack

| Camada        | Tecnologia                              |
| ------------- | --------------------------------------- |
| Framework     | Expo SDK 54 + Expo Router (file-based)  |
| Linguagem     | TypeScript                              |
| Animação      | react-native-reanimated 4 + worklets    |
| Gráficos      | react-native-svg                        |
| Estado/Persist| Context API + AsyncStorage              |
| Fontes        | @expo-google-fonts (Poppins/Inter/...)  |
| Web           | react-native-web (saída estática/PWA)   |

## 📁 Estrutura

```
src/
  app/            # Rotas (Expo Router): index, settings, _layout, +html
  components/     # Wheel, ResultModal, SegmentEditor
  constants/      # theme (paletas, fontes), defaults
  contexts/       # RouletteContext (estado global + helpers)
  domain/         # roulette.ts (lógica de giro, pura)
  hooks/          # useRouletteStorage
  types/          # tipos compartilhados
  utils/          # geometry (SVG), colors (contraste)
public/           # manifest.json + ícones do PWA
```

## 🚀 Passo a passo

### 1. Instalar dependências
```bash
npm install
```

### 2. (Recomendado) Alinhar versões nativas ao SDK
```bash
npx expo install --fix
```

### 3. Rodar no navegador (Web / PWA)
```bash
npm run web
```
Abre em `http://localhost:8081`. Use o DevTools (modo dispositivo)  para testar responsividade.

### 4. Rodar no Android
**Opção A — mais fácil (Expo Go):**
```bash
npm start
```
Instale o app **Expo Go** no celular e escaneie o QR Code (celular e PC na mesma rede Wi-Fi).

**Opção B — build nativo (precisa de Android Studio):**
```bash
npx expo run:android
```

### 5. Gerar o PWA para publicar
```bash
npm run build:web
```
Saída estática em `dist/`. Publique em qualquer host estático (Vercel, Netlify, GitHub Pages).

## 📦 Build de APK/AAB (Android, via EAS)
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview   # gera um APK instalável
```

## 🛠️ VS Code — extensões recomendadas

- **Expo Tools** (expo.vscode-expo-tools) — autocomplete de `app.json`, debug
- **ESLint** + **Prettier** — padronização
- **React Native Tools** (msjsdiag) — debug do bundler
- **Color Highlight** — visualizar as cores hex dos setores

> Dica: rode `npm start` no terminal integrado do VS Code (`Ctrl+'`) e pressione `w` (web) ou `a` (android).
```
