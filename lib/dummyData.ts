// lib/dummyData.ts
// Data dummy/mock untuk mode DEV (NEXT_PUBLIC_DATA_MODE=dev)
// Tidak digunakan saat mode LIVE — data diambil dari MongoDB
import type { Warga, KasRT, Kegiatan, Pengumuman, UMKM, Surat, Arsip } from './types';

export const DUMMY_WARGA: Warga[] = [];

export const DUMMY_KAS: KasRT[] = [];

export const DUMMY_KEGIATAN: Kegiatan[] = [];

export const DUMMY_PENGUMUMAN: Pengumuman[] = [];

export const DUMMY_UMKM: UMKM[] = [];

export const DUMMY_SURAT: Surat[] = [];

export const DUMMY_ARSIP: Arsip[] = [];
