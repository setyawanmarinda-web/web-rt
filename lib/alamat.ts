// Normalisasi alamat rumah supaya penulisan berbeda dianggap rumah yang sama.
// "AM 19/01" = "AM19 No. 1" = "AM19/1" = "AM 19 Nomor 01"  ->  "AM19-1"
// Huruf di belakang nomor ("1A") tetap rumah lain  ->  "AM19-1A"
// Alamat yang polanya tidak dikenali menghasilkan null.
export function alamatKey(teks: unknown): string | null {
  const s = String(teks ?? '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/\b(NOMOR|NO|BLOK)\b\.?/g, ' ');

  // pecah jadi potongan huruf / angka: "AM19/01" -> AM, 19, 01
  const t = s.match(/[A-Z]+|\d+/g) ?? [];
  const isNum = (x?: string) => !!x && /^\d+$/.test(x);
  const isAlpha = (x?: string) => !!x && /^[A-Z]+$/.test(x);

  if (t.length < 3 || t.length > 4) return null;
  if (!isAlpha(t[0]) || !isNum(t[1]) || !isNum(t[2])) return null;
  if (t.length === 4 && !isAlpha(t[3])) return null;

  const strip = (n: string) => n.replace(/^0+(?=\d)/, '');
  return `${t[0]}${strip(t[1])}-${strip(t[2])}${t[3] ?? ''}`;
}

// Dua alamat sama kalau keduanya terbaca dan kodenya sama.
export function alamatSama(a: unknown, b: unknown): boolean {
  const ka = alamatKey(a);
  return ka !== null && ka === alamatKey(b);
}
