import { driveGalleryImage, galleryPhotoLimit, wedding } from '../src/wedding.js';

// Use Google's public folder view. It lists the current children without an API key.
export function parsePublicDriveFolder(html) {
  if (!/<div\s+[^>]*class=["']flip-entries["']/i.test(html)) return null;
  const entries = html.split(/<div\b[^>]*\bclass=["']flip-entry["'][^>]*>/i).slice(1);
  const photoIds = new Set();
  for (const entry of entries) {
    const id = /href=["']https:\/\/drive\.google\.com\/file\/d\/([\w-]+)\/view(?:[?"'])/i.exec(entry)?.[1];
    const rasterImage = /https:\/\/drive-thirdparty\.googleusercontent\.com\/[^/"']+\/type\/image\/(?:png|jpe?g|webp|gif|avif|bmp)(?=["'?])/i.test(entry);
    if (rasterImage && driveGalleryImage(id)) photoIds.add(id);
    if (photoIds.size === galleryPhotoLimit) break;
  }
  return [...photoIds];
}

async function fetchGallery(request) {
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
  const unavailable = () => Response.json({ error: 'Folder Google Drive belum bisa dimuat.' }, {
    status: 502, headers: { 'Cache-Control': 'no-store' },
  });
  try {
    const folder = new URL(wedding.media.galleryFolder);
    const folderId = folder.pathname.match(/\/folders\/([\w-]+)\/?$/)?.[1];
    if (folder.hostname !== 'drive.google.com' || !folderId) return unavailable();
    const embed = new URL('https://drive.google.com/embeddedfolderview');
    embed.searchParams.set('id', folderId);
    const response = await fetch(embed, {
      headers: { Accept: 'text/html' },
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(9000)]),
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) return unavailable();
    const ids = parsePublicDriveFolder(await response.text());
    if (!ids) return unavailable();
    return Response.json({ ids }, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=60' },
    });
  } catch {
    return unavailable();
  }
}

export default { fetch: fetchGallery };
