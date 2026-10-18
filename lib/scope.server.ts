import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export type Scope = {
  role: string;
  username: string;
  rt: string;
  rw: string;
  all: boolean;
  canWrite: boolean;
};

export async function getScope(): Promise<Scope | null> {
  const session = await auth();
  const u = session?.user as { role?: string; username?: string; rt?: string; rw?: string } | undefined;
  if (!u?.role) return null;
  const all = u.role === 'master' || u.role === 'admin_rw';
  return {
    role: u.role,
    username: u.username ?? '',
    rt: u.rt ?? '',
    rw: u.rw ?? '012',
    all,
    canWrite: u.role !== 'warga',
  };
}

export function denied(status = 403, message = 'Tidak punya akses') {
  return NextResponse.json({ error: message }, { status });
}

// Filter RT untuk query baca. Akun RT/warga selalu dipaksa ke RT-nya sendiri.
export function rtQuery(scope: Scope, requested: string | null): Record<string, string> {
  if (scope.all) return requested && requested !== 'ALL' ? { rt: requested } : {};
  return { rt: scope.rt };
}

export function canAccessRt(scope: Scope, rt?: string | null): boolean {
  return scope.all || (!!rt && rt === scope.rt);
}

// Data baru: akun RT/warga selalu disimpan atas RT-nya sendiri.
export function forceRt(scope: Scope, body: unknown) {
  if (scope.all || !body || typeof body !== 'object') return;
  const set = (b: unknown) => {
    if (b && typeof b === 'object') (b as Record<string, unknown>).rt = scope.rt;
  };
  if (Array.isArray(body)) body.forEach(set);
  else set(body);
}

// Ubah data: akun RT/warga tidak boleh memindahkan data ke RT lain.
export function lockRt(scope: Scope, changes: unknown) {
  if (scope.all || !changes || typeof changes !== 'object') return;
  delete (changes as Record<string, unknown>).rt;
}

// Ubah/hapus data: hanya boleh kalau data itu milik RT akun.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ownershipDenied(scope: Scope, model: any, id: unknown): Promise<NextResponse | null> {
  if (scope.all) return null;
  const doc = (await model.findById(id).lean()) as { rt?: string } | null;
  if (!doc) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
  if (doc.rt !== scope.rt) return denied();
  return null;
}

// Ubah/hapus data anak (misal riwayat stok): kepemilikan dicek lewat data induknya (misal barang).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ownershipDeniedVia(scope: Scope, model: any, id: unknown, parentModel: any, parentField: string): Promise<NextResponse | null> {
  if (scope.all) return null;
  const doc = (await model.findById(id).lean()) as Record<string, unknown> | null;
  if (!doc) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
  const parent = (await parentModel.findById(doc[parentField]).lean()) as { rt?: string } | null;
  if (!parent || parent.rt !== scope.rt) return denied();
  return null;
}

// Seperti rtQuery, tapi akun RT juga menerima data level RW (rt = '012'), misalnya pengumuman dan agenda.
export function rtQueryRw(scope: Scope, requested: string | null): Record<string, unknown> {
  if (scope.all) return requested && requested !== 'ALL' ? { rt: requested } : {};
  return { rt: { $in: [scope.rt, '012'] } };
}
