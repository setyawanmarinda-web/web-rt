// Nama babak bagan gugur (dipakai server & client).
export const roundName = (r: number, total: number, layout: 'standard' | 'dua-kelompok' = 'standard') =>
  r === total ? 'Final' : r === total - 1 ? (layout === 'dua-kelompok' ? 'Semifinal (juara kelompok)' : 'Semifinal')
    : r === total - 2 && layout === 'standard' ? 'Perempat Final' : `Babak ${r}`;
