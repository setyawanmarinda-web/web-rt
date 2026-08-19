// lib/mongoose.ts
// Mongoose Schema & Model definitions untuk semua koleksi SIM RW 012
// Seluruh model di-guard dengan 'models[X] || model(...)' agar aman di Next.js hot-reload

import mongoose, { Schema, models, model } from 'mongoose';

// ─── Warga ────────────────────────────────────────────────────────────────────
const WargaSchema = new Schema({
  nama_lengkap:   { type: String, required: true, trim: true },
  tanggal_lahir:  { type: String },
  status_tinggal: { type: String, enum: ['Tetap', 'Kontrak'], required: true },
  rt:             { type: String, required: true },
  rw:             { type: String, default: '012' },
  no_hp:          { type: String },
  alamat:         { type: String, required: true },
  created_at:     { type: String, default: () => new Date().toISOString() },
});

// ─── KasRT ───────────────────────────────────────────────────────────────────
const PerantaraSchema = new Schema(
  { nama: String, alamat: String },
  { _id: false }
);

const KasRTSchema = new Schema({
  keterangan:       { type: String, required: true },
  jumlah:           { type: Number, required: true },
  jenis:            { type: String, enum: ['Masuk', 'Keluar'], required: true },
  pos:              { type: String, enum: ['Kas RT', 'Dana Sosial', 'Satpam & Sampah', '17an', 'THR'], required: true },
  rt:               { type: String, required: true },
  metode:           { type: String, enum: ['Cash', 'Transfer', 'Split', 'Titipan'], required: true },
  nama_pembayar:    { type: String },
  perantara_list:   { type: [PerantaraSchema], default: [] },
  rincian_split:    { type: String },
  diskon_keringanan:{ type: Boolean, default: false },
  tanggal_transaksi:{ type: String },
  created_at:       { type: String, default: () => new Date().toISOString() },
});

// ─── Kegiatan ─────────────────────────────────────────────────────────────────
const KegiatanSchema = new Schema({
  judul:    { type: String, required: true },
  deskripsi:{ type: String },
  tanggal:  { type: String, required: true },
  waktu:    { type: String },
  lokasi:   { type: String },
  rt:       { type: String, required: true },
  kategori: { type: String, enum: ['Kerja Bakti', 'Rapat', 'Posyandu', 'Sosialisasi', 'Lainnya'], required: true },
  status:   { type: String, enum: ['Akan Datang', 'Selesai', 'Dibatalkan'], default: 'Akan Datang' },
});

// ─── Pengumuman ───────────────────────────────────────────────────────────────
const PengumumanSchema = new Schema({
  judul:   { type: String, required: true },
  isi:     { type: String, required: true },
  tanggal: { type: String, required: true },
  kategori:{ type: String, enum: ['Penting', 'Informasi', 'Himbauan'], required: true },
  status:  { type: String, enum: ['Aktif', 'Ditarsipkan'], default: 'Aktif' },
  rt:      { type: String, required: true },
});

// ─── UMKM ─────────────────────────────────────────────────────────────────────
const UMKMSchema = new Schema({
  nama_usaha: { type: String, required: true },
  pemilik:    { type: String, required: true },
  deskripsi:  { type: String },
  kategori:   { type: String, enum: ['Kuliner', 'Jasa', 'Kelontong', 'Fashion', 'Lainnya'], required: true },
  whatsapp:   { type: String },
  foto_url:   { type: String },
  rt:         { type: String, required: true },
});

// ─── Surat ────────────────────────────────────────────────────────────────────
const SuratSchema = new Schema({
  no_surat:         { type: String, required: true },
  nama_pemohon:     { type: String, required: true },
  tanggal_lahir:    { type: String },
  jenis_surat:      { type: String, enum: ['Surat Pengantar KTP', 'SKTM', 'Surat Domisili', 'Lainnya'], required: true },
  keperluan:        { type: String, required: true },
  rt:               { type: String, required: true },
  tanggal_pengajuan:{ type: String, default: () => new Date().toISOString().split('T')[0] },
  status:           { type: String, enum: ['Pending', 'Diproses', 'Disetujui', 'Ditolak'], default: 'Pending' },
});

// ─── Arsip ────────────────────────────────────────────────────────────────────
const ArsipSchema = new Schema({
  judul:         { type: String, required: true },
  kategori:      { type: String, enum: ['Notulen Rapat', 'SK Kepengurusan', 'Peraturan RW', 'Laporan Keuangan'], required: true },
  file_url:      { type: String, default: '#' },
  tanggal_upload:{ type: String, default: () => new Date().toISOString().split('T')[0] },
  ukuran:        { type: String, default: '-' },
});

// ─── Exports (singleton-safe) ─────────────────────────────────────────────────
export const WargaModel      = models.Warga      || model('Warga',      WargaSchema);
export const KasRTModel      = models.KasRT      || model('KasRT',      KasRTSchema);
export const KegiatanModel   = models.Kegiatan   || model('Kegiatan',   KegiatanSchema);
export const PengumumanModel = models.Pengumuman || model('Pengumuman', PengumumanSchema);
export const UMKMModel       = models.UMKM       || model('UMKM',       UMKMSchema);
export const SuratModel      = models.Surat      || model('Surat',      SuratSchema);
export const ArsipModel      = models.Arsip      || model('Arsip',      ArsipSchema);

// Prevent unused import warning
export { mongoose };
