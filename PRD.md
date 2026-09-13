# PRD Reverse Engineering - SIM RW 012

## 1. Ringkasan Produk

SIM RW 012 adalah aplikasi administrasi lingkungan untuk membantu pengurus RT/RW mencatat data warga, mengelola transaksi kas, menerbitkan informasi, menjalankan layanan surat, mengelola arsip, mempromosikan UMKM, dan memantau inventori.

Produk saat ini berbentuk dashboard web dengan halaman publik dan area administrasi. Implementasi yang tersedia menjadi sumber utama kebutuhan dalam dokumen ini.

## 2. Tujuan Produk

- Mengurangi pencatatan administrasi yang tersebar di buku, spreadsheet, dan chat.
- Menyediakan satu sumber data untuk warga, transaksi, kegiatan, dan dokumen.
- Membuat proses input, edit, hapus, dan pemantauan data dapat dilakukan oleh pengurus.
- Menyediakan ringkasan yang mudah dipindai untuk keputusan operasional harian.
- Menyediakan mode DEV untuk pengujian lokal dan mode LIVE untuk MongoDB.

## 3. Pengguna dan Peran

### Pengurus RT/RW

Menginput dan memperbarui data warga, kas, kegiatan, pengumuman, UMKM, surat, arsip, dan inventori.

### Warga atau pengunjung publik

Melihat informasi umum, pengumuman, kegiatan, serta direktori UMKM yang dipublikasikan.

### Batasan peran saat ini

Aplikasi belum memiliki autentikasi, otorisasi berbasis peran, audit log, atau pembatasan akses API. Semua endpoint harus dianggap internal sampai lapisan keamanan ditambahkan.

## 4. Ruang Lingkup Fungsional

### 4.1 Dashboard

Dashboard menampilkan saldo kas, jumlah warga, jumlah kegiatan, mutasi kas terbaru, agenda terdekat, dan pengingat ulang tahun dari hari ini sampai H-7. Data dapat difilter berdasarkan RT melalui navigasi dashboard.

### 4.2 Pendataan Warga

Pengurus dapat menambahkan, mengedit, dan menghapus warga. Data minimal meliputi NIK, nama lengkap, tanggal lahir, alamat, RT, RW, dan status tinggal.

Aturan bisnis:

- NIK wajib tepat 16 angka dan tidak boleh mengandung huruf atau simbol.
- Tanggal lahir dipakai untuk menghitung usia dan kategori usia.
- Kategori usia terpusat pada helper: Balita 0-5, Anak 6-12, Remaja 13-17, Dewasa 18-59, Lansia 60+.
- Daftar warga di halaman Statistik diurutkan berdasarkan alamat.

### 4.3 Kas dan Iuran

Pengurus dapat mencatat pemasukan dan pengeluaran berdasarkan tiga pos: Kas RT, Sampah & Keamanan, dan Dana Sosial. Form mendukung metode Cash, Transfer, Titipan, dan Split, termasuk rincian perantara dan keringanan.

Sistem menampilkan saldo per pos, total masuk, total keluar, riwayat transaksi, edit, dan hapus.

### 4.4 Agenda Kegiatan

Pengurus dapat membuat, mengedit, dan menghapus agenda. Data meliputi judul, kategori, tanggal, waktu, lokasi, deskripsi, RT, dan status kegiatan.

### 4.5 Pengumuman

Pengurus dapat menerbitkan, mengedit, dan menghapus pengumuman. Data meliputi judul, isi, kategori, tanggal, status, dan RT.

### 4.6 Direktori UMKM

Pengurus dapat mendaftarkan dan mengedit profil usaha warga, termasuk nama usaha, pemilik, kategori, WhatsApp, deskripsi, RT, dan foto. Foto menerima JPG/PNG maksimal 1 MB melalui klik atau drag-and-drop.

### 4.7 Layanan Surat

Pengurus dapat mencatat pengajuan surat, mengubah data pengajuan, mengubah status, dan menghapus pengajuan. Nomor surat serta tanggal pengajuan dibuat oleh sistem ketika pengajuan baru disimpan.

### 4.8 Arsip Digital

Pengurus dapat menambah, mengedit, menghapus, dan mengunduh arsip PDF. Upload menerima PDF maksimal 1 MB melalui klik atau drag-and-drop.

### 4.9 Inventori

Pengurus dapat mencatat barang, stok masuk, pemakaian, kerusakan, kehilangan, peminjaman, pengembalian, riwayat, dan koreksi riwayat.

## 5. Arsitektur yang Terlihat

- `app/`: route halaman Next.js dan route API.
- `components/`: komponen navigasi, date picker, footer, dan notifikasi.
- `lib/store.ts`: state client, pemilihan mode data, operasi CRUD, dan LocalStorage DEV.
- `lib/mongoose.ts`: schema dan model MongoDB.
- `lib/wargaUtils.ts`: perhitungan usia, kategori usia, dan ulang tahun.
- DEV menyimpan daftar modul pada LocalStorage dengan key versi `v2`.
- LIVE mengambil data melalui endpoint API dan MongoDB.

## 6. Alur Utama

### Input data

1. Pengguna membuka menu dashboard.
2. Pengguna mengisi form.
3. Browser menjalankan validasi dasar.
4. Store menyimpan ke LocalStorage pada DEV atau API pada LIVE.
5. Daftar dan ringkasan diperbarui tanpa reload penuh.

### Edit dan hapus

1. Pengguna memilih ikon edit atau hapus pada daftar.
2. Edit mengisi form yang sama dengan data terpilih.
3. Hapus meminta konfirmasi.
4. Store memperbarui state dan sumber penyimpanan.

### Toggle mode

1. Mode awal membaca `NEXT_PUBLIC_DATA_MODE`.
2. Pilihan mode browser disimpan pada `sim_rw_data_mode`.
3. Perubahan mode memuat ulang sumber data yang sesuai.

## 7. Kebutuhan Nonfungsional

- TypeScript harus lolos `npx tsc --noEmit`.
- UI harus responsif pada desktop dan mobile.
- Data input harus tervalidasi di browser dan, untuk data penting, di API/schema.
- API LIVE memerlukan `MONGO_URI`.
- Upload data URL cocok untuk prototipe kecil, bukan strategi storage produksi jangka panjang.
- Operasi API sebaiknya mendapatkan autentikasi, otorisasi, rate limiting, dan audit log sebelum deployment publik.

## 8. Gap dan Risiko yang Ditemukan

- Autentikasi dan otorisasi belum tersedia.
- Upload file masih disimpan sebagai data URL sehingga ukuran database dapat membesar.
- Belum ada storage object, backup otomatis, atau pemulihan data.
- Beberapa halaman masih memiliki warning lint dan penggunaan `any` lama.
- Pengaturan sistem masih berupa state UI dan belum seluruhnya tersimpan ke database.
- Belum ada test otomatis untuk validasi NIK, kategori usia, ulang tahun, upload, dan operasi CRUD.
- Model data tambahan seperti iuran dan inventory memiliki endpoint sendiri dan belum seluruhnya disatukan ke store utama.
- Validasi dan error state perlu distandardisasi agar pesan API konsisten.

## 9. Indikator Keberhasilan

- Pengurus dapat mengelola seluruh modul inti tanpa mengedit database langsung.
- Tidak ada NIK baru yang tersimpan jika bukan tepat 16 angka.
- Daftar warga menampilkan usia dan kategori yang konsisten.
- Pengingat ulang tahun menampilkan hari ini dan rentang tujuh hari berikutnya secara benar.
- Upload menolak tipe file dan ukuran yang tidak sesuai.
- DEV dapat digunakan tanpa MongoDB, sedangkan LIVE dapat memuat data MongoDB.
- Perubahan data terlihat konsisten setelah tambah, edit, hapus, dan perpindahan mode.

## 10. Prioritas Berikutnya

1. Tambahkan autentikasi dan otorisasi pengurus.
2. Pindahkan file dari data URL ke object storage.
3. Tambahkan test otomatis untuk helper warga dan validasi form/API.
4. Rapikan lint dan hilangkan penggunaan `any` yang tersisa.
5. Satukan model error, loading, dan empty state pada semua halaman.
6. Tambahkan audit log dan backup database.
