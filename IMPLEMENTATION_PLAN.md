# Implementation Plan - SIM RW 012 Updates

Dokumen ini berisi rencana eksekusi untuk 13 fitur baru yang diminta.

## 1. Tombol toggle LIVE / DEV yang bisa diklik user
- **File yang disentuh:** `lib/store.ts`, `app/dashboard/layout.tsx`, `lib/dataMode.ts`
- **Langkah teknis:** 
  - Modifikasi `useSimStore` untuk menyimpan mode (LIVE/DEV) ke state internal dan `localStorage`, dengan nilai awal (fallback) mengambil dari `.env`.
  - Ubah badge mode di `layout.tsx` menjadi toggle interaktif yang memanggil fungsi set mode di store.
- **Keputusan:** -
- **Estimasi Kompleksitas:** Sedang

## 2. Menu hapus transaksi di setiap form input
- **File yang disentuh:** `app/api/*/route.ts` (semua modul), `lib/store.ts`, `app/dashboard/*/page.tsx` (semua modul).
- **Langkah teknis:**
  - Tambahkan fungsi `DELETE` pada semua API route (warga, kas, kegiatan, pengumuman, umkm, surat, arsip).
  - Buat fungsi penghapusan data di `useSimStore` beserta refresh list.
  - Tambahkan tombol/icon "Hapus" di setiap baris tabel pada UI.
  - Implementasikan dialog konfirmasi sebelum hapus (menggunakan alert bawaan atau modal kecil).
- **Keputusan:** -
- **Estimasi Kompleksitas:** Besar (menyentuh banyak file)

## 3. Menu "Inventori" baru di sidebar
- **File yang disentuh:** `components/Sidebar.tsx`, `lib/types.ts`, `lib/mongoose.ts`, `app/api/inventori/route.ts`, `app/dashboard/inventori/page.tsx`, `lib/store.ts`.
- **Langkah teknis:**
  - Buat schema Mongoose dan tipe data (nama_barang, kategori, jumlah, kondisi, dll).
  - Buat API GET & POST untuk inventori.
  - Tambahkan ke `store.ts`.
  - Buat UI halaman inventori dan letakkan link di Sidebar sebelum "Pengaturan Sistem".
- **Keputusan:** -
- **Estimasi Kompleksitas:** Sedang

## 4. Date picker (kalender popup) untuk semua input tanggal
- **File yang disentuh:** `components/DatePicker.tsx` (baru), semua file halaman form.
- **Langkah teknis:**
  - Cek atau buat komponen `DatePicker.tsx` yang reusable (mungkin menggunakan `react-datepicker` atau native HTML5 `type="date"` yang di-styling dengan baik jika belum ada package tambahan).
  - Ganti semua input tanggal di Kas, Warga, Kegiatan, Surat, dll dengan komponen ini.
- **Keputusan:** ⚠️ **NEED DECISION** - Apakah diperbolehkan untuk menginstall package eksternal (misal: `react-datepicker` atau Radix UI date picker) untuk kalender yang lebih bagus, atau cukup menggunakan `<input type="date">` bawaan HTML5 yang di-styling ulang?
- **Estimasi Kompleksitas:** Sedang

## 5. Field NIK di form input Warga baru
- **File yang disentuh:** `lib/mongoose.ts`, `lib/types.ts`, `app/dashboard/statistik/page.tsx`, `app/api/warga/route.ts`.
- **Langkah teknis:**
  - Tambah field `nik` (String, required, unique) di schema dan types Warga.
  - Tambahkan validasi panjang 16 digit di form.
  - Di tampilan tabel, buat fungsi helper untuk masking (menampilkan 4 digit terakhir) dan tambahkan tombol "Lihat" (mata) untuk toggle unmask.
- **Keputusan:** -
- **Estimasi Kompleksitas:** Sedang

## 6. Hilangkan tulisan "(Default Focus)" untuk RT 002
- **File yang disentuh:** `components/Sidebar.tsx`, `app/dashboard/statistik/page.tsx`.
- **Langkah teknis:**
  - Cari teks "(Default Focus)" dan hapus dari render UI.
- **Keputusan:** -
- **Estimasi Kompleksitas:** Kecil

## 7. Kategori usia otomatis terpusat
- **File yang disentuh:** `lib/utils.ts` (baru/existing), `app/dashboard/statistik/page.tsx`.
- **Langkah teknis:**
  - Buat fungsi reusable `calculateAge(birthDateString: string)` dan `getAgeCategory(age: number)`.
  - Implementasikan logic kategori: Balita (0-5), Anak (6-11), Remaja (12-17), Dewasa (18-59), Lansia (60+).
  - Ganti logic hitung lansia di menu Warga menggunakan fungsi ini.
- **Keputusan:** -
- **Estimasi Kompleksitas:** Kecil

## 8. Upload arsip PDF: drag & drop + klik, maksimal 4MB
- **File yang disentuh:** `app/dashboard/arsip/page.tsx`.
- **Langkah teknis:**
  - Buat komponen area *drag-and-drop* untuk file PDF.
  - Beri validasi ukuran (max 4MB) dan tipe (application/pdf) di frontend.
- **Keputusan:** ⚠️ **NEED DECISION** - Aplikasi ini belum memiliki integrasi cloud storage (AWS S3, Cloudinary, Vercel Blob, dll). Apakah Anda ingin menyimpan file sementara sebagai Base64 di MongoDB (TIDAK DISARANKAN untuk file 4MB), atau menggunakan layanan storage spesifik (mohon sebutkan layanan apa yang ingin digunakan)?
- **Estimasi Kompleksitas:** Sedang

## 9. Halaman "Daftarkan UMKM Anda": upload foto & update dummy
- **File yang disentuh:** `lib/dummyData.ts`, `app/dashboard/umkm/page.tsx`, `lib/mongoose.ts`.
- **Langkah teknis:**
  - Ganti teks dummy "Ibu Virna" menjadi "Pak Dika".
  - Tambahkan input upload 1 foto (opsional) di form pendaftaran.
  - Set default avatar bila foto tidak ada.
- **Keputusan:** ⚠️ **NEED DECISION** - Sama dengan Poin 8, untuk fitur *upload foto*, ke mana file gambar ini akan di-hosting?
- **Estimasi Kompleksitas:** Kecil

## 10. Upgrade README.md
- **File yang disentuh:** `README.md`
- **Langkah teknis:**
  - Tulis ulang dokumen mencakup arsitektur, cara setup, fitur, struktur folder, dll.
- **Keputusan:** -
- **Estimasi Kompleksitas:** Kecil

## 11. Buat PRD.md (Reverse Engineering)
- **File yang disentuh:** `PRD.md` (baru)
- **Langkah teknis:**
  - Tulis dokumen *Product Requirements Document* lengkap berdasarkan struktur aplikasi saat ini, plus identifikasi fitur yang kurang (gap).
- **Keputusan:** -
- **Estimasi Kompleksitas:** Sedang

## 12. Kolom "Usia" di tabel/list Warga
- **File yang disentuh:** `app/dashboard/statistik/page.tsx` (atau file tabel warga terkait).
- **Langkah teknis:**
  - Import fungsi `calculateAge` dari Poin 7.
  - Tambahkan kolom baru di UI tabel, tampilkan angka usia atau "-" bila tidak ada tanggal lahir.
- **Keputusan:** -
- **Estimasi Kompleksitas:** Kecil

## 13. Notifikasi ulang tahun warga
- **File yang disentuh:** `app/dashboard/page.tsx` (halaman utama).
- **Langkah teknis:**
  - Import `wargaList` dari `useSimStore`.
  - Buat logic pembanding tanggal+bulan dari `tanggal_lahir` dengan hari ini + 7 hari ke depan.
  - Tampilkan hasilnya (nama, H-X hari) di kartu notifikasi pada dashboard.
- **Keputusan:** -
- **Estimasi Kompleksitas:** Sedang
