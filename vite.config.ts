import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import net from 'net';
import path from 'path';
import {defineConfig} from 'vite';

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(false));
    server.listen({ port, host: '0.0.0.0' }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function findAvailablePort(startPort: number) {
  for (let port = startPort; port < startPort + 40; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  return startPort;
}

export default defineConfig(async ({ command }) => {
  const disableHmr = process.env.DISABLE_HMR === 'true' || process.env.CODESPACES === 'true';
  const preferredPort = Number(process.env.VITE_PORT ?? process.env.PORT ?? 5173);
  const basePort = Number.isFinite(preferredPort) && preferredPort > 0 ? preferredPort : 5173;
  const chosenPort = command === 'serve' ? await findAvailablePort(basePort) : basePort;
  const codespaceName = process.env.CODESPACE_NAME;
  const forwardingDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
  const codespaceHost = codespaceName && forwardingDomain
    ? `${codespaceName}-${chosenPort}.${forwardingDomain}`
    : undefined;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: chosenPort,
      strictPort: false,
      // HMR is disabled in AI Studio and Codespaces via env flags.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: disableHmr ? false : (codespaceHost ? { protocol: 'wss', host: codespaceHost, clientPort: 443 } : undefined),
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: disableHmr ? null : {},
    },
  };
});
