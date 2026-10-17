'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useSimStore } from '@/lib/store';
import { KasRT, SimpanPinjam } from '@/lib/types';
import {
  Wallet, TrendingUp, TrendingDown, Users, PlusCircle, Download,
  HelpCircle, CreditCard, CheckCircle2, ShieldCheck, ArrowUpRight, ArrowDownRight, Tag, ArrowRight, Plus, Trash2, Calendar, Pencil, X
} from 'lucide-react';
import { KasEditProvider, KasEditToggle, KasSortGroup } from '@/components/KasLayoutEditor';
import DatePickerField from '@/components/DatePickerField';
import { formatRupiahInput, parseRupiahInput } from '@/lib/currency';

interface PerantaraItem {
  nama: string;
  alamat: string;
  nominal: number;
}

function KasDashboardContent() {
  const { selectedRt, kasList, wargaList, simpanPinjamList, addKasTransaction, addSimpanPinjamTransaction, updateData, getKasSummaryByRt, deleteData } = useSimStore();

  const summary = getKasSummaryByRt(selectedRt);

  // Form State Catat Transaksi Iuran
  const [transType, setTransType] = useState<'Masuk' | 'Keluar'>('Masuk');
  const [selectedPos, setSelectedPos] = useState<KasRT['pos']>('Kas RT');
  const [amount, setAmount] = useState<number>(55000);
  const [metode, setMetode] = useState<KasRT['metode']>('Transfer');
  const [namaPembayar, setNamaPembayar] = useState<string>('');
  const [alamatPembayar, setAlamatPembayar] = useState<string>('');
  const [rincianSplit, setRincianSplit] = useState<string>('');
  const [diskonKeringanan, setDiskonKeringanan] = useState<boolean>(false);
  const [catatanText, setCatatanText] = useState<string>('');
  
  // Tanggal Otomatis (Default hari ini YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [tanggalTransaksi, setTanggalTransaksi] = useState<string>(todayStr);

  // Dynamic Multiple Perantara/Titipan List (Nama & Alamat)
  const [perantaraList, setPerantaraList] = useState<PerantaraItem[]>([
    { nama: '', alamat: '', nominal: 0 }
  ]);

  // Form State Tambah Warga

  // Toast feedback
  const [notification, setNotification] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSimpanPinjamId, setEditingSimpanPinjamId] = useState<string | null>(null);
  const [simpanPinjamMode, setSimpanPinjamMode] = useState<'Simpan' | 'Pinjam' | 'Cicilan'>('Simpan');
  const [simpanPinjamNama, setSimpanPinjamNama] = useState('');
  const [simpanPinjamAlamat, setSimpanPinjamAlamat] = useState('');
  const [simpanPinjamNominal, setSimpanPinjamNominal] = useState(0);
  const [simpanPinjamTenor, setSimpanPinjamTenor] = useState<3 | 6 | 12>(3);
  const [simpanPinjamBunga, setSimpanPinjamBunga] = useState<'5' | '6' | '8' | 'Lainnya'>('5');
  const [simpanPinjamBungaManual, setSimpanPinjamBungaManual] = useState('');
  const [simpanPinjamTanggal, setSimpanPinjamTanggal] = useState(todayStr);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Add & Remove Dynamic Perantara Item
  const handleAddPerantara = () => {
    setPerantaraList([...perantaraList, { nama: '', alamat: '', nominal: 0 }]);
  };

  const handleRemovePerantara = (index: number) => {
    if (perantaraList.length === 1) return;
    setPerantaraList(perantaraList.filter((_, i) => i !== index));
  };

  const handlePerantaraChange = (index: number, field: 'nama' | 'alamat' | 'nominal', value: string | number) => {
    const updated = [...perantaraList];
    if (field === 'nominal') updated[index].nominal = Number(value);
    else updated[index][field] = String(value);
    setPerantaraList(updated);
  };

  // Submit Transaction
  const handleKasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return alert('Nominal harus lebih besar dari 0');

    if (metode === 'Titipan') {
      const validPerantara = perantaraList.filter((item) => item.nama.trim() !== '');
      const totalTitipan = validPerantara.reduce((total, item) => total + Number(item.nominal || 0), 0);
      if (!validPerantara.length) return alert('Minimal satu nama perantara wajib diisi.');
      if (validPerantara.some((item) => !item.alamat.trim())) return alert('Alamat semua perantara wajib diisi.');
      if (totalTitipan !== Number(amount)) return alert(`Total nominal titipan harus sama dengan Nominal Transaksi Rp ${formatRupiahInput(amount)}.`);
    }

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

    const data = {
      keterangan: fullKeterangan,
      jumlah: Number(amount),
      jenis: transType,
      pos: selectedPos,
      rt: selectedRt === 'ALL' ? '002' : selectedRt,
      metode: metode,
      nama_pembayar: namaPembayar,
      alamat_pembayar: alamatPembayar,
      perantara_list: metode === 'Titipan' ? perantaraList : undefined,
      rincian_split: rincianSplit,
      diskon_keringanan: diskonKeringanan,
      tanggal_transaksi: tanggalTransaksi
    };
    if (editingId) await updateData('kas', editingId, data);
    else await addKasTransaction(data);

    showToast(`✅ Transaksi ${transType} Rp ${Number(amount).toLocaleString('id-ID')} berhasil ${editingId ? 'diubah' : 'dicatat'}!`);

    // Reset Form
    setCatatanText('');
    setNamaPembayar('');
    setPerantaraList([{ nama: '', alamat: '', nominal: 0 }]);
    setRincianSplit('');
    setEditingId(null);
  };

  const startEdit = (item: KasRT) => {
    setEditingId(item.id); setTransType(item.jenis); setSelectedPos(item.pos); setAmount(item.jumlah);
    setMetode(item.metode); setNamaPembayar(item.nama_pembayar || ''); setAlamatPembayar(item.alamat_pembayar || ''); setRincianSplit(item.rincian_split || '');
    setDiskonKeringanan(Boolean(item.diskon_keringanan)); setTanggalTransaksi(item.tanggal_transaksi || todayStr);
    setCatatanText(item.keterangan); setPerantaraList(item.perantara_list?.length ? item.perantara_list.map((perantara) => ({ ...perantara, nominal: perantara.nominal || 0 })) : [{ nama: '', alamat: '', nominal: 0 }]);
  };

  const cancelEdit = () => {
    setEditingId(null); setCatatanText(''); setNamaPembayar(''); setAlamatPembayar(''); setRincianSplit(''); setPerantaraList([{ nama: '', alamat: '', nominal: 0 }]);
  };

  // Submit New Warga
  const resetSimpanPinjamForm = () => {
    setEditingSimpanPinjamId(null);
    setSimpanPinjamMode('Simpan');
    setSimpanPinjamNama('');
    setSimpanPinjamAlamat('');
    setSimpanPinjamNominal(0);
    setSimpanPinjamTenor(3);
    setSimpanPinjamBunga('5');
    setSimpanPinjamBungaManual('');
    setSimpanPinjamTanggal(todayStr);
  };

  const handleSimpanPinjamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simpanPinjamNama.trim() || !simpanPinjamAlamat.trim()) return alert('Nama dan alamat wajib diisi');
    if (!simpanPinjamNominal || simpanPinjamNominal <= 0) return alert('Nominal harus lebih besar dari 0');
    const bungaPersen = simpanPinjamMode === 'Pinjam'
      ? (simpanPinjamBunga === 'Lainnya' ? Number(simpanPinjamBungaManual) : Number(simpanPinjamBunga))
      : 0;
    if (simpanPinjamMode === 'Pinjam' && (!Number.isFinite(bungaPersen) || bungaPersen < 0)) return alert('Bunga pinjaman wajib diisi dengan angka yang valid');

    const warga = wargaList.find((item) => item.nama_lengkap.trim().toLowerCase() === simpanPinjamNama.trim().toLowerCase() && item.alamat.trim().toLowerCase() === simpanPinjamAlamat.trim().toLowerCase());
    const data: Omit<SimpanPinjam, 'id' | 'created_at'> = {
      warga_id: warga?.id,
      nama: simpanPinjamNama.trim(),
      alamat: simpanPinjamAlamat.trim(),
      jenis: simpanPinjamMode,
      nominal: Number(simpanPinjamNominal),
      tenor_bulan: simpanPinjamMode === 'Pinjam' ? simpanPinjamTenor : undefined,
      bunga_persen: simpanPinjamMode === 'Pinjam' ? bungaPersen : undefined,
      rt: selectedRt === 'ALL' ? (warga?.rt || '002') : selectedRt,
      tanggal_transaksi: simpanPinjamTanggal,
    };

    if (editingSimpanPinjamId) await updateData('simpan-pinjam', editingSimpanPinjamId, data);
    else await addSimpanPinjamTransaction(data);

    showToast(`✅ Transaksi ${simpanPinjamMode.toLowerCase()} berhasil ${editingSimpanPinjamId ? 'diubah' : 'dicatat'}!`);
    resetSimpanPinjamForm();
  };

  const startEditSimpanPinjam = (item: SimpanPinjam) => {
    setEditingSimpanPinjamId(item.id);
    setSimpanPinjamMode(item.jenis);
    setSimpanPinjamNama(item.nama);
    setSimpanPinjamAlamat(item.alamat);
    setSimpanPinjamNominal(item.nominal);
    setSimpanPinjamTenor(item.tenor_bulan || 3);
    const bunga = item.bunga_persen ?? 5;
    setSimpanPinjamBunga([5, 6, 8].includes(bunga) ? String(bunga) as '5' | '6' | '8' : 'Lainnya');
    setSimpanPinjamBungaManual([5, 6, 8].includes(bunga) ? '' : String(bunga));
    setSimpanPinjamTanggal(item.tanggal_transaksi);
  };

  const handleDelete = async (id: string, ket: string) => {
    if (window.confirm(`Yakin ingin menghapus transaksi: ${ket}?`)) {
      try {
        await deleteData('kas', id);
        showToast(`✅ Transaksi berhasil dihapus!`);
      } catch (err) {
        alert('Gagal menghapus data.');
      }
    }
  };

  const handleDeleteSimpanPinjam = async (id: string, ket: string) => {
    if (window.confirm(`Yakin ingin menghapus transaksi: ${ket}?`)) {
      try {
        await deleteData('simpan-pinjam', id);
        showToast('✅ Transaksi Simpan Pinjam berhasil dihapus!');
      } catch {
        alert('Gagal menghapus data Simpan Pinjam.');
      }
    }
  };

  const filteredKas = selectedRt === 'ALL' ? kasList : kasList.filter(k => k.rt === selectedRt);
  const filteredSimpanPinjam = selectedRt === 'ALL' ? simpanPinjamList : simpanPinjamList.filter((item) => item.rt === selectedRt);
  const selectedWarga = wargaList.find((item) => item.nama_lengkap.trim().toLowerCase() === namaPembayar.trim().toLowerCase() && (selectedRt === 'ALL' || item.rt === selectedRt));
  const tarifIuranWajib = selectedWarga?.nominal_iuran ?? 0;
  const wargaNamaSuggestions = Array.from(new Set(wargaList.map((item) => item.nama_lengkap.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'id'));
  const wargaAlamatSuggestions = Array.from(new Set(wargaList.map((item) => item.alamat.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
  const totalSimpanan = filteredSimpanPinjam.filter((item) => item.jenis === 'Simpan').reduce((total, item) => total + item.nominal, 0);
  const totalPinjaman = filteredSimpanPinjam.reduce((total, item) => total + (item.jenis === 'Pinjam' ? item.nominal : item.jenis === 'Cicilan' ? -item.nominal : 0), 0);
  const exportRtLabel = selectedRt === 'ALL' ? 'semua' : selectedRt;

  const handleExportKasExcel = () => {
    const rows = filteredKas.map((item) => ({
      ID: item.id,
      Tanggal: item.tanggal_transaksi || new Date(item.created_at).toLocaleDateString('id-ID'),
      Jenis: item.jenis,
      Pos: item.pos,
      Nominal: Number(item.jumlah),
      Metode: item.metode,
      Pembayar: item.nama_pembayar || '',
      'Alamat Pembayar': item.alamat_pembayar || '',
      Keterangan: item.keterangan,
      'Keringanan Lansia/Janda': item.diskon_keringanan ? 'Ya' : 'Tidak',
      RT: item.rt,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Keuangan');
    XLSX.writeFile(workbook, `riwayat_mutasi_keuangan_rt${exportRtLabel}.xlsx`);
  };

  const handleExportSimpanPinjamExcel = () => {
    const rows = filteredSimpanPinjam.map((item) => ({
      ID: item.id,
      Tanggal: item.tanggal_transaksi,
      Nama: item.nama,
      Alamat: item.alamat,
      Jenis: item.jenis,
      'Tenor (Bulan)': item.tenor_bulan || '',
      'Bunga (%)': item.bunga_persen || 0,
      Nominal: Number(item.nominal),
      RT: item.rt,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dashboard Simpan Pinjam');
    XLSX.writeFile(workbook, `dashboard_simpan_pinjam_rt${exportRtLabel}.xlsx`);
  };
  const bungaAktif = simpanPinjamBunga === 'Lainnya' ? Number(simpanPinjamBungaManual) || 0 : Number(simpanPinjamBunga);
  const bungaNominal = simpanPinjamMode === 'Pinjam' && simpanPinjamNominal > 0
    ? Math.round(simpanPinjamNominal * bungaAktif / 100)
    : 0;
  const cicilanBulanan = simpanPinjamMode === 'Pinjam' && simpanPinjamNominal > 0
    ? Math.round(simpanPinjamNominal / simpanPinjamTenor)
    : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <datalist id="kas-warga-nama-suggestions">
        {wargaNamaSuggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}
      </datalist>
      <datalist id="kas-warga-alamat-suggestions">
        {wargaAlamatSuggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}
      </datalist>
      <datalist id="statistik-warga-nama-suggestions">
        {wargaNamaSuggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}
      </datalist>
      <datalist id="statistik-warga-alamat-suggestions">
        {wargaAlamatSuggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}
      </datalist>
      
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
            Pencatatan iuran terpisah 4 pos (Kas RT, Sampah & Keamanan, Dana Sosial, Dana 17an) & multi-titipan via tetangga.
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

      <KasEditToggle />

      <KasSortGroup attr="data-kas-block" storageKey="kas-layout-v1">
      {/* Metric Cards */}
      <div data-kas-block="metric">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span>Rincian Saldo Akumulasi per Pos (RT {selectedRt})</span>
        </h3>

        <KasSortGroup attr="data-kas-card" storageKey="kas-cards-v1" layout="flow" gap="0.75rem">
          <div data-kas-card="kasrt" data-lo-w="4" className="min-w-[220px] sm:min-w-0 snap-start bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all flex-1"><div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-slate-400">Kas RT</span><span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">Operasional</span></div><div className="text-base sm:text-lg font-bold text-emerald-400 mb-1">Rp {(summary["Kas RT"] || 0).toLocaleString("id-ID")}</div><p className="text-[10px] sm:text-[11px] text-slate-500">Operasional Internal</p></div>
          <div data-kas-card="sampah" data-lo-w="4" className="min-w-[220px] sm:min-w-0 snap-start bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all flex-1"><div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-slate-400">Sampah & Keamanan</span><span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">Wajib</span></div><div className="text-base sm:text-lg font-bold text-white mb-1">Rp {(summary["Sampah & Keamanan"] || 0).toLocaleString("id-ID")}</div><p className="text-[10px] sm:text-[11px] text-slate-500">Sampah, Keamanan & kegiatan RW</p></div>
          <div data-kas-card="dansos" data-lo-w="4" className="min-w-[220px] sm:min-w-0 snap-start bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all flex-1"><div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-slate-400">Dana Sosial</span><span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-bold">Dansos</span></div><div className="text-base sm:text-lg font-bold text-white mb-1">Rp {(summary["Dana Sosial"] || 0).toLocaleString("id-ID")}</div><p className="text-[10px] sm:text-[11px] text-slate-500">Sumbangan & Santunan</p></div>
          <div data-kas-card="simpinjam" data-lo-w="4" className="min-w-[220px] sm:min-w-0 snap-start bg-slate-900/90 border border-amber-500/30 p-4 rounded-xl relative overflow-hidden group hover:border-amber-400/70 transition-all flex-1"><div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-slate-400">Simpan Pinjam</span><span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">Simpin</span></div><div className="space-y-1"><div className="text-sm font-bold text-emerald-300">Simpanan: Rp {totalSimpanan.toLocaleString("id-ID")}</div><div className="text-sm font-bold text-amber-300">Pinjaman: Rp {totalPinjaman.toLocaleString("id-ID")}</div></div><p className="text-[10px] sm:text-[11px] text-slate-500 mt-2">Saldo berjalan</p></div>
          <div data-kas-card="dana17" data-lo-w="4" className="min-w-[220px] sm:min-w-0 snap-start bg-slate-900/90 border border-sky-500/30 p-4 rounded-xl relative overflow-hidden group hover:border-sky-400/70 transition-all flex-1"><div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-slate-400">Dana 17an</span><span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-bold">17an</span></div><div className="text-base sm:text-lg font-bold text-sky-300 mb-1">Rp {(summary['Dana 17an'] || 0).toLocaleString('id-ID')}</div><p className="text-[10px] sm:text-[11px] text-slate-500">Iuran kegiatan 17an</p></div>
        </KasSortGroup>
      </div>

      {/* Top Layout Action Forms */}
      <div data-kas-block="forms">
        <KasSortGroup attr="data-kas-panel" storageKey="kas-panels-v1" layout="flow">
        
        {/* Form Catat Transaksi Keuangan (8 cols) */}
        <div data-kas-panel="catat" data-lo-w="8" className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2"><h2 className="text-base sm:text-lg font-bold text-white">{editingId ? 'Edit Transaksi Keuangan' : 'Form Catat Transaksi Keuangan'}</h2>{editingId && <button type="button" onClick={cancelEdit} className="text-slate-400 hover:text-white" title="Batal Edit"><X className="w-4 h-4" /></button>}</div>
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

          <form onSubmit={handleKasSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            
            {/* Tanggal Transaksi Otomatis */}
            <div>
              <DatePickerField
                label="Tanggal Transaksi"
                value={tanggalTransaksi}
                onChange={setTanggalTransaksi}
                required={true}
                colorTheme="emerald"
              />
            </div>

            {transType === 'Masuk' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Warga</label>
                  <input
                    type="text"
                    value={namaPembayar}
                    onChange={(e) => {
                      const nextNama = e.target.value;
                      setNamaPembayar(nextNama);
                      const wargaCocok = wargaList.find((item) => item.nama_lengkap.trim().toLowerCase() === nextNama.trim().toLowerCase() && (selectedRt === 'ALL' || item.rt === selectedRt));
                      if (wargaCocok) setAlamatPembayar(wargaCocok.alamat);
                    }}
                    placeholder="Pilih nama warga"
                    list="kas-warga-nama-suggestions"
                    autoComplete="off"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Alamat</label>
                  <input
                    type="text"
                    value={alamatPembayar}
                    readOnly={Boolean(selectedWarga)}
                    onChange={(e) => setAlamatPembayar(e.target.value)}
                    placeholder="Otomatis dari nama warga"
                    list="kas-warga-alamat-suggestions"
                    autoComplete="off"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 read-only:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tarif Iuran Wajib</label>
                  <input
                    type="text"
                    value={formatRupiahInput(tarifIuranWajib)}
                    readOnly
                    placeholder="Terisi otomatis dari Statistik Warga"
                    className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-3 py-2.5 text-sm font-bold text-emerald-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nominal Transaksi (Rp) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatRupiahInput(amount)}
                    onChange={(e) => setAmount(parseRupiahInput(e.target.value))}
                    placeholder="55.000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pos Alokasi Dana *</label>
                    <select value={selectedPos} onChange={(e) => setSelectedPos(e.target.value as KasRT['pos'])} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                      <option value="Sampah & Keamanan">Pos Sampah & Keamanan</option>
                      <option value="Kas RT">Pos Kas RT Internal</option>
                      <option value="Dana Sosial">Pos Dana Sosial</option>
                      <option value="Dana 17an">Dana 17an</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Metode / Kanal Pembayaran</label>
                    <select value={metode} onChange={(e) => setMetode(e.target.value as KasRT['metode'])} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                      <option value="Transfer">Transfer Bank / QRIS</option>
                      <option value="Cash">Tunai / Cash Langsung</option>
                      <option value="Titipan">Titipan via Tetangga</option>
                      <option value="Split">Split Cash + Transfer</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nominal Transaksi (Rp) *</label>
                  <input type="text" inputMode="numeric" value={formatRupiahInput(amount)} onChange={(e) => setAmount(parseRupiahInput(e.target.value))} placeholder="55.000" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-emerald-500" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pos Alokasi Dana *</label>
                  <select value={selectedPos} onChange={(e) => setSelectedPos(e.target.value as KasRT['pos'])} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                    <option value="Sampah & Keamanan">Pos Sampah & Keamanan</option><option value="Kas RT">Pos Kas RT Internal</option><option value="Dana Sosial">Pos Dana Sosial</option><option value="Dana 17an">Dana 17an</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Metode / Kanal Pembayaran</label>
                  <select value={metode} onChange={(e) => setMetode(e.target.value as KasRT['metode'])} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                    <option value="Transfer">Transfer Bank / QRIS</option><option value="Cash">Tunai / Cash Langsung</option><option value="Titipan">Titipan via Tetangga</option><option value="Split">Split Cash + Transfer</option>
                  </select>
                </div>
              </div>
            )}

            {/* Skenario Khusus Titipan via Tetangga dengan Multiple Dynamic Add (+ Button) */}
            {metode === 'Titipan' && (
              <div className="sm:col-span-2 p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-3">
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
                          onChange={(e) => {
                            const nextNama = e.target.value;
                            handlePerantaraChange(idx, 'nama', nextNama);
                            const wargaCocok = wargaList.find((item) => item.nama_lengkap.trim().toLowerCase() === nextNama.trim().toLowerCase() && (selectedRt === 'ALL' || item.rt === selectedRt));
                            if (wargaCocok) handlePerantaraChange(idx, 'alamat', wargaCocok.alamat);
                          }}
                          placeholder={`Nama Perantara ${idx + 1}`}
                          list="kas-warga-nama-suggestions"
                          autoComplete="off"
                          className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="w-full sm:w-1/2 flex items-center gap-2">
                        <input
                          type="text"
                          value={p.alamat}
                          onChange={(e) => handlePerantaraChange(idx, 'alamat', e.target.value)}
                          placeholder="Alamat / No Rumah (e.g. Blok A1 No 5)"
                          list="kas-warga-alamat-suggestions"
                          autoComplete="off"
                          className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatRupiahInput(p.nominal)}
                          onChange={(e) => handlePerantaraChange(idx, 'nominal', parseRupiahInput(e.target.value))}
                          placeholder="Nominal"
                          className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
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
                <div className="flex items-center justify-between border-t border-emerald-500/20 pt-2 text-xs">
                  <span className="text-slate-400">Total nominal titipan</span>
                  <span className={`font-bold ${perantaraList.reduce((total, item) => total + item.nominal, 0) === amount ? 'text-emerald-300' : 'text-amber-300'}`}>
                    Rp {formatRupiahInput(perantaraList.reduce((total, item) => total + item.nominal, 0))} / Rp {formatRupiahInput(amount)}
                  </span>
                </div>
              </div>
            )}

            {/* Skenario Split Payment */}
            {metode === 'Split' && (
              <div className="sm:col-span-2 p-3.5 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-2">
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
            <div className="sm:col-span-2">
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
              className={`sm:col-span-2 w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-98 ${
                transType === 'Masuk'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110'
                  : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:brightness-110'
              }`}
            >
              {editingId ? 'Simpan Perubahan' : transType === 'Masuk' ? '+ Simpan Pemasukan Iuran' : '- Simpan Pengeluaran Anggaran'}
            </button>

          </form>
        </div>

        {/* Form Input Transaksi Simpan Pinjam */}
        <div data-kas-panel="simpin-form" data-lo-w="4" className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Input Transaksi Simpan Pinjam</h2>
                <p className="text-xs text-slate-400">Catat simpanan, pinjaman, dan cicilan warga</p>
              </div>
            </div>

            <form onSubmit={handleSimpanPinjamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama *</label>
                <input
                  type="text"
                  value={simpanPinjamNama}
                  onChange={(e) => {
                    const nextNama = e.target.value;
                    setSimpanPinjamNama(nextNama);
                    const wargaCocok = wargaList.find((item) =>
                      item.nama_lengkap.trim().toLowerCase() === nextNama.trim().toLowerCase()
                      && (selectedRt === 'ALL' || item.rt === selectedRt)
                    );
                    if (wargaCocok) setSimpanPinjamAlamat(wargaCocok.alamat);
                  }}
                  placeholder="Nama warga"
                  list="statistik-warga-nama-suggestions"
                  autoComplete="off"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat *</label>
                <input
                  type="text"
                  value={simpanPinjamAlamat}
                  onChange={(e) => setSimpanPinjamAlamat(e.target.value)}
                  placeholder="Alamat rumah warga"
                  list="statistik-warga-alamat-suggestions"
                  autoComplete="off"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis *</label>
                  <select
                    value={simpanPinjamMode === 'Cicilan' ? 'Pinjam' : simpanPinjamMode}
                    onChange={(e) => setSimpanPinjamMode(e.target.value as 'Simpan' | 'Pinjam')}
                    disabled={simpanPinjamMode === 'Cicilan'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-semibold disabled:opacity-60"
                  >
                    <option value="Simpan">Simpan</option>
                    <option value="Pinjam">Pinjam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nominal (Rp) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatRupiahInput(simpanPinjamNominal)}
                    onChange={(e) => setSimpanPinjamNominal(parseRupiahInput(e.target.value))}
                    placeholder="1.000.000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {simpanPinjamMode === 'Pinjam' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Tenor Pinjaman *</label>
                      <select
                        value={simpanPinjamTenor}
                        onChange={(e) => setSimpanPinjamTenor(Number(e.target.value) as 3 | 6 | 12)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="3">3 bulan</option>
                        <option value="6">6 bulan</option>
                        <option value="12">12 bulan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Bunga Pinjaman *</label>
                      <select
                        value={simpanPinjamBunga}
                        onChange={(e) => setSimpanPinjamBunga(e.target.value as '5' | '6' | '8' | 'Lainnya')}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="5">5%</option>
                        <option value="6">6%</option>
                        <option value="8">8%</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  {simpanPinjamBunga === 'Lainnya' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Bunga Manual (%) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={simpanPinjamBungaManual}
                        onChange={(e) => setSimpanPinjamBungaManual(e.target.value)}
                        placeholder="Contoh: 7.5"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  )}

                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                    <div className="text-[11px] uppercase tracking-wide text-amber-200">Bunga dibayar di awal</div>
                    <div className="text-lg font-black text-amber-300">Rp {bungaNominal.toLocaleString('id-ID')}</div>
                    <div className="mt-2 text-[11px] uppercase tracking-wide text-amber-200">Cicilan per bulan</div>
                    <div className="text-lg font-black text-amber-300">Rp {cicilanBulanan.toLocaleString('id-ID')}</div>
                    <div className="text-[11px] text-amber-100/70">Bunga {bungaAktif}% dibayar di awal. Cicilan = nominal dibagi {simpanPinjamTenor} bulan.</div>
                  </div>
                </div>
              )}

              <DatePickerField label="Tanggal Transaksi" value={simpanPinjamTanggal} onChange={setSimpanPinjamTanggal} required colorTheme="teal" />

              {simpanPinjamMode === 'Cicilan' && <p className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-200">Pembayaran ini akan mengurangi saldo pinjaman nama dan alamat tersebut.</p>}

              <button
                type="submit"
                className="w-full py-3 mt-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-sm transition-all"
              >
                {editingSimpanPinjamId ? 'Simpan Perubahan' : `+ Simpan ${simpanPinjamMode}`}
              </button>
              {editingSimpanPinjamId && <button type="button" onClick={resetSimpanPinjamForm} className="w-full text-xs text-slate-400 hover:text-white">Batal edit</button>}
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
            <p className="text-slate-300 font-semibold">Total Simpanan: <span className="text-emerald-400">Rp {totalSimpanan.toLocaleString('id-ID')}</span></p>
            <p className="text-slate-300 font-semibold mt-1">Total Pinjaman: <span className="text-amber-300">Rp {totalPinjaman.toLocaleString('id-ID')}</span></p>
          </div>
        </div>

      </KasSortGroup>
      </div>

      {/* Riwayat Mutasi Transaksi */}
      <div data-kas-block="mutasi" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Riwayat & Mutasi Transaksi Keuangan</h2>
            <p className="text-xs text-slate-400">Catatan iuran & pengeluaran RT {selectedRt}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">Total: {filteredKas.length} RECORD</span>
            <button
              onClick={handleExportKasExcel}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500 hover:text-slate-950"
              title="Download Riwayat & Mutasi Transaksi Keuangan"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </button>
          </div>
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

              <div className="flex items-center justify-between mt-1">
                {item.diskon_keringanan && (
                  <span className="inline-block text-[9px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-500/30">
                  Keringanan Lansia/Janda
                  </span>
                )}
                <div className="flex gap-2"><button onClick={() => startEdit(item)} className="p-1.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white rounded-lg transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(item.id, item.keterangan)} className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors flex-shrink-0" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button></div>
              </div>
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
                <th className="px-4 py-3 text-right">Aksi</th>
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
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => startEdit(item)} className="p-1.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white rounded-lg transition-colors" title="Edit Transaksi"><Pencil className="w-4 h-4" /></button><button onClick={() => handleDelete(item.id, item.keterangan)} className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors" title="Hapus Transaksi"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Riwayat Simpan Pinjam */}
      <div data-kas-block="simpin" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Dashboard Simpan Pinjam</h2>
            <p className="text-xs text-slate-400">Riwayat simpanan, pinjaman, dan pembayaran cicilan RT {selectedRt}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 text-xs font-semibold">
            <span className="rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-300">Simpanan Rp {totalSimpanan.toLocaleString('id-ID')}</span>
            <span className="rounded-lg bg-amber-500/10 px-3 py-2 text-amber-300">Pinjaman Rp {totalPinjaman.toLocaleString('id-ID')}</span>
            <button
              onClick={handleExportSimpanPinjamExcel}
              className="inline-flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-300 transition-colors hover:bg-sky-500 hover:text-slate-950"
              title="Download Dashboard Simpan Pinjam"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
              <tr><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Alamat</th><th className="px-4 py-3">Jenis</th><th className="px-4 py-3">Tenor</th><th className="px-4 py-3 text-right">Nominal</th><th className="px-4 py-3 text-right">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredSimpanPinjam.map((item) => (
                <tr key={item.id} className="hover:bg-slate-850/50">
                  <td className="px-4 py-3 text-xs font-mono text-slate-400 whitespace-nowrap">{item.tanggal_transaksi}</td>
                  <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">{item.nama}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">{item.alamat}</td>
                  <td className="px-4 py-3"><span className={`rounded-md border px-2 py-1 text-xs font-semibold ${item.jenis === 'Simpan' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : item.jenis === 'Cicilan' ? 'border-sky-500/30 bg-sky-500/10 text-sky-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>{item.jenis}</span></td>
                  <td className="px-4 py-3 text-xs">{item.tenor_bulan ? <>{item.tenor_bulan} bulan<br /><span className="text-amber-300">Bunga {item.bunga_persen ?? 0}%: Rp {Math.round(item.nominal * (item.bunga_persen ?? 0) / 100).toLocaleString('id-ID')}</span><br /><span className="text-slate-400">Cicilan Rp {Math.round(item.nominal / item.tenor_bulan).toLocaleString('id-ID')}/bln</span></> : '-'}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">Rp {item.nominal.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => startEditSimpanPinjam(item)} className="p-1.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white rounded-lg" title="Edit"><Pencil className="w-4 h-4" /></button>
                    {item.jenis === 'Pinjam' && <button onClick={() => { setSimpanPinjamMode('Cicilan'); setSimpanPinjamNama(item.nama); setSimpanPinjamAlamat(item.alamat); setSimpanPinjamTenor(item.tenor_bulan || 3); setSimpanPinjamNominal(0); setEditingSimpanPinjamId(null); }} className="ml-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[11px] font-bold text-sky-300 hover:bg-sky-500 hover:text-white">Catat Cicilan</button>}
                    <button onClick={() => handleDeleteSimpanPinjam(item.id, `${item.jenis} ${item.nama}`)} className="ml-2 p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {!filteredSimpanPinjam.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">Belum ada transaksi Simpan Pinjam.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      </KasSortGroup>
    </div>
  );
}

export default function KasDashboardPage() {
  return (
    <KasEditProvider>
      <KasDashboardContent />
    </KasEditProvider>
  );
}
