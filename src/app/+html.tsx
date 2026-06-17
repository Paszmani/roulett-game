import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * HTML raiz da versão web (Expo Router). Injeta as metatags do PWA.
 * Renderizado apenas no build estático web — não afeta Android.
 */
export default function Root({ children }: PropsWithChildren) {
  // Prefixo de deploy (ex.: "/roleta" no GitHub Pages). Vazio em deploy na raiz.
  const baseUrl = (process.env.EXPO_BASE_URL || '').replace(/\/$/, '');
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        {/* PWA */}
        <link rel="manifest" href={`${baseUrl}/manifest.json`} />
        <meta name="theme-color" content="#6D28D9" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href={`${baseUrl}/icon-192.png`} />

        {/* Evita scroll-bounce indesejado no body em telas com ScrollView */}
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: bodyStyle }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const bodyStyle = `
html, body { height: 100%; margin: 0; background-color: #0F172A; }
#root { display: flex; height: 100%; }
`;
