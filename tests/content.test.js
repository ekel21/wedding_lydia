import test from 'node:test';
import assert from 'node:assert/strict';
import { wedding, eventTime, formatEventDate, formatEventHours, guestFromSearch, countdownParts, mapLink } from '../src/wedding.js';

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
