// lib/event/guard.ts — otorisasi modul 17an (divalidasi di backend)
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export type EventActor = { id: string; role: string; username: string; nama: string; warga_id: string };

export async function getActor(): Promise<EventActor | null> {
  const session = await auth();
  const u = session?.user as { id?: string; role?: string; username?: string; name?: string; warga_id?: string } | undefined;
  if (!u?.id || !u.role) return null;
  return { id: u.id, role: u.role, username: u.username ?? '', nama: u.name ?? '', warga_id: u.warga_id ?? '' };
}

export const fail = (status: number, error: string) => NextResponse.json({ error }, { status });

// Semua akun login boleh membaca.
export async function requireLogin(): Promise<{ actor: EventActor } | { res: NextResponse }> {
  const actor = await getActor();
  return actor ? { actor } : { res: fail(401, 'Belum login') };
}

// Hanya master yang boleh menulis (admin_rw/admin_rt/warga hanya melihat).
export async function requireMaster(): Promise<{ actor: EventActor } | { res: NextResponse }> {
  const actor = await getActor();
  if (!actor) return { res: fail(401, 'Belum login') };
  if (actor.role !== 'master') return { res: fail(403, 'Hanya master yang boleh mengubah data 17an') };
  return { actor };
}

export function toJson<T extends { _id?: unknown }>(d: T) {
  const rest = { ...(d as Record<string, unknown>) };
  delete rest._id; delete rest.__v;
  return { ...rest, id: String(d._id) };
}
