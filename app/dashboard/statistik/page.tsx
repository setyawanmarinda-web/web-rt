'use client';

import React, { useState } from 'react';
import { useSimStore } from '@/lib/store';
import { RT_LIST } from '@/lib/types';
import { Users, BarChart2, UserPlus, CheckCircle2, Calendar, MapPin } from 'lucide-react';

export default function StatistikPage() {
  const { wargaList, selectedRt, addWarga } = useSimStore();

  const [nama, setNama] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [alamat, setAlamat] = useState('');
  const [rt, setRt] = useState(selectedRt === 'ALL' ? '002' : selectedRt);
  const [statusTinggal, setStatusTinggal] = useState<'Tetap' | 'Kontrak'>('Tetap');
  const [toast, setToast] = useState<string | null>(null);

  const filteredWarga = selectedRt === 'ALL' ? wargaList : wargaList.filter(w => w.rt === selectedRt);

  const totalWarga = filteredWarga.length;
  const wargaTetap = filteredWarga.filter(w => w.status_tinggal === 'Tetap').length;
  const wargaKontrak = filteredWarga.filter(w => w.status_tinggal === 'Kontrak').length;
  const lansiaCount = filteredWarga.filter(w => w.nama_lengkap.toLowerCase().includes('lansia') || w.id === 'w-2').length;

  const handleAddWarga = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !alamat) return alert('Nama dan Alamat Rumah Wajib diisi');

    addWarga({
      nama_lengkap: nama,
      tanggal_lahir: tanggalLahir,
      alamat,
      status_tinggal: statusTinggal,
      rt,
      rw: '012'
    } as any);

    setToast(`Warga ${nama} (${alamat}) berhasil ditambahkan!`);
    setTimeout(() => setToast(null), 3000);
    setNama('');
    setTanggalLahir('');
    setAlamat('');
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Statistik & Demografi Kependudukan</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Pendataan warga tanpa NIK (Nama, Tanggal Lahir, Alamat Rumah & RT 001 - 010)</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-xl text-xs sm:text-sm border border-emerald-500/30">
            Total {totalWarga} Kepala Keluarga / Jiwa
          </span>
        </div>
      </div>

      {/* Metric Visual Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block uppercase mb-1">Total Terdata</span>
          <div className="text-3xl font-extrabold text-white mb-2">{totalWarga} <span className="text-sm font-normal text-slate-500">Warga</span></div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-full" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block uppercase mb-1">Warga Tetap</span>
          <div className="text-3xl font-extrabold text-teal-400 mb-2">{wargaTetap} <span className="text-sm font-normal text-slate-500">KK</span></div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-teal-400 h-full" style={{ width: `${totalWarga ? (wargaTetap/totalWarga)*100 : 0}%` }} />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{totalWarga ? Math.round((wargaTetap/totalWarga)*100) : 0}% dari populasi</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block uppercase mb-1">Warga Kontrak / Sewa</span>
          <div className="text-3xl font-extrabold text-purple-400 mb-2">{wargaKontrak} <span className="text-sm font-normal text-slate-500">KK</span></div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-purple-400 h-full" style={{ width: `${totalWarga ? (wargaKontrak/totalWarga)*100 : 0}%` }} />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{totalWarga ? Math.round((wargaKontrak/totalWarga)*100) : 0}% dari populasi</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block uppercase mb-1">Kategori Lansia</span>
          <div className="text-3xl font-extrabold text-amber-400 mb-2">{lansiaCount} <span className="text-sm font-normal text-slate-500">Lansia</span></div>
          <p className="text-[11px] text-slate-400">Penerima Potongan Pos Iuran</p>
        </div>
      </div>

      {/* Grid Content: Table & Registration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Table Warga (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <h2 className="text-base sm:text-lg font-bold text-white mb-4">Daftar Warga Terdaftar (RT {selectedRt})</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Nama Lengkap</th>
                  <th className="px-4 py-3">Tanggal Lahir</th>
                  <th className="px-4 py-3">Alamat Rumah</th>
                  <th className="px-4 py-3">RT / RW</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredWarga.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-850">
                    <td className="px-4 py-3 font-bold text-white whitespace-nowrap">{w.nama_lengkap}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400 whitespace-nowrap">{w.tanggal_lahir || '-'}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">{w.alamat || '-'}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap font-bold text-emerald-400">RT {w.rt} / RW {w.rw}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                        w.status_tinggal === 'Tetap'
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        {w.status_tinggal}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Input Form Warga (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">Input Warga Baru</h2>
          </div>

          <form onSubmit={handleAddWarga} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama Sesuai KTP"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Tanggal Lahir (Datepicker)
              </label>
              <input
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Rumah Lengkap *</label>
              <input
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Contoh: Blok A1 No. 4"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih RT (Urut 001 - 010)</label>
              <select
                value={rt}
                onChange={(e) => setRt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
              >
                {RT_LIST.map((r) => (
                  <option key={r} value={r}>
                    RT {r} {r === '002' ? '(Default Focus)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status Tempat Tinggal</label>
              <select
                value={statusTinggal}
                onChange={(e) => setStatusTinggal(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Tetap">Warga Tetap</option>
                <option value="Kontrak">Warga Kontrak / Sewa</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
            >
              + Simpan Data Warga
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
