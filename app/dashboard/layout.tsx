'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useScope, canSeeMenu } from '@/lib/scope';
import Sidebar from '@/components/Sidebar';
import { useSimStore } from '@/lib/store';
import { Search, Menu } from 'lucide-react';
import ProfileMenu from '@/components/ProfileMenu';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { selectedRt, setSelectedRt, pengumumanList, kegiatanList } = useSimStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user: scopeUser, ready: scopeReady } = useScope();
  const blocked = scopeReady && !!scopeUser && !canSeeMenu(scopeUser, pathname);
  useEffect(() => {
    if (blocked) router.replace('/dashboard/laporan');
  }, [blocked, router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        selectedRt={selectedRt}
        onRtChange={setSelectedRt}
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top bar Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            
            {/* Mobile Hamburger Toggle for Dashboard Sidebar */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5 text-emerald-400" />
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell pengumuman={pengumumanList} kegiatan={kegiatanList} selectedRt={selectedRt} />
            <div className="hidden lg:flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-400 text-xs w-56">
              <Search className="w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Cari transaksi / warga..."
                className="bg-transparent text-white focus:outline-none w-full"
              />
            </div>
            
            <ThemeToggle />
            <ProfileMenu />
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {blocked ? null : children}
        </main>
      </div>
    </div>
  );
}
