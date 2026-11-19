# Undangan Pemberkatan Moses & Lidya

Undangan berbahasa Indonesia dengan tema adat Karo dengan palet merah, hitam, dan gading. Satu kolom berlebar maksimal 460 piksel di semua layar, dengan navigasi bagian di atas seperti tampilan ponsel. Dibuat dengan Vite, JavaScript, dan Firebase Cloud Firestore. Hosting website tetap di Vercel.

- Sampul dengan ilustrasi bergaya cetak rumah adat Siwaluh Jabu di dataran tinggi dan ornamen terinspirasi tenun Karo. Saat undangan dibuka, sampul terangkat seperti lembar tenun.
- Animasi sapuan pada ilustrasi, lembar tenun yang terangkat, ornamen bab yang muncul, pita tenun yang terbentang saat digulir, serta kartu dan benang penghubung cerita. Undangan mengikuti pengaturan kurangi gerakan pada perangkat tamu.
- Profil mempelai, cerita cinta, jadwal dan peta masing-masing tempat acara.
- Nama tamu dari parameter `?to=`, hitung mundur WIB, dan amplop digital BRI.
- Satu formulir RSVP privat dengan kolom ucapan atau doa opsional.
- Foto sampul, potret, galeri, dan musik bersifat opsional. Tidak ada foto atau lagu contoh yang seolah-olah berasal dari pasangan.

## Perbarui repositori GitHub yang sudah terhubung ke Vercel

1. Ekstrak ZIP di komputer. Folder `api/`, `public/`, `src/` dan file `package.json` sudah berada di tingkat paling atas ZIP.
2. Buka **repositori undangan yang lama** di GitHub dan pilih branch Production yang dipakai proyek Vercel, biasanya `main`. Pilih **Add file → Upload files**, lalu unggah **isi ZIP yang sudah diekstrak**, bukan ZIP atau folder pembungkusnya. Jika memakai GitHub Desktop, salin isi ZIP ke folder repositori dan pilih **Replace**. Jangan hapus folder `.git` milik repositori.
3. Simpan perubahan dengan **Commit changes**. Jika memakai GitHub Desktop, lanjutkan dengan **Push origin**. Pastikan `package.json` masih berada di direktori yang sama seperti sebelumnya agar Vercel membangun proyek dari lokasi yang tepat.
4. Buka **Deployments** pada proyek Vercel yang sama. Setelah build Production berstatus **Ready**, buka lagi tautan undangan dan uji galeri serta tombol ×. Biarkan Environment Variables Firebase di proyek Vercel tetap seperti yang sudah dipakai.

File lokal seperti `node_modules/`, hasil build `dist/`, dan `.env.local` tidak perlu diunggah. Jangan mengunggah kunci admin Firebase. Cadangan gambar WebP sudah ikut di `public/images/gallery/`.

## 1. Lengkapi informasi undangan

Edit `src/wedding.js` sebelum membagikan tautan.

| Data | Isi saat ini |
| --- | --- |
| Jam pemberkatan | Pukul 14.00 WIB, penafsiran sementara dari “2 WIB”. Jam selesai tidak ditampilkan karena belum tersedia. |
| Tempat pemberkatan | Gereja GBKP Runggun Bahorok, Laudamak. Konfirmasi penulisan lokasi dan pin yang tepat. |
| Resepsi | Jambur Taras Bahorok. Tanggal dan jam tampil “Jadwal menyusul” sampai diisi. |
| Peta | Masing-masing mengarah ke pencarian nama tempat. Ganti `ceremony.mapsUrl` dan `reception.mapsUrl` dengan pin resmi. Teks peta yang diberikan untuk resepsi menyebut gereja, jadi tidak dipakai untuk resepsi. |
| Nama keluarga | “Bena Tuah Tarigan Sibero” memakai satu huruf n. Nama Bapak Muhtar Pinem diberi tanda (+). |
| Amplop digital | Sudah memakai data BRI yang diberikan. Tetapkan `gift: null` jika ingin menyembunyikan. |
| Foto | Galeri membaca isi folder Google Drive yang diberikan. Salinan WebP dari tiga PNG terbaru ikut sebagai cadangan. Galeri muat sampai 6 foto. |

Nama, narasi, dan metadata untuk kartu tautan ada di `index.html`. Jika tanggal pemberkatan berubah, ubah juga tanggal pada `og:description` dan teks cadangan di HTML. Tanggal resepsi tidak otomatis mengikuti tanggal pemberkatan.

Contoh tautan tamu: `https://domain-undangan.vercel.app/?to=Keluarga%20Pinem`. Buat tautan secara manual dengan mengganti spasi menjadi `%20`, atau buat parameter dengan `new URLSearchParams({to: 'Keluarga Pinem'}).toString()`.

### Galeri foto

Situs Vercel membaca `media.galleryFolder` pada `src/wedding.js` melalui `api/wedding-gallery.js` setiap kali undangan dibuka, dengan cache daftar singkat di Vercel. Tamu tidak perlu masuk akun Google. Pastikan folder dan foto bisa dilihat oleh **Siapa saja yang memiliki tautan**. Tambah atau hapus foto di folder yang sama, lalu buka ulang undangan. Bila perubahan belum terlihat, tunggu sekitar 1–2 menit dan coba lagi. Tidak perlu commit baru hanya untuk foto.

Galeri menampilkan sampai enam gambar yang punya format web, seperti PNG, JPG, dan WebP. Jika daftar folder tidak bisa dibaca atau undangan dibuka dari pratinjau HTML lokal, `media.gallery` menjadi daftar cadangan. Tiga cadangan WebP di `public/images/gallery/` diambil dari PNG terbaru di folder Drive, tanpa mengubah komposisinya. Untuk mengubah folder sumber, ubah `media.galleryFolder` dan perbarui daftar serta file cadangannya jika diperlukan. Galeri tidak menampilkan keterangan di bawah foto. Tamu dapat mengetuk foto untuk memperbesar, lalu menutupnya dengan tombol × atau mengetuk area gelap di luar foto.

### Ayat pembuka dan musik
- Ayat pembuka memakai Matius 19:6, Terjemahan Baru (TB). Ubah teks di bagian `scripture` pada `index.html` jika diperlukan.
- **Jumpa Ras Ate Ngena – Iche Br Ginting** hanya bersumber dari Dropbox. Saat **Buka Undangan** ditekan, lagu mulai diputar dan terus berjalan saat halaman digulir. Ikon not musik hanya untuk jeda/putar kembali, tanpa membuka YouTube.
- Pastikan file Dropbox tetap dapat diakses oleh **Siapa saja yang memiliki tautan**. Pratinjau HTML yang diunduh memerlukan internet dan mengambil lagu langsung dari Dropbox. Pada situs Vercel, fungsi `api/wedding-music.js` meneruskan audio dari Dropbox dengan jenis media yang benar dan mendukung permintaan sebagian file. Tidak ada salinan audio di proyek.
- Jika file Dropbox diganti, perbarui `media.music` pada `src/wedding.js` dengan tautan langsung `raw=1`. Sesuaikan `media.musicMimeType` dengan format audio yang sebenarnya, misalnya `audio/mpeg` untuk MP3 asli. Gunakan deploy Vercel dari folder sumber proyek, termasuk folder `api/`. Mengunggah hanya folder `dist/` tidak menyertakan fungsi ini.

## 2. Hubungkan Firebase

1. Di Firebase Console, buat atau buka project, lalu daftarkan **Web app** di **Project settings → Your apps**.
2. Di **Authentication → Sign-in method**, aktifkan **Anonymous**. Tamu tidak perlu membuat akun. Jika deployment perlu izin domain, masukkan domain Vercel yang dipakai dan `localhost` untuk tes lokal di **Authentication → Settings → Authorized domains**.
3. Buat **Cloud Firestore** (database default, mode Production). Gunakan project khusus undangan atau gabungkan aturan dengan aturan project lama sebelum menerbitkannya, karena penerbitan mengganti aturan aktif.
4. Jalankan dari folder project berikut untuk menerbitkan rules.

   ```sh
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --project ID_PROJECT_ANDA
   ```

   Dengan Firebase Console tanpa CLI, salin `firestore.rules` ke **Firestore Database → Rules** dan terbitkan.
5. Untuk uji lokal, salin `.env.example` menjadi `.env.local` lalu isi variabel berikut dari konfigurasi **Web app**.

   | Variabel | Key konfigurasi Firebase Web |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | `apiKey` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` |
   | `VITE_FIREBASE_APP_ID` | `appId` |

   Variabel `VITE_*` masuk ke kode browser, jadi isi hanya konfigurasi Web app. Jangan masukkan service account, private key, atau kredensial admin.

## 3. Uji di komputer dan deploy ke Vercel

Gunakan Node.js 24.

```sh
npm ci
npm run dev
npm test
npm run build
```

- Buka alamat yang muncul setelah `npm run dev`. Jika konfigurasi Firebase belum lengkap, tombol kirim tidak aktif dan tampilan tetap bisa dicek.
- Push isi folder ini ke repositori Git, lalu impor repositori itu ke Vercel. Pilih root directory yang berisi `package.json`. Project menggunakan preset **Vite**, build command **`npm run build`**, dan output **`dist`**. Pengaturan ini sudah ada di `vercel.json`.
- Di pengaturan project Vercel, isi empat Environment Variables Firebase di atas untuk **Production** dan **Preview** jika perlu. Deploy ulang setelah menambah atau mengganti variabel. Jangan aktifkan variabel emulator di Vercel.
- Pada URL deploy, coba kirim RSVP hadir dengan ucapan, lalu coba RSVP tidak hadir tanpa ucapan. Periksa keduanya di Firestore. Jika diuji dari browser yang sama, pengiriman kedua memperbarui entri pertama.

Untuk menguji aturan Firestore tanpa menyambungkan project produksi, jalankan perintah di bawah (memerlukan Java 21 atau versi yang diminta Firebase Emulator Suite).

```sh
npx firebase-tools emulators:exec --project demo-moses-lidya --only auth,firestore "node --test tests/firebase.test.js"
```

## 4. Kelola tamu di Firebase Console

- Buka **Firestore Database → Data → rsvp** untuk melihat nama, status, jumlah orang, dan ucapan atau doa (field `message`). Jika pesan dibiarkan kosong, field ini berisi teks kosong. Data tidak ditampilkan di website.
- Tamu yang mengirim ulang dari identitas browser yang sama memperbarui entri sebelumnya, bukan membuat entri tambahan. Browser atau perangkat lain dapat membuat entri baru.
- Jika sudah memakai versi sebelumnya, publikasikan Rules baru agar koleksi buku tamu lama tidak bisa dibaca lewat website. Data sebelumnya tidak dihapus dari Firebase.
- File aman digunakan sebagai sumber proyek pribadi. Jika tidak ingin nomor rekening terlihat di repositori, gunakan repositori Git privat. Nomor tetap dapat dilihat siapa pun yang mendapat tautan undangan saat fitur amplop digital aktif.

## Referensi

- [Ragam Hias Ornamen Rumah Adat Batak Karo](https://repositori.kemendikdasmen.go.id/29757/)
- [Mengenal Permukiman Masyarakat Batak Karo](https://repositori.kemendikdasmen.go.id/28806/)

- [Vite di Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Anonymous Authentication Firebase Web](https://firebase.google.com/docs/auth/web/anonymous-auth)
- [Firebase CLI dan deployment Firestore](https://firebase.google.com/docs/cli)
