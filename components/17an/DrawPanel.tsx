'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Lock, Gift, X, ShieldCheck, Maximize2, Minimize2, Play, Square, Pencil, Repeat } from 'lucide-react';
import SpinWheel, { type SpinWheelHandle } from './SpinWheel';
import WinnerOverlay from './WinnerOverlay';
import { RT_LIST } from '@/lib/types';
import { btn2Cls, btnCls, callApi, inputCls } from './types';

export type Draw = {
  id: string; nama: string; status: 'draft' | 'terkunci' | 'menjalankan' | 'selesai' | 'disahkan'; allow_multi_win: boolean; putaran?: number;
  prizes: { id: string; nama: string; jumlah: number }[];
  participants: { id: string; nama: string; alamat?: string }[];
  lock?: { list_hash: string; commitment: string; drand_round?: number; locked_at: string };
  result?: { source: 'drand' | 'server-only'; winners: { prizeId: string; participantId: string; revealed?: boolean; absent?: boolean }[] };
};
type Summary = { id: string; nama: string; status: string; putaran: number; jumlah_peserta: number; jumlah_hadiah: number };
const STATUS_LABEL: Record<string, string> = { draft: 'Draft', terkunci: 'Daftar terkunci', menjalankan: 'Berjalan…', selesai: 'Sudah diundi (belum disahkan)', disahkan: 'Disahkan' };

export default function DrawPanel({ isMaster }: { isMaster: boolean }) {
  const [list, setList] = useState<Summary[]>([]);
  const [d, setD] = useState<Draw | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [newName, setNewName] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    try { setList(await callApi('/api/17an/draws', 'GET')); setErr(''); } catch (e) { setErr((e as Error).message); }
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadList(); }, [loadList]);

  const open = async (id: string) => {
    if (!id) return setD(null);
    try { setD(await callApi(`/api/17an/draws?id=${id}`, 'GET')); } catch (e) { setErr((e as Error).message); }
  };
  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    if (!d) return null;
    setBusy(true);
    try {
      const next = await callApi<Draw>('/api/17an/draws', 'PATCH', { id: d.id, action, ...extra });
      setD(next); loadList(); return next;
    } catch (e) { alert((e as Error).message); return null; } finally { setBusy(false); }
  };
  const nextRound = async () => {
    if (!d) return;
    const nama = window.prompt('Nama putaran berikutnya (kosongkan untuk nama otomatis):', '');
    if (nama === null) return;
    try {
      const doc = await callApi<Draw>('/api/17an/draws', 'POST', { from_id: d.id, nama: nama.trim() || undefined });
      await loadList(); setD(doc);
    } catch (er) { alert((er as Error).message); }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const doc = await callApi<Draw>('/api/17an/draws', 'POST', { nama: newName });
      setNewName(null); await loadList(); setD(doc);
    } catch (er) { alert((er as Error).message); }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className={inputCls + ' sm:max-w-xs'} value={d?.id ?? ''} onChange={(e) => open(e.target.value)}>
          <option value="">— Pilih undian —</option>
          {list.map((x) => <option key={x.id} value={x.id}>{x.nama}{x.putaran > 1 ? ` · putaran ${x.putaran}` : ''} ({STATUS_LABEL[x.status]})</option>)}
        </select>
        {isMaster && <button className={btnCls} onClick={() => setNewName('')}><Plus className="w-4 h-4 inline -mt-0.5" /> Undian baru</button>}
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
      {newName !== null && isMaster && (
        <form onSubmit={create} className="flex gap-2">
          <input className={inputCls} placeholder="Nama undian (mis. Doorprize Malam Puncak)" required maxLength={100} value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className={btnCls}>Buat</button><button type="button" className={btn2Cls} onClick={() => setNewName(null)}>Batal</button>
        </form>
      )}
      {d ? <DrawDetail key={d.id} d={d} isMaster={isMaster} busy={busy} act={act} onNextRound={nextRound} onDeleted={() => { setD(null); loadList(); }} />
        : newName === null && <p className="text-sm text-slate-500">{list.length ? 'Pilih undian.' : 'Belum ada undian.'}</p>}
    </section>
  );
}

function DrawDetail({ d, isMaster, busy, act, onDeleted, onNextRound }: {
  d: Draw; isMaster: boolean; busy: boolean; act: (a: string, x?: Record<string, unknown>) => Promise<Draw | null>; onDeleted: () => void; onNextRound: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [prizes, setPrizes] = useState(() => d.prizes.map((p) => ({ ...p })));
  const [rt, setRt] = useState('ALL');
  const [paste, setPaste] = useState('');
  const [winnerCount, setWinnerCount] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [celebrate, setCelebrate] = useState<{ id: number; prize: string; name: string; alamat?: string; ms: number } | null>(null);
  const [auto, setAuto] = useState(false);
  const [full, setFull] = useState(false);
  const wheel = useRef<SpinWheelHandle>(null);
  const stage = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const autoRef = useRef(false);
  const dRef = useRef(d);
  useEffect(() => { dRef.current = d; });
  const draft = d.status === 'draft';
  const byId = new Map(d.participants.map((p) => [p.id, p]));

  // Semua kemajuan putaran tersimpan di server (hadiah per pemenang: revealed / absent), jadi aman bila halaman tertutup.
  const ws = d.result?.winners ?? [];
  const nextIdx = ws.findIndex((w) => !w.revealed);
  const total = ws.length;
  const revealedCount = ws.filter((w) => w.revealed).length;
  const wonIds = new Set(ws.filter((w) => w.revealed && !w.absent).map((w) => w.participantId));
  const sudahKeluar = wonIds.size;
  const belumKeluar = d.participants.length - sudahKeluar;
  const absentCount = ws.filter((w) => w.absent).length;
  const prizeName = (id: string) => d.prizes.find((p) => p.id === id)?.nama ?? 'Hadiah';
  const history = ws.map((w, i) => ({ w, i })).filter((x) => x.w.revealed).map((x, k) => ({ ...x, n: k + 1 })).reverse(); // terbaru di atas
  const last = history[0];
  const nextW = nextIdx >= 0 ? ws[nextIdx] : undefined;
  const isReplacement = nextIdx > 0 && !!ws[nextIdx - 1].absent && ws[nextIdx - 1].prizeId === nextW?.prizeId;
  const prizeProgress = nextW ? (() => {
    const same = ws.map((w, i) => ({ w, i })).filter((x) => x.w.prizeId === nextW.prizeId && !x.w.absent);
    return { k: same.findIndex((x) => x.i === nextIdx) + 1, n: same.length };
  })() : null;

  // Satu putaran: roda berputar ke pemenang yang sudah ditetapkan server, lalu langsung disimpan (reveal).
  const spinOnce = async (): Promise<boolean> => {
    if (busyRef.current) return false;
    const cur = dRef.current;
    const list = cur.result?.winners ?? [];
    const idx = list.findIndex((w) => !w.revealed);
    if (idx < 0) return false;
    busyRef.current = true; setSpinning(true);
    const won = new Set(list.filter((w) => w.revealed && !w.absent).map((w) => w.participantId));
    const winner = cur.participants.find((x) => x.id === list[idx].participantId);
    const pool = cur.participants.filter((x) => !won.has(x.id)).map((x) => x.nama); // roda hanya berisi yang belum menang
    await wheel.current?.spinTo(winner?.nama ?? '?', pool);
    const saved = await act('reveal', { index: idx });
    busyRef.current = false; setSpinning(false);
    if (!saved) return false;
    dRef.current = saved;
    setCelebrate({ id: idx + 1, prize: cur.prizes.find((p) => p.id === list[idx].prizeId)?.nama ?? 'Hadiah', name: winner?.nama ?? '?', alamat: winner?.alamat, ms: autoRef.current ? 2200 : 4800 });
    return true;
  };
  const stopAuto = () => { autoRef.current = false; setAuto(false); };
  const runAuto = async () => {
    if (autoRef.current) return stopAuto();
    autoRef.current = true; setAuto(true);
    while (autoRef.current) {
      if (!(await spinOnce())) break;
      if (!(dRef.current.result?.winners ?? []).some((w) => !w.revealed)) break;
      await new Promise((r) => setTimeout(r, 2500)); // jeda singkat agar nama pemenang terbaca
    }
    stopAuto();
  };
  const markAbsent = async (index: number) => {
    const w = ws[index];
    const nama = byId.get(w.participantId)?.nama ?? '';
    if (!window.confirm(`${nama} tidak hadir?\n\nPengganti diundi ulang untuk hadiah “${prizeName(w.prizeId)}”. ${nama} tetap boleh ikut kesempatan undian berikutnya.`)) return;
    stopAuto();
    await act('absent', { index });
  };

  const toggleFull = async () => {
    if (!full) {
      setFull(true);
      try { await stage.current?.requestFullscreen?.(); } catch { /* iOS: cukup overlay penuh layar */ }
    } else {
      setFull(false);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }
  };
  useEffect(() => {
    const onFs = () => { if (!document.fullscreenElement) setFull(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    document.addEventListener('fullscreenchange', onFs);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('fullscreenchange', onFs); window.removeEventListener('keydown', onKey); autoRef.current = false; };
  }, []);

  const run = async () => {
    if (!window.confirm('Jalankan undian sekarang? Hasil ditentukan server dan tidak bisa diputar ulang.')) return;
    await act('run');
  };
  const remove = async () => {
    if (!window.confirm('Hapus undian draft ini?')) return;
    const res = await fetch(`/api/17an/draws?id=${d.id}`, { method: 'DELETE' });
    if (!res.ok) return alert((await res.json().catch(() => ({}))).error || 'Gagal');
    onDeleted();
  };
  const hasResult = d.status === 'selesai' || d.status === 'disahkan';
  const allShown = hasResult && nextIdx < 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">{d.nama}{(d.putaran ?? 1) > 1 && <span className="ml-2 align-middle text-[11px] font-bold px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300">Putaran {d.putaran}</span>}</h2>
          <span className="text-xs text-slate-400">{STATUS_LABEL[d.status]} · {d.participants.length} peserta · {d.allow_multi_win ? 'boleh menang lebih dari sekali' : 'satu orang satu hadiah'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {isMaster && <button className={btn2Cls} onClick={() => setEditing(true)}><Pencil className="w-4 h-4 inline -mt-0.5" /> Edit</button>}
          {isMaster && d.status === 'disahkan' && <button className={btnCls} disabled={busy} onClick={onNextRound}><Repeat className="w-4 h-4 inline -mt-0.5" /> Putaran berikutnya</button>}
          <Link href={`/17an/bukti/${d.id}`} className={btn2Cls}><ShieldCheck className="w-4 h-4 inline -mt-0.5" /> Bukti undian</Link>
          {isMaster && draft && <button className={btn2Cls + ' text-red-400'} onClick={remove}><Trash2 className="w-4 h-4" /></button>}
        </div>
      </div>

      {isMaster && draft && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold">Hadiah &amp; aturan <span className="font-normal text-slate-500">(hadiah boleh dikosongkan)</span></h3>
            {prizes.map((p, i) => (
              <div key={p.id || i} className="flex gap-2">
                <input className={inputCls} placeholder="Nama hadiah (opsional)" maxLength={100} value={p.nama} onChange={(e) => setPrizes(prizes.map((x, j) => (j === i ? { ...x, nama: e.target.value } : x)))} />
                <input type="number" min={1} max={1000} className={inputCls + ' !w-20'} value={p.jumlah} onChange={(e) => setPrizes(prizes.map((x, j) => (j === i ? { ...x, jumlah: Number(e.target.value) } : x)))} />
                <button aria-label="Hapus hadiah" onClick={() => setPrizes(prizes.filter((_, j) => j !== i))}><X className="w-4 h-4" /></button>
              </div>
            ))}
            <button className={btn2Cls} onClick={() => setPrizes([...prizes, { id: '', nama: '', jumlah: 1 }])}><Gift className="w-4 h-4 inline -mt-0.5" /> Tambah hadiah</button>
            {prizes.length === 0 && (
              <label className="text-xs text-slate-400 block">Jumlah pemenang (tanpa hadiah)
                <input type="number" min={1} max={1000} className={inputCls + ' !w-24'} value={winnerCount} onChange={(e) => setWinnerCount(Number(e.target.value))} />
              </label>
            )}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.allow_multi_win} onChange={(e) => act('rules', { allow_multi_win: e.target.checked, prizes })} /> Peserta boleh menang lebih dari sekali</label>
            <button className={btnCls} disabled={busy} onClick={() => act('rules', { prizes })}>Simpan hadiah</button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold">Peserta ({d.participants.length})</h3>
            <div className="flex gap-2">
              <select className={inputCls} value={rt} onChange={(e) => setRt(e.target.value)}>
                <option value="ALL">Semua RT</option>
                {RT_LIST.map((x) => <option key={x} value={x}>RT {x}</option>)}
              </select>
              <button className={btn2Cls + ' whitespace-nowrap'} disabled={busy} onClick={() => act('import-warga', { rt })}>Ambil dari data warga</button>
            </div>
            <label className="text-xs text-slate-400">Ketik / tempel manual — satu per baris, format “Nama | Alamat” (alamat opsional)</label>
            <textarea className={inputCls + ' font-mono'} rows={5} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={'Budi | AM 19/01\nSiti | AM 20/05\nPak RT'} />
            <button className={btn2Cls} disabled={busy || !paste.trim()} onClick={async () => { if (await act('add-bulk', { text: paste })) setPaste(''); }}>
              Tambahkan ke daftar ({paste.split('\n').filter((l) => l.trim()).length})
            </button>
            <ul className="max-h-48 overflow-y-auto text-xs divide-y divide-slate-800">
              {d.participants.slice(0, 200).map((p) => (
                <li key={p.id} className="flex justify-between gap-2 py-1"><span className="truncate">{p.nama} <span className="text-slate-500">{p.alamat}</span></span>
                  <button aria-label="Hapus" onClick={() => act('remove-participant', { participantId: p.id })}><X className="w-3 h-3" /></button></li>
              ))}
              {d.participants.length > 200 && <li className="py-1 text-slate-500">… dan {d.participants.length - 200} lainnya</li>}
            </ul>
            {d.participants.length > 0 && <button className="text-xs text-red-400" onClick={() => window.confirm('Kosongkan semua peserta?') && act('clear-participants')}>Kosongkan daftar</button>}
          </div>

          <div className="lg:col-span-2">
            <button className={btnCls} disabled={busy || !d.participants.length} onClick={async () => { if (!window.confirm('Kunci daftar peserta & hadiah? Setelah dikunci daftar tidak bisa diubah.')) return; if (await act('rules', { prizes })) await act('lock', { jumlah_pemenang: winnerCount }); }}>
              <Lock className="w-4 h-4 inline -mt-0.5" /> Kunci daftar sebelum undian
            </button>
          </div>
        </div>
      )}

      {d.lock && (
        <details className="group text-xs">
          <summary className="cursor-pointer text-slate-400 hover:text-slate-200 list-none flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Daftar peserta sudah dikunci
            <span className="underline decoration-dotted">detail teknis (untuk verifikasi)</span>
          </summary>
          <div className="mt-2 bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1 break-all">
            <p className="text-slate-300">Sidik jari digital yang dibuat <b>sebelum</b> undian, agar daftar peserta dan hasil tidak bisa diubah diam-diam. Warga bisa mencocokkannya di halaman “Bukti undian”.</p>
            <div>Hash daftar peserta: <code className="text-slate-200">{d.lock.list_hash}</code></div>
            <div>Komitmen seed server: <code className="text-slate-200">{d.lock.commitment}</code></div>
            <div>Ronde drand saat dikunci: {d.lock.drand_round ?? 'tidak tersedia'}</div>
          </div>
        </details>
      )}

      {isMaster && d.status === 'terkunci' && (
        <div className="flex gap-2">
          <button className={btnCls} disabled={busy} onClick={run}>Jalankan undian</button>
          <button className={btn2Cls} disabled={busy} onClick={() => act('unlock')}>Buka kunci</button>
        </div>
      )}

      {hasResult && (
        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <div className="space-y-3">
            {isMaster ? (
              <div ref={stage} className={full ? 'fixed inset-0 z-[100] bg-slate-950 overflow-auto p-4 sm:p-8 flex flex-col lg:flex-row gap-6 items-center lg:items-start' : 'space-y-3'}>
                <WinnerOverlay win={celebrate} ms={celebrate?.ms ?? 4800} onClose={() => setCelebrate(null)} />
                <div className={full ? 'flex-1 w-full flex flex-col items-center justify-center gap-5 min-h-0' : 'space-y-3'}>
                  <div className="relative w-full">
                    <button type="button" onClick={toggleFull} title={full ? 'Keluar layar penuh (Esc)' : 'Layar penuh'} aria-label={full ? 'Keluar layar penuh' : 'Layar penuh'}
                      className="absolute right-0 top-0 z-20 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200">
                      {full ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                    <SpinWheel ref={wheel} onClick={spinOnce} disabled={spinning || auto || nextIdx < 0}
                      className={full ? 'max-w-[min(72vh,88vw)]' : 'max-w-[320px]'} />
                  </div>
                  <div className="text-center space-y-3 w-full max-w-xl">
                    <div className={`rounded-2xl border border-fuchsia-400/40 bg-fuchsia-500/10 ${full ? 'p-4' : 'p-3'}`}>
                      <div className={`font-black text-fuchsia-200 ${full ? 'text-2xl' : 'text-base'}`}>
                        {nextW ? <>Putaran ke-{revealedCount + 1} <span className="font-semibold text-fuchsia-300/80">dari {total}</span></> : <>Semua putaran selesai <span className="font-semibold text-fuchsia-300/80">({total})</span></>}
                      </div>
                      {nextW && (
                        <div className={`${full ? 'text-base' : 'text-xs'} text-slate-200 mt-0.5`}>
                          Hadiah: <b>{prizeName(nextW.prizeId)}</b>{prizeProgress && prizeProgress.n > 1 ? ` (pemenang ${prizeProgress.k} dari ${prizeProgress.n})` : ''}
                          {isReplacement && <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-300 text-slate-950 text-[10px] font-black">PENGGANTI (undi ulang)</span>}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-slate-900 border border-slate-800 py-2"><div className={`font-black text-white ${full ? 'text-3xl' : 'text-xl'}`}>{belumKeluar}</div><div className="text-[10px] text-slate-400">belum keluar</div></div>
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 py-2"><div className={`font-black text-emerald-300 ${full ? 'text-3xl' : 'text-xl'}`}>{sudahKeluar}</div><div className="text-[10px] text-slate-400">sudah menang</div></div>
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 py-2"><div className={`font-black text-amber-300 ${full ? 'text-3xl' : 'text-xl'}`}>{absentCount}</div><div className="text-[10px] text-slate-400">tidak hadir</div></div>
                    </div>
                    {last && (
                      <div className={`rounded-2xl border shadow-[0_0_24px_#10b98122] ${last.w.absent ? 'bg-amber-500/10 border-amber-400/40' : 'bg-emerald-500/15 border-emerald-400/40'} ${full ? 'p-5' : 'p-3'}`}>
                        <div className={`${full ? 'text-base' : 'text-xs'} ${last.w.absent ? 'text-amber-300' : 'text-emerald-300'}`}>{last.w.absent ? '⚠️ Tidak hadir' : '🏆'} {prizeName(last.w.prizeId)} · putaran {last.n}</div>
                        <div className={`font-black text-white ${last.w.absent ? 'line-through opacity-70' : ''} ${full ? 'text-4xl sm:text-5xl' : 'text-lg'}`}>{byId.get(last.w.participantId)?.nama}</div>
                        {byId.get(last.w.participantId)?.alamat && <div className={`${full ? 'text-lg' : 'text-xs'} text-slate-300`}>{byId.get(last.w.participantId)?.alamat}</div>}
                        {d.status === 'selesai' && !last.w.absent && (
                          <button className={btn2Cls + ' mt-2 !border-amber-400/50 !text-amber-200'} disabled={busy || spinning} onClick={() => markAbsent(last.i)}>Tidak hadir — undi ulang</button>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button className={btnCls + (full ? ' !text-base !px-5 !py-3' : '')} disabled={nextIdx < 0 || spinning || auto} onClick={spinOnce}>
                        {spinning ? 'Memutar…' : nextW ? `Putar ke-${revealedCount + 1}: ${prizeName(nextW.prizeId)}` : 'Semua hadiah sudah diputar'}
                      </button>
                      <button className={btn2Cls + (full ? ' !text-base !px-5 !py-3' : '')} disabled={nextIdx < 0 && !auto} onClick={runAuto}>
                        {auto ? <><Square className="w-4 h-4 inline -mt-0.5" /> Hentikan otomatis</> : <><Play className="w-4 h-4 inline -mt-0.5" /> Putar otomatis semua</>}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">Setiap putaran langsung tersimpan; aman bila halaman tertutup. Klik roda untuk memutar lagi.</p>
                  </div>
                </div>

                <div className={`bg-slate-900 border border-slate-800 rounded-xl p-3 w-full ${full ? 'lg:w-96 lg:max-h-[92vh] overflow-y-auto' : ''}`}>
                  <h4 className="text-sm font-semibold mb-2">Riwayat putaran {history.length > 0 && <span className="text-xs font-normal text-slate-500">({history.length} dari {total})</span>}</h4>
                  {history.length === 0 ? <p className="text-xs text-slate-500">Belum ada putaran. Nama pemenang akan langsung tercatat (dan tersimpan) di sini.</p> : (
                    <ol className={`space-y-1.5 overflow-y-auto ${full ? '' : 'max-h-56'}`}>
                      {history.map((h) => {
                        const x = byId.get(h.w.participantId);
                        return (
                          <li key={h.n} className={`flex items-start gap-2 text-sm rounded-lg px-2.5 py-1.5 ${h.w.absent ? 'bg-amber-500/10' : 'bg-slate-950/60'}`}>
                            <span className={`shrink-0 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${h.w.absent ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{h.n}</span>
                            <span className="min-w-0 flex-1">
                              <b className={`text-white ${h.w.absent ? 'line-through opacity-60' : ''}`}>{x?.nama}</b>
                              <span className="block text-[11px] text-slate-400 truncate">{prizeName(h.w.prizeId)}{x?.alamat ? ` · ${x.alamat}` : ''}{h.w.absent ? ' · tidak hadir' : ''}</span>
                            </span>
                            {d.status === 'selesai' && !h.w.absent && <button className="shrink-0 text-[10px] font-semibold text-amber-300 hover:underline" disabled={busy || spinning} onClick={() => markAbsent(h.i)}>Tidak hadir</button>}
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-900 border border-slate-800 py-2"><div className="text-xl font-black text-white">{belumKeluar}</div><div className="text-[10px] text-slate-400">belum keluar</div></div>
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 py-2"><div className="text-xl font-black text-emerald-300">{sudahKeluar}</div><div className="text-[10px] text-slate-400">sudah menang</div></div>
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 py-2"><div className="text-xl font-black text-amber-300">{absentCount}</div><div className="text-[10px] text-slate-400">tidak hadir</div></div>
                </div>
                <p className="text-sm text-slate-400">{revealedCount < total ? `Undian berlangsung: putaran ${revealedCount} dari ${total}.` : 'Semua putaran selesai.'} Daftar pemenang ada di samping.</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Pemenang</h3>
            {d.prizes.map((p) => {
              const mine = ws.filter((w) => w.prizeId === p.id && (d.status === 'disahkan' || w.revealed));
              return (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-sm font-semibold">{p.nama} <span className="text-xs text-slate-500">×{p.jumlah}</span></div>
                  <ul className="mt-1 text-sm space-y-0.5">
                    {mine.map((w, i) => { const x = byId.get(w.participantId); return <li key={i} className={w.absent ? 'line-through opacity-50' : ''}>{w.absent ? '⚠️' : '🏆'} {x?.nama} <span className="text-xs text-slate-500">{x?.alamat}{w.absent ? ' · tidak hadir' : ''}</span></li>; })}
                    {mine.filter((w) => !w.absent).length === 0 && <li className="text-xs text-slate-500">Belum diumumkan</li>}
                  </ul>
                </div>
              );
            })}
            {isMaster && d.status === 'selesai' && (
              <div className="flex flex-wrap gap-2">
                <button className={btnCls} disabled={busy || !allShown} onClick={() => window.confirm('Sahkan hasil? Hasil sah tidak dapat diganti atau diundi ulang, dan seed server akan dibuka untuk verifikasi.') && act('certify')}>Sahkan hasil</button>
                <button className={btn2Cls} disabled={busy} onClick={() => { const a = window.prompt('Alasan membatalkan hasil (akan tampil di bukti undian):'); if (a) act('void', { alasan: a }); }}>Batalkan hasil</button>
                {!allShown && <p className="text-[11px] text-slate-500 w-full">Putar semua hadiah (termasuk pengganti) dulu sebelum mengesahkan.</p>}
              </div>
            )}
            {d.result?.source === 'server-only' && <p className="text-[11px] text-amber-400">Catatan: sumber acak publik (drand) tidak tersedia saat undian; hanya seed server dengan komitmen yang dipakai.</p>}
          </div>
        </div>
      )}
      {editing && isMaster && <EditDrawDialog d={d} busy={busy} act={act} onClose={() => setEditing(false)} onNextRound={() => { setEditing(false); onNextRound(); }} />}
    </div>
  );
}

function EditDrawDialog({ d, busy, act, onClose, onNextRound }: { d: Draw; busy: boolean; act: (a: string, x?: Record<string, unknown>) => Promise<Draw | null>; onClose: () => void; onNextRound: () => void }) {
  const [nama, setNama] = useState(d.nama);
  const [multi, setMulti] = useState(d.allow_multi_win);
  const draft = d.status === 'draft';
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nama.trim() !== d.nama && !(await act('rename', { nama }))) return;
    if (draft && multi !== d.allow_multi_win && !(await act('rules', { allow_multi_win: multi }))) return;
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <form onSubmit={save} className="w-full sm:max-w-md max-h-[96dvh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center"><h3 className="font-semibold text-sm">Edit undian</h3><button type="button" onClick={onClose} aria-label="Tutup"><X className="w-4 h-4" /></button></div>
        <label className="text-xs text-slate-400 block">Judul undian
          <input className={inputCls + ' mt-1'} required maxLength={100} value={nama} onChange={(e) => setNama(e.target.value)} />
        </label>
        <label className={`flex items-center gap-2 text-sm ${draft ? '' : 'opacity-50'}`}>
          <input type="checkbox" disabled={!draft} checked={multi} onChange={(e) => setMulti(e.target.checked)} /> Peserta boleh menang lebih dari sekali
        </label>

        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs space-y-2">
          {d.status === 'draft' && <p className="text-slate-300">Hadiah dan daftar peserta masih bisa diubah langsung di halaman undian (bagian “Hadiah &amp; aturan” dan “Peserta”).</p>}
          {d.status === 'terkunci' && (
            <>
              <p className="text-slate-300">Daftar sudah dikunci. Untuk mengubah hadiah atau peserta, buka kunci dulu (komitmen dibuat ulang saat dikunci lagi).</p>
              <button type="button" className={btn2Cls} disabled={busy} onClick={async () => { if (await act('unlock')) onClose(); }}>Buka kunci</button>
            </>
          )}
          {d.status === 'selesai' && (
            <>
              <p className="text-slate-300">Undian sudah diundi tetapi belum disahkan. Mengubah hadiah/peserta berarti membatalkan hasil (alasan tercatat dan tampil di bukti undian).</p>
              <button type="button" className={btn2Cls} disabled={busy} onClick={async () => { const a = window.prompt('Alasan membatalkan hasil:'); if (a && (await act('void', { alasan: a }))) onClose(); }}>Batalkan hasil</button>
            </>
          )}
          {d.status === 'disahkan' && (
            <>
              <p className="text-slate-300">Hasil sudah disahkan dan tidak dapat diubah. Untuk mengundi lagi dengan hadiah baru, buat <b>putaran berikutnya</b>: peserta tersisa, dan pemenang sebelumnya otomatis keluar (kecuali aturan menang ganda aktif). Putaran bisa dibuat berkali-kali.</p>
              <button type="button" className={btnCls} onClick={onNextRound}><Repeat className="w-4 h-4 inline -mt-0.5" /> Buat putaran berikutnya</button>
            </>
          )}
        </div>
        <div className="flex gap-2"><button className={btnCls} disabled={busy}>Simpan</button><button type="button" className={btn2Cls} onClick={onClose}>Tutup</button></div>
      </form>
    </div>
  );
}
