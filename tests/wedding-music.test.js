import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/wedding-music.js';

const route = 'https://undangan.example/api/wedding-music';
test('streams Dropbox byte ranges with the actual audio MIME type', async (t) => {
  const bytes = new Uint8Array([1, 2, 3]);
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(new URL(url).hostname, 'www.dropbox.com');
    assert.equal(new URL(url).searchParams.get('raw'), '1');
    assert.equal(options.headers.get('range'), 'bytes=0-2');
    return new Response(bytes, {
      status: 206,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Range': 'bytes 0-2/100',
        'Content-Length': '3',
        'Accept-Ranges': 'bytes',
      },
    });
  });
  const resp = await handler.fetch(new Request(route, { headers: { Range: 'bytes=0-2' } }));
  assert.equal(resp.status, 206);
  assert.equal(resp.headers.get('content-type'), 'audio/mp4');
  assert.equal(resp.headers.get('content-range'), 'bytes 0-2/100');
  assert.equal(resp.headers.get('accept-ranges'), 'bytes');
  assert.deepEqual(new Uint8Array(await resp.arrayBuffer()), bytes);
});

test('a HEAD request returns metadata without audio content', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    assert.equal(init.method, 'HEAD');
    return new Response(null, { headers: { 'Content-Type': 'audio/mpeg', 'Content-Length': '100' } });
  });
  const resp = await handler.fetch(new Request(route, { method: 'HEAD' }));
  assert.equal(resp.status, 200);
  assert.equal(resp.body, null);
  assert.equal(resp.headers.get('content-length'), '100');
});

test('does not forward a preview page or accept POST', async (t) => {
  const called = t.mock.method(globalThis, 'fetch', async () => new Response('<html></html>', {
    headers: { 'Content-Type': 'text/html' },
  }));
  const badMethod = await handler.fetch(new Request(route, { method: 'POST' }));
  assert.equal(badMethod.status, 405);
  assert.equal(called.mock.callCount(), 0);
  assert.equal((await handler.fetch(new Request(route))).status, 502);
});


test('bounds open-ended audio requests so the first part can arrive sooner', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url, opts) => {
    assert.equal(opts.headers.get('range'), 'bytes=100-524387');
    return new Response(null, { status: 206, headers: { 'Content-Type': 'audio/mpeg' } });
  });
  assert.equal((await handler.fetch(new Request(route, { headers: { Range: 'bytes=100-' } }))).status, 206);
});
