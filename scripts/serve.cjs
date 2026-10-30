'use strict';
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

// Serve only the three public assets, never arbitrary filesystem paths.
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']]
]);
function createServer() {
  return http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; connect-src 'none'");
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      res.end();
      return;
    }
    // Match raw request paths, so traversal encodings are not normalized into assets.
    const asset = assets.get((req.url || '').split('?')[0]);
    if (!asset) { res.writeHead(404); res.end(); return; }
    try {
      const body = await fs.readFile(path.join(__dirname, '..', 'public', asset[0]));
      res.writeHead(200, { 'Content-Type': asset[1] });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(500); res.end('Asset unavailable');
    }
  });
}
if (require.main === module) {
  const server = createServer();
  server.on('error', error => { console.error('Local server failed:', error.code); process.exitCode = 1; });
  server.listen(4173, '127.0.0.1', () => console.log('SUMI capability lab: http://127.0.0.1:4173 (Ctrl+C to stop)'));
}
module.exports = { createServer };
