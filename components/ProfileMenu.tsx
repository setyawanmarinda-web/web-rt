'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { signOut } from 'next-auth/react';
import { Lock, LogOut, Settings, X } from 'lucide-react';
import { useScope, roleLabel } from '@/lib/scope';

function symbolOf(u: { role?: string; rt?: string; rw?: string }) {
  if (u.role === 'master') return { top: '', main: 'M' };
  if (u.role === 'admin_rw') return { top: 'RW', main: String(u.rw || '012').replace(/^0+/, '') || '12' };
  const rt = String(u.rt || '').slice(-2);
  return { top: 'RT', main: rt || '?' };
}

function ChangePasswordModal({ forced, onClose }: { forced: boolean; onClose: () => void }) {
  const [lama, setLama] = useState('');
  const [baru, setBaru] = useState('');
  const [ulang, setUlang] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!lama || !baru || !ulang) {
      setErr('Semua kolom wajib diisi.');
      return;
    }
    if (baru !== ulang) {
      setErr('Ulangi password baru belum sama.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/akun/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lama, baru }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(d.error || 'Gagal mengganti password.');
        setBusy(false);
        return;
      }
      setDone(true);
      setTimeout(() => signOut({ callbackUrl: '/login' }), 1500);
    } catch {
      setErr('Tidak bisa terhubung ke server.');
      setBusy(false);
    }
  }

  const input =
    'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500';

  const modal = (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/70 p-4 font-sans">
      <div className="my-auto w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Ganti Password</h2>
          </div>
          {!forced && !done && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {forced && !done && (
          <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Demi keamanan, ganti password awal dulu sebelum memakai aplikasi.
          </p>
        )}

        {done ? (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-200">
            Password berhasil diganti. Anda akan keluar, lalu masuk lagi dengan password baru.
          </p>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password lama</label>
              <input type="password" autoComplete="current-password" value={lama} onChange={(e) => setLama(e.target.value)} className={input} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password baru</label>
              <input type="password" autoComplete="new-password" value={baru} onChange={(e) => setBaru(e.target.value)} className={input} />
              <p className="mt-1 text-[11px] text-slate-500">Minimal 8 karakter, berisi huruf dan angka.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ulangi password baru</label>
              <input type="password" autoComplete="new-password" value={ulang} onChange={(e) => setUlang(e.target.value)} className={input} />
            </div>
            {err && <p className="text-xs font-semibold text-red-400">{err}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-sm font-bold disabled:opacity-60"
            >
              {busy ? 'Menyimpan...' : 'Simpan password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
  // Dirender di body supaya tidak terjebak di dalam header (efek blur/transform membuat "fixed" ikut header).
  return typeof document === 'undefined' ? null : createPortal(modal, document.body);
}

export default function ProfileMenu() {
  const { user } = useScope();
  const [open, setOpen] = useState(false);
  const [showSetting, setShowSetting] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;
  const sym = symbolOf(user);
  const forced = !!user.wajib_ganti_password;

  return (
    <>
      <div ref={box} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex items-center gap-2.5 rounded-full p-1 sm:pr-3 hover:bg-slate-800 transition-colors"
        >
          <span className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex flex-col items-center justify-center leading-none font-black">
            {sym.top && <span className="text-[8px] font-bold">{sym.top}</span>}
            <span className={sym.top ? 'text-[13px]' : 'text-base'}>{sym.main}</span>
          </span>
          <span className="hidden sm:block text-left leading-tight min-w-0">
            <span className="block text-xs font-semibold text-slate-100 truncate max-w-[140px]">{user.name}</span>
            <span className="block text-[10px] font-semibold text-emerald-400">{roleLabel(user)}</span>
          </span>
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-700 bg-slate-900 py-1.5 shadow-2xl shadow-black/40 z-50"
          >
            <div className="px-3 pt-1 pb-1.5 text-[11px] font-semibold text-slate-400">Profile</div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setShowSetting(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Setting
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        )}
      </div>

      {(showSetting || forced) && <ChangePasswordModal forced={forced} onClose={() => setShowSetting(false)} />}
    </>
  );
}
