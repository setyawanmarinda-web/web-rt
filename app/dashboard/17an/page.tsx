'use client';

import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useScope } from '@/lib/scope';
import AgendaPanel from '@/components/17an/AgendaPanel';
import TournamentPanel from '@/components/17an/TournamentPanel';
import DrawPanel from '@/components/17an/DrawPanel';
import { Banner17an, Section17an, useBeranda17an } from '@/components/17an/HomeAgenda17an';

const TABS = [
  { key: 'beranda', label: 'Beranda' },
  { key: 'agenda', label: 'Agenda' },
  { key: 'bracket', label: 'Bracket Pertandingan' },
  { key: 'undian', label: 'Undian Doorprize' },
] as const;

export default function Agenda17anPage() {
  const { user, ready } = useScope();
  const isMaster = user?.role === 'master';
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('beranda');
  const data = useBeranda17an();

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400"><Trophy className="w-6 h-6" /></div>
        <div>
          <h1 className="text-xl font-bold">Agenda 17an RW 012</h1>
          <p className="text-xs text-slate-400">{ready && !isMaster ? 'Mode lihat — perubahan data hanya oleh master.' : 'Jadwal kegiatan, bracket pertandingan, dan undian doorprize.'}</p>
        </div>
      </header>
      {tab !== 'beranda' && <Banner17an data={data} onOpen={() => setTab('beranda')} />}
      <nav className="flex gap-1.5 overflow-x-auto border-b border-slate-800 pb-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t.key ? 'bg-rose-500/20 text-rose-200' : 'text-slate-400 hover:text-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </nav>
      {tab === 'beranda' && <Section17an data={data} />}
      {tab === 'agenda' && <AgendaPanel isMaster={isMaster} onOpenBracket={() => setTab('beranda')} />}
      {tab === 'bracket' && <TournamentPanel isMaster={isMaster} />}
      {tab === 'undian' && <DrawPanel isMaster={isMaster} />}
    </div>
  );
}
