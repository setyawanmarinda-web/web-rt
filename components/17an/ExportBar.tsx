'use client';

import React, { useState } from 'react';
import { Download, Images } from 'lucide-react';
import { canvasToJpg, downloadBlob, elementToCanvas, loadExportFont, stitchCanvases } from '@/lib/client/exportImage';

export type ExportSection = { key: string; label: string; ref: React.RefObject<HTMLElement | null>; available: boolean; hint?: string };

const safe = (s: string) => s.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'bagan';

// Tombol unduh JPG per bagian (fase grup, babak gugur, klasemen akhir) + satu gambar gabungan seluruh rangkaian.
export default function ExportBar({ title, subtitle, sections, disabled }: { title: string; subtitle?: string; sections: ExportSection[]; disabled?: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (key: string, list: ExportSection[]) => {
    setBusy(key);
    try {
      await loadExportFont(); // font Geist siap sebelum menggambar judul
      const parts: HTMLCanvasElement[] = [];
      for (const s of list) if (s.ref.current) parts.push(await elementToCanvas(s.ref.current, { scale: 2 }));
      if (!parts.length) throw new Error('Tidak ada bagian yang bisa diunduh');
      const blob = await canvasToJpg(stitchCanvases(parts, { title, subtitle }));
      downloadBlob(blob, `${safe(title)}-${key}.jpg`);
    } catch (e) {
      alert((e as Error).message || 'Gagal mengunduh gambar');
    } finally {
      setBusy(null);
    }
  };
  const ready = sections.filter((s) => s.available);
  const btn = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed';
  return (
    <div className="flex flex-wrap items-center gap-2" data-export-skip>
      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Unduh JPG:</span>
      {sections.map((s) => (
        <button key={s.key} type="button" disabled={disabled || !!busy || !s.available} title={s.available ? undefined : s.hint}
          onClick={() => run(s.key, [s])} className={`${btn} border-slate-700 hover:bg-slate-800 text-slate-200`}>
          {busy === s.key ? 'Membuat…' : s.label}
        </button>
      ))}
      {ready.length > 1 && (
        <button type="button" disabled={disabled || !!busy} onClick={() => run('lengkap', ready)}
          className={`${btn} border-fuchsia-400/60 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-100`}>
          <Images className="w-3.5 h-3.5" />{busy === 'lengkap' ? 'Membuat…' : 'Semua rangkaian (1 gambar)'}
        </button>
      )}
    </div>
  );
}
