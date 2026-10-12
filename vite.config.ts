import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import type { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

const DATA_FILE_PATH = path.resolve(__dirname, 'project-data.json');

function createRealtimeSyncMiddleware() {
  const sseClients = new Set<ServerResponse>();

  const readStoredData = (): { updatedAt: number; data: unknown } | null => {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch {
      // ignore read errors
    }
    return null;
  };

  const broadcastUpdate = (payload: { updatedAt: number; clientId?: string; data: unknown }) => {
    const message = `data: ${JSON.stringify(payload)}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.write(message);
      } catch {
        sseClients.delete(client);
      }
    });
  };

  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url ? req.url.split('?')[0] : '';

    if (url === '/api/project-data/stream' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write(': connected\n\n');
      const current = readStoredData();
      if (current) {
        res.write(`data: ${JSON.stringify(current)}\n\n`);
      }
      sseClients.add(res);
      req.on('close', () => {
        sseClients.delete(res);
      });
      return;
    }

    if (url === '/api/project-data' && req.method === 'GET') {
      const current = readStoredData();
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify(current || { updatedAt: 0, data: null }));
      return;
    }

    if (url === '/api/project-data' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const record = {
            updatedAt: Date.now(),
            clientId: parsed.clientId || '',
            data: parsed.data,
          };
          fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(record, null, 2), 'utf-8');
          broadcastUpdate(record);
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(JSON.stringify({ ok: true, updatedAt: record.updatedAt }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: String(err) }));
        }
      });
      return;
    }

    next();
  };
}

function area1RealtimeSyncPlugin(): Plugin {
  const middleware = createRealtimeSyncMiddleware();
  return {
    name: 'area1-realtime-sync',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), area1RealtimeSyncPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
