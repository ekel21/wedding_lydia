import { defineConfig } from 'vite';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import music from './api/wedding-music.js';
import gallery from './api/wedding-gallery.js';

function mountRoute(server, path, handler) {
  server.middlewares.use(path, async (req, res) => {
    const controller = new AbortController();
    res.once('close', () => controller.abort());
    try {
      const request = new Request('http://localhost' + path, {
        method: req.method,
        headers: new Headers(req.headers),
        signal: controller.signal,
      });
      const response = await handler.fetch(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) await pipeline(Readable.fromWeb(response.body), res);
      else res.end();
    } catch {
      if (!res.headersSent && !res.destroyed) {
        res.writeHead(502);
        res.end('Layanan belum tersedia.');
      }
    }
  });
}

function mountWeddingApis(server) {
  mountRoute(server, '/api/wedding-music', music);
  mountRoute(server, '/api/wedding-gallery', gallery);
}

export default defineConfig({
  plugins: [{
    name: 'local-wedding-apis',
    configureServer: mountWeddingApis,
    configurePreviewServer: mountWeddingApis,
  }],
});
