'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { commitmentOf, finalSeed, listHash, replayWinners } from '@/lib/event/draw';

type Proof = {
  id: string; nama: string; status: string; allow_multi_win: boolean; putaran?: number; parent_id?: string;
  prizes: { id: string; nama: string; jumlah: number }[];
  participants: { id: string; nama: string; alamat?: string }[];
  lock?: { list_hash: string; commitment: string; drand_round?: number; locked_at: string; locked_by: string };
  result?: { seed: string; source: string; drand_round?: number; drand_randomness?: string; winners: { prizeId: string; participantId: string; absent?: boolean }[]; redraws?: { n: number; prizeId: string; absentId: string; newId: string; at: string; by: string }[]; ran_at: string; server_seed?: string };
  voided: { at: string; reason: string; by: string }[];
  audit: { at: string; by: string; action: string; detail: string }[];
};
type Check = { label: string; ok: boolean | null; note?: string };

export default function BuktiPage() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<Proof | null>(null);
  const [err, setErr] = useState('');
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetch(`/api/17an/draws?id=${id}`).then(async (r) => {
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Gagal memuat');
      setP(j);
    }).catch((e) => setErr(e.message));
  }, [id]);

  const verify = async () => {
    if (!p?.lock || !p.result?.server_seed) return;
    setChecking(true);
    const r = p.result, out: Check[] = [];
    const parts = p.participants.map((x) => ({ id: x.id, nama: x.nama, alamat: x.alamat ?? '' }));
    const lh = await listHash(parts);
    out.push({ label: 'Hash daftar peserta cocok dengan yang dikunci', ok: lh === p.lock.list_hash });
    out.push({ label: 'Seed server (dibuka) cocok dengan komitmen sebelum undian', ok: (await commitmentOf(r.server_seed!)) === p.lock.commitment });
    if (r.source === 'drand' && r.drand_round) {
      try {
        const d = await (await fetch(`https://api.drand.sh/public/${r.drand_round}`)).json();
        out.push({ label: `Randomness drand ronde ${r.drand_round} sama dengan arsip publik drand`, ok: d.randomness === r.drand_randomness });
      } catch { out.push({ label: 'Randomness drand dibandingkan dengan arsip publik', ok: null, note: 'Tidak bisa menghubungi drand dari browser' }); }
      out.push({ label: 'Ronde drand lebih baru daripada saat daftar dikunci', ok: !!p.lock.drand_round && r.drand_round > p.lock.drand_round });
    }
    const seed = await finalSeed(r.server_seed!, r.drand_randomness ?? '', lh);
    out.push({ label: 'Seed akhir dihitung ulang sama', ok: seed === r.seed });
    // undi ulang bila ada yang tidak hadir ikut dihitung ulang dari seed yang sama
    const again = await replayWinners(seed, parts, p.prizes, p.allow_multi_win, r.redraws ?? []);
    const key = (w: { prizeId: string; participantId: string; absent?: boolean }) => `${w.prizeId}|${w.participantId}|${w.absent ? 1 : 0}`;
    out.push({ label: 'Pemenang dihitung ulang di browser ini sama persis', ok: again.ok && again.winners.map(key).join(';') === r.winners.map(key).join(';') });
    if (r.redraws?.length) out.push({ label: `${r.redraws.length} undi ulang pengganti (peserta tidak hadir) juga cocok dengan hitungan ulang`, ok: again.ok });
    setChecks(out); setChecking(false);
  };

  if (err) return <main className="p-6 text-red-400">{err}</main>;
  if (!p) return <main className="p-6 text-slate-400">Memuat…</main>;
  const byId = new Map(p.participants.map((x) => [x.id, x]));
  const hex = 'text-[11px] break-all text-slate-200';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-5">
        <Link href="/dashboard/17an" className="text-xs text-slate-400 hover:text-slate-200">← Kembali ke Agenda 17an</Link>
        <h1 className="text-xl font-bold">Bukti Undian: {p.nama}</h1>
        {(p.putaran ?? 1) > 1 && <p className="text-xs text-fuchsia-300">Putaran ke-{p.putaran}{p.parent_id && <> · <Link className="underline" href={`/17an/bukti/${p.parent_id}`}>lihat bukti putaran sebelumnya</Link></>}.{!p.allow_multi_win && ' Peserta adalah sisa dari putaran sebelumnya (pemenang sebelumnya tidak ikut).'}</p>}
        <p className="text-xs text-slate-400">Status: <b>{p.status}</b>. Halaman ini hanya berisi nama dan alamat peserta; NIK tidak disimpan di undian. Verifikasi menghitung ulang hasil dengan kode yang sama dengan server, namun tanda tangan drand tidak diperiksa di browser.</p>

        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 text-sm">
          <h2 className="font-semibold">Aturan</h2>
          <p>{p.allow_multi_win ? 'Peserta boleh menang lebih dari satu hadiah (tidak pada hadiah yang sama).' : 'Satu peserta hanya menang satu hadiah.'} Peserta: {p.participants.length}.</p>
          <ul className="list-disc ml-5">{p.prizes.map((x) => <li key={x.id}>{x.nama} × {x.jumlah}</li>)}</ul>
        </section>

        {p.lock && (
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <h2 className="font-semibold text-sm">Komitmen (dibuat sebelum undian)</h2>
            <div className="text-xs text-slate-400">Hash daftar peserta</div><div className={hex}>{p.lock.list_hash}</div>
            <div className="text-xs text-slate-400">SHA-256 seed server</div><div className={hex}>{p.lock.commitment}</div>
            <div className="text-xs text-slate-400">Dikunci {new Date(p.lock.locked_at).toLocaleString('id-ID')} oleh {p.lock.locked_by}; ronde drand: {p.lock.drand_round ?? '—'}</div>
          </section>
        )}

        {p.result && (
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <h2 className="font-semibold text-sm">Hasil</h2>
            <div className="text-xs text-slate-400">Sumber acak: {p.result.source === 'drand' ? `drand ronde ${p.result.drand_round}` : 'seed server saja (drand tidak tersedia)'}</div>
            {p.result.drand_randomness && <div className={hex}>{p.result.drand_randomness}</div>}
            <div className="text-xs text-slate-400">Seed akhir</div><div className={hex}>{p.result.seed}</div>
            <div className="text-xs text-slate-400">Seed server {p.result.server_seed ? '(dibuka)' : '(dirahasiakan sampai hasil disahkan)'}</div>
            {p.result.server_seed && <div className={hex}>{p.result.server_seed}</div>}
            {p.prizes.map((pr) => (
              <div key={pr.id} className="text-sm"><b>{pr.nama}</b>: {p.result!.winners.filter((w) => w.prizeId === pr.id && !w.absent).map((w) => byId.get(w.participantId)?.nama).join(', ')}</div>
            ))}
            {(p.result.redraws?.length ?? 0) > 0 && (
              <div className="text-xs text-amber-300 pt-1 space-y-0.5">
                <div className="font-semibold">Pemenang tidak hadir → undi ulang pengganti (peserta yang tidak hadir tetap boleh ikut):</div>
                {p.result.redraws!.map((r) => <div key={r.n}>#{r.n} · {p.prizes.find((x) => x.id === r.prizeId)?.nama}: {byId.get(r.absentId)?.nama} tidak hadir → pengganti {byId.get(r.newId)?.nama}</div>)}
              </div>
            )}
            {p.result.server_seed ? (
              <div className="pt-2">
                <button onClick={verify} disabled={checking} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium disabled:opacity-50">{checking ? 'Memeriksa…' : 'Verifikasi di browser saya'}</button>
                {checks && <ul className="mt-3 space-y-1 text-sm">{checks.map((c, i) => <li key={i}>{c.ok === null ? '⚠️' : c.ok ? '✅' : '❌'} {c.label}{c.note ? ` — ${c.note}` : ''}</li>)}</ul>}
              </div>
            ) : <p className="text-xs text-amber-400">Verifikasi lengkap tersedia setelah hasil disahkan.</p>}
          </section>
        )}

        {p.voided.length > 0 && (
          <section className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 text-sm">
            <h2 className="font-semibold mb-1">Hasil yang dibatalkan sebelum disahkan</h2>
            <ul className="list-disc ml-5 text-xs text-slate-300">{p.voided.map((v, i) => <li key={i}>{new Date(v.at).toLocaleString('id-ID')} oleh {v.by}: {v.reason}</li>)}</ul>
          </section>
        )}

        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="font-semibold text-sm mb-2">Riwayat tindakan admin</h2>
          <ul className="text-xs text-slate-300 space-y-1">{p.audit.map((a, i) => <li key={i}>{new Date(a.at).toLocaleString('id-ID')} · {a.by} · <b>{a.action}</b> {a.detail}</li>)}</ul>
        </section>

        <details className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <summary className="cursor-pointer text-sm font-semibold">Daftar peserta final ({p.participants.length})</summary>
          <ul className="mt-2 max-h-80 overflow-y-auto text-xs divide-y divide-slate-800">{p.participants.map((x) => <li key={x.id} className="py-1">{x.nama} <span className="text-slate-500">{x.alamat}</span></li>)}</ul>
        </details>
      </div>
    </main>
  );
}
