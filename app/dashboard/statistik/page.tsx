'use client';

import React, { useState } from 'react';
import { useSimStore } from '@/lib/store';
import DatePickerField from '@/components/DatePickerField';
import BirthdayNotifications from '@/components/BirthdayNotifications';
import { RT_LIST } from '@/lib/types';
import { getAge, getWargaAgeCategory } from '@/lib/wargaUtils';
import { Users, BarChart2, UserPlus, CheckCircle2, Calendar, MapPin, Trash2, Pencil, X } from 'lucide-react';

export default function StatistikPage() {
  const { wargaList, selectedRt, addWarga, updateData, deleteData } = useSimStore();
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [alamat, setAlamat] = useState('');
  const [rt, setRt] = useState(selectedRt === 'ALL' ? '002' : selectedRt);
  const [statusTinggal, setStatusTinggal] = useState<'Tetap' | 'Kontrak'>('Tetap');
  const [toast, setToast] = useState<string | null>(null);

  const filteredWarga = selectedRt === 'ALL' ? wargaList : wargaList.filter(w => w.rt === selectedRt);
  const sortedWarga = [...filteredWarga].sort((first, second) =>
    first.alamat.localeCompare(second.alamat, 'id', { numeric: true, sensitivity: 'base' })
  );

  const totalWarga = filteredWarga.length;
  const wargaTetap = filteredWarga.filter(w => w.status_tinggal === 'Tetap').length;
  const wargaKontrak = filteredWarga.filter(w => w.status_tinggal === 'Kontrak').length;
  const lansiaCount = filteredWarga.filter(w => getWargaAgeCategory(w) === 'Lansia').length;

  const handleAddWarga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nik || nik.length !== 16) return alert('NIK wajib diisi 16 digit');
    if (!nama || !alamat) return alert('Nama dan Alamat Rumah Wajib diisi');

    const data = {
      nama_lengkap: nama,
      nik,
      tanggal_lahir: tanggalLahir,
      alamat,
      status_tinggal: statusTinggal,
      rt,
      rw: '012'
    };
    if (editingId) await updateData('warga', editingId, data); else await addWarga(data);

    setToast(`Warga ${nama} (${alamat}) berhasil ditambahkan!`);
    setTimeout(() => setToast(null), 3000);
    setNama('');
    setNik('');
    setTanggalLahir('');
    setAlamat('');
    setEditingId(null);
  };
  const startEdit = (item: (typeof wargaList)[number]) => { setEditingId(item.id); setNik(item.nik || ''); setNama(item.nama_lengkap); setTanggalLahir(item.tanggal_lahir || ''); setAlamat(item.alamat); setRt(item.rt); setStatusTinggal(item.status_tinggal); };
  const handleDelete = async (id: string, nama: string) => {
    if (window.confirm(`Yakin ingin menghapus data warga ${nama}?`)) {
      try {
        await deleteData('warga', id);
        setToast(`Data warga ${nama} berhasil dihapus.`);
        setTimeout(() => setToast(null), 3000);
      } catch (err) {
        alert('Gagal menghapus data.');
      }
    }
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
          <p className="text-slate-400 text-xs sm:text-sm">Pendataan warga dengan NIK, tanggal lahir, alamat rumah & RT 001 - 010</p>
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

      <BirthdayNotifications wargaList={filteredWarga} />

      {/* Grid Content: Table & Registration */}
      <div className="space-y-6 lg:space-y-8">
        {/* Table Warga */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <h2 className="text-base sm:text-lg font-bold text-white mb-4">Daftar Warga Terdaftar (RT {selectedRt})</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Alamat Rumah</th>
                  <th className="px-4 py-3">NIK</th>
                  <th className="px-4 py-3">Nama Lengkap</th>
                  <th className="px-4 py-3">Tanggal Lahir</th>
                  <th className="px-4 py-3">Usia</th>
                  <th className="px-4 py-3">Kategori Usia</th>
                  <th className="px-4 py-3">RT / RW</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sortedWarga.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-850">
                    <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">{w.alamat || '-'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400 whitespace-nowrap">{w.nik || '-'}</td>
                    <td className="px-4 py-3 font-bold text-white whitespace-nowrap">{w.nama_lengkap}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400 whitespace-nowrap">{w.tanggal_lahir || '-'}</td>
                    <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">{getAge(w.tanggal_lahir) ?? '-'}{getAge(w.tanggal_lahir) !== null ? ' tahun' : ''}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getWargaAgeCategory(w) ? (
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">{getWargaAgeCategory(w)}</span>
                      ) : '-'}
                    </td>
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
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => startEdit(w)} className="p-1.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white rounded-lg transition-colors" title="Edit Warga"><Pencil className="w-4 h-4" /></button>
                      <button 
                        onClick={() => handleDelete(w.id, w.nama_lengkap)}
                        className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors"
                        title="Hapus Warga"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Input Form Warga */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">{editingId ? 'Edit Data Warga' : 'Input Warga Baru'}</h2>{editingId && <button type="button" onClick={() => { setEditingId(null); setNama(''); setTanggalLahir(''); setAlamat(''); }} className="ml-auto text-slate-400 hover:text-white" title="Batal Edit"><X className="w-4 h-4" /></button>}
          </div>

          <form onSubmit={handleAddWarga} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 items-end">
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">NIK *</label>
              <input
                type="text"
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                placeholder="16 digit NIK"
                inputMode="numeric"
                pattern="[0-9]{16}"
                minLength={16}
                maxLength={16}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="lg:col-span-1">
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

            <div className="lg:col-span-1">
              <DatePickerField
                label="Tanggal Lahir"
                value={tanggalLahir}
                onChange={setTanggalLahir}
                colorTheme="emerald"
              />
            </div>

            <div className="lg:col-span-1">
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

            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih RT (Urut 001 - 010)</label>
              <select
                value={rt}
                onChange={(e) => setRt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
              >
                {RT_LIST.map((r) => (
                  <option key={r} value={r}>
                    RT {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status Tempat Tinggal</label>
              <select
                value={statusTinggal}
                onChange={(e) => setStatusTinggal(e.target.value as 'Tetap' | 'Kontrak')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Tetap">Warga Tetap</option>
                <option value="Kontrak">Warga Kontrak / Sewa</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all lg:col-span-1"
            >
              {editingId ? 'Simpan Perubahan' : '+ Simpan Data Warga'}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
