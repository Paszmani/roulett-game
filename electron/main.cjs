/**
 * Processo principal do Electron — casca desktop da Roleta.
 *
 * Mesma arquitetura do Kiosk Maze (pac-man): janela normal + gravação de lead
 * em disco via `fs` (1 JSON por lead + CSV consolidado, regenerado a cada
 * gravação para unir colunas).
 *
 * O bundle web (Expo export) é servido por um servidor HTTP local em
 * 127.0.0.1 (porta efêmera): o export usa caminhos absolutos com o baseUrl do
 * GitHub Pages (`/roulett-game/...`), o que inviabiliza `loadFile`/file://.
 * O servidor remove esse prefixo ao resolver os arquivos.
 *
 * Layout de pastas esperado (ao lado do .exe em produção):
 *   Roleta Personalizavel.exe
 *   config.json        -> { "terminalId": "..." } (opcional)
 *   data/leads/        -> SAÍDA: leads.csv + raw/<...>.json
 */

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');

/** Prefixo do deploy web (experiments.baseUrl do app.json). */
const BASE_PATH = '/roulett-game';
const GAME_ID = 'roleta';
const DEV_URL = process.env.KIOSK_DEV_URL;
/** Modo de verificação: abre oculto, loga o carregamento e sai sozinho. */
const SMOKE = !!process.env.KIOSK_SMOKE;

// --- Caminhos de disco -----------------------------------------------------

function baseDir() {
  return app.isPackaged ? path.dirname(app.getPath('exe')) : path.join(__dirname, '..');
}

// Bundle web: em produção vai como extraResources (resources/web), FORA do
// asar — dentro dele o empacotador derruba web/assets/node_modules/** (fontes
// e imagens do export do Expo).
function webRoot() {
  return app.isPackaged ? path.join(process.resourcesPath, 'web') : path.join(__dirname, 'web');
}

function leadsDir() {
  return path.join(baseDir(), 'data', 'leads');
}

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(path.join(baseDir(), 'config.json'), 'utf8'));
  } catch {
    return {};
  }
}

// --- Servidor estático do bundle web ----------------------------------------

const MIME = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript',
  css: 'text/css',
  json: 'application/json',
  map: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  txt: 'text/plain',
  wasm: 'application/wasm',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
};

/**
 * Resolve o arquivo pedido dentro do bundle web: remove o BASE_PATH, tenta o
 * caminho exato, depois `<caminho>/index.html` (export estático) e por fim o
 * index raiz (fallback SPA para rotas do expo-router).
 */
function resolveFile(reqPath) {
  const root = webRoot();
  let p = decodeURIComponent(reqPath);
  if (p === BASE_PATH || p.startsWith(BASE_PATH + '/')) p = p.slice(BASE_PATH.length) || '/';
  const candidates = [p, p.replace(/\/+$/, '') + '/index.html', p + '.html', '/index.html'];
  for (const c of candidates) {
    const file = path.join(root, c);
    if (!file.startsWith(root)) continue; // bloqueia path traversal
    try {
      if (fs.statSync(file).isFile()) return file;
    } catch {
      /* tenta o próximo candidato */
    }
  }
  return null;
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
      const file = resolveFile(pathname);
      if (!file) {
        console.warn('[404]', pathname);
        res.writeHead(404);
        res.end('not found');
        return;
      }
      const ext = path.extname(file).slice(1).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

// --- CSV consolidado (união de colunas) ------------------------------------

function leadsToCsv(leads) {
  const meta = ['timestamp', 'terminalId', 'themeId', 'score'];
  const ids = [];
  for (const l of leads) for (const k of Object.keys(l.fields || {})) if (!ids.includes(k)) ids.push(k);
  const cell = (v) => (/[",\r\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const header = [...meta, ...ids];
  const rows = leads.map((l) => [
    l.timestamp,
    l.terminalId,
    l.themeId,
    String(l.score),
    ...ids.map((id) => (l.fields && l.fields[id]) || ''),
  ]);
  return [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
}

function regenerateCsv(dir) {
  const rawDir = path.join(dir, 'raw');
  const files = fs.existsSync(rawDir) ? fs.readdirSync(rawDir).filter((f) => f.endsWith('.json')) : [];
  const leads = files
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(rawDir, f), 'utf8'));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  fs.writeFileSync(path.join(dir, 'leads.csv'), leadsToCsv(leads), 'utf8');
}

// --- IPC -------------------------------------------------------------------

function registerIpc() {
  ipcMain.handle('kiosk:getConfig', () => {
    const cfg = readConfig();
    return { terminalId: cfg.terminalId || 'totem-01', gameId: GAME_ID };
  });

  ipcMain.handle('kiosk:saveLead', (_event, lead) => {
    const dir = leadsDir();
    fs.mkdirSync(path.join(dir, 'raw'), { recursive: true });
    const stamp = String(lead.timestamp || new Date().toISOString()).replace(/[:.]/g, '-');
    const name = `${stamp}-${lead.terminalId || 'totem'}.json`;
    fs.writeFileSync(path.join(dir, 'raw', name), JSON.stringify(lead, null, 2), 'utf8');
    regenerateCsv(dir);
  });

  ipcMain.handle('kiosk:revealLeads', () => {
    const dir = leadsDir();
    fs.mkdirSync(dir, { recursive: true });
    return shell.openPath(dir);
  });
}

// --- Janela -----------------------------------------------------------------

async function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 1000,
    backgroundColor: '#000000',
    show: !SMOKE,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (SMOKE) {
    win.webContents.on('console-message', (_e, _level, message) => {
      console.log('[renderer]', message);
    });
    win.webContents.on('did-finish-load', () => {
      console.log('[smoke] bundle web carregado OK');
      setTimeout(() => app.exit(0), 3000);
    });
  }
  win.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error(`[erro] falha ao carregar ${url}: ${desc} (${code})`);
    if (SMOKE) app.exit(1);
  });

  if (DEV_URL) {
    win.loadURL(DEV_URL);
  } else {
    const server = startedServer || (startedServer = await startServer());
    const { port } = server.address();
    win.loadURL(`http://127.0.0.1:${port}${BASE_PATH}/`);
  }

  return win;
}

let startedServer = null;

app.whenReady().then(() => {
  registerIpc();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
