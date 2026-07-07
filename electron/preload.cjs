/**
 * Preload — ponte segura renderer <-> main (mesmo contrato do Kiosk Maze).
 *
 * Com contextIsolation + sandbox, o renderer não toca em `fs`/`ipcRenderer`
 * direto. Expomos só uma API mínima em `window.kiosk`; o app faz
 * feature-detect dela (ver src/leads/leadStore.ts) e cai nos caminhos web
 * (AsyncStorage/localStorage) quando ausente.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kiosk', {
  isKiosk: true,
  getConfig: () => ipcRenderer.invoke('kiosk:getConfig'),
  saveLead: (lead) => ipcRenderer.invoke('kiosk:saveLead', lead),
  revealLeads: () => ipcRenderer.invoke('kiosk:revealLeads'),
});
