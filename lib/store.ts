'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Warga, KasRT, Kegiatan, Pengumuman, UMKM, Surat, Arsip,
} from './types';
import {
  DUMMY_WARGA, DUMMY_KAS, DUMMY_KEGIATAN, DUMMY_PENGUMUMAN,
  DUMMY_UMKM, DUMMY_SURAT, DUMMY_ARSIP,
} from './dummyData';
import { DATA_MODE } from './dataMode';

// ─── LocalStorage keys (hanya dipakai saat DEV mode) ─────────────────────────
const STORAGE_KEYS = {
  WARGA:      'sim_rw_warga_v1',
  KAS:        'sim_rw_kas_v1',
  KEGIATAN:   'sim_rw_kegiatan_v1',
  PENGUMUMAN: 'sim_rw_pengumuman_v1',
  UMKM:       'sim_rw_umkm_v1',
  SURAT:      'sim_rw_surat_v1',
  ARSIP:      'sim_rw_arsip_v1',
};

// ─── Generic API helper ────────────────────────────────────────────────────────
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request gagal');
  }
  return res.json() as Promise<T>;
}

// ─── Main Store Hook ──────────────────────────────────────────────────────────
export function useSimStore() {
  const [dataMode, setDataModeState] = useState<'dev' | 'live'>(DATA_MODE);
  const isLive = dataMode === 'live';

  const [isLoaded,        setIsLoaded]        = useState(false);
  const [isLoading,       setIsLoading]        = useState(false);
  const [error,           setError]            = useState<string | null>(null);
  const [wargaList,       setWargaList]        = useState<Warga[]>([]);
  const [kasList,         setKasList]          = useState<KasRT[]>([]);
  const [kegiatanList,    setKegiatanList]     = useState<Kegiatan[]>([]);
  const [pengumumanList,  setPengumumanList]   = useState<Pengumuman[]>([]);
  const [umkmList,        setUmkmList]         = useState<UMKM[]>([]);
  const [suratList,       setSuratList]        = useState<Surat[]>([]);
  const [arsipList,       setArsipList]        = useState<Arsip[]>([]);
  const [selectedRt,      setSelectedRt]       = useState<string>('002');

  // Load saved mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('sim_rw_data_mode') as 'dev' | 'live' | null;
    if (savedMode && savedMode !== dataMode) {
      setDataModeState(savedMode);
    }
  }, []);

  const setDataMode = (mode: 'dev' | 'live') => {
    localStorage.setItem('sim_rw_data_mode', mode);
    setDataModeState(mode);
  };

  // ─── Inisialisasi: DEV = localStorage, LIVE = API fetch ─────────────────────
  useEffect(() => {
    setIsLoaded(false);
    if (!isLive) {
      // DEV MODE: load dari localStorage, fallback ke dummy data
      try {
        const s = (key: string, fallback: unknown[]) => {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : fallback;
        };
        setWargaList(s(STORAGE_KEYS.WARGA, DUMMY_WARGA));
        setKasList(s(STORAGE_KEYS.KAS, DUMMY_KAS));
        setKegiatanList(s(STORAGE_KEYS.KEGIATAN, DUMMY_KEGIATAN));
        setPengumumanList(s(STORAGE_KEYS.PENGUMUMAN, DUMMY_PENGUMUMAN));
        setUmkmList(s(STORAGE_KEYS.UMKM, DUMMY_UMKM));
        setSuratList(s(STORAGE_KEYS.SURAT, DUMMY_SURAT));
        setArsipList(s(STORAGE_KEYS.ARSIP, DUMMY_ARSIP));
      } catch (e) {
        console.error('Gagal load localStorage:', e);
        // Fallback absolut ke dummy
        setWargaList(DUMMY_WARGA);
        setKasList(DUMMY_KAS);
        setKegiatanList(DUMMY_KEGIATAN);
        setPengumumanList(DUMMY_PENGUMUMAN);
        setUmkmList(DUMMY_UMKM);
        setSuratList(DUMMY_SURAT);
        setArsipList(DUMMY_ARSIP);
      } finally {
        setIsLoaded(true);
      }
    } else {
      // LIVE MODE: fetch semua data dari API
      setIsLoading(true);
      Promise.all([
        apiFetch<Warga[]>('/api/warga'),
        apiFetch<KasRT[]>('/api/kas'),
        apiFetch<Kegiatan[]>('/api/kegiatan'),
        apiFetch<Pengumuman[]>('/api/pengumuman'),
        apiFetch<UMKM[]>('/api/umkm'),
        apiFetch<Surat[]>('/api/surat'),
        apiFetch<Arsip[]>('/api/arsip'),
      ])
        .then(([warga, kas, kegiatan, pengumuman, umkm, surat, arsip]) => {
          setWargaList(warga);
          setKasList(kas);
          setKegiatanList(kegiatan);
          setPengumumanList(pengumuman);
          setUmkmList(umkm);
          setSuratList(surat);
          setArsipList(arsip);
        })
        .catch((e) => {
          console.error('Gagal fetch data dari API:', e);
          setError('Gagal terhubung ke database. Periksa koneksi & MONGO_URI.');
        })
        .finally(() => {
          setIsLoaded(true);
          setIsLoading(false);
        });
    }
  }, [isLive]);

  // ─── Helper simpan ke localStorage (DEV only) ─────────────────────────────
  const saveLocal = <T>(key: string, data: T[]) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
  };

  // ─── Fungsi refresh (LIVE) atau reload dummy (DEV) ──────────────────────────
  const refreshWarga = useCallback(async (rt?: string) => {
    if (!isLive) return;
    const url = rt && rt !== 'ALL' ? `/api/warga?rt=${rt}` : '/api/warga';
    const data = await apiFetch<Warga[]>(url);
    setWargaList(data);
  }, [isLive]);

  const refreshKas = useCallback(async (rt?: string) => {
    if (!isLive) return;
    const url = rt && rt !== 'ALL' ? `/api/kas?rt=${rt}` : '/api/kas';
    const data = await apiFetch<KasRT[]>(url);
    setKasList(data);
  }, [isLive]);

  // ─── WARGA ────────────────────────────────────────────────────────────────
  const addWarga = async (newWarga: Omit<Warga, 'id' | 'created_at'>) => {
    if (isLive) {
      const saved = await apiFetch<Warga>('/api/warga', {
        method: 'POST',
        body: JSON.stringify(newWarga),
      });
      setWargaList((prev) => [saved, ...prev]);
      return saved;
    } else {
      const item: Warga = { ...newWarga, id: 'w-' + Date.now(), created_at: new Date().toISOString() };
      const updated = [item, ...wargaList];
      setWargaList(updated);
      saveLocal(STORAGE_KEYS.WARGA, updated);
      return item;
    }
  };

  // ─── KAS ──────────────────────────────────────────────────────────────────
  const addKasTransaction = async (newKas: Omit<KasRT, 'id' | 'created_at'>) => {
    if (isLive) {
      const saved = await apiFetch<KasRT>('/api/kas', {
        method: 'POST',
        body: JSON.stringify(newKas),
      });
      setKasList((prev) => [saved, ...prev]);
      return saved;
    } else {
      const item: KasRT = { ...newKas, id: 'k-' + Date.now(), created_at: new Date().toISOString() };
      const updated = [item, ...kasList];
      setKasList(updated);
      saveLocal(STORAGE_KEYS.KAS, updated);
      return item;
    }
  };

  // ─── KEGIATAN ─────────────────────────────────────────────────────────────
  const addKegiatan = async (newItem: Omit<Kegiatan, 'id'>) => {
    if (isLive) {
      const saved = await apiFetch<Kegiatan>('/api/kegiatan', {
        method: 'POST',
        body: JSON.stringify(newItem),
      });
      setKegiatanList((prev) => [saved, ...prev]);
    } else {
      const item: Kegiatan = { ...newItem, id: 'g-' + Date.now() };
      const updated = [item, ...kegiatanList];
      setKegiatanList(updated);
      saveLocal(STORAGE_KEYS.KEGIATAN, updated);
    }
  };

  // ─── PENGUMUMAN ───────────────────────────────────────────────────────────
  const addPengumuman = async (newItem: Omit<Pengumuman, 'id'>) => {
    if (isLive) {
      const saved = await apiFetch<Pengumuman>('/api/pengumuman', {
        method: 'POST',
        body: JSON.stringify(newItem),
      });
      setPengumumanList((prev) => [saved, ...prev]);
    } else {
      const item: Pengumuman = { ...newItem, id: 'p-' + Date.now() };
      const updated = [item, ...pengumumanList];
      setPengumumanList(updated);
      saveLocal(STORAGE_KEYS.PENGUMUMAN, updated);
    }
  };

  // ─── UMKM ─────────────────────────────────────────────────────────────────
  const addUmkm = async (newItem: Omit<UMKM, 'id'>) => {
    if (isLive) {
      const saved = await apiFetch<UMKM>('/api/umkm', {
        method: 'POST',
        body: JSON.stringify(newItem),
      });
      setUmkmList((prev) => [saved, ...prev]);
    } else {
      const item: UMKM = { ...newItem, id: 'u-' + Date.now() };
      const updated = [item, ...umkmList];
      setUmkmList(updated);
      saveLocal(STORAGE_KEYS.UMKM, updated);
    }
  };

  // ─── SURAT ────────────────────────────────────────────────────────────────
  const addSurat = async (newItem: Omit<Surat, 'id' | 'no_surat' | 'tanggal_pengajuan' | 'status'>) => {
    if (isLive) {
      const saved = await apiFetch<Surat>('/api/surat', {
        method: 'POST',
        body: JSON.stringify(newItem),
      });
      setSuratList((prev) => [saved, ...prev]);
    } else {
      const item: Surat = {
        ...newItem,
        id: 's-' + Date.now(),
        no_surat: `SRT/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`,
        tanggal_pengajuan: new Date().toISOString().split('T')[0],
        status: 'Pending',
      };
      const updated = [item, ...suratList];
      setSuratList(updated);
      saveLocal(STORAGE_KEYS.SURAT, updated);
    }
  };

  const updateSuratStatus = async (id: string, status: Surat['status']) => {
    if (isLive) {
      await apiFetch('/api/surat', {
        method: 'PATCH',
        body: JSON.stringify({ id, status }),
      });
      setSuratList((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    } else {
      const updated = suratList.map((s) => (s.id === id ? { ...s, status } : s));
      setSuratList(updated);
      saveLocal(STORAGE_KEYS.SURAT, updated);
    }
  };

  // ─── ARSIP ────────────────────────────────────────────────────────────────
  const addArsip = async (newItem: Omit<Arsip, 'id' | 'tanggal_upload'>) => {
    if (isLive) {
      const saved = await apiFetch<Arsip>('/api/arsip', {
        method: 'POST',
        body: JSON.stringify(newItem),
      });
      setArsipList((prev) => [saved, ...prev]);
    } else {
      const item: Arsip = {
        ...newItem,
        id: 'a-' + Date.now(),
        tanggal_upload: new Date().toISOString().split('T')[0],
      };
      const updated = [item, ...arsipList];
      setArsipList(updated);
      saveLocal(STORAGE_KEYS.ARSIP, updated);
    }
  };


  // ─── HAPUS DATA (GENERIC) ─────────────────────────────────────────────────
  const deleteData = async (module: 'warga'|'kas'|'kegiatan'|'pengumuman'|'umkm'|'surat'|'arsip', id: string) => {
    if (isLive) {
      await apiFetch(`/api/${module}?id=${id}`, { method: 'DELETE' });
    }
    
    // Update State & LocalStorage
    switch(module) {
      case 'warga':
        const updatedWarga = wargaList.filter(x => x.id !== id);
        setWargaList(updatedWarga);
        if (!isLive) saveLocal(STORAGE_KEYS.WARGA, updatedWarga);
        break;
      case 'kas':
        const updatedKas = kasList.filter(x => x.id !== id);
        setKasList(updatedKas);
        if (!isLive) saveLocal(STORAGE_KEYS.KAS, updatedKas);
        break;
      case 'kegiatan':
        const updatedKeg = kegiatanList.filter(x => x.id !== id);
        setKegiatanList(updatedKeg);
        if (!isLive) saveLocal(STORAGE_KEYS.KEGIATAN, updatedKeg);
        break;
      case 'pengumuman':
        const updatedPeng = pengumumanList.filter(x => x.id !== id);
        setPengumumanList(updatedPeng);
        if (!isLive) saveLocal(STORAGE_KEYS.PENGUMUMAN, updatedPeng);
        break;
      case 'umkm':
        const updatedUmkm = umkmList.filter(x => x.id !== id);
        setUmkmList(updatedUmkm);
        if (!isLive) saveLocal(STORAGE_KEYS.UMKM, updatedUmkm);
        break;
      case 'surat':
        const updatedSurat = suratList.filter(x => x.id !== id);
        setSuratList(updatedSurat);
        if (!isLive) saveLocal(STORAGE_KEYS.SURAT, updatedSurat);
        break;
      case 'arsip':
        const updatedArsip = arsipList.filter(x => x.id !== id);
        setArsipList(updatedArsip);
        if (!isLive) saveLocal(STORAGE_KEYS.ARSIP, updatedArsip);
        break;
    }
  };

  // ─── Kalkulasi Saldo per Pos Kas ──────────────────────────────────────────
  const getKasSummaryByRt = (rtFilter: string) => {
    const filtered = rtFilter === 'ALL' ? kasList : kasList.filter((k) => k.rt === rtFilter);

    const posBalance: Record<string, number> & {
      totalMasuk: number; totalKeluar: number; saldoAkhir: number;
    } = {
      'Kas RT': 0, 'Dana Sosial': 0, 'Satpam & Sampah': 0, '17an': 0, 'THR': 0,
      totalMasuk: 0, totalKeluar: 0, saldoAkhir: 0,
    };

    filtered.forEach((item) => {
      const amount = Number(item.jumlah);
      if (item.jenis === 'Masuk') {
        posBalance[item.pos] = (posBalance[item.pos] ?? 0) + amount;
        posBalance.totalMasuk += amount;
      } else {
        posBalance[item.pos] = (posBalance[item.pos] ?? 0) - amount;
        posBalance.totalKeluar += amount;
      }
    });

    posBalance.saldoAkhir = posBalance.totalMasuk - posBalance.totalKeluar;
    return posBalance;
  };

  return {
    // State
    isLoaded,
    isLoading,
    error,
    dataMode,
    setDataMode,
    // Data
    wargaList,
    kasList,
    kegiatanList,
    pengumumanList,
    umkmList,
    suratList,
    arsipList,
    // Navigation
    selectedRt,
    setSelectedRt,
    // Actions
    addWarga,
    addKasTransaction,
    addKegiatan,
    addPengumuman,
    addUmkm,
    addSurat,
    updateSuratStatus,
    deleteData,
    addArsip,
    // Refresh (live only)
    refreshWarga,
    refreshKas,
    // Kalkulasi
    getKasSummaryByRt,
  };
}
