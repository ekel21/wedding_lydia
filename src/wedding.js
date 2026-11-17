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
    date: '',
    start: '',
    end: '',
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
    gallery: [], // mis. ['/images/galeri-1.webp', '/images/galeri-2.webp']
    music: 'https://www.dropbox.com/scl/fi/u4feigden62r3a6voejla/JUMPA-RAS-ATE-NGENA-Iche-Br-Ginting-Cipt-Dr.-Minola-Sebayang-SH-MH.mp3?rlkey=hcnj9n25weoblkftncc97f735&raw=1',
    musicMimeType: 'audio/mp4', // File Dropbox berisi AAC dalam wadah MP4 meskipun namanya .mp3.
    song: { title: 'Jumpa Ras Ate Ngena', artist: 'Iche Br Ginting' },
  },
};

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
