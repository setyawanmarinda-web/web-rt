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
  pos: 'Kas RT' | 'Dana Sosial' | 'Satpam & Sampah' | '17an' | 'THR';
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

// Helper list RT 001 s/d RT 010 (Default RT 002)
export const RT_LIST = ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010'];


