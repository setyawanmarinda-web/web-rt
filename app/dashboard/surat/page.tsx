'use client';

import React, { useState } from 'react';
import { useSimStore } from '@/lib/store';
import { FileText, Clock, CheckCircle2, AlertCircle, Plus } from 'lucide-react';

export default function SuratPage() {
  const { suratList, selectedRt, addSurat, updateSuratStatus } = useSimStore();

  const [nik, setNik] = useState('');
  const [namaPemohon, setNamaPemohon] = useState('');
  const [jenisSurat, setJenisSurat] = useState<'Surat Pengantar KTP' | 'SKTM' | 'Surat Domisili' | 'Lainnya'>('Surat Pengantar KTP');
  const [keperluan, setKeperluan] = useState('');

  const filteredSurat = selectedRt === 'ALL' ? suratList : suratList.filter(s => s.rt === selectedRt);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nik || !namaPemohon || !keperluan) return alert('NIK, Nama, dan Keperluan wajib diisi');

    addSurat({
      nik,
      nama_pemohon: namaPemohon,
      jenis_surat: jenisSurat,
      keperluan,
      rt: selectedRt === 'ALL' ? '002' : selectedRt
    });

    setNik('');
    setNamaPemohon('');
    setKeperluan('');
    alert('Pengajuan surat pengantar berhasil didaftarkan!');
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Layanan Surat Pengantar Warga</h1>
          <p className="text-slate-400 text-sm">Pengajuan & verifikasi Surat Pengantar KTP, SKTM, & Domisili dengan status tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* List Permohonan Surat (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">Daftar Pengajuan Surat</h2>

          <div className="space-y-3">
            {filteredSurat.map((item) => (
              <div key={item.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-emerald-400 font-bold">{item.no_surat}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-slate-400">{item.tanggal_pengajuan}</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{item.jenis_surat} - {item.nama_pemohon}</h3>
                  <p className="text-xs text-slate-400 mt-1">Keperluan: {item.keperluan} (NIK: {item.nik})</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.status === 'Disetujui'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : item.status === 'Diproses'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.status}
                  </span>

                  {item.status !== 'Disetujui' && (
                    <button
                      onClick={() => updateSuratStatus(item.id, 'Disetujui')}
                      className="px-3 py-1 bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                      Setujui Surat
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Ajukan Surat (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-lg font-bold text-white mb-4">Buat Pengajuan Surat Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">NIK Pemohon *</label>
              <input
                type="text"
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                placeholder="3275..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Pemohon *</label>
              <input
                type="text"
                value={namaPemohon}
                onChange={(e) => setNamaPemohon(e.target.value)}
                placeholder="Nama pemohon sesuai KTP"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis Layanan Surat</label>
              <select
                value={jenisSurat}
                onChange={(e) => setJenisSurat(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Surat Pengantar KTP">Surat Pengantar KTP</option>
                <option value="SKTM">SKTM (Surat Keterangan Tidak Mampu)</option>
                <option value="Surat Domisili">Surat Domisili Tempat Tinggal</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Keperluan Pengajuan *</label>
              <textarea
                rows={3}
                value={keperluan}
                onChange={(e) => setKeperluan(e.target.value)}
                placeholder="Rincian keperluan pengajuan surat..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
            >
              + Ajukan Surat
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
