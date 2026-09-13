# SIM RW 012

Sistem administrasi digital untuk pengurus RT/RW. Aplikasi ini mengelola data warga, kas dan iuran, kegiatan, pengumuman, UMKM, layanan surat, arsip digital, serta inventori.

## Fitur Utama

- Dashboard ringkasan warga, saldo kas, kegiatan, dan pengingat ulang tahun.
- Toggle data `DEV` dan `LIVE (MongoDB)` dari header dashboard.
- Pendataan warga dengan NIK tepat 16 angka, tanggal lahir, alamat, RT, dan status tinggal.
- Kategori usia otomatis: Balita, Anak, Remaja, Dewasa, dan Lansia.
- Tabel warga dengan usia dan kategori usia yang diurutkan berdasarkan alamat.
- Kas RT dengan tiga pos: Kas RT, Sampah & Keamanan, dan Dana Sosial.
- CRUD agenda kegiatan, pengumuman, UMKM, layanan surat, dan arsip digital.
- Upload arsip PDF dan foto UMKM melalui klik atau drag-and-drop, maksimal 1 MB.
- Inventori barang beserta riwayat stok, peminjaman, dan koreksi.

## Teknologi

- Next.js App Router dan React
- TypeScript
- Tailwind CSS
- Mongoose dan MongoDB
- LocalStorage untuk mode DEV

## Persiapan

Prasyarat: Node.js 20 atau lebih baru, npm, dan MongoDB jika memakai mode LIVE.

```bash
npm install
```

Buat file `.env.local` jika memakai MongoDB:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/sim_rw_012
NEXT_PUBLIC_DATA_MODE=dev
```

`NEXT_PUBLIC_DATA_MODE` dapat diisi `dev` atau `live`. Pilihan mode dari toggle dashboard disimpan di browser.

## Menjalankan Aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Untuk production:

```bash
npm run build
npm start
```

## Mode Data

### DEV

Mode DEV tidak membutuhkan MongoDB. Data disimpan di LocalStorage browser menggunakan key versi `v2`. Dataset dummy sudah dikosongkan sehingga aplikasi dimulai tanpa data contoh.

### LIVE

Mode LIVE mengambil data dari MongoDB melalui route API di `app/api`. Pastikan `MONGO_URI` tersedia sebelum mengganti mode. Data LIVE bersifat persisten.

## Struktur Penting

```text
app/api/                    Route API MongoDB
app/dashboard/              Halaman administrasi
components/                 Komponen UI reusable
lib/store.ts                State, mode data, CRUD, dan LocalStorage
lib/mongoose.ts             Schema dan model MongoDB
lib/types.ts                Kontrak data TypeScript
lib/wargaUtils.ts           Perhitungan usia dan ulang tahun
```

Halaman administrasi utama berada di `/dashboard`. Menu Inventori tersedia di sidebar sebelum Pengaturan Sistem.

## Validasi Data

- NIK warga: wajib tepat 16 angka, tanpa huruf atau karakter lain.
- Arsip: hanya PDF, maksimal 1 MB.
- Foto UMKM: hanya JPG atau PNG, maksimal 1 MB.
- Tanggal menggunakan komponen `DatePickerField`.
- Data dapat diedit dan dihapus dari menu terkait.

## Verifikasi

```bash
npx tsc --noEmit
npm run lint
```

Lint dapat menampilkan warning atau error lama pada file yang belum dirapikan. Typecheck adalah pemeriksaan kontrak TypeScript utama.

## Catatan Produksi

Upload saat ini disimpan sebagai data URL. Untuk deployment produksi dengan file besar atau banyak pengguna, gunakan object storage seperti S3, Cloudinary, atau Vercel Blob dan simpan URL-nya di MongoDB.

Dokumen setup MongoDB tambahan tersedia di [MONGODB_SETUP.md](MONGODB_SETUP.md).
