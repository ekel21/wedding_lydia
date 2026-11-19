// Edit data ini sebelum membagikan undangan. Format tanggal: YYYY-MM-DD.
// Jam memakai zona waktu WIB. Isi mapsUrl dengan tautan pin resmi bila tersedia.
// Untuk menambah aset, simpan file di public/images atau public/audio.
export const wedding = {
  ceremony: {
    date: '2027-01-15',
    start: '14:00', // Penafsiran sementara "2 WIB". Konfirmasi dahulu.
    end: '',
    venue: 'Gereja GBKP Runggun Bahorok',
    area: 'Laudamak, Bahorok',
    mapsQuery: 'Gereja GBKP Runggun Bahorok Laudamak',
    mapsUrl: '',
  },
  reception: {
    date: '2027-01-16',
    start: '07:00',
    end: '18:00',
    venue: 'Jambur Taras Bahorok',
    area: 'Bahorok, Sumatera Utara',
    mapsQuery: 'Jambur Taras Bahorok Sumatera Utara',
    mapsUrl: '',
  },
  countdown: 'ceremony', // 'ceremony', 'reception', atau false
  gift: { bank: 'BRI', number: '526401021411536', holder: 'Moses Pinem' }, // null untuk menyembunyikan
  media: {
    cover: '', // mis. '/images/cover.webp'
    groom: '',
    bride: '',
    galleryFolder: 'https://drive.google.com/drive/folders/1KtfxgSVmTMZNDvwv32-k5pZ3F8ubsOEm',
    gallery: [
      { driveId: '1ASGtqEabbTDWZZCuuo9rS-fotKOBTeb1', src: '/images/gallery/drive-1ASGtqEabbTDWZZCuuo9rS-fotKOBTeb1.webp', alt: 'Foto Moses dan Lidya di Danau Toba' },
      { driveId: '1YsNZtRy5SvKa4B_qMY-mdB9wgZRWJxav', src: '/images/gallery/drive-1YsNZtRy5SvKa4B_qMY-mdB9wgZRWJxav.webp', alt: 'Potret Moses dan Lidya berlatar perbukitan' },
      { driveId: '1oiXZjM80iSGHvgAG9swuPxae-Bl-cFbV', src: '/images/gallery/drive-1oiXZjM80iSGHvgAG9swuPxae-Bl-cFbV.webp', alt: 'Dua potret Moses dan Lidya dalam satu bingkai' },
    ],
    music: 'https://www.dropbox.com/scl/fi/u4feigden62r3a6voejla/JUMPA-RAS-ATE-NGENA-Iche-Br-Ginting-Cipt-Dr.-Minola-Sebayang-SH-MH.mp3?rlkey=hcnj9n25weoblkftncc97f735&raw=1',
    musicMimeType: 'audio/mp4', // File Dropbox berisi AAC dalam wadah MP4 meskipun namanya .mp3.
    song: { title: 'Jumpa Ras Ate Ngena', artist: 'Iche Br Ginting' },
  },
};

export const galleryPhotoLimit = 6;

export function driveGalleryImage(id, thumbnail = false) {
  if (typeof id !== 'string' || !/^[\w-]{10,128}$/.test(id)) return '';
  return 'https://lh3.googleusercontent.com/d/' + id + (thumbnail ? '=w720' : '=w1600');
}

const dateFormat = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

export function eventTime(date, time = '12:00') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time ?? '')) return null;
  const nominalDate = new Date(date + 'T12:00:00Z');
  if (!Number.isFinite(nominalDate.getTime()) || nominalDate.toISOString().slice(0, 10) !== date) return null;
  const value = new Date(date + 'T' + time + ':00+07:00');
  return Number.isFinite(value.getTime()) ? value : null;
}

export function formatEventDate(date) {
  const value = eventTime(date);
  return value ? dateFormat.format(value) : 'Jadwal menyusul';
}

export function formatEventHours(event) {
  if (!eventTime(event.date)) return 'Tanggal dan waktu akan diumumkan.';
  if (!eventTime(event.date, event.start)) return 'Waktu akan diumumkan.';
  const start = event.start.replace(':', '.');
  const end = eventTime(event.date, event.end) ? '–' + event.end.replace(':', '.') : '';
  return 'Pukul ' + start + end + ' WIB';
}

export function guestFromSearch(search) {
  const name = new URLSearchParams(search).get('to') ?? '';
  return name.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

export function countdownParts(target, now) {
  const total = Math.max(0, Math.ceil((target - now) / 1000));
  return [Math.floor(total / 86400), Math.floor(total / 3600) % 24, Math.floor(total / 60) % 60, total % 60];
}

export function mapLink(event) {
  if (event.mapsUrl) return event.mapsUrl;
  return 'https://www.google.com/maps/search/?' + new URLSearchParams({ api: '1', query: event.mapsQuery });
}
