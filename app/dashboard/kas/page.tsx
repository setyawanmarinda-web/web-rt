'use client';

import React, { useState } from 'react';
import { useSimStore } from '@/lib/store';
import { KasRT, Warga } from '@/lib/types';
import {
  Wallet, TrendingUp, TrendingDown, Users, PlusCircle, UserPlus,
  HelpCircle, CreditCard, Sparkles, CheckCircle2, ShieldCheck, ArrowUpRight, ArrowDownRight, Tag
} from 'lucide-react';

export default function KasDashboardPage() {
  const { selectedRt, kasList, wargaList, addKasTransaction, addWarga, getKasSummaryByRt } = useSimStore();

  const summary = getKasSummaryByRt(selectedRt);

  // Form State Catat Transaksi Iuran (Dengan Fitur Skenario Lapangan Khusus)
  const [transType, setTransType] = useState<'Masuk' | 'Keluar'>('Masuk');
  const [selectedPos, setSelectedPos] = useState<KasRT['pos']>('Kas RT');
  const [amount, setAmount] = useState<number>(55000);
  const [metode, setMetode] = useState<KasRT['metode']>('Transfer');
  const [namaPembayar, setNamaPembayar] = useState<string>('');
  const [namaPerantara, setNamaPerantara] = useState<string>('');
  const [rincianSplit, setRincianSplit] = useState<string>('');
  const [diskonKeringanan, setDiskonKeringanan] = useState<boolean>(false);
  const [catatanText, setCatatanText] = useState<string>('');

  // Form State Tambah Warga
  const [nik, setNik] = useState<string>('');
  const [namaWarga, setNamaWarga] = useState<string>('');
  const [statusTinggal, setStatusTinggal] = useState<'Tetap' | 'Kontrak'>('Tetap');
  const [rtWarga, setRtWarga] = useState<string>(selectedRt === 'ALL' ? '002' : selectedRt);

  // Toast feedback
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Preset Handler Nominal Iuran Standard & Skenario Keringanan
  const applyPresetStandard = () => {
    setAmount(55000);
    setSelectedPos('Kas RT');
    setDiskonKeringanan(false);
  };

  const applyPresetDiskonJandaLansia = () => {
    setAmount(28000);
    setSelectedPos('Satpam & Sampah');
    setDiskonKeringanan(true);
    setCatatanText('Keringanan iuran Lansia/Janda kurang mampu (Pos Satpam & Sampah)');
  };

  // Submit Transaction
  const handleKasSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return alert('Nominal harus lebih besar dari 0');

    let fullKeterangan = `[${selectedPos}] ${catatanText || (transType === 'Masuk' ? `Iuran Warga (${namaPembayar})` : 'Pengeluaran Operasional RT')}`;

    if (metode === 'Titipan' && namaPerantara) {
      fullKeterangan += ` - Titip via ${namaPerantara}`;
    } else if (metode === 'Split' && rincianSplit) {
      fullKeterangan += ` (${rincianSplit})`;
    }

    addKasTransaction({
      keterangan: fullKeterangan,
      jumlah: Number(amount),
      jenis: transType,
      pos: selectedPos,
      rt: selectedRt === 'ALL' ? '002' : selectedRt,
      metode: metode,
      nama_pembayar: namaPembayar,
      nama_perantara: namaPerantara,
      rincian_split: rincianSplit,
      diskon_keringanan: diskonKeringanan
    });

    showToast(`✅ Transaksi ${transType} Rp ${Number(amount).toLocaleString('id-ID')} berhasil dicatat!`);

    // Reset Form
    setCatatanText('');
    setNamaPembayar('');
    setNamaPerantara('');
    setRincianSplit('');
  };

  // Submit New Warga
  const handleWargaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nik || !namaWarga) return alert('NIK dan Nama Lengkap wajib diisi');

    addWarga({
      nik,
      nama_lengkap: namaWarga,
      status_tinggal: statusTinggal,
      rt: rtWarga,
      rw: '012'
    });

    showToast(`✅ Data warga "${namaWarga}" berhasil ditambahkan!`);
    setNik('');
    setNamaWarga('');
  };

  const filteredKas = selectedRt === 'ALL' ? kasList : kasList.filter(k => k.rt === selectedRt);

  return (
    <div className="space-y-8">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-white tracking-tight">Kas & Iuran Warga</h1>
            <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Panel RT {selectedRt}
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            Pencatatan iuran terpisah 5 pos (Kas RT, Dansos, Satpam & Sampah, 17an, THR) & fleksibilitas skenario transaksi lapangan.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">Total Saldo Bersih</span>
            <span className="text-xl font-extrabold text-emerald-400">
              Rp {summary.saldoAkhir.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Metric Cards - 5 Pos Keuangan */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span>Rincian Saldo Akumulasi per Pos (RT {selectedRt})</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">1. Satpam & Sampah</span>
              <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-bold">Wajib</span>
            </div>
            <div className="text-lg font-bold text-white mb-1">
              Rp {(summary['Satpam & Sampah'] || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500">Alokasi Utama Rp 28.000/KK</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500" />
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">2. Kas RT</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">Operasional</span>
            </div>
            <div className="text-lg font-bold text-emerald-400 mb-1">
              Rp {(summary['Kas RT'] || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500">Operasional Kas Internal</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">3. Dana Sosial</span>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-bold">Dansos</span>
            </div>
            <div className="text-lg font-bold text-white mb-1">
              Rp {(summary['Dana Sosial'] || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500">Sumbangan & Santunan</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500" />
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">4. Dana 17an</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-bold">HUT RI</span>
            </div>
            <div className="text-lg font-bold text-white mb-1">
              Rp {(summary['17an'] || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500">Kegiatan & Lomba 17-an</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500" />
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">5. Dana THR</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold">Tabungan</span>
            </div>
            <div className="text-lg font-bold text-white mb-1">
              Rp {(summary['THR'] || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500">Petugas Kebersihan & Ronda</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
          </div>

        </div>
      </div>

      {/* Top Layout Action Forms: Catat Transaksi & Tambah Warga Bersandingan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Catat Transaksi Keuangan (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Form Catat Transaksi Keuangan</h2>
                <p className="text-xs text-slate-400">Dukungan skenario pembayaran titipan, split cash/transfer, dan diskon lansia</p>
              </div>
            </div>

            {/* Switch Jenis Transaksi */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTransType('Masuk')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  transType === 'Masuk'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                + Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setTransType('Keluar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  transType === 'Keluar'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                - Pengeluaran
              </button>
            </div>
          </div>

          <form onSubmit={handleKasSubmit} className="space-y-5">
            
            {/* Presets Quick Buttons */}
            {transType === 'Masuk' && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mr-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Preset Cepat:
                </span>
                <button
                  type="button"
                  onClick={applyPresetStandard}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1 rounded-lg font-medium transition-colors"
                >
                  Standard Rp 55.000 / KK
                </button>
                <button
                  type="button"
                  onClick={applyPresetDiskonJandaLansia}
                  className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-lg font-medium transition-colors"
                >
                  Diskon Lansia / Janda (Rp 28.000 Wajib Only)
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Pos Alokasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pos Alokasi Dana *
                </label>
                <select
                  value={selectedPos}
                  onChange={(e) => setSelectedPos(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Satpam & Sampah">Pos Satpam & Sampah (Wajib Rp 28k)</option>
                  <option value="Kas RT">Pos Kas RT Internal</option>
                  <option value="Dana Sosial">Pos Dana Sosial (Dansos)</option>
                  <option value="17an">Pos Dana 17-an (Agustus)</option>
                  <option value="THR">Pos Dana THR Pekerja</option>
                </select>
              </div>

              {/* Nominal */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nominal Transaksi (Rp) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="55000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Metode Pembayaran */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Metode / Kanal Pembayaran
                </label>
                <select
                  value={metode}
                  onChange={(e) => setMetode(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Transfer">Transfer Bank / QRIS</option>
                  <option value="Cash">Tunai / Cash Langsung</option>
                  <option value="Titipan">Titipan via Tetangga / Pengurus</option>
                  <option value="Split">Split (Kombinasi Cash + Transfer)</option>
                </select>
              </div>

              {/* Nama Pembayar / Warga */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Warga Pembayar / Penerima
                </label>
                <input
                  type="text"
                  value={namaPembayar}
                  onChange={(e) => setNamaPembayar(e.target.value)}
                  placeholder="Contoh: Pak Budi Santoso"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

            </div>

            {/* Skenario Khusus Titipan */}
            {metode === 'Titipan' && (
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <CreditCard className="w-4 h-4" />
                  <span>Skenario Pembayaran Titipan Lapangan</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nama Perantara / Tetangga Yang Menitipkan:
                  </label>
                  <input
                    type="text"
                    value={namaPerantara}
                    onChange={(e) => setNamaPerantara(e.target.value)}
                    placeholder="Contoh: Ibu Virna (Tetangga sebelah)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Skenario Khusus Split Payment */}
            {metode === 'Split' && (
              <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
                  <CreditCard className="w-4 h-4" />
                  <span>Rincian Kombinasi Split Payment</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tuliskan Rincian Pembagian Cash & Transfer:
                  </label>
                  <input
                    type="text"
                    value={rincianSplit}
                    onChange={(e) => setRincianSplit(e.target.value)}
                    placeholder="Contoh: Cash Rp 25.000 + TF Rp 30.000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Catatan Keterangan Detail */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Keterangan Detail Transaksi
              </label>
              <textarea
                rows={2}
                value={catatanText}
                onChange={(e) => setCatatanText(e.target.value)}
                placeholder="Catatan tambahan misal: Pembayaran iuran bulan Agustus 2026..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${
                transType === 'Masuk'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110'
                  : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:brightness-110'
              }`}
            >
              {transType === 'Masuk' ? '+ Simpan Pemasukan Iuran' : '- Simpan Pengeluaran Anggaran'}
            </button>

          </form>
        </div>

        {/* Form Tambah Warga Cepat (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Pendataan Warga Baru</h2>
                <p className="text-xs text-slate-400">Registrasi cepat NIK & status tinggal</p>
              </div>
            </div>

            <form onSubmit={handleWargaSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">NIK Warga *</label>
                <input
                  type="text"
                  maxLength={16}
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  placeholder="327501..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={namaWarga}
                  onChange={(e) => setNamaWarga(e.target.value)}
                  placeholder="Nama sesuai KTP"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">RT</label>
                  <select
                    value={rtWarga}
                    onChange={(e) => setRtWarga(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="002">RT 002</option>
                    <option value="001">RT 001</option>
                    <option value="003">RT 003</option>
                    <option value="004">RT 004</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status Tempat Tinggal</label>
                  <select
                    value={statusTinggal}
                    onChange={(e) => setStatusTinggal(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Tetap">Warga Tetap</option>
                    <option value="Kontrak">Kontrak / Sewa</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 mt-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl font-bold text-sm transition-all"
              >
                + Tambahkan Data Warga
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
            <p className="flex items-center gap-1 text-slate-300 font-semibold mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Total Warga Terdaftar (RT {selectedRt}):
            </p>
            <p className="text-slate-400">
              {wargaList.filter(w => selectedRt === 'ALL' || w.rt === selectedRt).length} Kepala / Jiwa terdata dalam sistem.
            </p>
          </div>
        </div>

      </div>

      {/* Tabel Mutasi Transaksi Keuangan Real-Time */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Riwayat & Mutasi Transaksi Keuangan</h2>
            <p className="text-xs text-slate-400">Catatan pencatatan iuran & pengeluaran RT {selectedRt}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Total Transaksi: {filteredKas.length} RECORD</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Jenis & Pos Alokasi</th>
                <th className="px-4 py-3">Keterangan & Skenario Lapangan</th>
                <th className="px-4 py-3">Kanal</th>
                <th className="px-4 py-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredKas.map((item) => (
                <tr key={item.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {item.jenis === 'Masuk' ? (
                        <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="p-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <div>
                        <span className="font-semibold text-white block">{item.pos}</span>
                        <span className="text-[10px] text-slate-400">RT {item.rt}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <p className="text-slate-200 text-xs leading-relaxed">{item.keterangan}</p>
                    {item.diskon_keringanan && (
                      <span className="inline-block mt-1 text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-500/30">
                        Potongan Keringanan Lansia/Janda
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                      item.metode === 'Titipan'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : item.metode === 'Split'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : item.metode === 'Transfer'
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {item.metode}
                    </span>
                  </td>

                  <td className={`px-4 py-3 text-right font-mono font-bold whitespace-nowrap ${
                    item.jenis === 'Masuk' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {item.jenis === 'Masuk' ? '+' : '-'} Rp {Number(item.jumlah).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
