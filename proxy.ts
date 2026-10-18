// proxy.ts — semua halaman wajib login (Next 16)
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const loggedIn = !!req.auth;

  if (pathname === '/login') {
    if (loggedIn) return NextResponse.redirect(new URL('/', req.nextUrl));
    return NextResponse.next();
  }

  if (!loggedIn) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Belum login' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  const mustChange = (req.auth?.user as { wajib_ganti_password?: boolean } | undefined)?.wajib_ganti_password;
  if (mustChange && pathname.startsWith('/api') && !pathname.startsWith('/api/akun/')) {
    return NextResponse.json({ error: 'Wajib ganti password' }, { status: 403 });
  }

  const role = (req.auth?.user as { role?: string } | undefined)?.role;
  if (role === 'warga') {
    if (/^\/dashboard\/(kas|kegiatan|arsip|pengaturan)(\/|$)/.test(pathname)) {
      return NextResponse.redirect(new URL('/dashboard/laporan', req.nextUrl));
    }
    if (/^\/api\/(kegiatan|arsip|iuran|pembayaran-iuran)(\/|$)/.test(pathname)) {
      return NextResponse.json({ error: 'Tidak punya akses' }, { status: 403 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)'],
};
