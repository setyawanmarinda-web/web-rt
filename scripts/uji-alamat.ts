// Uji manual alamatKey. Jalankan: npx tsx scripts/uji-alamat.ts
// (tanpa tsx: salin lib/alamat.ts dan file ini ke satu folder, ubah impor jadi './alamat.ts',
//  lalu node --experimental-strip-types uji-alamat.ts)
import { alamatKey, alamatSama } from '../lib/alamat';

const kasus: [string, string | null][] = [
  ['AM 19/01', 'AM19-1'],
  ['AM19 No. 1', 'AM19-1'],
  ['AM19/1', 'AM19-1'],
  ['AM 19 Nomor 01', 'AM19-1'],
  ['am 19/01', 'AM19-1'],
  ['  AM19  /  01 ', 'AM19-1'],
  ['AM 19/1A', 'AM19-1A'],
  ['AM19 No. 1a', 'AM19-1A'],
  ['AM 19/10', 'AM19-10'],
  ['Blok A1 No. 4', 'A1-4'],
  ['', null],
  ['Blok', null],
  ['19', null],
  ['AM 19', null],
  ['Jl. Mawar', null],
];

let gagal = 0;
for (const [input, harapan] of kasus) {
  const hasil = alamatKey(input);
  const ok = hasil === harapan;
  if (!ok) gagal++;
  console.log(`${ok ? 'OK  ' : 'GAGAL'} ${JSON.stringify(input)} -> ${hasil} (harapan ${harapan})`);
}

const sama: [string, string, boolean][] = [
  ['AM 19/01', 'AM19/1', true],
  ['AM 19/1', 'AM19/1A', false],
  ['AM 19/1', 'AM 19/11', false],
  ['Jl. Mawar', 'Jl. Mawar', false],
];
for (const [a, b, harapan] of sama) {
  const ok = alamatSama(a, b) === harapan;
  if (!ok) gagal++;
  console.log(`${ok ? 'OK  ' : 'GAGAL'} alamatSama(${JSON.stringify(a)}, ${JSON.stringify(b)}) = ${alamatSama(a, b)}`);
}

console.log(gagal ? `\n${gagal} uji gagal` : '\nSemua uji lulus');
process.exit(gagal ? 1 : 0);
