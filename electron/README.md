# Roleta — casca Electron (app offline para Windows)

Subprojeto autocontido: as dependências do Electron ficam aqui dentro e não
tocam nas dependências do Expo. O bundle web é gerado pelo projeto raiz em
`electron/web/` e servido por um servidor HTTP local (o export usa o baseUrl
`/roulett-game` do GitHub Pages, então `file://` não funciona).

## Uso (a partir da RAIZ do projeto)

```bash
# 1) instalar as deps da casca (uma vez)
npm --prefix electron install

# 2) rodar em janela desktop
npm run electron:dev

# 3) gerar o app Windows (release/win-unpacked + .zip)
npm run electron:dist
```

## Leads

Com a captura ligada (Configurações → Captura de leads), cada lead vira um
JSON em `data/leads/raw/` e o consolidado `data/leads/leads.csv` — ao lado do
.exe em produção, ou na raiz do projeto em desenvolvimento. O botão
"Exportar leads (CSV)" nas configurações abre essa pasta.

`config.json` opcional ao lado do .exe: `{ "terminalId": "totem-01" }`
identifica a máquina na coluna `terminalId` do CSV.
