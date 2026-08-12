'use client';

import React from 'react';
import { useSimStore } from '@/lib/store';
import { FileSpreadsheet, Download, Printer, CheckCircle } from 'lucide-react';

export default function LaporanPage() {
  const { kasList, wargaList, selectedRt, getKasSummaryByRt } = useSimStore();

  const summary = getKasSummaryByRt(selectedRt);
  const filteredKas = selectedRt === 'ALL' ? kasList : kasList.filter(k => k.rt === selectedRt);
  const filteredWarga = selectedRt === 'ALL' ? wargaList : wargaList.filter(w => w.rt === selectedRt);

  const handleExportCSV = (type: 'kas' | 'warga') => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (type === 'kas') {
      csvContent += 'ID,Tanggal,Jenis,Pos,Nominal,Metode,Pembayar,Keterangan\n';
      filteredKas.forEach(k => {
        csvContent += `"${k.id}","${k.created_at}","${k.jenis}","${k.pos}","${k.jumlah}","${k.metode}","${k.nama_pembayar || ''}","${k.keterangan.replace(/"/g, '""')}"\n`;
      });
    } else {
      csvContent += 'ID,NIK,Nama Lengkap,Status Tinggal,RT,RW,No HP\n';
      filteredWarga.forEach(w => {
        csvContent += `"${w.id}","${w.nik}","${w.nama_lengkap}","${w.status_tinggal}","${w.rt}","${w.rw}","${w.no_hp || ''}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_${type.toUpperCase()}_RT_${selectedRt}_RW012.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Laporan & Ekspor Rekapitulasi Data</h1>
          <p className="text-slate-400 text-sm">Cetak & unduh laporan rekapitulasi keuangan 5 pos & data kependudukan (Format PDF / Excel CSV)</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExportCSV('kas')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Kas Excel (CSV)</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF Laporan</span>
          </button>
        </div>
      </div>

      {/* Printable Financial Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-white">REKAPITULASI KAS & IURAN RT {selectedRt} / RW 012</h2>
            <p className="text-xs text-slate-400">Kelurahan Bahagia • Periode Tahun 2026</p>
          </div>
          <span className="text-xs text-emerald-400 font-mono font-bold">Generated: {new Date().toLocaleDateString('id-ID')}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Total Pemasukan</span>
            <span className="text-lg font-bold text-emerald-400">Rp {summary.totalMasuk.toLocaleString('id-ID')}</span>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Total Pengeluaran</span>
            <span className="text-lg font-bold text-red-400">Rp {summary.totalKeluar.toLocaleString('id-ID')}</span>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Saldo Akhir Bersih</span>
            <span className="text-lg font-bold text-teal-300">Rp {summary.saldoAkhir.toLocaleString('id-ID')}</span>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Total Warga KK</span>
            <span className="text-lg font-bold text-white">{filteredWarga.length} KK</span>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Rincian Pos Keuangan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-400 block">1. Satpam & Sampah</span>
              <span className="font-bold text-white">Rp {(summary['Satpam & Sampah'] || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-400 block">2. Kas RT</span>
              <span className="font-bold text-emerald-400">Rp {(summary['Kas RT'] || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-400 block">3. Dana Sosial</span>
              <span className="font-bold text-white">Rp {(summary['Dana Sosial'] || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-400 block">4. Dana 17-an</span>
              <span className="font-bold text-white">Rp {(summary['17an'] || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-400 block">5. Dana THR</span>
              <span className="font-bold text-white">Rp {(summary['THR'] || 0).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
