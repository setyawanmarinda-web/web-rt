'use client';

import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { useSimStore } from '@/lib/store';
import { Download, GripVertical, MessageCircle, Store, Trash2, Pencil, Upload, X } from 'lucide-react';
import type { UMKM } from '@/lib/types';
import { SortGroup } from '@/components/LayoutEdit';
import { useViewOnly } from '@/lib/scope';

export default function UmkmPage() {
  const viewOnly = useViewOnly();
  const { umkmList, wargaList, addUmkm, updateData, deleteData } = useSimStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSuperAdmin] = useState(() => typeof window !== 'undefined' && localStorage.getItem('sim_rw_role') === 'super_admin');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = async (id: string, nama: string) => {
    if (window.confirm(`Yakin ingin menghapus UMKM "${nama}"?`)) {
      try { await deleteData('umkm', id); } catch { alert('Gagal menghapus.'); }
    }
  };

  const startEdit = (item: (typeof umkmList)[number]) => {
    setEditingId(item.id);
    setNamaUsaha(item.nama_usaha);
    setPemilik(item.pemilik);
    setAlamatRumah(item.alamat_rumah || wargaList.find((warga) => warga.nama_lengkap.trim().toLowerCase() === item.pemilik.trim().toLowerCase())?.alamat || '');
    setDeskripsi(item.deskripsi);
    setKategori(item.kategori);
    setWhatsapp(item.whatsapp);
    setCurrentFotoUrl(item.foto_url || '');
    setSelectedFile(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOwnerChange = (value: string) => {
    setPemilik(value);
    const warga = wargaList.find((item) => item.nama_lengkap.trim().toLowerCase() === value.trim().toLowerCase());
    if (warga) setAlamatRumah(warga.alamat);
  };

  const handleDrop = async (targetId: string) => {
    if (!isSuperAdmin || !draggedId || draggedId === targetId) return;
    const ordered = [...umkmList].sort((first, second) => (first.urutan ?? 0) - (second.urutan ?? 0));
    const fromIndex = ordered.findIndex((item) => item.id === draggedId);
    const toIndex = ordered.findIndex((item) => item.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, moved);
    await Promise.all(ordered.map((item, index) => updateData('umkm', item.id, { urutan: index })));
    setDraggedId(null);
  };

  const [namaUsaha, setNamaUsaha] = useState('');
  const [pemilik, setPemilik] = useState('');
  const [alamatRumah, setAlamatRumah] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kategori, setKategori] = useState<'Kuliner' | 'Jasa' | 'Kelontong' | 'Fashion' | 'Lainnya'>('Kuliner');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [currentFotoUrl, setCurrentFotoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wargaNames = Array.from(new Set(wargaList.map((warga) => warga.nama_lengkap.trim()).filter(Boolean)))
    .sort((first, second) => first.localeCompare(second, 'id'));
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUmkm = umkmList.filter((item) => !normalizedSearch
    || item.nama_usaha.toLowerCase().includes(normalizedSearch)
    || item.pemilik.toLowerCase().includes(normalizedSearch));
  const orderedUmkm = [...filteredUmkm].sort((first, second) => (first.urutan ?? 0) - (second.urutan ?? 0));

  const normalizeHeader = (value: unknown) => String(value ?? '').replace(/[\s_-]+/g, ' ').trim().toLowerCase();
  const normalizeName = (value: unknown) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  const normalizeWhatsapp = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits ? (digits.startsWith('62') ? digits : `62${digits.replace(/^0/, '')}`) : '';
  };

  const handleExportExcel = () => {
    const rows = umkmList.map((item) => ({
      'Nama Usaha': item.nama_usaha,
      Pemilik: item.pemilik,
      'Alamat Rumah': item.alamat_rumah || '',
      Deskripsi: item.deskripsi,
      Kategori: item.kategori,
      WhatsApp: item.whatsapp,
      'Foto URL': item.foto_url || '',
      RT: item.rt,
      Urutan: item.urutan ?? 0,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Direktori UMKM');
    XLSX.writeFile(workbook, 'direktori_umkm_rw012.xlsx');
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      const existingByName = new Map(umkmList.map((item) => [normalizeName(item.nama_usaha), item]));
      const createdNames = new Set<string>();
      let created = 0;
      let updated = 0;

      for (const rawRow of rows) {
        const row: Record<string, string> = {};
        Object.entries(rawRow).forEach(([key, value]) => { row[normalizeHeader(key)] = String(value ?? '').trim(); });
        const nama = row['nama usaha'];
        if (!nama) continue;

        const normalizedNama = normalizeName(nama);
        const existing = existingByName.get(normalizedNama);
        if (!existing && createdNames.has(normalizedNama)) continue;
        const importedWhatsapp = normalizeWhatsapp(row.whatsapp);
        const importedKategori = ['Kuliner', 'Jasa', 'Kelontong', 'Fashion', 'Lainnya'].includes(row.kategori)
          ? row.kategori as UMKM['kategori']
          : undefined;
        const changes: Record<string, string> = {};
        if (row.pemilik) changes.pemilik = row.pemilik;
        if (row['alamat rumah']) changes.alamat_rumah = row['alamat rumah'];
        if (row.deskripsi) changes.deskripsi = row.deskripsi;
        if (importedKategori) changes.kategori = importedKategori;
        if (importedWhatsapp) changes.whatsapp = importedWhatsapp;
        if (row['foto url']) changes.foto_url = row['foto url'];
        if (row.rt) changes.rt = row.rt;

        if (existing) {
          if (Object.keys(changes).length) {
            await updateData('umkm', existing.id, changes);
            updated += 1;
          }
        } else {
          await addUmkm({
            nama_usaha: nama,
            pemilik: changes.pemilik || 'Warga RT 002',
            alamat_rumah: changes.alamat_rumah,
            deskripsi: changes.deskripsi || '',
            kategori: importedKategori || 'Lainnya',
            whatsapp: changes.whatsapp || '',
            foto_url: changes.foto_url,
            rt: changes.rt || '002',
            urutan: umkmList.length + created,
          });
          createdNames.add(normalizedNama);
          created += 1;
        }
      }

      alert(`Import selesai. ${created} UMKM baru, ${updated} UMKM diperbarui. Nama yang sama tidak dibuat ulang.`);
    } catch (error) {
      console.error('[IMPORT UMKM]', error);
      alert('Gagal membaca atau menyimpan file Excel UMKM.');
    } finally {
      event.target.value = '';
    }
  };

  const selectFile = (file: File | undefined) => {
    if (!file) return;
    const isImage = ['image/jpeg', 'image/png'].includes(file.type)
      || /\.(jpe?g|png)$/i.test(file.name);
    if (!isImage) {
      setSelectedFile(null);
      setFileError('File harus berformat JPG atau PNG.');
      return;
    }
    if (file.size > 1024 * 1024) {
      setSelectedFile(null);
      setFileError('Ukuran file maksimal 1 MB.');
      return;
    }
    setSelectedFile(file);
    setCurrentFotoUrl('');
    setFileError('');
  };

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Foto tidak dapat dibaca.'));
    reader.readAsDataURL(file);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaUsaha || !whatsapp) return alert('Nama Usaha dan No WhatsApp wajib diisi');
    const fotoUrl = selectedFile ? await readFileAsDataUrl(selectedFile) : currentFotoUrl || undefined;

    const data = {
      nama_usaha: namaUsaha,
      pemilik: pemilik || 'Warga RT 002',
      alamat_rumah: alamatRumah,
      deskripsi,
      kategori,
      whatsapp: whatsapp.startsWith('62') ? whatsapp : '62' + whatsapp.replace(/^0/, ''),
      foto_url: fotoUrl,
      rt: '002'
    } as const;
    if (editingId) await updateData('umkm', editingId, data); else await addUmkm(data);

    setNamaUsaha('');
    setPemilik('');
    setAlamatRumah('');
    setDeskripsi('');
    setWhatsapp('');
    setSelectedFile(null);
    setFileError('');
    setCurrentFotoUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setEditingId(null);
    alert(editingId ? 'Data UMKM berhasil diubah!' : 'Usaha UMKM berhasil ditambahkan ke direktori!');
  };

  return (
    <div className="space-y-8">
      <SortGroup attr="data-lo" storageKey="lo-umkm" className="space-y-8">
<div data-lo="b1" className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Direktori UMKM Warga RW 012</h1>
          <p className="text-slate-400 text-sm">Promosi usaha warga lokal (Agen Cemilan, Jasa Perbaikan, Kuliner) dengan kontak WhatsApp langsung</p>
        </div>
      </div>

      <datalist id="umkm-warga-nama-suggestions">
        {wargaNames.map((name) => <option key={name} value={name} />)}
      </datalist>

      <div data-lo="b2">
<SortGroup attr="data-lo-p" storageKey="lo-umkm-b2" layout="flow" gap="1.5rem">
        
        {/* Grid UMKM List (8 cols) */}
        <div data-lo-p="p1" data-lo-w="9" data-lo-s="n" className="lg:col-span-9">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Daftar UMKM</h2>
              <p className="text-xs text-slate-400">{filteredUmkm.length} usaha ditemukan</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <input ref={importInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
              {!viewOnly && (
              <button type="button" onClick={handleExportExcel} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950" title="Export Direktori UMKM ke Excel">
                <Download className="h-4 w-4" /> Export
              </button>
              )}
              {!viewOnly && (
<button type="button" onClick={() => importInputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-300 hover:bg-sky-500 hover:text-slate-950" title="Import dan update Direktori UMKM dari Excel">
                <Upload className="h-4 w-4" /> Import
              </button>
)}
            </div>
            <div className="relative w-full sm:max-w-xs">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama UMKM atau pemilik..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                aria-label="Cari nama UMKM atau pemilik"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {orderedUmkm.map((u) => (
            <div
              key={u.id}
              draggable={isSuperAdmin}
              onDragStart={() => isSuperAdmin && setDraggedId(u.id)}
              onDragOver={(event) => { if (isSuperAdmin) event.preventDefault(); }}
              onDrop={() => void handleDrop(u.id)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between hover:border-emerald-500/50 transition-all group"
            >
              <div>
                {isSuperAdmin && <div className="mb-2 flex items-center gap-1 text-[10px] text-slate-500"><GripVertical className="h-3.5 w-3.5" /> Geser posisi toko</div>}
                {u.foto_url && <img src={u.foto_url} alt={`Foto ${u.nama_usaha}`} className="w-full aspect-square object-cover rounded-lg mb-3" />}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/30">
                    {u.kategori}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">{u.pemilik}</span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{u.nama_usaha}</h3>
                <p className="text-slate-300 text-xs leading-relaxed mb-3 line-clamp-3">{u.deskripsi}</p>
              </div>

              <a
                href={`https://wa.me/${u.whatsapp}?text=Halo%20${encodeURIComponent(u.nama_usaha)},%20saya%20warga%20RW%20012%20ingin%20bertanya...`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold border border-emerald-500/30 rounded-lg text-[10px] flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi via WhatsApp ({u.whatsapp})</span>
              </a>
              <div className="flex gap-2 mt-2">{!viewOnly && (
<button onClick={() => startEdit(u)} className="flex-1 py-1.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white font-semibold border border-sky-500/20 rounded-lg text-[10px] flex items-center justify-center gap-1 transition-all"><Pencil className="w-3 h-3" /> Edit</button>
)}{!viewOnly && (
<button onClick={() => handleDelete(u.id, u.nama_usaha)} className="flex-1 py-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-semibold border border-rose-500/20 rounded-lg text-[10px] flex items-center justify-center gap-1 transition-all"><Trash2 className="w-3 h-3" /> Hapus</button>
)}</div>
            </div>
          ))}
          {!filteredUmkm.length && <div className="sm:col-span-2 xl:col-span-4 rounded-xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">UMKM tidak ditemukan.</div>}
          </div>
        </div>

        {/* Form Tambah UMKM (4 cols) */}
        {!viewOnly && (
<div data-lo-p="p2" data-lo-w="3" data-lo-s="n" className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">{editingId ? 'Edit UMKM' : 'Daftarkan UMKM Anda'}</h2>{editingId && <button type="button" onClick={() => { setEditingId(null); setNamaUsaha(''); setPemilik(''); setDeskripsi(''); setWhatsapp(''); setSelectedFile(null); setFileError(''); setCurrentFotoUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="ml-auto text-slate-400 hover:text-white" title="Batal Edit"><X className="w-4 h-4" /></button>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Usaha *</label>
              <input
                type="text"
                value={namaUsaha}
                onChange={(e) => setNamaUsaha(e.target.value)}
                placeholder="Contoh: Agen Cemilan Bu Virna"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Pemilik</label>
              <input
                type="text"
                value={pemilik}
                onChange={(e) => handleOwnerChange(e.target.value)}
                placeholder="Ibu Virna"
                list="umkm-warga-nama-suggestions"
                autoComplete="off"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Rumah</label>
              <input
                type="text"
                value={alamatRumah}
                readOnly={Boolean(wargaList.find((warga) => warga.nama_lengkap.trim().toLowerCase() === pemilik.trim().toLowerCase()))}
                onChange={(e) => setAlamatRumah(e.target.value)}
                placeholder="Otomatis dari Statistik Warga"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white read-only:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori Usaha</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as UMKM['kategori'])}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Kuliner">Kuliner / Makanan</option>
                <option value="Jasa">Jasa / Perbaikan</option>
                <option value="Kelontong">Toko Kelontong / Sembako</option>
                <option value="Fashion">Fashion / Pakaian</option>
              </select>
            </div>

            <label
              htmlFor="umkm-foto"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-emerald-500'); }}
              onDragLeave={(e) => e.currentTarget.classList.remove('border-emerald-500')}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-emerald-500'); selectFile(e.dataTransfer.files[0]); }}
              className="block p-5 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl text-center bg-slate-950/50 cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                id="umkm-foto"
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                onChange={(e) => selectFile(e.target.files?.[0])}
                className="sr-only"
              />
              <p className="text-xs text-slate-300 font-medium">Klik atau tarik foto JPG/PNG ke area ini</p>
              <p className="text-[10px] text-slate-500 mt-1">Maksimal ukuran file 1 MB</p>
              {selectedFile && <p className="text-xs text-emerald-400 mt-2 break-all">{selectedFile.name}</p>}
              {!selectedFile && currentFotoUrl && <img src={currentFotoUrl} alt="Foto UMKM saat ini" className="w-full h-24 object-cover rounded-lg mt-3" />}
              {fileError && <p className="text-xs text-rose-400 mt-2">{fileError}</p>}
            </label>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">No WhatsApp (Diawali 62/08) *</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="628123456789"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Deskripsi Produk / Layanan</label>
              <textarea
                rows={3}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Menyediakan aneka cemilan pedas..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
            >
              {editingId ? 'Simpan Perubahan' : '+ Simpan UMKM'}
            </button>
          </form>
        </div>
)}

      </SortGroup>
</div>
</SortGroup>
    </div>
  );
}
