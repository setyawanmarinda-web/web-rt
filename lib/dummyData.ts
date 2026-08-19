// lib/dummyData.ts
// Data dummy/mock untuk mode DEV (NEXT_PUBLIC_DATA_MODE=dev)
// Tidak digunakan saat mode LIVE — data diambil dari MongoDB
import type { Warga, KasRT, Kegiatan, Pengumuman, UMKM, Surat, Arsip } from './types';

export const DUMMY_WARGA: Warga[] = [
  { id: 'w-1', nama_lengkap: 'Budi Santoso', tanggal_lahir: '1984-03-12', status_tinggal: 'Tetap', rt: '002', rw: '012', no_hp: '081234567890', alamat: 'Blok A1 No. 4', created_at: '2026-01-10T08:00:00Z' },
  { id: 'w-2', nama_lengkap: 'Siti Aminah (Lansia)', tanggal_lahir: '1955-07-20', status_tinggal: 'Tetap', rt: '002', rw: '012', no_hp: '081398765432', alamat: 'Blok A1 No. 8', created_at: '2026-01-12T09:30:00Z' },
  { id: 'w-3', nama_lengkap: 'Anton Wijaya', tanggal_lahir: '1991-11-22', status_tinggal: 'Kontrak', rt: '002', rw: '012', no_hp: '085611223344', alamat: 'Blok B2 No. 12', created_at: '2026-02-01T14:15:00Z' },
  { id: 'w-4', nama_lengkap: 'Ibu Virna Kusuma', tanggal_lahir: '1985-02-14', status_tinggal: 'Tetap', rt: '002', rw: '012', no_hp: '081777889900', alamat: 'Blok A1 No. 5', created_at: '2026-01-15T11:00:00Z' },
  { id: 'w-5', nama_lengkap: 'Bambang Herdian', tanggal_lahir: '1978-09-09', status_tinggal: 'Tetap', rt: '001', rw: '012', no_hp: '081900112233', alamat: 'Blok C3 No. 1', created_at: '2026-02-10T10:00:00Z' },
  { id: 'w-6', nama_lengkap: 'Dewi Lestari', tanggal_lahir: '1995-04-17', status_tinggal: 'Kontrak', rt: '003', rw: '012', no_hp: '081299887766', alamat: 'Blok D1 No. 7', created_at: '2026-03-05T16:20:00Z' },
];

export const DUMMY_KAS: KasRT[] = [
  { id: 'k-1', keterangan: '[Satpam & Sampah] Iuran Wajib Pak Budi', jumlah: 28000, jenis: 'Masuk', pos: 'Satpam & Sampah', rt: '002', metode: 'Transfer', nama_pembayar: 'Budi Santoso', tanggal_transaksi: '2026-08-01', created_at: '2026-08-01T10:00:00Z' },
  { id: 'k-2', keterangan: '[Kas RT] Alokasi Iuran RT Pak Budi', jumlah: 12000, jenis: 'Masuk', pos: 'Kas RT', rt: '002', metode: 'Transfer', nama_pembayar: 'Budi Santoso', tanggal_transaksi: '2026-08-01', created_at: '2026-08-01T10:00:00Z' },
  { id: 'k-3', keterangan: '[Dana Sosial] Alokasi Dansos Pak Budi', jumlah: 5000, jenis: 'Masuk', pos: 'Dana Sosial', rt: '002', metode: 'Transfer', nama_pembayar: 'Budi Santoso', tanggal_transaksi: '2026-08-01', created_at: '2026-08-01T10:00:00Z' },
  { id: 'k-6', keterangan: '[Satpam & Sampah] Iuran Titip via Ibu Virna & Pak Joko', jumlah: 56000, jenis: 'Masuk', pos: 'Satpam & Sampah', rt: '002', metode: 'Titipan', nama_pembayar: 'Pak Hendra & Pak Supri', perantara_list: [{ nama: 'Ibu Virna', alamat: 'Blok A1 No 5' }, { nama: 'Pak Joko', alamat: 'Blok A1 No 6' }], tanggal_transaksi: '2026-08-03', created_at: '2026-08-03T11:20:00Z' },
  { id: 'k-7', keterangan: '[Kas RT] Split Payment Pak Anton (Cash Rp 25k + TF Rp 30k)', jumlah: 55000, jenis: 'Masuk', pos: 'Kas RT', rt: '002', metode: 'Split', nama_pembayar: 'Anton Wijaya', rincian_split: 'Cash Rp 25.000 + TF Rp 30.000', tanggal_transaksi: '2026-08-05', created_at: '2026-08-05T15:45:00Z' },
  { id: 'k-8', keterangan: '[Satpam & Sampah] Keringanan Lansia Bu Siti Aminah', jumlah: 28000, jenis: 'Masuk', pos: 'Satpam & Sampah', rt: '002', metode: 'Cash', nama_pembayar: 'Siti Aminah', diskon_keringanan: true, tanggal_transaksi: '2026-08-06', created_at: '2026-08-06T09:10:00Z' },
  { id: 'k-9', keterangan: '[Kas RT] Pembelian Lampu LED POS Ronda RT 002', jumlah: 150000, jenis: 'Keluar', pos: 'Kas RT', rt: '002', metode: 'Cash', tanggal_transaksi: '2026-08-08', created_at: '2026-08-08T19:30:00Z' },
];

export const DUMMY_KEGIATAN: Kegiatan[] = [
  { id: 'g-1', judul: 'Kerja Bakti Massal Sambut 17 Agustus', deskripsi: 'Pembersihan saluran air, pengecatan gapura, dan pemasangan bendera merah putih.', tanggal: '2026-08-16', waktu: '07:00 - 11:00 WIB', lokasi: 'Lapangan Utama & Pos Ronda RT 002', rt: '002', kategori: 'Kerja Bakti', status: 'Akan Datang' },
  { id: 'g-2', judul: 'Rapat Koordinasi Pengurus RT 002', deskripsi: 'Pembahasan persiapan Lomba HUT RI dan Rekapitulasi Iuran Warga.', tanggal: '2026-08-20', waktu: '19:30 WIB - Selesai', lokasi: 'Rumah Ketua RT 002', rt: '002', kategori: 'Rapat', status: 'Akan Datang' },
  { id: 'g-3', judul: 'Posyandu Balita & Lansia Rutin', deskripsi: 'Pemeriksaan kesehatan gratis, penimbangan balita, dan pembagian makanan tambahan.', tanggal: '2026-08-10', waktu: '08:30 - 11:30 WIB', lokasi: 'Balai Warga RW 012', rt: '012', kategori: 'Posyandu', status: 'Selesai' },
];

export const DUMMY_PENGUMUMAN: Pengumuman[] = [
  { id: 'p-1', judul: 'Himbauan Pemasangan Bendera Merah Putih', isi: 'Diberitahukan kepada seluruh warga RT 002 / RW 012 untuk memasang bendera Merah Putih serentak mulai tanggal 1 - 31 Agustus 2026.', tanggal: '2026-08-01', kategori: 'Penting', status: 'Aktif', rt: '002' },
  { id: 'p-2', judul: 'Jadwal Ronda Malam Terbaru Bulan Agustus', isi: 'Jadwal ronda malam telah diperbarui. Mohon warga memeriksa grup WhatsApp RT 002 atau papan pengumuman di Pos Ronda.', tanggal: '2026-08-02', kategori: 'Informasi', status: 'Aktif', rt: '002' },
];

export const DUMMY_UMKM: UMKM[] = [
  { id: 'u-1', nama_usaha: 'Agen Cemilan Bu Virna', pemilik: 'Ibu Virna', deskripsi: 'Menyediakan aneka keripik pedas, kue basah tradisional, dan pesanan snack box.', kategori: 'Kuliner', whatsapp: '6281777889900', rt: '002' },
  { id: 'u-2', nama_usaha: 'Jasa Perbaikan AC & Elektronik Pak Budi', pemilik: 'Pak Budi Santoso', deskripsi: 'Servis AC berkala, cuci AC, perbaikan mesin cuci dan instalasi listrik rumah tangga.', kategori: 'Jasa', whatsapp: '6281234567890', rt: '002' },
  { id: 'u-3', nama_usaha: 'Toko Kelontong Berkah Madura', pemilik: 'Bang Hasan', deskripsi: 'Menjual sembako lengkap, gas LPG 3kg/12kg, air galon isi ulang, buka 24 jam.', kategori: 'Kelontong', whatsapp: '6281900112233', rt: '001' },
];

export const DUMMY_SURAT: Surat[] = [
  { id: 's-1', no_surat: 'SRT/2026/08/001', nama_pemohon: 'Budi Santoso', tanggal_lahir: '1984-03-12', jenis_surat: 'Surat Pengantar KTP', keperluan: 'Perpanjangan KTP elektronik yang hilang', rt: '002', tanggal_pengajuan: '2026-08-09', status: 'Disetujui' },
  { id: 's-2', no_surat: 'SRT/2026/08/002', nama_pemohon: 'Siti Aminah', tanggal_lahir: '1955-07-20', jenis_surat: 'SKTM', keperluan: 'Pengajuan Bantuan BPJS Kesehatan PBI', rt: '002', tanggal_pengajuan: '2026-08-11', status: 'Diproses' },
  { id: 's-3', no_surat: 'SRT/2026/08/003', nama_pemohon: 'Anton Wijaya', tanggal_lahir: '1991-11-22', jenis_surat: 'Surat Domisili', keperluan: 'Kelengkapan berkas domisili tempat tinggal sementara', rt: '002', tanggal_pengajuan: '2026-08-12', status: 'Pending' },
];

export const DUMMY_ARSIP: Arsip[] = [
  { id: 'a-1', judul: 'Notulen Rapat Musyawarah RW 012 Semester I 2026', kategori: 'Notulen Rapat', file_url: '#', tanggal_upload: '2026-07-15', ukuran: '1.2 MB' },
  { id: 'a-2', judul: 'SK Kepengurusan RT 002 / RW 012 Kelurahan Bahagia', kategori: 'SK Kepengurusan', file_url: '#', tanggal_upload: '2026-01-05', ukuran: '850 KB' },
  { id: 'a-3', judul: 'Peraturan & Tata Tertib Warga RW 012 (Revisi 2026)', kategori: 'Peraturan RW', file_url: '#', tanggal_upload: '2026-01-10', ukuran: '2.4 MB' },
];
