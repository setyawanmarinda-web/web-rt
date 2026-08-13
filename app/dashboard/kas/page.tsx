'use client';

import React, { useState } from 'react';
import { useSimStore } from '@/lib/store';
import { KasRT, Warga, RT_LIST } from '@/lib/types';
import {
  Wallet, TrendingUp, TrendingDown, Users, PlusCircle, UserPlus,
  HelpCircle, CreditCard, Sparkles, CheckCircle2, ShieldCheck, ArrowUpRight, ArrowDownRight, Tag, ArrowRight, Plus, Trash2, Calendar
} from 'lucide-react';

interface PerantaraItem {
  nama: string;
  alamat: string;
}

export default function KasDashboardPage() {
  const { selectedRt, kasList, wargaList, addKasTransaction, addWarga, getKasSummaryByRt } = useSimStore();

  const summary = getKasSummaryByRt(selectedRt);

  // Form State Catat Transaksi Iuran
  const [transType, setTransType] = useState<'Masuk' | 'Keluar'>('Masuk');
  const [selectedPos, setSelectedPos] = useState<KasRT['pos']>('Kas RT');
  const [amount, setAmount] = useState<number>(55000);
  const [metode, setMetode] = useState<KasRT['metode']>('Transfer');
  const [namaPembayar, setNamaPembayar] = useState<string>('');
  const [rincianSplit, setRincianSplit] = useState<string>('');
  const [diskonKeringanan, setDiskonKeringanan] = useState<boolean>(false);
  const [catatanText, setCatatanText] = useState<string>('');
  
  // Tanggal Otomatis (Default hari ini YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [tanggalTransaksi, setTanggalTransaksi] = useState<string>(todayStr);

  // Dynamic Multiple Perantara/Titipan List (Nama & Alamat)
  const [perantaraList, setPerantaraList] = useState<PerantaraItem[]>([
    { nama: '', alamat: '' }
  ]);

  // Form State Tambah Warga
  const [namaWarga, setNamaWarga] = useState<string>('');
  const [tanggalLahirWarga, setTanggalLahirWarga] = useState<string>('');
  const [alamatWarga, setAlamatWarga] = useState<string>('');
  const [statusTinggal, setStatusTinggal] = useState<'Tetap' | 'Kontrak'>('Tetap');
  const [rtWarga, setRtWarga] = useState<string>(selectedRt === 'ALL' ? '002' : selectedRt);

  // Toast feedback
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Add & Remove Dynamic Perantara Item
  const handleAddPerantara = () => {
    setPerantaraList([...perantaraList, { nama: '', alamat: '' }]);
  };

  const handleRemovePerantara = (index: number) => {
    if (perantaraList.length === 1) return;
    setPerantaraList(perantaraList.filter((_, i) => i !== index));
  };

  const handlePerantaraChange = (index: number, field: 'nama' | 'alamat', value: string) => {
    const updated = [...perantaraList];
    updated[index][field] = value;
    setPerantaraList(updated);
  };

  // Presets
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

    if (metode === 'Titipan') {
      const validPerantara = perantaraList.filter(p => p.nama.trim() !== '');
      if (validPerantara.length > 0) {
        const titipanDetails = validPerantara.map(p => `${p.nama}${p.alamat ? ` (${p.alamat})` : ''}`).join(', ');
        fullKeterangan += ` - Titip via: ${titipanDetails}`;
      }
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
      perantara_list: metode === 'Titipan' ? perantaraList : undefined,
      rincian_split: rincianSplit,
      diskon_keringanan: diskonKeringanan,
      tanggal_transaksi: tanggalTransaksi
    } as any);

    showToast(`✅ Transaksi ${transType} Rp ${Number(amount).toLocaleString('id-ID')} berhasil dicatat!`);

    // Reset Form
    setCatatanText('');
    setNamaPembayar('');
    setPerantaraList([{ nama: '', alamat: '' }]);
    setRincianSplit('');
  };

  // Submit New Warga (NIK Removed, Tanggal Lahir & Alamat Added)
  const handleWargaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaWarga || !alamatWarga) return alert('Nama Lengkap dan Alamat Rumah wajib diisi');

    addWarga({
      nama_lengkap: namaWarga,
      tanggal_lahir: tanggalLahirWarga,
      alamat: alamatWarga,
      status_tinggal: statusTinggal,
      rt: rtWarga,
      rw: '012'
    } as any);

    showToast(`✅ Data warga "${namaWarga}" (${alamatWarga}) berhasil ditambahkan!`);
    setNamaWarga('');
    setTanggalLahirWarga('');
    setAlamatWarga('');
  };

  const filteredKas = selectedRt === 'ALL' ? kasList : kasList.filter(k => k.rt === selectedRt);

  return (
    <div className="space-y-6 sm:space-y-8">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Kas & Iuran Warga</h1>
            <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Panel RT {selectedRt}
            </span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Pencatatan iuran terpisah 5 pos (Kas RT, Dansos, Satpam & Sampah, 17an, THR) & multi-titipan via tetangga.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 self-start md:self-auto w-full md:w-auto justify-between md:justify-start">
          <div className="text-left md:text-right">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 block uppercase">Total Saldo Bersih</span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-400">
              Rp {summary.saldoAkhir.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span>Rincian Saldo Akumulasi per Pos (RT {selectedRt})</span>
        </h3>

        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-5 gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          <div className="min-w-[220px] sm:min-w-0 snap-start bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">1. Satpam & Sampah</span>
              <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-bold">Wajib</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-white mb-1">
              Rp {(summary['Satpam & Sampah'] || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500">Alokasi Utama Rp 28k/KK</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500" />
          </div>

          <div className="min-w-[220px] sm:min-w-0 snap-start bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">2. Kas RT</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">Operasional</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-emerald-400 mb-1">
              Rp {(summary['Kas RT'] || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500">Operasional Internal</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
          </div>

          <div className="min-w-[220px] sm:min-w-0 snap-start bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">3. Dana Sosial</span>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-bold">Dansos</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-white mb-1">
              Rp {(summary['Dana Sosial'] || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500">Sumbangan & Santunan</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500" />
          </div>

          <div className="min-w-[220px] sm:min-w-0 snap-start bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">4. Dana 17an</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-bold">HUT RI</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-white mb-1">
              Rp {(summary['17an'] || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500">Kegiatan & Lomba</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500" />
          </div>

          <div className="min-w-[220px] sm:min-w-0 snap-start bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">5. Dana THR</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold">Tabungan</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-white mb-1">
              Rp {(summary['THR'] || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500">Petugas Kebersihan/Ronda</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
          </div>
        </div>
      </div>

      {/* Top Layout Action Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Form Catat Transaksi Keuangan (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Form Catat Transaksi Keuangan</h2>
                <p className="text-xs text-slate-400">Fitur tanggal otomatis, multi-titipan via tetangga (nama & alamat)</p>
              </div>
            </div>

            {/* Switch Jenis Transaksi */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
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

          <form onSubmit={handleKasSubmit} className="space-y-4 sm:space-y-5">
            
            {/* Tanggal Transaksi Otomatis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  Tanggal Transaksi (Otomatis Klik Datepicker) *
                </label>
                <input
                  type="date"
                  value={tanggalTransaksi}
                  onChange={(e) => setTanggalTransaksi(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  required
                />
              </div>

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

            {/* Presets Quick Buttons */}
            {transType === 'Masuk' && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  Preset Cepat:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={applyPresetStandard}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    Standard Rp 55.000 / KK
                  </button>
                  <button
                    type="button"
                    onClick={applyPresetDiskonJandaLansia}
                    className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    Diskon Lansia / Janda (Rp 28k)
                  </button>
                </div>
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
                  <option value="Titipan">Titipan via Tetangga (Multi-Input Nama & Alamat)</option>
                  <option value="Split">Split (Kombinasi Cash + Transfer)</option>
                </select>
              </div>
            </div>

            {/* Nama Warga Pembayar */}
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

            {/* Skenario Khusus Titipan via Tetangga dengan Multiple Dynamic Add (+ Button) */}
            {metode === 'Titipan' && (
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <CreditCard className="w-4 h-4 flex-shrink-0" />
                    <span>Daftar Nama & Alamat Perantara / Tetangga Menitipkan</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPerantara}
                    className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-2.5 py-1 rounded-lg text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Perantara</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {perantaraList.map((p, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div className="w-full sm:w-1/2">
                        <input
                          type="text"
                          value={p.nama}
                          onChange={(e) => handlePerantaraChange(idx, 'nama', e.target.value)}
                          placeholder={`Nama Perantara ${idx + 1}`}
                          className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="w-full sm:w-1/2 flex items-center gap-2">
                        <input
                          type="text"
                          value={p.alamat}
                          onChange={(e) => handlePerantaraChange(idx, 'alamat', e.target.value)}
                          placeholder="Alamat / No Rumah (e.g. Blok A1 No 5)"
                          className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                        {perantaraList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePerantara(idx)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skenario Split Payment */}
            {metode === 'Split' && (
              <div className="p-3.5 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Rincian Kombinasi Cash & Transfer:
                </label>
                <input
                  type="text"
                  value={rincianSplit}
                  onChange={(e) => setRincianSplit(e.target.value)}
                  placeholder="Contoh: Cash Rp 25.000 + TF Rp 30.000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
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
                placeholder="Catatan tambahan..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-98 ${
                transType === 'Masuk'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110'
                  : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:brightness-110'
              }`}
            >
              {transType === 'Masuk' ? '+ Simpan Pemasukan Iuran' : '- Simpan Pengeluaran Anggaran'}
            </button>

          </form>
        </div>

        {/* Form Tambah Warga Baru (Alamat, Tanggal Lahir Otomatis, RT 001 - RT 010 Order) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 flex-shrink-0">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Pendataan Warga Baru</h2>
                <p className="text-xs text-slate-400">Tanpa NIK, Tanggal Lahir & Alamat Lengkap</p>
              </div>
            </div>

            <form onSubmit={handleWargaSubmit} className="space-y-4">
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

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                  Tanggal Lahir (Klik Datepicker)
                </label>
                <input
                  type="date"
                  value={tanggalLahirWarga}
                  onChange={(e) => setTanggalLahirWarga(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Rumah Lengkap *</label>
                <input
                  type="text"
                  value={alamatWarga}
                  onChange={(e) => setAlamatWarga(e.target.value)}
                  placeholder="Contoh: Blok A1 No. 4"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih RT (Urut 001 - 010)</label>
                  <select
                    value={rtWarga}
                    onChange={(e) => setRtWarga(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 font-semibold"
                  >
                    {RT_LIST.map((rt) => (
                      <option key={rt} value={rt}>
                        RT {rt} {rt === '002' ? '(Default)' : ''}
                      </option>
                    ))}
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
                className="w-full py-3 mt-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl font-bold text-sm transition-all"
              >
                + Tambahkan Data Warga
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
            <p className="flex items-center gap-1 text-slate-300 font-semibold mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Total Terdata:
            </p>
            <p className="text-slate-400">
              {wargaList.filter(w => selectedRt === 'ALL' || w.rt === selectedRt).length} Kepala Keluarga di RT {selectedRt}.
            </p>
          </div>
        </div>

      </div>

      {/* Riwayat Mutasi Transaksi */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Riwayat & Mutasi Transaksi Keuangan</h2>
            <p className="text-xs text-slate-400">Catatan iuran & pengeluaran RT {selectedRt}</p>
          </div>

          <span className="text-xs text-slate-400 font-mono">Total: {filteredKas.length} RECORD</span>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden space-y-3">
          {filteredKas.map((item) => (
            <div key={item.id} className="bg-slate-950 border border-slate-800/90 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-slate-400">
                  {item.tanggal_transaksi || new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  item.metode === 'Titipan'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : item.metode === 'Split'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.metode}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-semibold text-white text-xs block">{item.pos}</span>
                  <p className="text-slate-300 text-xs mt-0.5 leading-snug">{item.keterangan}</p>
                </div>
                <span className={`font-mono font-bold text-sm whitespace-nowrap ${
                  item.jenis === 'Masuk' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {item.jenis === 'Masuk' ? '+' : '-'} Rp {Number(item.jumlah).toLocaleString('id-ID')}
                </span>
              </div>

              {item.diskon_keringanan && (
                <span className="inline-block text-[9px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-500/30">
                  Keringanan Lansia/Janda
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Jenis & Pos</th>
                <th className="px-4 py-3">Keterangan & Detail Skenario</th>
                <th className="px-4 py-3">Kanal</th>
                <th className="px-4 py-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredKas.map((item) => (
                <tr key={item.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                    {item.tanggal_transaksi || new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
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
