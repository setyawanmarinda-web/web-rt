'use client';

import { useState, useEffect } from 'react';
import {
  Warga, KasRT, Kegiatan, Pengumuman, UMKM, Surat, Arsip,
  INITIAL_WARGA, INITIAL_KAS, INITIAL_KEGIATAN, INITIAL_PENGUMUMAN, INITIAL_UMKM, INITIAL_SURAT, INITIAL_ARSIP
} from './types';

const STORAGE_KEYS = {
  WARGA: 'sim_rw_warga_v1',
  KAS: 'sim_rw_kas_v1',
  KEGIATAN: 'sim_rw_kegiatan_v1',
  PENGUMUMAN: 'sim_rw_pengumuman_v1',
  UMKM: 'sim_rw_umkm_v1',
  SURAT: 'sim_rw_surat_v1',
  ARSIP: 'sim_rw_arsip_v1',
};

export function useSimStore() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [wargaList, setWargaList] = useState<Warga[]>(INITIAL_WARGA);
  const [kasList, setKasList] = useState<KasRT[]>(INITIAL_KAS);
  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>(INITIAL_KEGIATAN);
  const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>(INITIAL_PENGUMUMAN);
  const [umkmList, setUmkmList] = useState<UMKM[]>(INITIAL_UMKM);
  const [suratList, setSuratList] = useState<Surat[]>(INITIAL_SURAT);
  const [arsipList, setArsipList] = useState<Arsip[]>(INITIAL_ARSIP);
  const [selectedRt, setSelectedRt] = useState<string>('002'); // Default Panel RT 002

  useEffect(() => {
    try {
      const storedWarga = localStorage.getItem(STORAGE_KEYS.WARGA);
      if (storedWarga) setWargaList(JSON.parse(storedWarga));

      const storedKas = localStorage.getItem(STORAGE_KEYS.KAS);
      if (storedKas) setKasList(JSON.parse(storedKas));

      const storedKegiatan = localStorage.getItem(STORAGE_KEYS.KEGIATAN);
      if (storedKegiatan) setKegiatanList(JSON.parse(storedKegiatan));

      const storedPengumuman = localStorage.getItem(STORAGE_KEYS.PENGUMUMAN);
      if (storedPengumuman) setPengumumanList(JSON.parse(storedPengumuman));

      const storedUmkm = localStorage.getItem(STORAGE_KEYS.UMKM);
      if (storedUmkm) setUmkmList(JSON.parse(storedUmkm));

      const storedSurat = localStorage.getItem(STORAGE_KEYS.SURAT);
      if (storedSurat) setSuratList(JSON.parse(storedSurat));

      const storedArsip = localStorage.getItem(STORAGE_KEYS.ARSIP);
      if (storedArsip) setArsipList(JSON.parse(storedArsip));
    } catch (e) {
      console.error("Failed to load local storage state", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save changes to LocalStorage
  const addWarga = (newWarga: Omit<Warga, 'id' | 'created_at'>) => {
    const item: Warga = {
      ...newWarga,
      id: 'w-' + Date.now(),
      created_at: new Date().toISOString()
    };
    const updated = [item, ...wargaList];
    setWargaList(updated);
    localStorage.setItem(STORAGE_KEYS.WARGA, JSON.stringify(updated));
    return item;
  };

  const addKasTransaction = (newKas: Omit<KasRT, 'id' | 'created_at'>) => {
    const item: KasRT = {
      ...newKas,
      id: 'k-' + Date.now(),
      created_at: new Date().toISOString()
    };
    const updated = [item, ...kasList];
    setKasList(updated);
    localStorage.setItem(STORAGE_KEYS.KAS, JSON.stringify(updated));
    return item;
  };

  const addKegiatan = (newItem: Omit<Kegiatan, 'id'>) => {
    const item: Kegiatan = { ...newItem, id: 'g-' + Date.now() };
    const updated = [item, ...kegiatanList];
    setKegiatanList(updated);
    localStorage.setItem(STORAGE_KEYS.KEGIATAN, JSON.stringify(updated));
  };

  const addPengumuman = (newItem: Omit<Pengumuman, 'id'>) => {
    const item: Pengumuman = { ...newItem, id: 'p-' + Date.now() };
    const updated = [item, ...pengumumanList];
    setPengumumanList(updated);
    localStorage.setItem(STORAGE_KEYS.PENGUMUMAN, JSON.stringify(updated));
  };

  const addUmkm = (newItem: Omit<UMKM, 'id'>) => {
    const item: UMKM = { ...newItem, id: 'u-' + Date.now() };
    const updated = [item, ...umkmList];
    setUmkmList(updated);
    localStorage.setItem(STORAGE_KEYS.UMKM, JSON.stringify(updated));
  };

  const addSurat = (newItem: Omit<Surat, 'id' | 'no_surat' | 'tanggal_pengajuan' | 'status'>) => {
    const item: Surat = {
      ...newItem,
      id: 's-' + Date.now(),
      no_surat: `SRT/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`,
      tanggal_pengajuan: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };
    const updated = [item, ...suratList];
    setSuratList(updated);
    localStorage.setItem(STORAGE_KEYS.SURAT, JSON.stringify(updated));
  };

  const updateSuratStatus = (id: string, status: Surat['status']) => {
    const updated = suratList.map(s => s.id === id ? { ...s, status } : s);
    setSuratList(updated);
    localStorage.setItem(STORAGE_KEYS.SURAT, JSON.stringify(updated));
  };

  const addArsip = (newItem: Omit<Arsip, 'id' | 'tanggal_upload'>) => {
    const item: Arsip = {
      ...newItem,
      id: 'a-' + Date.now(),
      tanggal_upload: new Date().toISOString().split('T')[0]
    };
    const updated = [item, ...arsipList];
    setArsipList(updated);
    localStorage.setItem(STORAGE_KEYS.ARSIP, JSON.stringify(updated));
  };

  // Calculations for Pos Kas
  const getKasSummaryByRt = (rtFilter: string) => {
    const filtered = rtFilter === 'ALL' ? kasList : kasList.filter(k => k.rt === rtFilter);

    const posBalance = {
      'Kas RT': 0,
      'Dana Sosial': 0,
      'Satpam & Sampah': 0,
      '17an': 0,
      'THR': 0,
      totalMasuk: 0,
      totalKeluar: 0,
      saldoAkhir: 0
    };

    filtered.forEach(item => {
      const amount = Number(item.jumlah);
      if (item.jenis === 'Masuk') {
        posBalance[item.pos] = (posBalance[item.pos] || 0) + amount;
        posBalance.totalMasuk += amount;
      } else {
        posBalance[item.pos] = (posBalance[item.pos] || 0) - amount;
        posBalance.totalKeluar += amount;
      }
    });

    posBalance.saldoAkhir = posBalance.totalMasuk - posBalance.totalKeluar;
    return posBalance;
  };

  return {
    isLoaded,
    wargaList,
    kasList,
    kegiatanList,
    pengumumanList,
    umkmList,
    suratList,
    arsipList,
    selectedRt,
    setSelectedRt,
    addWarga,
    addKasTransaction,
    addKegiatan,
    addPengumuman,
    addUmkm,
    addSurat,
    updateSuratStatus,
    addArsip,
    getKasSummaryByRt
  };
}
