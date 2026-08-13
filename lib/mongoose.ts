import mongoose from 'mongoose';

// Warga Schema
const WargaSchema = new mongoose.Schema({
  nama_lengkap: { type: String, required: true },
  tanggal_lahir: String,
  status_tinggal: { type: String, enum: ['Tetap', 'Kontrak'], required: true },
  rt: { type: String, required: true },
  rw: { type: String, required: true },
  no_hp: String,
  alamat: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// KasRT Schema
const KasRTSchema = new mongoose.Schema({
  keterangan: { type: String, required: true },
  jumlah: { type: Number, required: true },
  jenis: { type: String, enum: ['Masuk', 'Keluar'], required: true },
  pos: { type: String, enum: ['Kas RT', 'Dana Sosial', 'Satpam & Sampah', '17an', 'THR'], required: true },
  rt: { type: String, required: true },
  metode: { type: String, enum: ['Cash', 'Transfer', 'Split', 'Titipan'], required: true },
  nama_pembayar: String,
  perantara_list: [{ nama: String, alamat: String }],
  rincian_split: String,
  diskon_keringanan: Boolean,
  tanggal_transaksi: String,
  created_at: { type: Date, default: Date.now }
});

// Kegiatan Schema
const KegiatanSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  deskripsi: String,
  tanggal: { type: String, required: true },
  waktu: String,
  lokasi: String,
  rt: { type: String, required: true },
  kategori: { type: String, enum: ['Kerja Bakti', 'Rapat', 'Posyandu', 'Sosialisasi', 'Lainnya'] },
  status: { type: String, enum: ['Akan Datang', 'Selesai', 'Dibatalkan'], default: 'Akan Datang' },
  created_at: { type: Date, default: Date.now }
});

// Pengumuman Schema
const PengumumanSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  isi: { type: String, required: true },
  tanggal: { type: String, required: true },
  kategori: { type: String, enum: ['Penting', 'Informasi', 'Himbauan'], required: true },
  status: { type: String, enum: ['Aktif', 'Ditarsipkan'], default: 'Aktif' },
  rt: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// UMKM Schema
const UMKMSchema = new mongoose.Schema({
  nama_usaha: { type: String, required: true },
  pemilik: { type: String, required: true },
  deskripsi: String,
  kategori: { type: String, enum: ['Kuliner', 'Jasa', 'Kelontong', 'Fashion', 'Lainnya'] },
  whatsapp: String,
  foto_url: String,
  rt: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// Surat Schema
const SuratSchema = new mongoose.Schema({
  no_surat: { type: String, unique: true },
  tanggal_lahir: String,
  nama_pemohon: { type: String, required: true },
  jenis_surat: { type: String, enum: ['Surat Pengantar KTP', 'SKTM', 'Surat Domisili', 'Lainnya'], required: true },
  keperluan: String,
  rt: { type: String, required: true },
  tanggal_pengajuan: { type: String, default: () => new Date().toISOString().split('T')[0] },
  status: { type: String, enum: ['Pending', 'Diproses', 'Disetujui', 'Ditolak'], default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

// Arsip Schema
const ArsipSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  kategori: { type: String, enum: ['Notulen Rapat', 'SK Kepengurusan', 'Peraturan RW', 'Laporan Keuangan'] },
  file_url: String,
  tanggal_upload: { type: String, default: () => new Date().toISOString().split('T')[0] },
  ukuran: String,
  created_at: { type: Date, default: Date.now }
});

// Create models
export const Warga = mongoose.models.Warga || mongoose.model('Warga', WargaSchema);
export const KasRT = mongoose.models.KasRT || mongoose.model('KasRT', KasRTSchema);
export const Kegiatan = mongoose.models.Kegiatan || mongoose.model('Kegiatan', KegiatanSchema);
export const Pengumuman = mongoose.models.Pengumuman || mongoose.model('Pengumuman', PengumumanSchema);
export const UMKM = mongoose.models.UMKM || mongoose.model('UMKM', UMKMSchema);
export const Surat = mongoose.models.Surat || mongoose.model('Surat', SuratSchema);
export const Arsip = mongoose.models.Arsip || mongoose.model('Arsip', ArsipSchema);
