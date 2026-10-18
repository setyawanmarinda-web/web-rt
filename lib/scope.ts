'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { RT_LIST } from './types';

export type ScopeUser = { name?: string; username?: string; role?: string; rw?: string; rt?: string; wajib_ganti_password?: boolean } | null;
type Snapshot = { rt: string; user: ScopeUser; ready: boolean };

const SAVED_KEY = 'sim_rw_selected_rt';
const serverSnap: Snapshot = { rt: '002', user: null, ready: false };
let snap: Snapshot = { ...serverSnap };
let started = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function patch(next: Partial<Snapshot>) {
  snap = { ...snap, ...next };
  emit();
}

export function isAllScope(u: ScopeUser): boolean {
  return u?.role === 'master' || u?.role === 'admin_rw';
}

export function scopeOptions(u: ScopeUser): { value: string; label: string }[] {
  if (!u) return [];
  if (isAllScope(u)) {
    return [
      ...RT_LIST.map((rt) => ({ value: rt, label: `RT ${rt}` })),
      { value: 'ALL', label: 'RW 012' },
    ];
  }
  return u.rt ? [{ value: u.rt, label: `RT ${u.rt}` }] : [];
}

export function roleLabel(u: ScopeUser): string {
  switch (u?.role) {
    case 'master':
      return 'Master';
    case 'admin_rw':
      return `Admin RW ${u.rw || '012'}`;
    case 'admin_rt':
      return `Admin RT ${u.rt || ''}`.trim();
    case 'warga':
      return `Warga RT ${u.rt || ''}`.trim();
    default:
      return '-';
  }
}

function start() {
  if (started || typeof window === 'undefined') return;
  started = true;
  fetch('/api/auth/session')
    .then((r) => r.json())
    .then((s) => {
      const u: ScopeUser = s?.user ?? null;
      let rt = '002';
      if (u && isAllScope(u)) {
        let saved: string | null = null;
        try {
          saved = localStorage.getItem(SAVED_KEY);
        } catch {}
        rt = saved && (saved === 'ALL' || RT_LIST.includes(saved)) ? saved : '002';
      } else if (u?.rt) {
        rt = u.rt;
      }
      patch({ user: u, rt, ready: true });
    })
    .catch(() => patch({ ready: true }));
}

export function setSelectedRt(rt: string) {
  const u = snap.user;
  if (!scopeOptions(u).some((o) => o.value === rt)) return;
  if (isAllScope(u)) {
    try {
      localStorage.setItem(SAVED_KEY, rt);
    } catch {}
  }
  patch({ rt });
}

export function useScope() {
  useEffect(() => {
    start();
  }, []);
  const s = useSyncExternalStore(
    subscribe,
    () => snap,
    () => serverSnap,
  );
  const options = s.user
    ? scopeOptions(s.user)
    : [{ value: s.rt, label: s.rt === 'ALL' ? 'RW 012' : `RT ${s.rt}` }];
  return {
    selectedRt: s.rt,
    setSelectedRt,
    user: s.user,
    ready: s.ready,
    options,
    locked: options.length <= 1,
  };
}

// Menu yang tidak tampil untuk akun warga
const HIDDEN_FOR_WARGA = ['/dashboard/kas', '/dashboard/kegiatan', '/dashboard/arsip', '/dashboard/pengaturan'];

export function canSeeMenu(u: ScopeUser, href: string): boolean {
  if (u?.role !== 'warga') return true;
  return !HIDDEN_FOR_WARGA.some((h) => href === h || href.startsWith(h + '/'));
}

export function isViewOnly(u: ScopeUser): boolean {
  return u?.role === 'warga';
}

export function useViewOnly(): boolean {
  const { user } = useScope();
  return isViewOnly(user);
}
