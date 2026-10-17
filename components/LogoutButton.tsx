'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-red-400 hover:border-red-500/40 transition-all text-xs font-semibold"
      title="Keluar"
      aria-label="Keluar"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Keluar</span>
    </button>
  );
}
