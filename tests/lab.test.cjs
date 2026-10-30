'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { once } = require('node:events');
const http = require('node:http');
const { createServer } = require('../scripts/serve.cjs');
function harness(request) {
  const elements = {};
  let output;
  function element() { return { value: 'test', children: [], listeners: {}, addEventListener(k, fn) { this.listeners[k] = fn; }, replaceChildren() { this.children = []; }, append(...nodes) { this.children.push(...nodes); }, click() {} }; }
  for (const id of ['probe','results','record','device','asset','capture','recording','notes','saved']) elements[id] = element();
  const context = {
    document: { getElementById: id => elements[id], createElement: element },
    window: { isSecureContext: true },
    navigator: { userAgent: 'test', requestMediaKeySystemAccess: request },
    Blob: class { constructor(parts) { output = parts.join(''); } },
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    setTimeout: fn => fn(), Date
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8'), context);
  return { elements, async probe() { await elements.probe.listeners.click(); }, report() { elements.record.listeners.submit({ preventDefault() {} }); return JSON.parse(output); } };
}
test('rejected capability requests recover without declaring protection', async () => {
  const h = harness(async () => { const e = new Error('unsupported'); e.name = 'NotSupportedError'; throw e; });
  await h.probe();
  assert.equal(h.elements.results.children.length, 4);
  assert.equal(h.elements.probe.disabled, false);
  assert.ok(h.report().capabilities.every(r => r.status === 'request-rejected'));
  assert.equal(h.report().protectionVerified, false);
});
test('missing EME API is reported as unavailable', async () => {
  const h = harness(undefined); await h.probe();
  assert.ok(h.report().capabilities.every(r => r.status === 'unavailable'));
});
test('accepted capabilities and manual black-frame observations do not certify protection', async () => {
  const h = harness(async () => ({ getConfiguration: () => ({ sessionTypes: ['temporary'] }) }));
  await h.probe(); h.elements.capture.value = 'black'; h.elements.recording.value = 'black';
  const r = h.report();
  assert.ok(r.capabilities.every(c => c.status === 'request-accepted'));
  assert.equal(r.protectionVerified, false);
  assert.equal(r.drmPlayback, 'not-connected');
});
test('local server serves only allowlisted assets and rejects writes', async t => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.close(); await once(server, 'close'); });
  const port = server.address().port;
  async function request(target, method = 'GET') {
    return new Promise((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port, path: target, method, agent: false }, res => {
        let body = ''; res.setEncoding('utf8'); res.on('data', c => body += c);
        res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
      }); req.on('error', reject); req.end();
    });
  }
  const home = await request('/'); assert.equal(home.status, 200); assert.match(home.body, /SUMI/);
  assert.equal(home.headers['cache-control'], 'no-store');
  assert.match(home.headers['content-security-policy'], /connect-src 'none'/);
  for (const target of ['/.env', '/package.json', '/../README.md', '/%2e%2e/README.md']) assert.equal((await request(target)).status, 404);
  assert.equal((await request('/', 'POST')).status, 405);
  assert.equal((await request('/', 'HEAD')).body, '');
});
