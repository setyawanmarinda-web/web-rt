'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Warga, KasRT, Kegiatan, Pengumuman, UMKM, Surat, Arsip,
} from './types';
import { DATA_MODE } from './dataMode';

// ─── LocalStorage keys (hanya dipakai saat DEV mode) ─────────────────────────
const STORAGE_KEYS = {
  WARGA:      'sim_rw_warga_v2',
  KAS:        'sim_rw_kas_v2',
  KEGIATAN:   'sim_rw_kegiatan_v2',
  PENGUMUMAN: 'sim_rw_pengumuman_v2',
  UMKM:       'sim_rw_umkm_v2',
  SURAT:      'sim_rw_surat_v2',
  ARSIP:      'sim_rw_arsip_v2',
};

const LEGACY_STORAGE_KEYS = [
  'sim_rw_warga_v1',
  'sim_rw_kas_v1',
  'sim_rw_kegiatan_v1',
  'sim_rw_pengumuman_v1',
  'sim_rw_umkm_v1',
  'sim_rw_surat_v1',
  'sim_rw_arsip_v1',
];

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
      // DEV MODE: load dari localStorage, fallback ke data kosong
      try {
        LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
        const s = (key: string, fallback: unknown[]) => {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : fallback;
        };
        setWargaList(s(STORAGE_KEYS.WARGA, []));
        setKasList(s(STORAGE_KEYS.KAS, []));
        setKegiatanList(s(STORAGE_KEYS.KEGIATAN, []));
        setPengumumanList(s(STORAGE_KEYS.PENGUMUMAN, []));
        setUmkmList(s(STORAGE_KEYS.UMKM, []));
        setSuratList(s(STORAGE_KEYS.SURAT, []));
        setArsipList(s(STORAGE_KEYS.ARSIP, []));
      } catch (e) {
        console.error('Gagal load localStorage:', e);
        setWargaList([]);
        setKasList([]);
        setKegiatanList([]);
        setPengumumanList([]);
        setUmkmList([]);
        setSuratList([]);
        setArsipList([]);
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

  const updateData = async (
    module: 'warga'|'kas'|'kegiatan'|'pengumuman'|'umkm'|'surat'|'arsip',
    id: string,
    changes: Record<string, unknown>,
  ) => {
    if (isLive) {
      const updated = await apiFetch<Record<string, unknown>>(`/api/${module}`, {
        method: 'PATCH',
        body: JSON.stringify({ id, ...changes }),
      });
      const replace = <T extends { id: string }>(list: T[], setList: (value: T[]) => void) => {
        setList(list.map((item) => item.id === id ? { ...item, ...updated, id } : item));
      };
      switch (module) {
        case 'warga': replace(wargaList, setWargaList); break;
        case 'kas': replace(kasList, setKasList); break;
        case 'kegiatan': replace(kegiatanList, setKegiatanList); break;
        case 'pengumuman': replace(pengumumanList, setPengumumanList); break;
        case 'umkm': replace(umkmList, setUmkmList); break;
        case 'surat': replace(suratList, setSuratList); break;
        case 'arsip': replace(arsipList, setArsipList); break;
      }
      return;
    }

    const replaceLocal = <T extends { id: string }>(list: T[], setList: (value: T[]) => void, key: string) => {
      const updated = list.map((item) => item.id === id ? { ...item, ...changes } as T : item);
      setList(updated);
      saveLocal(key, updated);
    };
    switch (module) {
      case 'warga': replaceLocal(wargaList, setWargaList, STORAGE_KEYS.WARGA); break;
      case 'kas': replaceLocal(kasList, setKasList, STORAGE_KEYS.KAS); break;
      case 'kegiatan': replaceLocal(kegiatanList, setKegiatanList, STORAGE_KEYS.KEGIATAN); break;
      case 'pengumuman': replaceLocal(pengumumanList, setPengumumanList, STORAGE_KEYS.PENGUMUMAN); break;
      case 'umkm': replaceLocal(umkmList, setUmkmList, STORAGE_KEYS.UMKM); break;
      case 'surat': replaceLocal(suratList, setSuratList, STORAGE_KEYS.SURAT); break;
      case 'arsip': replaceLocal(arsipList, setArsipList, STORAGE_KEYS.ARSIP); break;
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
      'Kas RT': 0, 'Sampah & Keamanan': 0, 'Dana Sosial': 0,
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
    updateData,
    deleteData,
    addArsip,
    // Refresh (live only)
    refreshWarga,
    refreshKas,
    // Kalkulasi
    getKasSummaryByRt,
  };
}
