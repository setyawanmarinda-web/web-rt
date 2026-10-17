'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

type SessionUser = { name?: string; role?: string; rw?: string; rt?: string };

function roleLabel(u: SessionUser) {
  switch (u.role) {
    case 'master':
      return 'Master';
    case 'admin_rw':
      return `Admin RW ${u.rw || '012'}`;
    case 'admin_rt':
      return `Admin RT ${u.rt}`;
    case 'warga':
      return `Warga RT ${u.rt}`;
    default:
      return u.role ?? '';
  }
}

export default function UserBadge() {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', t);
    } catch {}
  }, []);

  useEffect(() => {
    let alive = true;
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((s) => {
        if (alive) setUser(s?.user ?? null);
      })
      .catch(() => {
        if (alive) setUser(null);
      });
    return () => {
      alive = false;
    };
  }, [pathname]);

  if (!user || pathname === '/login') return null;

  const initial = (user.name || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-2xl pl-2.5 pr-1.5 py-1.5 shadow-xl shadow-black/30 font-sans">
      <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 text-sm font-bold">
        {initial}
      </div>
      <div className="leading-tight min-w-0">
        <p className="text-xs font-semibold text-slate-100 truncate max-w-[110px] sm:max-w-[180px]">
          {user.name}
        </p>
        <p className="text-[10px] font-semibold text-emerald-400">{roleLabel(user)}</p>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
        title="Keluar"
        aria-label="Keluar"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
