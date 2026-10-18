'use client';

import { useEffect } from 'react';

// Badge akun dipindah ke header (ProfileMenu). Komponen ini tetap dipakai
// hanya untuk memulihkan tema terang/gelap yang tersimpan.
export default function UserBadge() {
  useEffect(() => {
    try {
      const t = localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', t);
    } catch {}
  }, []);
  return null;
}
