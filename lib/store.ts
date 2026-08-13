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
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [kasList, setKasList] = useState<KasRT[]>([]);
  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([]);
  const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>([]);
  const [umkmList, setUmkmList] = useState<UMKM[]>([]);
  const [suratList, setSuratList] = useState<Surat[]>([]);
  const [arsipList, setArsipList] = useState<Arsip[]>([]);
  const [selectedRt, setSelectedRt] = useState<string>('002'); // Default Panel RT 002

  // Fetch all data from MongoDB with Offline fallback
  useEffect(() => {
    async function loadAllData() {
      try {
        const [
          resWarga,
          resKas,
          resKegiatan,
          resPengumuman,
          resUmkm,
          resSurat,
          resArsip
        ] = await Promise.all([
          fetch(`/api/warga?rt=${selectedRt}`),
          fetch(`/api/kas?rt=${selectedRt}`),
          fetch(`/api/kegiatan?rt=${selectedRt}`),
          fetch(`/api/pengumuman?rt=${selectedRt}`),
          fetch(`/api/umkm?rt=${selectedRt}`),
          fetch(`/api/surat?rt=${selectedRt}`),
          fetch('/api/arsip')
        ]);

        const dataWarga = await resWarga.json();
        const dataKas = await resKas.json();
        const dataKegiatan = await resKegiatan.json();
        const dataPengumuman = await resPengumuman.json();
        const dataUmkm = await resUmkm.json();
        const dataSurat = await resSurat.json();
        const dataArsip = await resArsip.json();

        // Check if DB returned errors or fallback
        if (Array.isArray(dataWarga)) {
          setWargaList(dataWarga);
          localStorage.setItem(STORAGE_KEYS.WARGA, JSON.stringify(dataWarga));
        }
        if (Array.isArray(dataKas)) {
          setKasList(dataKas);
          localStorage.setItem(STORAGE_KEYS.KAS, JSON.stringify(dataKas));
        }
        if (Array.isArray(dataKegiatan)) {
          setKegiatanList(dataKegiatan);
          localStorage.setItem(STORAGE_KEYS.KEGIATAN, JSON.stringify(dataKegiatan));
        }
        if (Array.isArray(dataPengumuman)) {
          setPengumumanList(dataPengumuman);
          localStorage.setItem(STORAGE_KEYS.PENGUMUMAN, JSON.stringify(dataPengumuman));
        }
        if (Array.isArray(dataUmkm)) {
          setUmkmList(dataUmkm);
          localStorage.setItem(STORAGE_KEYS.UMKM, JSON.stringify(dataUmkm));
        }
        if (Array.isArray(dataSurat)) {
          setSuratList(dataSurat);
          localStorage.setItem(STORAGE_KEYS.SURAT, JSON.stringify(dataSurat));
        }
        if (Array.isArray(dataArsip)) {
          setArsipList(dataArsip);
          localStorage.setItem(STORAGE_KEYS.ARSIP, JSON.stringify(dataArsip));
        }
      } catch (err) {
        console.warn('⚠️ Gagal fetch dari MongoDB, memuat data dari localStorage / dummy...', err);
        
        // Offline / Fallback ke localStorage
        const storedWarga = localStorage.getItem(STORAGE_KEYS.WARGA);
        setWargaList(storedWarga ? JSON.parse(storedWarga) : INITIAL_WARGA);

        const storedKas = localStorage.getItem(STORAGE_KEYS.KAS);
        setKasList(storedKas ? JSON.parse(storedKas) : INITIAL_KAS);

        const storedKegiatan = localStorage.getItem(STORAGE_KEYS.KEGIATAN);
        setKegiatanList(storedKegiatan ? JSON.parse(storedKegiatan) : INITIAL_KEGIATAN);

        const storedPengumuman = localStorage.getItem(STORAGE_KEYS.PENGUMUMAN);
        setPengumumanList(storedPengumuman ? JSON.parse(storedPengumuman) : INITIAL_PENGUMUMAN);

        const storedUmkm = localStorage.getItem(STORAGE_KEYS.UMKM);
        setUmkmList(storedUmkm ? JSON.parse(storedUmkm) : INITIAL_UMKM);

        const storedSurat = localStorage.getItem(STORAGE_KEYS.SURAT);
        setSuratList(storedSurat ? JSON.parse(storedSurat) : INITIAL_SURAT);

        const storedArsip = localStorage.getItem(STORAGE_KEYS.ARSIP);
        setArsipList(storedArsip ? JSON.parse(storedArsip) : INITIAL_ARSIP);
      } finally {
        setIsLoaded(true);
      }
    }

    loadAllData();
  }, [selectedRt]);

  // Save changes to MongoDB + LocalStorage
  const addWarga = async (newWarga: Omit<Warga, 'id' | 'created_at'>) => {
    try {
      const res = await fetch('/api/warga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWarga)
      });
      const saved = await res.json();
      if (saved.error) throw new Error(saved.error);

      // Normalisasikan format _id MongoDB ke id string
      const item: Warga = { ...saved, id: saved._id || saved.id };
      const updated = [item, ...wargaList];
      setWargaList(updated);
      localStorage.setItem(STORAGE_KEYS.WARGA, JSON.stringify(updated));
      return item;
    } catch (err) {
      console.warn('⚠️ Gagal simpan ke MongoDB, menyimpan lokal...', err);
      const item: Warga = {
        ...newWarga,
        id: 'w-' + Date.now(),
        created_at: new Date().toISOString()
      };
      const updated = [item, ...wargaList];
      setWargaList(updated);
      localStorage.setItem(STORAGE_KEYS.WARGA, JSON.stringify(updated));
      return item;
    }
  };

  const addKasTransaction = async (newKas: Omit<KasRT, 'id' | 'created_at'>) => {
    try {
      const res = await fetch('/api/kas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKas)
      });
      const saved = await res.json();
      if (saved.error) throw new Error(saved.error);

      const item: KasRT = { ...saved, id: saved._id || saved.id };
      const updated = [item, ...kasList];
      setKasList(updated);
      localStorage.setItem(STORAGE_KEYS.KAS, JSON.stringify(updated));
      return item;
    } catch (err) {
      console.warn('⚠️ Gagal simpan ke MongoDB, menyimpan lokal...', err);
      const item: KasRT = {
        ...newKas,
        id: 'k-' + Date.now(),
        created_at: new Date().toISOString()
      };
      const updated = [item, ...kasList];
      setKasList(updated);
      localStorage.setItem(STORAGE_KEYS.KAS, JSON.stringify(updated));
      return item;
    }
  };

  const addKegiatan = async (newItem: Omit<Kegiatan, 'id'>) => {
    try {
      const res = await fetch('/api/kegiatan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      const saved = await res.json();
      
      const item: Kegiatan = { ...saved, id: saved._id || saved.id };
      const updated = [item, ...kegiatanList];
      setKegiatanList(updated);
      localStorage.setItem(STORAGE_KEYS.KEGIATAN, JSON.stringify(updated));
    } catch (err) {
      const item: Kegiatan = { ...newItem, id: 'g-' + Date.now() };
      const updated = [item, ...kegiatanList];
      setKegiatanList(updated);
      localStorage.setItem(STORAGE_KEYS.KEGIATAN, JSON.stringify(updated));
    }
  };

  const addPengumuman = async (newItem: Omit<Pengumuman, 'id'>) => {
    try {
      const res = await fetch('/api/pengumuman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      const saved = await res.json();

      const item: Pengumuman = { ...saved, id: saved._id || saved.id };
      const updated = [item, ...pengumumanList];
      setPengumumanList(updated);
      localStorage.setItem(STORAGE_KEYS.PENGUMUMAN, JSON.stringify(updated));
    } catch (err) {
      const item: Pengumuman = { ...newItem, id: 'p-' + Date.now() };
      const updated = [item, ...pengumumanList];
      setPengumumanList(updated);
      localStorage.setItem(STORAGE_KEYS.PENGUMUMAN, JSON.stringify(updated));
    }
  };

  const addUmkm = async (newItem: Omit<UMKM, 'id'>) => {
    try {
      const res = await fetch('/api/umkm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      const saved = await res.json();

      const item: UMKM = { ...saved, id: saved._id || saved.id };
      const updated = [item, ...umkmList];
      setUmkmList(updated);
      localStorage.setItem(STORAGE_KEYS.UMKM, JSON.stringify(updated));
    } catch (err) {
      const item: UMKM = { ...newItem, id: 'u-' + Date.now() };
      const updated = [item, ...umkmList];
    setUmkmList(updated);
    localStorage.setItem(STORAGE_KEYS.UMKM, JSON.stringify(updated));
  };

  const addSurat = async (newItem: Omit<Surat, 'id' | 'no_surat' | 'tanggal_pengajuan' | 'status'>) => {
    try {
      const res = await fetch('/api/surat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      const saved = await res.json();

      const item: Surat = { ...saved, id: saved._id || saved.id };
      const updated = [item, ...suratList];
      setSuratList(updated);
      localStorage.setItem(STORAGE_KEYS.SURAT, JSON.stringify(updated));
    } catch (err) {
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
    }
  };

  const updateSuratStatus = async (id: string, status: Surat['status']) => {
    try {
      const res = await fetch(`/api/surat/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const saved = await res.json();

      const updated = suratList.map(s => (s.id === id || (s as any)._id === id) ? { ...s, status: saved.status || status } : s);
      setSuratList(updated);
      localStorage.setItem(STORAGE_KEYS.SURAT, JSON.stringify(updated));
    } catch (err) {
      const updated = suratList.map(s => s.id === id ? { ...s, status } : s);
      setSuratList(updated);
      localStorage.setItem(STORAGE_KEYS.SURAT, JSON.stringify(updated));
    }
  };

  const addArsip = async (newItem: Omit<Arsip, 'id' | 'tanggal_upload'>) => {
    try {
      const res = await fetch('/api/arsip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      const saved = await res.json();

      const item: Arsip = { ...saved, id: saved._id || saved.id };
      const updated = [item, ...arsipList];
      setArsipList(updated);
      localStorage.setItem(STORAGE_KEYS.ARSIP, JSON.stringify(updated));
    } catch (err) {
      const item: Arsip = {
        ...newItem,
        id: 'a-' + Date.now(),
        tanggal_upload: new Date().toISOString().split('T')[0]
      };
      const updated = [item, ...arsipList];
      setArsipList(updated);
      localStorage.setItem(STORAGE_KEYS.ARSIP, JSON.stringify(updated));
    }
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
