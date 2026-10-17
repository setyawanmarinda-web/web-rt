'use client';

import React, { useRef, useState } from 'react';
import { useSimStore } from '@/lib/store';
import { Download, Upload, Trash2, Pencil, X } from 'lucide-react';
import type { Arsip } from '@/lib/types';

export default function ArsipPage() {
  const { arsipList, addArsip, updateData, deleteData } = useSimStore();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleDelete = async (id: string, judul: string) => {
    if (window.confirm(`Yakin ingin menghapus arsip "${judul}"?`)) {
      try { await deleteData('arsip', id); } catch { alert('Gagal menghapus.'); }
    }
  };

  const startEdit = (item: (typeof arsipList)[number]) => { setEditingId(item.id); setJudul(item.judul); setKategori(item.kategori); setSelectedFile(null); setFileError(''); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState<'Notulen Rapat' | 'SK Kepengurusan' | 'Peraturan RW' | 'Laporan Keuangan'>('Notulen Rapat');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectFile = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setSelectedFile(null);
      setFileError('File harus berformat PDF.');
      return;
    }
    if (file.size > 1024 * 1024) {
      setSelectedFile(null);
      setFileError('Ukuran file maksimal 1 MB.');
      return;
    }
    setSelectedFile(file);
    setFileError('');
  };

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('File tidak dapat dibaca.'));
    reader.readAsDataURL(file);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul) return alert('Judul arsip wajib diisi');
    if (!editingId && !selectedFile) return alert('Pilih file PDF terlebih dahulu.');

    const fileUrl = selectedFile ? await readFileAsDataUrl(selectedFile) : undefined;

    const data = {
      judul,
      kategori,
      file_url: fileUrl || arsipList.find((item) => item.id === editingId)?.file_url || '#',
      ukuran: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : arsipList.find((item) => item.id === editingId)?.ukuran || '-'
    };
    if (editingId) await updateData('arsip', editingId, data); else await addArsip(data);

    setJudul('');
    setSelectedFile(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setEditingId(null);
    alert(editingId ? 'Arsip berhasil diubah!' : 'Dokumen arsip digital berhasil ditambahkan!');
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Arsip Digital & Dokumen RW 012</h1>
          <p className="text-slate-400 text-sm">Penyimpanan PDF notulen rapat, SK kepengurusan, & Peraturan RW 012 Kelurahan Bahagia</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* List Arsip (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <h2 className="text-lg font-bold text-white mb-4">Arsip Dokumen Resmi</h2>
          {arsipList.map((item) => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-emerald-500/40 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  PDF
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{item.judul}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="text-emerald-400">{item.kategori}</span>
                    <span>•</span>
                    <span>Upload: {item.tanggal_upload}</span>
                    <span>•</span>
                    <span>{item.ukuran}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="#"
                  download={`${item.judul}.pdf`}
                  onClick={(e) => { if (item.file_url === '#') { e.preventDefault(); alert(`Berkas "${item.judul}" belum tersedia.`); } }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </a>
                <button onClick={() => startEdit(item)} className="p-1.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white rounded-lg transition-colors" title="Edit Arsip"><Pencil className="w-4 h-4" /></button><button onClick={() => handleDelete(item.id, item.judul)} className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors" title="Hapus Arsip"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Form Upload (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-white">{editingId ? 'Edit Arsip Digital' : 'Unggah Arsip PDF Baru'}</h2>{editingId && <button type="button" onClick={() => { setEditingId(null); setJudul(''); setSelectedFile(null); setFileError(''); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-slate-400 hover:text-white" title="Batal Edit"><X className="w-4 h-4" /></button>}</div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Dokumen *</label>
              <input
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Peraturan Ronda Malam 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori Dokumen</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as Arsip['kategori'])}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Notulen Rapat">Notulen Rapat</option>
                <option value="SK Kepengurusan">SK Kepengurusan</option>
                <option value="Peraturan RW">Peraturan RW 012</option>
                <option value="Laporan Keuangan">Laporan Keuangan</option>
              </select>
            </div>

            <label
              htmlFor="arsip-file"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-emerald-500'); }}
              onDragLeave={(e) => e.currentTarget.classList.remove('border-emerald-500')}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-emerald-500'); selectFile(e.dataTransfer.files[0]); }}
              className="block p-6 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl text-center bg-slate-950/50 cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                id="arsip-file"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => selectFile(e.target.files?.[0])}
                className="sr-only"
              />
              <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-300 font-medium">Klik atau tarik file PDF ke area ini</p>
              <p className="text-[10px] text-slate-500 mt-1">Maksimal ukuran file 1 MB</p>
              {selectedFile && <p className="text-xs text-emerald-400 mt-2 break-all">{selectedFile.name}</p>}
              {fileError && <p className="text-xs text-rose-400 mt-2">{fileError}</p>}
            </label>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
            >
              {editingId ? 'Simpan Perubahan' : '+ Simpan Berkas Arsip'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
