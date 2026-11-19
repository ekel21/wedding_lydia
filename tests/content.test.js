import test from 'node:test';
import assert from 'node:assert/strict';
import { wedding, eventTime, formatEventDate, formatEventHours, guestFromSearch, countdownParts, mapLink, driveGalleryImage } from '../src/wedding.js';
import galleryApi, { parsePublicDriveFolder } from '../api/wedding-gallery.js';

test('15 Januari 2027 jatuh pada Jumat dan konfigurasi WIB dihitung tepat', () => {
  assert.equal(formatEventDate(wedding.ceremony.date), 'Jumat, 15 Januari 2027');
  assert.equal(eventTime(wedding.ceremony.date, wedding.ceremony.start).toISOString(), '2027-01-15T07:00:00.000Z');
  assert.equal(eventTime('2027-02-30', '14:00'), null);
});

test('jadwal resepsi tidak mengikuti pemberkatan ketika belum tersedia', () => {
  assert.equal(formatEventDate(wedding.reception.date), 'Jadwal menyusul');
  assert.equal(formatEventHours(wedding.reception), 'Tanggal dan waktu akan diumumkan.');
});

test('personalisasi tamu menerima spasi dan aksen, dengan panjang terbatas', () => {
  assert.equal(guestFromSearch('?to=+Ibu%20D%C3%A9a%20dan%20keluarga+'), 'Ibu Déa dan keluarga');
  assert.equal(guestFromSearch('?to=' + 'x'.repeat(150)).length, 80);
  assert.equal(guestFromSearch(''), '');
});

test('waktu hitung mundur terurai dan tidak masuk nilai negatif', () => {
  assert.deepEqual(countdownParts(90_061_000, 0), [1, 1, 1, 1]);
  assert.deepEqual(countdownParts(1_000, 3_000), [0, 0, 0, 0]);
});

test('tautan peta terpisah dan bisa diganti pin resmi', () => {
  assert.match(new URL(mapLink(wedding.ceremony)).searchParams.get('query'), /Gereja/);
  assert.match(new URL(mapLink(wedding.reception)).searchParams.get('query'), /Jambur/);
  assert.equal(mapLink({ mapsUrl: 'https://maps.app.goo.gl/pin' }), 'https://maps.app.goo.gl/pin');
});

test('setiap foto memakai ID file Drive dan tersedia cadangan WebP lokal', () => {
  assert.equal(new URL(wedding.media.galleryFolder).hostname, 'drive.google.com');
  const photos = wedding.media.gallery;
  assert.equal(photos.length, 3);
  assert.equal(new Set(photos.map((photo) => photo.driveId)).size, photos.length);
  for (const photo of photos) {
    const url = new URL(driveGalleryImage(photo.driveId));
    assert.equal(url.hostname, 'lh3.googleusercontent.com');
    assert.equal(url.pathname, `/d/${photo.driveId}=w1600`);
    assert.match(photo.src, /^\/images\/gallery\/[\w-]+\.webp$/);
  }
  assert.equal(driveGalleryImage(undefined), '');
  assert.equal(driveGalleryImage(wedding.media.galleryFolder), '');
});

const listing = (ids, type = 'image/png') => `<div class="flip-entries">${ids.map((id) => `
  <div class="flip-entry"><a href="https://drive.google.com/file/d/${id}/view?usp=drive_web">
  <img src="https://drive-thirdparty.googleusercontent.com/16/type/${type}" /></a></div>`).join('')}</div>`;

test('daftar Drive hanya menampilkan foto dan mengikuti isi terbaru, bukan ID cadangan', async (t) => {
  const newIds = ['new-photo-A123', 'new-photo-B123'];
  const html = listing([...newIds, ...newIds]) + listing(['file-pdf-12345'], 'application/pdf');
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url.hostname, 'drive.google.com');
    assert.equal(url.pathname, '/embeddedfolderview');
    assert.equal(url.searchParams.get('id'), new URL(wedding.media.galleryFolder).pathname.split('/').at(-1));
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  });
  const response = await galleryApi.fetch(new Request('https://example.test/api/wedding-gallery'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ids: newIds });
  assert.match(response.headers.get('cache-control'), /s-maxage=60/);
});

test('folder kosong, folder privat, dan batas jumlah gambar dibedakan', async (t) => {
  const all = Array.from({ length: 10 }, (_, index) => 'new-photo-' + index);
  assert.deepEqual(parsePublicDriveFolder(listing([])), []);
  assert.deepEqual(parsePublicDriveFolder(listing(all)), all.slice(0, 6));
  assert.equal(parsePublicDriveFolder('<html><body>Sign in</body></html>'), null);
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>Sign in</html>', { headers: { 'Content-Type': 'text/html' } }));
  const response = await galleryApi.fetch(new Request('https://example.test/api/wedding-gallery'));
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
