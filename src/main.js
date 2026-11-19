import '@fontsource-variable/dm-sans/wght.css';
import '@fontsource-variable/fraunces/wght.css';
import '@fontsource-variable/fraunces/wght-italic.css';
import './style.css';
import { wedding, eventTime, formatEventDate, formatEventHours, guestFromSearch, countdownParts, mapLink, driveGalleryImage, galleryPhotoLimit } from './wedding.js';

const byId = (id) => document.getElementById(id);
const show = (id, yes = true) => { byId(id).hidden = !yes; };
const write = (id, value) => { byId(id).textContent = value; };

const guestName = guestFromSearch(window.location.search);
if (guestName) {
  write('guest-name', guestName);
  show('cover-guest');
  if (guestName.length >= 2) byId('attendance-name').value = guestName;
}

const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
root.classList.toggle('motion-enabled', !reducedMotion.matches);
reducedMotion.addEventListener?.('change', (event) => {
  root.classList.toggle('motion-enabled', !event.matches);
});

function activateScrollMotion(isOpening, scope = document) {
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
  const startAt = isOpening ? 110 : innerHeight - 30;
  const pending = [...scope.querySelectorAll('[data-reveal]')]
    .filter((element) => !element.closest('[hidden]') && element.getBoundingClientRect().top > startAt);

  function appear(element) {
    element.classList.remove('motion-armed');
    element.classList.add('motion-in');
    observer.unobserve(element);
    element.removeEventListener('focusin', onFocus);
  }

  function onFocus(event) { appear(event.currentTarget); }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) appear(entry.target);
  }, { threshold: 0.08, rootMargin: '0px 0px -34px' });

  for (const element of pending) {
    element.classList.add('motion-armed');
    observer.observe(element);
    element.addEventListener('focusin', onFocus);
  }
}

const cover = byId('cover');
const reading = byId('invitation-reading');
const closing = document.querySelector('.closing');
let musicOnOpen;

function revealInvitation({ animate, target, focus }) {
  if (cover.hidden || cover.classList.contains('is-opening')) return;
  if (animate) cover.classList.add('is-opening');
  else cover.hidden = true;
  root.classList.remove('invitation-locked');
  root.classList.add('invitation-active');
  reading.inert = false;
  closing.inert = false;

  const destination = target && !target.hidden ? target : byId('awal');
  destination.scrollIntoView({ behavior: 'instant' });
  if (focus) byId('welcome-title').focus({ preventScroll: true });
  activateScrollMotion(animate);

  if (animate) {
    cover.inert = true;
    const cloth = cover.querySelector('.cover-cloth');
    let deadline;
    function done() {
      clearTimeout(deadline);
      cloth.removeEventListener('transitionend', onFinish);
      cover.hidden = true;
      cover.classList.remove('is-opening');
    }
    function onFinish(event) {
      if (event.target === cloth && event.propertyName === 'transform') done();
    }
    cloth.addEventListener('transitionend', onFinish);
    deadline = setTimeout(done, 1190);
  }
}

function configureCover() {
  const deepLink = ['awal', 'countdown', 'mempelai', 'acara', 'cerita', 'galeri', 'hadiah', 'rsvp']
    .find((id) => location.hash === '#' + id);
  if (deepLink) {
    revealInvitation({ animate: false, target: byId(deepLink), focus: false });
    requestAnimationFrame(() => {
      const target = byId(deepLink);
      (target.hidden ? byId('awal') : target).scrollIntoView({ behavior: 'instant' });
    });
    return;
  }

  root.classList.add('invitation-locked');
  reading.inert = true;
  closing.inert = true;
  function open(event) {
    event.preventDefault();
    if (!root.classList.contains('invitation-locked')) return;
    musicOnOpen?.();
    revealInvitation({ animate: !reducedMotion.matches, focus: true });
  }
  byId('open-invitation').addEventListener('click', open);
  document.querySelector('.skip-link').addEventListener('click', (event) => {
    if (root.classList.contains('invitation-locked')) open(event);
  });
}

for (const [key, event] of Object.entries({ ceremony: wedding.ceremony, reception: wedding.reception })) {
  write(key + '-date', formatEventDate(event.date));
  write(key + '-time', formatEventHours(event));
  write(key + '-venue', event.venue);
  write(key + '-area', event.area);
  const link = byId(key + '-map');
  link.href = mapLink(event);
  if (event.mapsUrl) link.querySelector('[data-map-label]').textContent = 'Buka Google Maps';
}
const shortDate = wedding.ceremony.date && eventTime(wedding.ceremony.date)
  ? wedding.ceremony.date.split('-').reverse().join(' . ') : 'Jadwal menyusul';
write('cover-date', shortDate);
write('nav-date', shortDate);
write('cover-date-long', formatEventDate(wedding.ceremony.date).replace(/^[^,]+, /, ''));

const chapterLinks = [...document.querySelectorAll('.nav-chapters a')];
const chapters = chapterLinks.map((link) => byId(link.hash.slice(1)));
const navThread = document.querySelector('.nav-thread');
let queuedChapter = false;
function syncChapter() {
  if (queuedChapter) return;
  queuedChapter = true;
  requestAnimationFrame(() => {
    queuedChapter = false;
    const scrollLimit = document.documentElement.scrollHeight - innerHeight;
    const progress = scrollLimit > 0 ? Math.min(1, Math.max(0, scrollY / scrollLimit)) : 0;
    navThread.style.setProperty('--scroll-thread', progress.toFixed(4));
    const marker = Math.min(innerHeight * .26, 200);
    const current = chapters.findIndex((chapter) => {
      const rect = chapter.getBoundingClientRect();
      return rect.top <= marker && rect.bottom > marker;
    });
    chapterLinks.forEach((link, index) => {
      if (current === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}
window.addEventListener('scroll', syncChapter, { passive: true });
window.addEventListener('resize', syncChapter);
syncChapter();

const countdown = wedding[wedding.countdown];
const target = countdown?.start ? eventTime(countdown.date, countdown.start) : null;
if (target) {
  show('countdown');
  const eventName = wedding.countdown === 'ceremony' ? 'Pemberkatan' : 'Resepsi';
  write('countdown-title', 'Menuju ' + eventName);
  write('countdown-date', formatEventDate(countdown.date).replace(/^[^,]+, /, ''));
  byId('count-grid').setAttribute('aria-label', 'Hitung mundur menuju ' + eventName.toLowerCase());
  write('countdown-message', 'Waktu ' + eventName.toLowerCase() + ' telah tiba.');
  let timer = null;
  function renderCountdown() {
    const now = Date.now();
    if (now >= target.getTime()) {
      show('count-grid', false);
      show('countdown-message');
      if (timer !== null) clearInterval(timer);
      return;
    }
    const parts = countdownParts(target.getTime(), now);
    const ticker = byId('count-grid').getBoundingClientRect();
    const animateTick = !reducedMotion.matches && root.classList.contains('invitation-active')
      && ticker.bottom > 0 && ticker.top < innerHeight;
    ['days', 'hours', 'minutes', 'seconds'].forEach((id, i) => {
      const digit = byId(id);
      const value = String(parts[i]).padStart(2, '0');
      if (value === digit.textContent) return;
      digit.textContent = value;
      if (animateTick) digit.animate?.([
        { opacity: .48, transform: 'translateY(2px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 235, easing: 'ease-out' });
    });
  }
  renderCountdown();
  if (Date.now() < target.getTime()) timer = setInterval(renderCountdown, 1000);
}

if (wedding.gift?.number) {
  show('hadiah');
  write('bank-name', wedding.gift.bank);
  write('bank-number', wedding.gift.number);
  write('bank-holder', 'a.n. ' + wedding.gift.holder);
  byId('copy-bank').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(wedding.gift.number);
      write('copy-feedback', 'Nomor rekening berhasil disalin.');
    } catch {
      const range = document.createRange();
      range.selectNodeContents(byId('bank-number'));
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      write('copy-feedback', 'Silakan salin nomor rekening yang ditandai.');
    }
  });
}

const { media } = wedding;
if (media.cover) {
  const photo = new Image();
  photo.onload = () => {
    cover.style.setProperty('--cover-photo', 'url(' + JSON.stringify(photo.src) + ')');
    cover.classList.add('has-photo');
  };
  photo.src = media.cover;
}
for (const key of ['groom', 'bride']) {
  if (!media[key]) continue;
  const portrait = document.querySelector('[data-portrait="' + key + '"]');
  const image = new Image();
  image.alt = '';
  image.loading = 'lazy';
  image.addEventListener('error', () => image.remove(), { once: true });
  image.src = media[key];
  portrait.append(image);
}
const gallerySnapshot = (Array.isArray(media.gallery) ? media.gallery : [])
  .map((entry) => typeof entry === 'string' ? { src: entry } : entry)
  .filter((entry) => typeof entry?.src === 'string' && entry.src.trim());

async function loadGallery() {
  const describe = (entry, index) => ({ ...entry, alt: entry.alt || 'Foto Moses dan Lidya ' + (index + 1) });
  const snapshot = gallerySnapshot.slice(0, galleryPhotoLimit).map(describe);
  if (!media.galleryFolder || location.protocol === 'file:') return snapshot;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 11500);
  try {
    const response = await fetch('/api/wedding-gallery', { signal: controller.signal });
    if (!response.ok) return snapshot;
    const { ids } = await response.json();
    if (!Array.isArray(ids)) return snapshot;
    const known = new Map(snapshot.map((photo) => [photo.driveId, photo]));
    return [...new Set(ids.filter((id) => driveGalleryImage(id)))].slice(0, galleryPhotoLimit)
      .map((driveId) => known.get(driveId) || { driveId }).map(describe);
  } catch {
    return snapshot;
  } finally {
    clearTimeout(timeout);
  }
}

function setGalleryImage(image, photo, thumbnail = false) {
  const remote = driveGalleryImage(photo.driveId, thumbnail);
  const fallback = photo.src || (!thumbnail && driveGalleryImage(photo.driveId, true));
  image.referrerPolicy = 'no-referrer';
  image.onerror = remote && fallback ? () => {
    if (image.getAttribute('src') !== remote) return;
    image.onerror = null;
    image.src = fallback;
  } : null;
  image.src = remote || fallback;
}

function setupGallery(photos) {
  if (!photos.length) return;
  const viewer = byId('gallery-viewer');
  const closeButton = byId('gallery-close');
  const backdrop = byId('gallery-backdrop');
  const shell = document.querySelector('.invitation-shell');
  const fullPhoto = byId('gallery-viewer-image');
  const prev = byId('gallery-prev');
  const next = byId('gallery-next');
  let current = 0;
  let trigger;
  let usingFallback = false;
  let wasOpen = false;

  function openViewer() {
    if (wasOpen) return;
    usingFallback = false;
    try {
      if (typeof viewer.showModal !== 'function' || typeof viewer.close !== 'function') throw new TypeError();
      viewer.showModal();
    } catch {
      usingFallback = true;
      viewer.classList.add('is-fallback');
      viewer.setAttribute('open', '');
      backdrop.hidden = false;
      shell.setAttribute('inert', '');
      shell.setAttribute('aria-hidden', 'true');
    }
    wasOpen = true;
    root.classList.add('gallery-overlay-open');
    closeButton.focus({ preventScroll: true });
  }

  function resetViewer() {
    if (!wasOpen || viewer.hasAttribute('open')) return;
    wasOpen = false;
    if (usingFallback) {
      backdrop.hidden = true;
      viewer.classList.remove('is-fallback');
      shell.removeAttribute('inert');
      shell.removeAttribute('aria-hidden');
    }
    root.classList.remove('gallery-overlay-open');
    trigger?.focus({ preventScroll: true });
  }

  function closeViewer() {
    if (!wasOpen) return;
    if (usingFallback) viewer.removeAttribute('open');
    else viewer.close();
    resetViewer();
  }

  closeButton.addEventListener('click', closeViewer);
  backdrop.addEventListener('click', closeViewer);
  viewer.addEventListener('close', resetViewer);
  viewer.addEventListener('click', (event) => {
    if (event.target !== viewer) return;
    const rect = viewer.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right
        || event.clientY < rect.top || event.clientY > rect.bottom) closeViewer();
  });

  function selectPhoto(index) {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    fullPhoto.alt = photo.alt;
    setGalleryImage(fullPhoto, photo);
    write('gallery-count', (current + 1) + ' dari ' + photos.length + ' foto');
  }

  photos.forEach((photo, index) => {
    const tile = document.createElement('article');
    tile.className = 'gallery-tile';
    tile.setAttribute('data-reveal', 'zoom');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gallery-open';
    button.setAttribute('aria-label', 'Lihat foto. ' + photo.alt);
    button.setAttribute('aria-haspopup', 'dialog');
    const frame = document.createElement('span');
    frame.className = 'gallery-media';
    const image = new Image();
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    setGalleryImage(image, photo, true);
    const detail = document.createElement('span');
    detail.className = 'gallery-enlarge';
    detail.textContent = '+';
    detail.setAttribute('aria-hidden', 'true');
    frame.append(image);
    button.append(frame, detail);
    button.addEventListener('click', () => {
      trigger = button;
      selectPhoto(index);
      openViewer();
    });
    tile.append(button);
    byId('gallery-grid').append(tile);
  });

  prev.disabled = next.disabled = photos.length < 2;
  prev.addEventListener('click', () => selectPhoto(current - 1));
  next.addEventListener('click', () => selectPhoto(current + 1));
  viewer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeViewer();
      return;
    }
    if (usingFallback && event.key === 'Tab') {
      const controls = [...viewer.querySelectorAll('button:not([disabled])')];
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    if (photos.length < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    selectPhoto(current + (event.key === 'ArrowRight' ? 1 : -1));
  });
  show('galeri');
}

if (media.galleryFolder || gallerySnapshot.length) {
  show('galeri');
  void loadGallery().then((photos) => {
    if (!photos.length) {
      show('galeri', false);
      return;
    }
    setupGallery(photos);
    if (root.classList.contains('invitation-active')) activateScrollMotion(false, byId('gallery-grid'));
  });
}
const musicButton = byId('music-toggle');
const songName = media.song?.title || 'Lagu Undangan';

if (media.music) {
  const music = byId('wedding-audio');
  const feedbackId = 'music-feedback';
  // Vercel streams the Dropbox file from the same origin with its actual MIME type.
  // The standalone HTML has no server and uses Dropbox directly.
  const standalone = location.protocol === 'file:';
  music.src = standalone ? media.music : '/api/wedding-music';
  show('music-toggle');

  function syncMusicButton() {
    musicButton.setAttribute('aria-pressed', String(!music.paused));
    musicButton.setAttribute('aria-label', (music.paused ? 'Putar ' : 'Jeda ') + songName);
  }

  function playMusic() {
    write(feedbackId, '');
    if (music.error) music.load();
    const attempt = music.play();
    attempt?.catch((error) => {
      if (error.name === 'AbortError') return;
      syncMusicButton();
      write(feedbackId, error.name === 'NotAllowedError'
        ? 'Tekan ikon musik untuk memutar lagu.'
        : (standalone
          ? 'Periksa koneksi internet. Jika audio tidak dapat diputar di pratinjau, coba versi Vercel.'
          : 'Musik Dropbox belum dapat diputar. Periksa koneksi lalu tekan ikon musik lagi.'));
    });
  }

  for (const name of ['play', 'pause', 'ended', 'error']) {
    music.addEventListener(name, syncMusicButton);
  }
  music.addEventListener('playing', () => write(feedbackId, ''));
  syncMusicButton();
  musicOnOpen = playMusic;
  musicButton.addEventListener('click', () => {
    if (music.paused) playMusic();
    else music.pause();
  });
}

const status = byId('attendance-status');
const guestCount = byId('attendance-count');
function syncGuestCount() {
  const attending = status.value === 'hadir';
  show('party-control', attending);
  guestCount.disabled = !attending;
}
status.addEventListener('change', syncGuestCount);
syncGuestCount();

async function setupAttendance() {
  const emulator = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
  const firebaseEnv = Object.fromEntries(Object.entries({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }).map(([key, value]) => [key, value?.trim() ?? '']));
  const config = emulator ? {
    apiKey: 'demo-only-key',
    authDomain: 'demo-moses-lidya.firebaseapp.com',
    projectId: 'demo-moses-lidya',
    appId: '1:123456:web:demo',
  } : firebaseEnv;
  if (Object.values(config).some((value) => !value)) {
    show('preview-note');
    return;
  }

  try {
    const { connectWedding } = await import('./firebase.js');
    const connection = connectWedding(config, emulator);
    const attendForm = byId('attendance-form');

    bindForm(attendForm, 'attendance-feedback', (data) => {
      const name = readName(data);
      const attendance = data.get('status');
      const count = attendance === 'hadir' ? Number(data.get('guestCount')) : 0;
      if (!['hadir', 'tidak-hadir'].includes(attendance)) throw localError('Pilih status kehadiran Anda.');
      if (!Number.isInteger(count) || count < 0 || count > 5 || (attendance === 'hadir' && count < 1)) {
        throw localError('Pilih jumlah tamu antara 1 dan 5 orang.');
      }
      const message = String(data.get('message') ?? '').trim();
      if (message.length > 500) throw localError('Ucapan atau doa maksimal 500 karakter.');
      return connection.saveAttendance({ name, status: attendance, guestCount: count, message });
    }, 'Terima kasih. Konfirmasi Anda sudah tersimpan.');
  } catch {
    write('preview-note', 'Formulir sementara tidak dapat terhubung. Silakan coba lagi nanti.');
    show('preview-note');
  }
}

function localError(message) {
  return Object.assign(new Error(message), { validation: true });
}

function readName(data) {
  const name = String(data.get('name') ?? '').trim();
  if (name.length < 2 || name.length > 80) throw localError('Tulis nama antara 2 dan 80 karakter.');
  return name;
}

function bindForm(form, feedbackId, save, success) {
  const button = form.querySelector('button[type=submit]');
  const feedback = byId(feedbackId);
  button.disabled = false;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.disabled) return;
    button.disabled = true;
    feedback.dataset.state = 'sending';
    feedback.textContent = 'Sedang mengirim…';
    try {
      await save(new FormData(form));
      feedback.dataset.state = 'success';
      feedback.textContent = success;
    } catch (error) {
      feedback.dataset.state = 'error';
      feedback.textContent = error.validation ? error.message : 'Belum dapat mengirim. Periksa koneksi Anda dan coba lagi.';
    } finally {
      button.disabled = false;
    }
  });
}

configureCover();
setupAttendance();
