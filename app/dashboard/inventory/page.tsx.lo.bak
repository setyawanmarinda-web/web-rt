'use client';

import { useEffect, useState } from 'react';
import DatePickerField from '@/components/DatePickerField';
import { Package, Plus, RefreshCw, Search, X, History, Minus, Pencil, Trash2 } from 'lucide-react';
import type { Inventory, InventoryHistory } from '@/lib/types';

export default function InventoryPage() {
  const [items, setItems] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [actionType, setActionType] = useState<
    'Masuk' | 'Dipakai' | 'Rusak' | 'Hilang' | 'Riwayat' | 'Koreksi' | null
  >(null);
  const [actionJumlah, setActionJumlah] = useState(1);
  const [actionKeterangan, setActionKeterangan] = useState('');
  const [actionTanggal, setActionTanggal] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [historyItems, setHistoryItems] = useState<InventoryHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [correctionHistory, setCorrectionHistory] = useState<InventoryHistory | null>(null);
  const [correctionJumlah, setCorrectionJumlah] = useState(1);
  const [correctionKeterangan, setCorrectionKeterangan] = useState('');
  const [correctionSaving, setCorrectionSaving] = useState(false);
  const [form, setForm] = useState({
    nama_barang: '',
    tipe: 'Tidak Habis Pakai' as Inventory['tipe'],
    stok_total: 1,
    rt: '002',
  });

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory');
      if (!res.ok) throw new Error('Gagal mengambil data inventory');

      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const filteredItems = items.filter((item) =>
    item.nama_barang.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nama_barang.trim()) {
      alert('Nama barang wajib diisi.');
      return;
    }

    if (form.stok_total < 1) {
      alert('Jumlah stok minimal 1.');
      return;
    }

    try {
      setSaving(true);

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama_barang: form.nama_barang.trim(),
          tipe: form.tipe,
          stok_total: Number(form.stok_total),
          stok_tersedia: Number(form.stok_total),
          stok_dipinjam: 0,
          status: 'Tersedia',
          rt: form.rt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Gagal menambahkan barang.');
      }

      setShowAddForm(false);
      setForm({
        nama_barang: '',
        tipe: 'Tidak Habis Pakai',
        stok_total: 1,
        rt: '002',
      });

      await loadInventory();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Gagal menambahkan barang.');
    } finally {
      setSaving(false);
    }
  };

  const openAction = (
    item: Inventory,
    action: 'Masuk' | 'Dipakai' | 'Rusak' | 'Hilang' | 'Riwayat' | 'Koreksi'
  ) => {
    setSelectedItem(item);
    setActionType(action);
    setActionJumlah(1);
    setActionKeterangan('');
    setActionTanggal(new Date().toISOString().split('T')[0]);
  };

  const handleCorrection = async () => {
    if (!correctionHistory) return;

    const jumlahBaru = Number(correctionJumlah);

    if (!Number.isInteger(jumlahBaru) || jumlahBaru <= 0) {
      alert('Jumlah baru harus berupa angka bulat lebih dari 0.');
      return;
    }

    if (jumlahBaru === correctionHistory.jumlah) {
      alert('Jumlah baru sama dengan jumlah sebelumnya.');
      return;
    }

    try {
      setCorrectionSaving(true);

      const res = await fetch('/api/inventory/history', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: correctionHistory.id,
          jumlah_baru: jumlahBaru,
          dikoreksi_oleh: 'Admin RT',
          koreksi_keterangan: correctionKeterangan.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal melakukan koreksi.');
      }

      setCorrectionHistory(null);
      setCorrectionJumlah(1);
      setCorrectionKeterangan('');

      await loadInventory();

      if (selectedItem) {
        await loadHistory(selectedItem.id);
      }

      alert('Koreksi berhasil disimpan.');
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : 'Gagal melakukan koreksi inventory.'
      );
    } finally {
      setCorrectionSaving(false);
    }
  };

  const loadHistory = async (barangId: string) => {
    try {
      setHistoryLoading(true);

      const res = await fetch(
        `/api/inventory/history?barang_id=${encodeURIComponent(barangId)}`
      );

      if (!res.ok) {
        throw new Error('Gagal mengambil riwayat inventory.');
      }

      const data = await res.json();
      setHistoryItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setHistoryItems([]);
      alert(
        error instanceof Error
          ? error.message
          : 'Gagal mengambil riwayat inventory.'
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeAction = () => {
    setSelectedItem(null);
    setActionType(null);
    setActionJumlah(1);
    setActionKeterangan('');
    setActionTanggal(new Date().toISOString().split('T')[0]);
  };

  const handleStockAction = async (
    jenis: 'Masuk' | 'Dipakai' | 'Rusak' | 'Hilang',
    jumlah: number,
    keterangan: string
  ) => {
    if (!selectedItem) return;

    try {
      setSaving(true);

      const res = await fetch('/api/inventory/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barang_id: selectedItem.id,
          jenis,
          jumlah,
          keterangan: keterangan.trim(),
          dilakukan_oleh: 'Admin RT',
          tanggal: actionTanggal
            ? new Date(`${actionTanggal}T00:00:00`).toISOString()
            : new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Gagal menyimpan perubahan stok.');
      }

      setSelectedItem(null);
      setActionType(null);

      await loadInventory();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan perubahan stok.'
      );
    } finally {
      setSaving(false);
    }
  };

  const totalItems = items.length;
  const totalAvailable = items.reduce(
    (sum, item) => sum + item.stok_tersedia,
    0
  );
  const totalBorrowed = items.reduce(
    (sum, item) => sum + item.stok_dipinjam,
    0
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Inventory
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Kelola barang milik RT dan riwayat penggunaannya.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadInventory}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Barang
          </button>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Tambah Barang
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Tambahkan barang baru ke inventory RT.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Nama Barang
                </label>
                <input
                  type="text"
                  value={form.nama_barang}
                  onChange={(e) =>
                    setForm({ ...form, nama_barang: e.target.value })
                  }
                  placeholder="Contoh: Kursi Plastik"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Tipe Barang
                </label>
                <select
                  value={form.tipe}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tipe: e.target.value as Inventory['tipe'],
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                >
                  <option value="Tidak Habis Pakai">Tidak Habis Pakai</option>
                  <option value="Habis Pakai">Habis Pakai</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Jumlah Stok
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.stok_total}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        stok_total: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    RT
                  </label>
                  <select
                    value={form.rt}
                    onChange={(e) =>
                      setForm({ ...form, rt: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  >
                    <option value="001">RT 001</option>
                    <option value="002">RT 002</option>
                    <option value="003">RT 003</option>
                    <option value="004">RT 004</option>
                    <option value="005">RT 005</option>
                    <option value="006">RT 006</option>
                    <option value="007">RT 007</option>
                    <option value="008">RT 008</option>
                    <option value="009">RT 009</option>
                    <option value="010">RT 010</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Action Modal */}
      {selectedItem && actionType && actionType !== 'Riwayat' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {actionType === 'Masuk'
                    ? 'Tambah Stok'
                    : actionType === 'Dipakai'
                    ? 'Stok Keluar / Dipakai'
                    : actionType === 'Rusak'
                    ? 'Tandai Barang Rusak'
                    : 'Tandai Barang Hilang'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {selectedItem.nama_barang}
                </p>
              </div>

              <button
                type="button"
                onClick={closeAction}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Jumlah
                </label>
                <input
                  type="number"
                  min="1"
                  max={
                    actionType === 'Masuk'
                      ? undefined
                      : selectedItem.stok_tersedia
                  }
                  value={actionJumlah}
                  onChange={(e) =>
                    setActionJumlah(Number(e.target.value))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />

                {actionType !== 'Masuk' && (
                  <p className="text-xs text-slate-400 mt-2">
                    Stok tersedia: {selectedItem.stok_tersedia}
                  </p>
                )}
              </div>

              <DatePickerField
                label="Tanggal"
                value={actionTanggal}
                onChange={setActionTanggal}
                required
                colorTheme="emerald"
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Keterangan
                </label>
                <textarea
                  value={actionKeterangan}
                  onChange={(e) =>
                    setActionKeterangan(e.target.value)
                  }
                  rows={3}
                  placeholder={
                    actionType === 'Masuk'
                      ? 'Contoh: Pembelian baru'
                      : actionType === 'Dipakai'
                      ? 'Contoh: Dipakai untuk kegiatan RT'
                      : actionType === 'Rusak'
                      ? 'Contoh: Kursi patah'
                      : 'Contoh: Barang hilang saat kegiatan'
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAction}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={saving || actionJumlah < 1}
                  onClick={() => {
                    if (
                      actionType === 'Masuk' ||
                      actionType === 'Dipakai' ||
                      actionType === 'Rusak' ||
                      actionType === 'Hilang'
                    ) {
                      handleStockAction(
                        actionType,
                        actionJumlah,
                        actionKeterangan
                      );
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {selectedItem && actionType === 'Riwayat' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Riwayat Inventory
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {selectedItem.nama_barang}
                </p>
              </div>

              <button
                type="button"
                onClick={closeAction}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[65vh] overflow-y-auto">
              {historyLoading ? (
                <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  Memuat riwayat...
                </div>
              ) : historyItems.length === 0 ? (
                <div className="py-12 text-center">
                  <History className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Belum ada riwayat
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Belum ada perubahan stok untuk barang ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyItems.map((history) => (
                    <div
                      key={history.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {history.jenis}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {history.keterangan || 'Tidak ada keterangan'}
                          </p>
                        </div>

                        <span className="shrink-0 font-bold text-slate-900 dark:text-white">
                          {history.jumlah} unit
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span>
                            {new Date(history.tanggal).toLocaleString('id-ID')}
                          </span>
                          <span>
                            Oleh: {history.dilakukan_oleh}
                          </span>
                        </div>

                        {!history.dikoreksi && (
                          <button
                            type="button"
                            onClick={() => {
                              setCorrectionHistory(history);
                              setCorrectionJumlah(history.jumlah);
                              setCorrectionKeterangan('');
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                          >
                            Koreksi
                          </button>
                        )}

                        {history.dikoreksi && (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Sudah dikoreksi
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Correction Modal */}
      {correctionHistory && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Koreksi Riwayat
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {selectedItem?.nama_barang}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCorrectionHistory(null);
                  setCorrectionJumlah(1);
                  setCorrectionKeterangan('');
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Transaksi asli
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {correctionHistory.jenis} · {correctionHistory.jumlah} unit
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2">
                  {new Date(correctionHistory.tanggal).toLocaleString('id-ID')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Jumlah yang benar
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={correctionJumlah}
                  onChange={(e) => setCorrectionJumlah(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Alasan koreksi
                </label>
                <textarea
                  rows={3}
                  value={correctionKeterangan}
                  onChange={(e) => setCorrectionKeterangan(e.target.value)}
                  placeholder="Contoh: Salah input, seharusnya 2 unit rusak."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Koreksi tidak menghapus riwayat asli. Sistem akan mencatat jumlah sebelumnya, jumlah yang benar, waktu koreksi, dan petugas yang melakukan koreksi.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCorrectionHistory(null);
                    setCorrectionJumlah(1);
                    setCorrectionKeterangan('');
                  }}
                  disabled={correctionSaving}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleCorrection}
                  disabled={correctionSaving}
                  className="flex-1 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold disabled:opacity-50"
                >
                  {correctionSaving ? 'Menyimpan...' : 'Simpan Koreksi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Jenis Barang
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {totalItems}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Stok Tersedia
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-500">
            {totalAvailable}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sedang Dipinjam
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-500">
            {totalBorrowed}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari barang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="text-left px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">
                  Barang
                </th>
                <th className="text-left px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">
                  Tipe
                </th>
                <th className="text-center px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">
                  Total
                </th>
                <th className="text-center px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">
                  Tersedia
                </th>
                <th className="text-center px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">
                  Dipinjam
                </th>
                <th className="text-center px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">
                  Status
                </th>
                <th className="text-center px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-slate-400"
                  >
                    Memuat data inventory...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-slate-400"
                  >
                    Belum ada barang inventory.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {item.nama_barang}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                      {item.tipe}
                    </td>

                    <td className="px-5 py-4 text-center text-slate-700 dark:text-slate-300">
                      {item.stok_total}
                    </td>

                    <td className="px-5 py-4 text-center font-semibold text-emerald-500">
                      {item.stok_tersedia}
                    </td>

                    <td className="px-5 py-4 text-center font-semibold text-amber-500">
                      {item.stok_dipinjam}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openAction(item, 'Masuk')}
                          title="Tambah Stok"
                          className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-500/10"
                        >
                          <Plus className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openAction(item, 'Dipakai')}
                          title="Stok Keluar / Dipakai"
                          className="p-2 rounded-lg text-amber-500 hover:bg-amber-500/10"
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openAction(item, 'Rusak')}
                          title="Tandai Rusak"
                          className="p-2 rounded-lg text-orange-500 hover:bg-orange-500/10"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openAction(item, 'Hilang')}
                          title="Tandai Hilang"
                          className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            openAction(item, 'Riwayat');
                            loadHistory(item.id);
                          }}
                          title="Lihat Riwayat"
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
