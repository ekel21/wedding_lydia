import { defineConfig } from 'vite';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import music from './api/wedding-music.js';

function mountDropboxAudio(server) {
  server.middlewares.use('/api/wedding-music', async (req, res) => {
    const controller = new AbortController();
    res.once('close', () => controller.abort());
    try {
      const request = new Request('http://localhost/api/wedding-music', {
        method: req.method,
        headers: new Headers(req.headers),
        signal: controller.signal,
      });
      const response = await music.fetch(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) await pipeline(Readable.fromWeb(response.body), res);
      else res.end();
    } catch {
      if (!res.headersSent && !res.destroyed) {
        res.writeHead(502);
        res.end('Audio Dropbox tidak tersedia.');
      }
    }
  });
}

export default defineConfig({
  plugins: [{
    name: 'local-wedding-dropbox-audio',
    configureServer: mountDropboxAudio,
    configurePreviewServer: mountDropboxAudio,
  }],
});
