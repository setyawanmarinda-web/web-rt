'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Shuffle, X, Pencil, LayoutTemplate } from 'lucide-react';
import { BYE, buildKnockout, buildSlots, nextPow2, standings, type Match } from '@/lib/event/bracket';
import BracketView, { fmtJadwal, nameOf, roundName } from './BracketView';
import Podium from './Podium';
import ExportBar from './ExportBar';
import TataPanel from './TataPanel';
import { mergeTata, type Tata } from '@/lib/event/tata';
import DatePickerField from '@/components/DatePickerField';
import { applyOp, applyOps, type Op, type OpState } from '@/lib/event/ops';
import { btn2Cls, btnCls, callApi, inputCls, type TemplateSummary, type Tournament, type TournamentSummary } from './types';

const STATUS_CLS: Record<string, string> = { draft: 'bg-slate-700 text-slate-200', berjalan: 'bg-amber-500/20 text-amber-300', selesai: 'bg-emerald-500/20 text-emerald-300' };

export default function TournamentPanel({ isMaster }: { isMaster: boolean }) {
  const [list, setList] = useState<TournamentSummary[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [t, setT] = useState<Tournament | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [newForm, setNewForm] = useState<{ nama: string; cabang: string; mode: 'single' | 'group'; template_id: string; peserta: string } | null>(null);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [editMeta, setEditMeta] = useState(false);

  const loadList = useCallback(async () => {
    try { setList(await callApi('/api/17an/tournaments', 'GET')); setErr(''); } catch (e) { setErr((e as Error).message); }
  }, []);
  const loadTemplates = useCallback(async () => {
    try { setTemplates(await callApi('/api/17an/templates', 'GET')); } catch { /* template opsional */ }
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadList(); loadTemplates(); }, [loadList, loadTemplates]);

  const open = useCallback(async (id: string | null) => {
    setSel(id);
    if (!id) return setT(null);
    try { setT(await callApi(`/api/17an/tournaments?id=${id}`, 'GET')); setErr(''); } catch (e) { setErr((e as Error).message); }
  }, []);

  const act = async (action: string, extra: Record<string, unknown> = {}): Promise<boolean> => {
    if (!t) return false;
    setBusy(true);
    try {
      setT(await callApi<Tournament>('/api/17an/tournaments', 'PATCH', { id: t.id, action, ...extra }));
      setErr(''); loadList();
      return true;
    } catch (e) { alert((e as Error).message); return false; } finally { setBusy(false); }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm) return;
    try {
      const doc = await callApi<Tournament>('/api/17an/tournaments', 'POST', { ...newForm, template_id: newForm.template_id || undefined, peserta: newForm.template_id ? newForm.peserta : undefined });
      setNewForm(null); await loadList(); open(doc.id);
    } catch (er) { alert((er as Error).message); }
  };

  const saveTemplate = async () => {
    if (!t) return;
    const nama = window.prompt('Nama template (bagan & tata letak ini akan bisa dipakai lagi, tanpa nama peserta & hasil):', t.nama);
    if (!nama?.trim()) return;
    try {
      await callApi('/api/17an/templates', 'POST', { tournamentId: t.id, nama: nama.trim() });
      await loadTemplates();
      alert('Template tersimpan. Pakai lewat “Turnamen baru” → pilih template.');
    } catch (e) { alert((e as Error).message); }
  };

  const removeTemplate = async (id: string) => {
    const tpl = templates.find((x) => x.id === id);
    if (!tpl || !window.confirm(`Hapus template "${tpl.nama}"? Turnamen yang sudah dibuat darinya tidak terpengaruh.`)) return;
    try {
      const res = await fetch(`/api/17an/templates?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Gagal menghapus');
      setNewForm((f) => (f ? { ...f, template_id: '' } : f));
      loadTemplates();
    } catch (e) { alert((e as Error).message); }
  };

  const remove = async () => {
    if (!t || !window.confirm(`Hapus turnamen "${t.nama}" beserta semua hasilnya?`)) return;
    try {
      const url = `/api/17an/tournaments?id=${t.id}`;
      let res = await fetch(url, { method: 'DELETE' });
      if (res.status === 409 && window.confirm('Turnamen sudah berjalan. Tetap hapus?')) res = await fetch(url + '&konfirmasi=true', { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Gagal menghapus');
      open(null); loadList();
    } catch (e) { alert((e as Error).message); }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className={inputCls + ' sm:max-w-xs'} value={sel ?? ''} onChange={(e) => open(e.target.value || null)}>
          <option value="">— Pilih turnamen —</option>
          {list.map((x) => <option key={x.id} value={x.id}>{x.nama} ({x.mode === 'single' ? 'Gugur' : 'Grup'}, {x.jumlah_peserta} peserta)</option>)}
        </select>
        {isMaster && <button className={btnCls} onClick={() => setNewForm({ nama: '', cabang: '', mode: 'single', template_id: '', peserta: '' })}><Plus className="w-4 h-4 inline -mt-0.5" /> Turnamen baru</button>}
        {isMaster && t && <button className={btn2Cls} onClick={() => setEditMeta(true)}><Pencil className="w-4 h-4 inline -mt-0.5" /> Edit turnamen</button>}
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}

      {newForm && isMaster && (
        <form onSubmit={create} className="bg-slate-900 border border-slate-700 rounded-xl p-4 grid gap-3 sm:grid-cols-4">
          <label className="text-xs text-slate-400 sm:col-span-4"><LayoutTemplate className="w-3.5 h-3.5 inline -mt-0.5" /> Mulai dari
            <div className="flex gap-2 mt-1">
              <select className={inputCls} value={newForm.template_id} onChange={(e) => setNewForm({ ...newForm, template_id: e.target.value })}>
                <option value="">Kosong (atur sendiri)</option>
                {templates.map((x) => <option key={x.id} value={x.id}>Template: {x.nama} ({x.mode === 'single' ? 'Gugur' : 'Grup'}, {x.jumlah_peserta} peserta)</option>)}
              </select>
              {newForm.template_id && <button type="button" className={btn2Cls + ' text-red-400'} aria-label="Hapus template" onClick={() => removeTemplate(newForm.template_id)}><Trash2 className="w-4 h-4" /></button>}
            </div>
          </label>
          <input className={inputCls + ' sm:col-span-2'} placeholder="Nama turnamen (mis. Futsal Anak)" required maxLength={100} value={newForm.nama} onChange={(e) => setNewForm({ ...newForm, nama: e.target.value })} />
          <input className={inputCls} placeholder="Cabang (opsional)" maxLength={60} value={newForm.cabang} onChange={(e) => setNewForm({ ...newForm, cabang: e.target.value })} />
          {!newForm.template_id && (
            <select className={inputCls} value={newForm.mode} onChange={(e) => setNewForm({ ...newForm, mode: e.target.value as 'single' | 'group' })}>
              <option value="single">Sistem Gugur (Single Elimination)</option>
              <option value="group">Sistem Grup (+ babak gugur)</option>
            </select>
          )}
          {newForm.template_id && (
            <label className="text-xs text-slate-400 sm:col-span-4">Peserta (opsional) — satu per baris “Nama | Tim”; kosongkan untuk “Peserta 1, 2, …” lalu ganti namanya nanti
              <textarea className={inputCls + ' font-mono mt-1'} rows={5} value={newForm.peserta} onChange={(e) => setNewForm({ ...newForm, peserta: e.target.value })} />
            </label>
          )}
          <div className="flex gap-2 sm:col-span-4"><button className={btnCls}>{newForm.template_id ? 'Buat dari template' : 'Buat'}</button><button type="button" className={btn2Cls} onClick={() => setNewForm(null)}>Batal</button></div>
        </form>
      )}

      {t && editMeta && isMaster && <EditMetaDialog t={t} busy={busy} onClose={() => setEditMeta(false)} onSave={async (x) => { if (await act('meta', x)) setEditMeta(false); }} />}

      {t && <TournamentDetail key={t.id} t={t} isMaster={isMaster} busy={busy} act={act} onDelete={remove} onTemplate={saveTemplate} />}
      {!t && !newForm && <p className="text-sm text-slate-500">{list.length ? 'Pilih turnamen untuk melihat bracket.' : 'Belum ada turnamen.'}</p>}
    </section>
  );
}

function TournamentDetail({ t: tServer, isMaster, busy, act: serverAct, onDelete, onTemplate }: {
  t: Tournament; isMaster: boolean; busy: boolean; act: (a: string, x?: Record<string, unknown>) => Promise<boolean>; onDelete: () => void; onTemplate: () => void;
}) {
  // Perubahan edit (skor, jadwal, tukar peserta, ubah nama) ditampung dulu, baru disimpan lewat tombol Simpan.
  const groupRef = useRef<HTMLDivElement>(null);
  const koRef = useRef<HTMLDivElement>(null);
  const podiumRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<Op[]>([]);
  const [tataDraft, setTataDraft] = useState<Tata | null>(null); // null = tidak sedang mengubah tampilan
  const [arrange, setArrange] = useState(false); // true = kartu bergoyang & bisa diseret
  const t = useMemo<Tournament>(() => {
    if (!pending.length) return tServer;
    const st: OpState = { matches: JSON.parse(JSON.stringify(tServer.matches)), participants: JSON.parse(JSON.stringify(tServer.participants)) };
    applyOps(st, pending, true);
    return { ...tServer, matches: st.matches, participants: st.participants };
  }, [tServer, pending]);
  const queue = (op: Op): boolean => {
    const st: OpState = { matches: JSON.parse(JSON.stringify(t.matches)), participants: JSON.parse(JSON.stringify(t.participants)) };
    const r = applyOp(st, op, true);
    if (r.error) { alert(r.error); return false; }
    setPending((p) => [...p, op]);
    return true;
  };
  const act = async (a: string, x?: Record<string, unknown>) => {
    if (pending.length) { alert('Ada perubahan yang belum disimpan. Simpan atau batalkan dulu.'); return false; }
    return serverAct(a, x);
  };
  const saveAll = async () => { if (await serverAct('batch', { ops: pending })) setPending([]); };
  useEffect(() => {
    if (!pending.length) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [pending.length]);
  const started = t.matches.some((m) => m.status === 'done');
  const [namesText, setNamesText] = useState(() => t.participants.map((p) => (p.tim ? `${p.nama} | ${p.tim}` : p.nama)).join('\n'));
  const [acak, setAcak] = useState(true);
  const [bye, setBye] = useState('spread');
  const [layout, setLayout] = useState<'standard' | 'dua-kelompok'>(t.layout ?? 'standard');
  const [third, setThird] = useState(!!t.third_place);
  const [manual, setManual] = useState<string[] | null>(null);
  const [editing, setEditing] = useState<Match | null>(null);

  const n = t.participants.length;
  // Pilihan jumlah BYE: dari simetris (pangkat dua) turun per 2 sampai paling sedikit.
  const symBye = nextPow2(Math.max(2, n)) - n;
  const byeOptions = Array.from({ length: Math.floor((symBye - (n % 2)) / 2) + 1 }, (_, i) => symBye - 2 * i).filter((b) => b >= 0);
  const [byesSel, setByesSel] = useState<number | null>(null);
  const byeCount = byesSel !== null && byeOptions.includes(byesSel) ? byesSel : symBye;
  const effSize = n + byeCount;
  const preview = useMemo(() => {
    if (n < 2) return '';
    const ms = buildKnockout(buildSlots(Array.from({ length: n }, (_, i) => `x${i}`), n + byeCount, 'spread'), { halves: layout === 'dua-kelompok', third });
    const total = Math.max(...ms.map((m) => m.round));
    const names = (r: number) => roundName(r, total, layout);
    return Array.from({ length: total }, (_, i) => i + 1).map((r) => {
      const real = ms.filter((m) => m.round === r && m.status !== 'bye').length;
      const byes = ms.filter((m) => m.round === r && m.status === 'bye').length;
      const j3 = ms.some((m) => m.round === r && m.third) ? ' (termasuk juara 3)' : '';
      return `${names(r)}: ${real} laga${byes ? ` + ${byes} BYE` : ''}${j3}`;
    }).join(' → ');
  }, [n, byeCount, layout, third]);
  const ko = t.matches.filter((m) => m.stage === 'ko');
  const finalM = ko.filter((m) => !m.third).reduce<Match | null>((a, b) => (!a || b.round > a.round ? b : a), null);
  const finalDone = !!finalM && finalM.status === 'done' && !!finalM.winner;
  const gm = t.matches.filter((m) => m.stage === 'group');

  const parsed = useMemo(() => namesText.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const [nama, tim] = l.split('|').map((s) => s.trim());
    return { nama, tim: tim ?? '' };
  }), [namesText]);

  const saveParticipants = () => {
    const pool = [...t.participants];
    const withIds = parsed.map((p) => {
      const i = pool.findIndex((x) => x.nama === p.nama);
      const id = i >= 0 ? pool.splice(i, 1)[0].id : undefined;
      return { id, ...p };
    });
    act('participants', { participants: withIds });
  };

  const startManual = () => {
    const ids = t.participants.map((p) => p.id);
    const s = ko.length ? ko.filter((m) => !m.fa).flatMap((m) => [m.a ?? BYE, m.b ?? BYE]) : [...ids, ...Array(effSize - ids.length).fill(BYE)];
    setManual(s);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">{t.nama} {t.cabang && <span className="text-sm font-normal text-slate-400">· {t.cabang}</span>}</h2>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_CLS[t.status]}`}>{t.status.toUpperCase()}</span>
          <span className="ml-2 text-xs text-slate-400">{t.mode === 'single' ? 'Sistem Gugur' : 'Sistem Grup'} · {t.participants.length} peserta</span>
        </div>
        {isMaster && (
          <div className="flex gap-2">
            {t.matches.length > 0 && <button className={btn2Cls} disabled={busy} onClick={onTemplate} title="Simpan struktur bagan & tata letak sebagai template"><LayoutTemplate className="w-4 h-4 inline -mt-0.5" /> Jadikan template</button>}
            <button className={btn2Cls + ' text-red-400'} onClick={onDelete}><Trash2 className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {isMaster && (
        <details className="bg-slate-900 border border-slate-800 rounded-xl p-4" open={!t.matches.length}>
          <summary className="cursor-pointer text-sm font-semibold">Peserta &amp; pengaturan bracket</summary>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Peserta / tim — satu per baris, format “Nama | Tim” (tim opsional)</label>
              <textarea className={inputCls + ' font-mono'} rows={8} disabled={started} value={namesText} onChange={(e) => setNamesText(e.target.value)} placeholder={'Tim Merah\nTim Biru\nBudi | RT 03'} />
              <div className="flex items-center gap-3">
                <button className={btnCls} disabled={busy || started || parsed.length === 0} onClick={saveParticipants}>Simpan peserta ({parsed.length})</button>
                {started && <span className="text-xs text-amber-400">Terkunci: sudah ada hasil. Reset untuk mengubah.</span>}
              </div>
              <p className="text-[11px] text-slate-500">Menyimpan peserta mengosongkan bracket yang sudah dibuat; buat ulang setelahnya.</p>
            </div>

            <div className="space-y-3">
              {t.mode === 'group' && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-slate-400">Jumlah grup
                    <input type="number" min={1} max={32} className={inputCls} defaultValue={t.group_count} disabled={started} onBlur={(e) => Number(e.target.value) !== t.group_count && act('meta', { group_count: Number(e.target.value) })} />
                  </label>
                  <label className="text-xs text-slate-400">Lolos per grup (0 = liga saja)
                    <input type="number" min={0} max={8} className={inputCls} defaultValue={t.advance_per_group} disabled={started} onBlur={(e) => Number(e.target.value) !== t.advance_per_group && act('meta', { advance_per_group: Number(e.target.value) })} />
                  </label>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={acak} onChange={(e) => setAcak(e.target.checked)} /> <Shuffle className="w-4 h-4" /> Acak posisi peserta</label>
              {t.mode === 'single' && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-slate-400">Posisi BYE
                    <select className={inputCls} value={bye} onChange={(e) => setBye(e.target.value)}>
                      <option value="spread">Tersebar (seed teratas dapat BYE)</option>
                      <option value="top">Bagian atas bracket</option>
                      <option value="bottom">Bagian bawah bracket</option>
                    </select>
                  </label>
                  <label className="text-xs text-slate-400">Jumlah BYE
                    <select className={inputCls} value={byeCount} onChange={(e) => setByesSel(Number(e.target.value))}>
                      {byeOptions.map((b) => (
                        <option key={b} value={b}>{b} BYE — {n - b} tim main di babak 1{b === symBye ? ' (bracket simetris)' : ''}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              {t.mode === 'single' && (
                <label className="text-xs text-slate-400 block">Susunan bagan
                  <select className={inputCls} value={layout} onChange={(e) => setLayout(e.target.value as 'standard' | 'dua-kelompok')}>
                    <option value="standard">Standar (satu pohon bagan)</option>
                    <option value="dua-kelompok">Dua kelompok: A (atas) &amp; B (bawah), juara kelompok bertemu di final</option>
                  </select>
                </label>
              )}
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={third} onChange={(e) => setThird(e.target.checked)} /> Ada perebutan juara 3</label>
              {t.mode === 'single' && preview && <p className="text-[11px] text-slate-400">{preview}</p>}
              <div className="flex flex-wrap gap-2">
                <button className={btnCls} disabled={busy || t.participants.length < 2}
                  onClick={() => act('generate', { acak, bye, byes: byeCount, layout, third })}>
                  {t.matches.length ? 'Buat ulang' : t.mode === 'single' ? `Buat bracket (${byeCount} BYE)` : 'Buat grup & jadwal'}
                </button>
                {t.mode === 'single' && t.participants.length >= 2 && <button className={btn2Cls} disabled={busy} onClick={startManual}>Susun slot manual</button>}
                {t.mode === 'group' && gm.length > 0 && t.advance_per_group > 0 && (
                  <button className={btn2Cls} disabled={busy} onClick={() => act('advance', { third })}>{ko.length ? 'Susun ulang babak gugur dari klasemen' : 'Buat babak gugur dari klasemen'}</button>
                )}
              </div>
            </div>
          </div>

          {manual && (
            <div className="mt-4 border-t border-slate-800 pt-3">
              <p className="text-xs text-slate-400 mb-2">Atur tiap slot babak pertama (BYE = peserta di pasangannya lolos otomatis). Tiap peserta harus ada tepat satu kali.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {Array.from({ length: manual.length / 2 }, (_, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-950 rounded-lg p-2">
                    <span className="text-xs text-slate-500 w-6">{i + 1}</span>
                    {[0, 1].map((k) => (
                      <select key={k} className={inputCls} value={manual[2 * i + k]} onChange={(e) => setManual(manual.map((v, j) => (j === 2 * i + k ? e.target.value : v)))}>
                        <option value={BYE}>BYE</option>
                        {t.participants.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                      </select>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <button className={btnCls} disabled={busy} onClick={() => { act('generate', { slots: manual, layout, third }); setManual(null); }}>Terapkan susunan</button>
                <button className={btn2Cls} onClick={() => setManual(null)}>Tutup</button>
              </div>
            </div>
          )}
        </details>
      )}

      {isMaster && t.participants.length > 0 && (
        <details className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <summary className="cursor-pointer text-sm font-semibold">Ubah nama / tim peserta <span className="font-normal text-slate-500">(tetap bisa saat turnamen berjalan)</span></summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {t.participants.map((p) => (
              <div key={p.id + p.nama + (p.tim ?? '')} className="flex gap-2">
                <input className={inputCls} defaultValue={p.nama} maxLength={80} aria-label="Nama"
                  onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== p.nama && queue({ type: 'rename', participantId: p.id, nama: e.target.value.trim(), tim: p.tim ?? '' })} />
                <input className={inputCls + ' !w-32'} defaultValue={p.tim ?? ''} maxLength={80} placeholder="Tim" aria-label="Tim"
                  onBlur={(e) => e.target.value.trim() !== (p.tim ?? '') && queue({ type: 'rename', participantId: p.id, nama: p.nama, tim: e.target.value.trim() })} />
              </div>
            ))}
          </div>
        </details>
      )}

      {t.matches.length > 0 && (
        <ExportBar title={t.nama} disabled={arrange}
          subtitle={[t.cabang, t.mode === 'single' ? 'Sistem gugur' : 'Sistem grup + babak gugur', `${t.participants.length} peserta`].filter(Boolean).join(' · ')}
          sections={[
            ...(t.mode === 'group' && gm.length ? [{ key: 'fase-grup', label: 'Fase grup', ref: groupRef, available: true }] : []),
            ...(ko.length ? [{ key: 'babak-gugur', label: t.mode === 'group' ? 'Babak gugur' : 'Bagan', ref: koRef, available: true }] : []),
            { key: 'klasemen-akhir', label: 'Klasemen akhir', ref: podiumRef, available: finalDone, hint: 'Tersedia setelah final selesai' },
          ]} />
      )}

      {t.mode === 'group' && gm.length > 0 && (
        <div ref={groupRef} className="space-y-4">
          <h3 className="font-semibold text-sm">Fase grup</h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {t.groups.map((g, gi) => {
              const rows = standings(t.matches, g, gi);
              return (
                <div key={gi} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
                  <div className="text-sm font-semibold">{g.name}</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="text-slate-500"><tr><th className="text-left">#</th><th className="text-left">Peserta</th><th>Main</th><th>M</th><th>S</th><th>K</th><th>SG</th><th>Poin</th></tr></thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={r.id} className={i < t.advance_per_group ? 'text-emerald-300' : 'text-slate-300'}>
                            <td>{i + 1}</td><td className="truncate max-w-[9rem]">{nameOf(t.participants, r.id).label}</td>
                            <td className="text-center">{r.main}</td><td className="text-center">{r.w}</td><td className="text-center">{r.d}</td><td className="text-center">{r.l}</td>
                            <td className="text-center">{r.gd}</td><td className="text-center font-semibold">{r.pts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-[10px] text-slate-500 mt-1">Main · M=menang · S=seri · K=kalah · SG=selisih gol</p>
                  </div>
                  <ul className="space-y-1.5">
                    {gm.filter((m) => m.group === gi).map((m) => (
                      <li key={m.id}>
                        <button disabled={!isMaster} onClick={() => setEditing(m)} className="w-full text-left flex items-center justify-between gap-2 text-xs bg-slate-950 rounded-lg px-2.5 py-1.5 hover:border-rose-400 border border-transparent">
                          <span className="truncate">{nameOf(t.participants, m.a).label} <span className="text-slate-500">vs</span> {nameOf(t.participants, m.b).label}</span>
                          <span className="font-mono shrink-0">{m.status === 'done' ? `${m.scoreA} - ${m.scoreB}` : fmtJadwal(m.jadwal) || '—'}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {ko.length > 0 && (
        <div className="space-y-2">
          {isMaster && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-slate-500">Ketuk kartu untuk mengisi skor, jadwal, atau menukar peserta. <b>Tahan kartu</b> sebentar untuk memindahkan posisinya.</p>
              {!tataDraft && <button className={btn2Cls} onClick={() => { setArrange(false); setTataDraft(mergeTata(t.tata_letak)); }}>🎨 Warna &amp; garis</button>}
            </div>
          )}
          {isMaster && tataDraft && (
            <TataPanel tata={tataDraft} arrange={arrange} busy={busy} dirty={JSON.stringify(tataDraft) !== JSON.stringify(mergeTata(t.tata_letak))}
              onChange={setTataDraft} onCancel={() => { setTataDraft(null); setArrange(false); }}
              onSave={async () => { if (await serverAct('layout', { tata: tataDraft })) { setTataDraft(null); setArrange(false); } }}
              onReset={async () => { if (await serverAct('layout', { tata: null })) { setTataDraft(null); setArrange(false); } }} />
          )}
          <div ref={koRef} className="space-y-2">
            <h3 className="font-semibold text-sm">{t.mode === 'group' ? 'Babak gugur' : 'Bagan pertandingan'}</h3>
            <BracketView matches={t.matches} participants={t.participants} layout={t.layout} onSelect={isMaster ? setEditing : undefined}
              tata={tataDraft ?? mergeTata(t.tata_letak)} editing={arrange} onTata={setTataDraft}
              canArrange={isMaster && !arrange} onArrange={() => { setTataDraft((d) => d ?? mergeTata(t.tata_letak)); setArrange(true); }} />
          </div>
          {t.third_place && !t.matches.some((m) => m.third) && (
            <p className="text-[11px] text-amber-400">Perebutan juara 3 belum ada di bagan ini: buat ulang bracket (opsi “Ada perebutan juara 3” dicentang). Juara 3 hanya dibuat bila kedua semifinalis benar-benar bertanding (bukan BYE).</p>
          )}
        </div>
      )}

      <div ref={podiumRef}>
        {finalDone && <Podium matches={t.matches} participants={t.participants} tata={tataDraft ?? mergeTata(t.tata_letak)} judul={t.nama} cabang={t.cabang} />}
      </div>

      {arrange && tataDraft && (
        <div className="sticky bottom-3 z-40 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-500/50 bg-slate-900/95 backdrop-blur px-4 py-3 shadow-xl">
          <span className="text-sm text-rose-200">Mode atur posisi — seret kartu sesuai keinginan</span>
          <div className="flex gap-2">
            <button className={btn2Cls} disabled={busy} onClick={() => { setTataDraft(null); setArrange(false); }}>Batal</button>
            <button className={btnCls} disabled={busy} onClick={async () => { if (await serverAct('layout', { tata: tataDraft })) { setTataDraft(null); setArrange(false); } }}>Simpan posisi</button>
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="sticky bottom-3 z-40 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-slate-900/95 backdrop-blur px-4 py-3 shadow-xl">
          <span className="text-sm text-amber-200">{pending.length} perubahan belum disimpan</span>
          <div className="flex gap-2">
            <button className={btn2Cls} disabled={busy} onClick={() => setPending([])}>Batalkan</button>
            <button className={btnCls} disabled={busy} onClick={saveAll}>Simpan perubahan</button>
          </div>
        </div>
      )}

      {editing && isMaster && (
        <MatchDialog key={editing.id} match={t.matches.find((m) => m.id === editing.id) ?? editing} t={t} busy={busy} onClose={() => setEditing(null)} queue={queue} />
      )}
    </div>
  );
}

function MatchDialog({ match: m, t, busy, onClose, queue }: { match: Match; t: Tournament; busy: boolean; onClose: () => void; queue: (op: Op) => boolean }) {
  const [a, setA] = useState(String(m.scoreA ?? ''));
  const [b, setB] = useState(String(m.scoreB ?? ''));
  const [winner, setWinner] = useState(m.decidedBy === 'manual' && m.winner ? m.winner : '');
  const [tgl, setTgl] = useState((m.jadwal ?? '').split('T')[0]);
  const [jam, setJam] = useState((m.jadwal ?? '').split('T')[1] ?? '');
  const [lokasi, setLokasi] = useState(m.lokasi ?? '');
  const tie = a !== '' && a === b && m.stage === 'ko';
  const na = nameOf(t.participants, m.a).label, nb = nameOf(t.participants, m.b).label;
  const playable = !!m.a && !!m.b && m.a !== BYE && m.b !== BYE && m.status !== 'bye';
  const entrants = new Set(t.matches.filter((x) => x.stage === 'ko' && !x.fa).flatMap((x) => [x.a, x.b]).filter((x): x is string => !!x && x !== BYE));
  const swappable = m.stage === 'ko' && !m.fa && m.status !== 'done';
  const close = (fn: () => boolean) => { if (fn()) onClose(); };
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-lg max-h-[96dvh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">{m.third ? 'Perebutan juara 3' : 'Edit pertandingan'}{m.status === 'done' ? ' · sudah selesai' : ''}</h3>
          <button onClick={onClose} aria-label="Tutup"><X className="w-4 h-4" /></button>
        </div>

        {playable ? (
          <section className="space-y-2">
            <div className="text-xs font-semibold text-slate-400">Hasil</div>
            <div className="grid grid-cols-[1fr_5rem] gap-2 items-center">
              <span className="text-sm truncate">{na}</span><input type="number" min={0} className={inputCls} value={a} onChange={(e) => setA(e.target.value)} />
              <span className="text-sm truncate">{nb}</span><input type="number" min={0} className={inputCls} value={b} onChange={(e) => setB(e.target.value)} />
            </div>
            {tie && (
              <select className={inputCls} value={winner} onChange={(e) => setWinner(e.target.value)}>
                <option value="">Seri — pilih pemenang (mis. adu penalti)</option>
                <option value={m.a ?? ''}>{na}</option><option value={m.b ?? ''}>{nb}</option>
              </select>
            )}
            <div className="flex flex-wrap gap-2">
              <button className={btnCls} disabled={busy || a === '' || b === ''} onClick={() => close(() => queue({ type: 'score', matchId: m.id, scoreA: Number(a), scoreB: Number(b), winner: tie ? winner : undefined }))}>{m.status === 'done' ? 'Terapkan perubahan' : 'Terapkan hasil'}</button>
              {m.status === 'done' && <button className={btn2Cls} disabled={busy} onClick={() => close(() => queue({ type: 'clear-score', matchId: m.id }))}>Hapus hasil</button>}
            </div>
          </section>
        ) : (
          <p className="text-xs text-slate-500">{m.status === 'bye' ? 'Pertandingan BYE: peserta lolos otomatis tanpa skor.' : 'Skor bisa diisi setelah kedua peserta ditentukan.'}</p>
        )}

        {m.status !== 'bye' && (
          <section className="space-y-2 border-t border-slate-800 pt-3">
            <div className="text-xs font-semibold text-slate-400">Waktu &amp; tempat</div>
            <div className="grid grid-cols-2 gap-2 items-end">
              <DatePickerField label="Tanggal" value={tgl} onChange={setTgl} colorTheme="emerald" />
              <label className="text-xs font-semibold text-slate-300 block">Jam
                <input type="time" className={inputCls + ' mt-1'} value={jam} onChange={(e) => setJam(e.target.value)} />
              </label>
            </div>
            <input className={inputCls} placeholder="Lokasi / lapangan" maxLength={100} value={lokasi} onChange={(e) => setLokasi(e.target.value)} />
            <button className={btn2Cls} disabled={busy} onClick={() => close(() => queue({ type: 'schedule', matchId: m.id, jadwal: tgl ? (jam ? `${tgl}T${jam}` : tgl) : '', lokasi }))}>Terapkan jadwal</button>
          </section>
        )}

        {swappable && (
          <section className="space-y-2 border-t border-slate-800 pt-3">
            <div className="text-xs font-semibold text-slate-400">Tukar peserta (belum dimainkan)</div>
            {(['a', 'b'] as const).map((side) => {
              const cur = side === 'a' ? m.a : m.b;
              if (!cur || cur === BYE) return null;
              return (
                <label key={side} className="block text-xs text-slate-400">{nameOf(t.participants, cur).label} ditukar dengan
                  <select className={inputCls + ' mt-1'} value="" disabled={busy} onChange={(e) => e.target.value && close(() => queue({ type: 'swap-teams', matchId: m.id, side, participantId: e.target.value }))}>
                    <option value="">— pilih peserta —</option>
                    {t.participants.filter((p) => entrants.has(p.id) && p.id !== cur && p.id !== (side === 'a' ? m.b : m.a)).map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                  </select>
                </label>
              );
            })}
            <p className="text-[11px] text-slate-500">Peserta tersebut ikut berpindah ke posisi yang ditinggalkan. Posisi BYE diubah lewat “Susun slot manual”.</p>
          </section>
        )}
      </div>
    </div>
  );
}

function EditMetaDialog({ t, busy, onClose, onSave }: { t: Tournament; busy: boolean; onClose: () => void; onSave: (x: Record<string, unknown>) => void }) {
  const started = t.matches.some((m) => m.status === 'done');
  const [nama, setNama] = useState(t.nama);
  const [cabang, setCabang] = useState(t.cabang ?? '');
  const [mode, setMode] = useState(t.mode);
  const [gc, setGc] = useState(t.group_count);
  const [adv, setAdv] = useState(t.advance_per_group);
  const modeChanged = mode !== t.mode;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modeChanged && t.matches.length && !window.confirm('Mengganti mode akan MENGOSONGKAN bagan yang sudah dibuat (peserta tetap). Lanjutkan?')) return;
    const x: Record<string, unknown> = { nama, cabang };
    if (!started) { x.mode = mode; x.group_count = gc; x.advance_per_group = adv; }
    onSave(x);
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <form onSubmit={submit} className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center"><h3 className="font-semibold text-sm">Edit turnamen</h3><button type="button" onClick={onClose} aria-label="Tutup"><X className="w-4 h-4" /></button></div>
        <label className="text-xs text-slate-400 block">Judul
          <input className={inputCls + ' mt-1'} required maxLength={100} value={nama} onChange={(e) => setNama(e.target.value)} />
        </label>
        <label className="text-xs text-slate-400 block">Cabang
          <input className={inputCls + ' mt-1'} maxLength={60} value={cabang} onChange={(e) => setCabang(e.target.value)} />
        </label>
        <label className="text-xs text-slate-400 block">Mode
          <select className={inputCls + ' mt-1'} disabled={started} value={mode} onChange={(e) => setMode(e.target.value as 'single' | 'group')}>
            <option value="single">Sistem Gugur</option><option value="group">Sistem Grup (+ babak gugur)</option>
          </select>
        </label>
        {mode === 'group' && (
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-400">Jumlah grup
              <input type="number" min={1} max={32} className={inputCls + ' mt-1'} disabled={started} value={gc} onChange={(e) => setGc(Number(e.target.value))} />
            </label>
            <label className="text-xs text-slate-400">Lolos per grup
              <input type="number" min={0} max={8} className={inputCls + ' mt-1'} disabled={started} value={adv} onChange={(e) => setAdv(Number(e.target.value))} />
            </label>
          </div>
        )}
        {started && <p className="text-[11px] text-amber-400">Turnamen sudah berjalan: mode dan pengaturan grup terkunci. Judul dan cabang tetap bisa diubah.</p>}
        <p className="text-[11px] text-slate-500">Nama &amp; tim peserta, jadwal, serta skor diubah lewat bagian “Ubah nama / tim peserta” dan dengan mengetuk kartu pertandingan.</p>
        <div className="flex gap-2"><button className={btnCls} disabled={busy}>Simpan</button><button type="button" className={btn2Cls} onClick={onClose}>Batal</button></div>
      </form>
    </div>
  );
}
