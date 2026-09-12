// lib/mongoose.ts

// Mongoose Schema & Model definitions untuk semua koleksi SIM RW 012
// Seluruh model di-guard dengan 'models[X] || model(...)'
// agar aman di Next.js hot-reload

import mongoose, { Schema, models, model } from 'mongoose';

// ─── Warga ────────────────────────────────────────────────────────────────────

const WargaSchema = new Schema({
  nama_lengkap: {
    type: String,
    required: true,
    trim: true,
  },

  tanggal_lahir: {
    type: String,
  },

  status_tinggal: {
    type: String,
    enum: ['Tetap', 'Kontrak'],
    required: true,
  },

  rt: {
    type: String,
    required: true,
  },

  rw: {
    type: String,
    default: '012',
  },

  no_hp: {
    type: String,
  },

  alamat: {
    type: String,
    required: true,
  },

  created_at: {
    type: String,
    default: () => new Date().toISOString(),
  },
});

// ─── Kas RT ───────────────────────────────────────────────────────────────────

const PerantaraSchema = new Schema(
  {
    nama: String,
    alamat: String,
  },
  {
    _id: false,
  }
);

const KasRTSchema = new Schema({
  keterangan: {
    type: String,
    required: true,
  },

  jumlah: {
    type: Number,
    required: true,
  },

  jenis: {
    type: String,
    enum: ['Masuk', 'Keluar'],
    required: true,
  },

  pos: {
    type: String,
    enum: ['Kas RT', 'Sampah & Keamanan', 'Dana Sosial'],
    required: true,
  },

  rt: {
    type: String,
    required: true,
  },

  metode: {
    type: String,
    enum: ['Cash', 'Transfer', 'Split', 'Titipan'],
    required: true,
  },

  nama_pembayar: {
    type: String,
  },

  perantara_list: {
    type: [PerantaraSchema],
    default: [],
  },

  rincian_split: {
    type: String,
  },

  diskon_keringanan: {
    type: Boolean,
    default: false,
  },

  tanggal_transaksi: {
    type: String,
  },

  created_at: {
    type: String,
    default: () => new Date().toISOString(),
  },
});

// ─── Kegiatan ─────────────────────────────────────────────────────────────────

const KegiatanSchema = new Schema({
  judul: {
    type: String,
    required: true,
  },

  deskripsi: {
    type: String,
  },

  tanggal: {
    type: String,
    required: true,
  },

  waktu: {
    type: String,
  },

  lokasi: {
    type: String,
  },

  rt: {
    type: String,
    required: true,
  },

  kategori: {
    type: String,
    enum: ['Kerja Bakti', 'Rapat', 'Posyandu', 'Sosialisasi', 'Lainnya'],
    required: true,
  },

  status: {
    type: String,
    enum: ['Akan Datang', 'Selesai', 'Dibatalkan'],
    default: 'Akan Datang',
  },
});

// ─── Pengumuman ───────────────────────────────────────────────────────────────

const PengumumanSchema = new Schema({
  judul: {
    type: String,
    required: true,
  },

  isi: {
    type: String,
    required: true,
  },

  tanggal: {
    type: String,
    required: true,
  },

  kategori: {
    type: String,
    enum: ['Penting', 'Informasi', 'Himbauan'],
    required: true,
  },

  status: {
    type: String,
    enum: ['Aktif', 'Ditarsipkan'],
    default: 'Aktif',
  },

  rt: {
    type: String,
    required: true,
  },
});

// ─── UMKM ─────────────────────────────────────────────────────────────────────

const UMKMSchema = new Schema({
  nama_usaha: {
    type: String,
    required: true,
  },

  pemilik: {
    type: String,
    required: true,
  },

  deskripsi: {
    type: String,
  },

  kategori: {
    type: String,
    enum: ['Kuliner', 'Jasa', 'Kelontong', 'Fashion', 'Lainnya'],
    required: true,
  },

  whatsapp: {
    type: String,
  },

  foto_url: {
    type: String,
  },

  rt: {
    type: String,
    required: true,
  },
});

// ─── Surat ────────────────────────────────────────────────────────────────────

const SuratSchema = new Schema({
  no_surat: {
    type: String,
    required: true,
  },

  nama_pemohon: {
    type: String,
    required: true,
  },

  tanggal_lahir: {
    type: String,
  },

  jenis_surat: {
    type: String,
    enum: [
      'Surat Pengantar KTP',
      'SKTM',
      'Surat Domisili',
      'Lainnya',
    ],
    required: true,
  },

  keperluan: {
    type: String,
    required: true,
  },

  rt: {
    type: String,
    required: true,
  },

  tanggal_pengajuan: {
    type: String,
    default: () => new Date().toISOString().split('T')[0],
  },

  status: {
    type: String,
    enum: ['Pending', 'Diproses', 'Disetujui', 'Ditolak'],
    default: 'Pending',
  },
});

// ─── Arsip ────────────────────────────────────────────────────────────────────

const ArsipSchema = new Schema({
  judul: {
    type: String,
    required: true,
  },

  kategori: {
    type: String,
    enum: [
      'Notulen Rapat',
      'SK Kepengurusan',
      'Peraturan RW',
      'Laporan Keuangan',
    ],
    required: true,
  },

  file_url: {
    type: String,
    default: '#',
  },

  tanggal_upload: {
    type: String,
    default: () => new Date().toISOString().split('T')[0],
  },

  ukuran: {
    type: String,
    default: '-',
  },
});

// ─── Inventory ────────────────────────────────────────────────────────────────

const InventorySchema = new Schema({
  nama_barang: {
    type: String,
    required: true,
    trim: true,
  },

  tipe: {
    type: String,
    enum: ['Habis Pakai', 'Tidak Habis Pakai'],
    required: true,
  },

  foto_url: {
    type: String,
  },

  stok_total: {
    type: Number,
    default: 0,
    min: 0,
  },

  stok_tersedia: {
    type: Number,
    default: 0,
    min: 0,
  },

  stok_dipinjam: {
    type: Number,
    default: 0,
    min: 0,
  },

  status: {
    type: String,
    enum: ['Tersedia', 'Habis', 'Rusak', 'Hilang'],
    default: 'Tersedia',
  },

  rt: {
    type: String,
    required: true,
  },

  created_at: {
    type: String,
    default: () => new Date().toISOString(),
  },
});

// ─── Inventory History ────────────────────────────────────────────────────────

const InventoryHistorySchema = new Schema({
  barang_id: {
    type: String,
    required: true,
  },

  jenis: {
    type: String,
    enum: [
      'Masuk',
      'Keluar',
      'Rusak',
      'Hilang',
      'Dipakai',
      'Dikembalikan',
    ],
    required: true,
  },

  jumlah: {
    type: Number,
    required: true,
    min: 1,
  },

  keterangan: {
    type: String,
  },

  dilakukan_oleh: {
    type: String,
    required: true,
  },

  tanggal: {
    type: String,
    default: () => new Date().toISOString(),
  },

  dikoreksi: {
    type: Boolean,
    default: false,
  },

  jumlah_sebelumnya: {
    type: Number,
  },

  dikoreksi_pada: {
    type: String,
  },

  dikoreksi_oleh: {
    type: String,
  },

  koreksi_keterangan: {
    type: String,
  },
});

// ─── Inventory Loan ───────────────────────────────────────────────────────────

const InventoryLoanSchema = new Schema({
  barang_id: {
    type: String,
    required: true,
  },

  peminjam: {
    type: String,
    required: true,
  },

  jumlah: {
    type: Number,
    required: true,
    min: 1,
  },

  tanggal_pinjam: {
    type: String,
    required: true,
  },

  tanggal_rencana_kembali: {
    type: String,
    required: true,
  },

  tanggal_dikembalikan: {
    type: String,
  },

  status: {
    type: String,
    enum: [
      'Pending',
      'Disetujui',
      'Ditolak',
      'Dipinjam',
      'Dikembalikan',
    ],
    default: 'Pending',
  },

  kondisi_kembali: {
    type: String,
    enum: ['Baik', 'Rusak', 'Hilang'],
  },

  kontribusi_pemeliharaan: {
    type: Number,
    default: 0,
    min: 0,
  },

  catatan: {
    type: String,
  },

  rt: {
    type: String,
    required: true,
  },

  created_at: {
    type: String,
    default: () => new Date().toISOString(),
  },
});

// ─── Iuran Kewajiban ──────────────────────────────────────────────────────────

const IuranKewajibanSchema = new Schema({
  warga_id: {
    type: String,
    required: true,
  },

  rt: {
    type: String,
    required: true,
  },

  tahun: {
    type: Number,
    required: true,
  },

  bulan: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },

  nominal_normal: {
    type: Number,
    required: true,
    default: 55000,
  },

  nominal_wajib: {
    type: Number,
    required: true,
  },

  nominal_terbayar: {
    type: Number,
    default: 0,
    min: 0,
  },

  status: {
    type: String,
    enum: ["Belum Bayar", "Sebagian", "Lunas"],
    default: "Belum Bayar",
  },

  keringanan: {
    type: Boolean,
    default: false,
  },

  catatan_keringanan: {
    type: String,
  },

  created_at: {
    type: String,
    default: () => new Date().toISOString(),
  },
});

// ─── Pembayaran Iuran ─────────────────────────────────────────────────────────

const PembayaranIuranSchema = new Schema({
  warga_id: {
    type: String,
    required: true,
  },

  rt: {
    type: String,
    required: true,
  },

  tanggal_pembayaran: {
    type: String,
    required: true,
  },

  nominal: {
    type: Number,
    required: true,
    min: 1,
  },

  metode: {
    type: String,
    enum: ["Cash", "Transfer", "Split", "Titipan"],
    required: true,
  },

  alokasi: {
    type: [
      {
        kewajiban_id: {
          type: String,
          required: true,
        },
        tahun: {
          type: Number,
          required: true,
        },
        bulan: {
          type: Number,
          required: true,
        },
        nominal: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    default: [],
  },

  keringanan: {
    type: Boolean,
    default: false,
  },

  catatan: {
    type: String,
  },

  kas_id: {
    type: String,
  },

  created_at: {
    type: String,
    default: () => new Date().toISOString(),
  },
});

// ─── Exports (singleton-safe) ─────────────────────────────────────────────────

export const WargaModel =
  models.Warga || model('Warga', WargaSchema);

export const KasRTModel =
  models.KasRT || model('KasRT', KasRTSchema);

export const IuranKewajibanModel =
  models.IuranKewajiban || model('IuranKewajiban', IuranKewajibanSchema);

export const PembayaranIuranModel =
  models.PembayaranIuran || model('PembayaranIuran', PembayaranIuranSchema);

export const KegiatanModel =
  models.Kegiatan || model('Kegiatan', KegiatanSchema);

export const PengumumanModel =
  models.Pengumuman || model('Pengumuman', PengumumanSchema);

export const UMKMModel =
  models.UMKM || model('UMKM', UMKMSchema);

export const SuratModel =
  models.Surat || model('Surat', SuratSchema);

export const ArsipModel =
  models.Arsip || model('Arsip', ArsipSchema);

export const InventoryModel =
  models.Inventory || model('Inventory', InventorySchema);

export const InventoryHistoryModel =
  models.InventoryHistory ||
  model('InventoryHistory', InventoryHistorySchema);

export const InventoryLoanModel =
  models.InventoryLoan ||
  model('InventoryLoan', InventoryLoanSchema);

// Prevent unused import warning
export { mongoose };