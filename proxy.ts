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

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)'],
};
