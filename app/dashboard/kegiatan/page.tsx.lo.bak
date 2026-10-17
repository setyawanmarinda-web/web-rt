'use client';

import React, { useState } from 'react';
import { useSimStore } from '@/lib/store';
import DatePickerField from '@/components/DatePickerField';
import { Calendar, Plus, MapPin, Clock, CheckCircle2, Trash2, Pencil, X } from 'lucide-react';

export default function KegiatanPage() {
  const { kegiatanList, selectedRt, addKegiatan, updateData, deleteData } = useSimStore();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleDelete = async (id: string, judul: string) => {
    if (window.confirm(`Yakin ingin menghapus kegiatan "${judul}"?`)) {
      try { await deleteData('kegiatan', id); } catch { alert('Gagal menghapus.'); }
    }
  };

  const startEdit = (item: (typeof kegiatanList)[number]) => {
    setEditingId(item.id); setJudul(item.judul); setDeskripsi(item.deskripsi); setTanggal(item.tanggal);
    setWaktu(item.waktu); setLokasi(item.lokasi); setKategori(item.kategori);
  };

  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [waktu, setWaktu] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [kategori, setKategori] = useState<'Kerja Bakti' | 'Rapat' | 'Posyandu' | 'Sosialisasi' | 'Lainnya'>('Kerja Bakti');

  const filteredKegiatan = selectedRt === 'ALL' ? kegiatanList : kegiatanList.filter(k => k.rt === selectedRt || k.rt === '012');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul || !tanggal) return alert('Judul dan tanggal wajib diisi');

    const data = {
      judul,
      deskripsi,
      tanggal,
      waktu: waktu || '08:00 WIB',
      lokasi: lokasi || 'Balai Warga RT 002',
      rt: selectedRt === 'ALL' ? '002' : selectedRt,
      kategori,
      status: 'Akan Datang'
    } as const;
    if (editingId) await updateData('kegiatan', editingId, data);
    else await addKegiatan(data);

    setJudul('');
    setDeskripsi('');
    setTanggal('');
    setWaktu('');
    setLokasi('');
    setEditingId(null);
    alert(editingId ? 'Agenda kegiatan berhasil diubah!' : 'Agenda kegiatan berhasil ditambahkan!');
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Agenda Kegiatan Warga</h1>
          <p className="text-slate-400 text-sm">Manajemen CRUD agenda kegiatan RT {selectedRt} (Kerja Bakti, Rapat RT/RW, Posyandu)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* List Kegiatan (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-lg font-bold text-white mb-4">Daftar Agenda Kegiatan</h2>
          {filteredKegiatan.map((item) => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-emerald-500/40 transition-all">
              <div className="flex items-start justify-between gap-4 mb-2">
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  {item.kategori}
                </span>
                <span className="text-xs text-slate-400 font-mono">{item.tanggal}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{item.judul}</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">{item.deskripsi}</p>
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 border-t border-slate-800 pt-3">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-emerald-400" /> {item.waktu}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> {item.lokasi}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(item)} className="p-1.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white rounded-lg transition-colors" title="Edit Kegiatan"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(item.id, item.judul)} className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors" title="Hapus Kegiatan"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Form Tambah Kegiatan (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-white">{editingId ? 'Edit Agenda' : 'Buat Agenda Baru'}</h2>{editingId && <button type="button" onClick={() => { setEditingId(null); setJudul(''); setDeskripsi(''); setTanggal(''); setWaktu(''); setLokasi(''); }} className="text-slate-400 hover:text-white" title="Batal Edit"><X className="w-4 h-4" /></button>}</div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Kegiatan *</label>
              <input
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Kerja Bakti Gapura"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Kerja Bakti">Kerja Bakti</option>
                <option value="Rapat">Rapat RT/RW</option>
                <option value="Posyandu">Posyandu</option>
                <option value="Sosialisasi">Sosialisasi</option>
              </select>
            </div>

            <DatePickerField
              label="Tanggal"
              value={tanggal}
              onChange={setTanggal}
              required
              colorTheme="emerald"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Waktu</label>
              <input
                type="text"
                value={waktu}
                onChange={(e) => setWaktu(e.target.value)}
                placeholder="07:00 - 11:00 WIB"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Lokasi</label>
              <input
                type="text"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                placeholder="Lapangan Pos Ronda"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Deskripsi</label>
              <textarea
                rows={3}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Rincian acara..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
            >
              {editingId ? 'Simpan Perubahan' : '+ Publish Agenda'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
