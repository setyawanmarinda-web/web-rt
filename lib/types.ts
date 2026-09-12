export interface Warga {
  id: string;
  nama_lengkap: string;
  tanggal_lahir?: string;
  status_tinggal: 'Tetap' | 'Kontrak';
  rt: string;
  rw: string;
  no_hp?: string;
  alamat: string;
  created_at: string;
}

export interface KasRT {
  id: string;
  keterangan: string;
  jumlah: number;
  jenis: 'Masuk' | 'Keluar';
  pos: 'Kas RT' | 'Sampah & Keamanan' | 'Dana Sosial';
  rt: string;
  metode: 'Cash' | 'Transfer' | 'Split' | 'Titipan';
  nama_pembayar?: string;
  perantara_list?: { nama: string; alamat: string }[];
  rincian_split?: string;
  diskon_keringanan?: boolean;
  tanggal_transaksi?: string;
  created_at: string;
}

export interface Kegiatan {
  id: string;
  judul: string;
  deskripsi: string;
  tanggal: string;
  waktu: string;
  lokasi: string;
  rt: string;
  kategori: 'Kerja Bakti' | 'Rapat' | 'Posyandu' | 'Sosialisasi' | 'Lainnya';
  status: 'Akan Datang' | 'Selesai' | 'Dibatalkan';
}

export interface Pengumuman {
  id: string;
  judul: string;
  isi: string;
  tanggal: string;
  kategori: 'Penting' | 'Informasi' | 'Himbauan';
  status: 'Aktif' | 'Ditarsipkan';
  rt: string;
}

export interface UMKM {
  id: string;
  nama_usaha: string;
  pemilik: string;
  deskripsi: string;
  kategori: 'Kuliner' | 'Jasa' | 'Kelontong' | 'Fashion' | 'Lainnya';
  whatsapp: string;
  foto_url?: string;
  rt: string;
}

export interface Surat {
  id: string;
  no_surat: string;
  tanggal_lahir?: string;
  nama_pemohon: string;
  jenis_surat: 'Surat Pengantar KTP' | 'SKTM' | 'Surat Domisili' | 'Lainnya';
  keperluan: string;
  rt: string;
  tanggal_pengajuan: string;
  status: 'Pending' | 'Diproses' | 'Disetujui' | 'Ditolak';
}

export interface Arsip {
  id: string;
  judul: string;
  kategori: 'Notulen Rapat' | 'SK Kepengurusan' | 'Peraturan RW' | 'Laporan Keuangan';
  file_url: string;
  tanggal_upload: string;
  ukuran: string;
}
export interface Inventory {
  id: string;
  nama_barang: string;
  tipe: 'Habis Pakai' | 'Tidak Habis Pakai';
  foto_url?: string;
  stok_total: number;
  stok_tersedia: number;
  stok_dipinjam: number;
  status: 'Tersedia' | 'Habis' | 'Rusak' | 'Hilang';
  rt: string;
  created_at: string;
}

export interface InventoryHistory {
  id: string;
  barang_id: string;
  jenis: 'Masuk' | 'Keluar' | 'Rusak' | 'Hilang' | 'Dipakai' | 'Dikembalikan';
  jumlah: number;
  keterangan?: string;
  dilakukan_oleh: string;
  tanggal: string;
  dikoreksi?: boolean;
  jumlah_sebelumnya?: number;
  dikoreksi_pada?: string;
  dikoreksi_oleh?: string;
  koreksi_keterangan?: string;
}

export interface InventoryLoan {
  id: string;
  barang_id: string;
  peminjam: string;
  jumlah: number;
  tanggal_pinjam: string;
  tanggal_rencana_kembali: string;
  tanggal_dikembalikan?: string;
  status: 'Pending' | 'Disetujui' | 'Ditolak' | 'Dipinjam' | 'Dikembalikan';
  kondisi_kembali?: 'Baik' | 'Rusak' | 'Hilang';
  kontribusi_pemeliharaan?: number;
  catatan?: string;
  rt: string;
  created_at: string;
}

// Helper list RT 001 s/d RT 010 (Default RT 002)
export const RT_LIST = ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010'];


