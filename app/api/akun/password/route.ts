// app/api/akun/password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import dbConnect from '@/lib/dbConnect';
import { UserModel } from '@/lib/userModel';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const id = (session?.user as { id?: string } | undefined)?.id;
    if (!id) return NextResponse.json({ error: 'Belum login' }, { status: 401 });

    const { lama, baru } = await req.json();
    if (typeof lama !== 'string' || typeof baru !== 'string' || !lama || !baru) {
      return NextResponse.json({ error: 'Password lama dan baru wajib diisi' }, { status: 400 });
    }
    if (baru.length < 8) {
      return NextResponse.json({ error: 'Password baru minimal 8 karakter' }, { status: 400 });
    }
    if (!/[A-Za-z]/.test(baru) || !/\d/.test(baru)) {
      return NextResponse.json({ error: 'Password baru harus berisi huruf dan angka' }, { status: 400 });
    }
    if (baru === lama) {
      return NextResponse.json({ error: 'Password baru tidak boleh sama dengan password lama' }, { status: 400 });
    }
    if (baru.toLowerCase() === 'adm,123') {
      return NextResponse.json({ error: 'Password itu adalah password awal. Pilih password lain' }, { status: 400 });
    }

    await dbConnect();
    const u = (await UserModel.findById(id).lean()) as { password_hash?: string } | null;
    if (!u || !u.password_hash) {
      return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 404 });
    }
    if (!(await bcrypt.compare(lama, u.password_hash))) {
      return NextResponse.json({ error: 'Password lama salah' }, { status: 400 });
    }

    await UserModel.updateOne(
      { _id: id },
      { $set: { password_hash: await bcrypt.hash(baru, 10), wajib_ganti_password: false } },
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/akun/password POST]', err);
    return NextResponse.json({ error: 'Gagal mengganti password' }, { status: 500 });
  }
}
