import { wedding } from '../src/wedding.js';

// The audio stays in Dropbox. Correct the external file's MIME type
// and stream its bytes unchanged, including partial requests and seeks.
async function fetchMusic(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const { music, musicMimeType } = wedding.media;
  if (!music) return new Response(null, { status: 404 });

  const headers = new Headers({ 'Accept-Encoding': 'identity' });
  const range = request.headers.get('range');
  if (range && /^bytes=(?:\d+-\d*|-\d+)$/.test(range)) {
    const start = /^bytes=(\d+)-$/.exec(range)?.[1];
    const firstByte = Number(start);
    // Bound open-ended browser requests so Dropbox can deliver the first playable
    // part without waiting to send the whole track.
    if (request.method === 'GET' && start !== undefined && Number.isSafeInteger(firstByte + 524288)) {
      headers.set('Range', 'bytes=' + firstByte + '-' + (firstByte + 524287));
    } else {
      headers.set('Range', range);
    }
  }
  let upstream;
  try {
    upstream = await fetch(music, {
      method: request.method,
      headers,
      redirect: 'follow',
      signal: request.signal,
    });
  } catch {
    return new Response('Audio Dropbox tidak tersedia.', { status: 502 });
  }

  if (![200, 206, 416].includes(upstream.status)) {
    await upstream.body?.cancel();
    return new Response('Audio Dropbox tidak tersedia.', { status: 502 });
  }
  const type = upstream.headers.get('content-type') || '';
  if (upstream.status !== 416 && !/^(audio\/|video\/mp4|application\/octet-stream)/i.test(type)) {
    await upstream.body?.cancel();
    return new Response('Tautan Dropbox tidak mengembalikan file audio.', { status: 502 });
  }

  const responseHeaders = new Headers({
    'Content-Type': musicMimeType || 'audio/mpeg',
    'Content-Disposition': 'inline',
    'Cache-Control': 'private, max-age=300',
  });
  for (const name of ['content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag']) {
    const value = upstream.headers.get(name);
    if (value !== null) responseHeaders.set(name, value);
  }
  if (upstream.status === 416) {
    await upstream.body?.cancel();
    responseHeaders.delete('Content-Length');
  }
  return new Response(request.method === 'HEAD' || upstream.status === 416 ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export default { fetch: fetchMusic };
