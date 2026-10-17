// lib/wargaImport.ts
// Logika murni untuk import Excel data warga: tambah orang baru, perbarui orang lama
// (dicocokkan lewat ID atau NIK), dan hitung tarif iuran otomatis per alamat / KK.

import type { Warga } from '@/lib/types';

export const TARIF_ALAMAT = 55000; // wajib, 1x per alamat (KK pertama)
export const TARIF_KK_TAMBAHAN = 27000; // opsional, KK kedua dst (Dana Sosial + Kas RT)

export type ImportRecord = {
  rowNumber: number;
  raw: Record<string, string>;
  id: string;
  nomor: string;
  alamat: string;
  nama: string;
  nik: string;
  tanggalLahir: string;
  usiaRaw: string;
  kategoriRaw: string;
  rtRwRaw: string;
  statusRaw: string;
  tarifRaw: string;
  noKk: string;
  hubungan: string;
  ikutKkRaw: string;
  simpinRaw: string;
};

export type ImportDeps = {
  getAge: (isoDate: string) => number | null;
  getCategory: (isoDate: string) => string;
  parseRtRw: (raw: string, fallbackRt: string) => { rt: string; rw: string };
  parseRupiah: (raw: string) => number;
  normalizeName: (s: string) => string;
  defaultRt: string;
};

export type ImportItem = {
  kind: 'tambah' | 'perbarui';
  rowNumber: number;
  id?: string;
  nama: string;
  nik: string;
  alamat: string;
  nomor: string;
  rt: string;
  rw: string;
  rt_rw: string;
  status: 'Tetap' | 'Kontrak';
  tanggal_lahir: string;
  no_kk: string;
  hubungan: string;
  ikut_iuran_kk: boolean;
  anggota_simpin: boolean;
  nominal_iuran: number;
  tarifAuto: boolean;
  changes?: Record<string, unknown>;
  changeLabels: string[];
  warnings: string[];
};

export type ImportFailure = { rowNumber: number; reason: string; row: Record<string, string> };

export type ImportPlan = { items: ImportItem[]; failed: ImportFailure[]; skipped: number };

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const onlyDigits = (s: string) => s.replace(/\D/g, '');
const normAlamat = (s: string) => squash(s);
const normKk = (s: string) => s.toLowerCase().replace(/\s+/g, '');
const kkKey = (alamat: string, noKk: string) => `${normAlamat(alamat)}|${normKk(noKk)}`;
const str = (v: unknown) => String(v ?? '').trim();

export function pickCol(row: Record<string, string>, names: string[]): string {
  const want = names.map(squash);
  for (const [key, value] of Object.entries(row)) {
    if (want.includes(squash(key))) return str(value);
  }
  return '';
}

function parseFlag(raw: string): { ok: boolean; value?: boolean } {
  const v = raw.trim().toLowerCase();
  if (!v) return { ok: true };
  if (['ya', 'y', 'yes', 'ikut', '1', 'true'].includes(v)) return { ok: true, value: true };
  if (['tidak', 't', 'no', 'n', '0', 'false', '-'].includes(v)) return { ok: true, value: false };
  return { ok: false };
}

export function planWargaImport(records: ImportRecord[], existing: Warga[], deps: ImportDeps): ImportPlan {
  const failed: ImportFailure[] = [];
  const items: ImportItem[] = [];
  let skipped = 0;

  const byId = new Map<string, Warga>();
  const byNik = new Map<string, Warga>();
  const nameIndex = new Map<string, Warga[]>();
  const payerKeys = new Set<string>();

  existing.forEach((w) => {
    byId.set(w.id, w);
    const n = onlyDigits(w.nik ?? '');
    if (n.length === 16) byNik.set(n, w);
    const nm = deps.normalizeName(w.nama_lengkap ?? '');
    nameIndex.set(nm, [...(nameIndex.get(nm) ?? []), w]);
    if ((w.nominal_iuran ?? 0) > 0) payerKeys.add(kkKey(w.alamat ?? '', w.no_kk ?? ''));
  });

  const seenIds = new Set<string>();
  const seenNiks = new Set<string>();
  const plannedNames = new Set<string>();
  const nomorByAlamat = new Map<string, string>();
  const newOnes: { item: ImportItem; explicit: number | null }[] = [];

  for (const rec of records) {
    const fail = (reason: string) => {
      failed.push({ rowNumber: rec.rowNumber, reason, row: rec.raw });
    };

    if (!rec.id && !rec.nama && !rec.alamat && !rec.nik) continue; // baris kosong

    // 1. Cocokkan dengan data lama: ID dulu, kalau kosong pakai NIK
    let target: Warga | undefined;
    if (rec.id) {
      target = byId.get(rec.id);
      if (!target) {
        fail('ID tidak ditemukan di database. Kosongkan kolom ID kalau ini orang baru.');
        continue;
      }
    } else if (/^\d{16}$/.test(rec.nik)) {
      target = byNik.get(rec.nik);
    }
    if (target && seenIds.has(target.id)) {
      fail('Orang ini muncul dua kali di file (ID atau NIK sama).');
      continue;
    }
    const isNew = !target;

    // 2. Nama & alamat
    const nama = rec.nama || target?.nama_lengkap || '';
    const alamat = rec.alamat || target?.alamat || '';
    if (!nama || !alamat) {
      fail('Alamat dan Nama Lengkap wajib diisi.');
      continue;
    }

    // 3. NIK
    let nik = '';
    if (rec.nik) {
      if (!/^\d{16}$/.test(rec.nik)) {
        fail('NIK wajib tepat 16 digit angka.');
        continue;
      }
      nik = rec.nik;
    } else if (target) {
      nik = target.nik ?? '';
    } else {
      fail('NIK wajib tepat 16 digit angka.');
      continue;
    }
    if (nik) {
      const other = byNik.get(nik);
      if (other && (!target || other.id !== target.id)) {
        fail(`NIK sudah dipakai warga lain (${other.nama_lengkap}).`);
        continue;
      }
      if (seenNiks.has(nik)) {
        fail('NIK ini muncul dua kali di file.');
        continue;
      }
    }

    // 4. Tanggal lahir
    let tanggal = rec.tanggalLahir;
    if (!tanggal) {
      if (target) {
        tanggal = target.tanggal_lahir ?? '';
      } else {
        fail('Format tanggal lahir tidak valid.');
        continue;
      }
    } else {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
        fail('Format tanggal lahir tidak valid.');
        continue;
      }
      if (Number.isNaN(new Date(`${tanggal}T00:00:00`).getTime())) {
        fail('Tanggal lahir tidak valid.');
        continue;
      }
    }

    const warnings: string[] = [];
    if (tanggal && (isNew || target?.tanggal_lahir !== tanggal)) {
      const age = deps.getAge(tanggal);
      if (age !== null) {
        const calcAge = String(age);
        const calcCat = deps.getCategory(tanggal);
        if (rec.usiaRaw && rec.usiaRaw !== calcAge) {
          warnings.push(`Usia di file ${rec.usiaRaw}, dihitung sistem ${calcAge}.`);
        }
        if (rec.kategoriRaw && calcCat && rec.kategoriRaw.toLowerCase() !== calcCat.toLowerCase()) {
          warnings.push(`Kategori usia di file "${rec.kategoriRaw}", dihitung sistem "${calcCat}".`);
        }
      }
    }

    // 5. Status
    const statusLower = rec.statusRaw.toLowerCase();
    let status: 'Tetap' | 'Kontrak';
    if (statusLower === 'tetap') status = 'Tetap';
    else if (statusLower === 'kontrak') status = 'Kontrak';
    else if (!rec.statusRaw && target) status = target.status_tinggal;
    else {
      fail('Status harus Tetap atau Kontrak.');
      continue;
    }

    // 6. RT/RW
    let rt: string;
    let rw: string;
    if (rec.rtRwRaw || !target) {
      const parsed = deps.parseRtRw(rec.rtRwRaw, deps.defaultRt);
      rt = parsed.rt;
      rw = parsed.rw;
    } else {
      rt = target.rt;
      rw = target.rw;
    }

    // 7. Tarif (kosong = dihitung sistem untuk orang baru)
    let explicitNominal: number | null = null;
    if (rec.tarifRaw) {
      if (!/^\d[\d.]*$/.test(rec.tarifRaw)) {
        fail('Tarif Iuran Wajib harus berupa angka dengan pemisah titik ribuan.');
        continue;
      }
      explicitNominal = deps.parseRupiah(rec.tarifRaw);
    }

    // 8. KK, hubungan, penanda ikut
    let noKk = target?.no_kk ?? '';
    if (rec.noKk) noKk = rec.noKk.trim() === '-' ? '' : rec.noKk.trim();
    let hubungan = target?.hubungan ?? '';
    if (rec.hubungan) hubungan = rec.hubungan.trim() === '-' ? '' : rec.hubungan.trim();

    const ikutParsed = parseFlag(rec.ikutKkRaw);
    if (!ikutParsed.ok) {
      fail('Ikut Iuran KK harus Ya atau Tidak.');
      continue;
    }
    const simpinParsed = parseFlag(rec.simpinRaw);
    if (!simpinParsed.ok) {
      fail('Anggota Simpin harus Ya atau Tidak.');
      continue;
    }
    const ikutKk = ikutParsed.value ?? target?.ikut_iuran_kk ?? false;
    const simpin = simpinParsed.value ?? target?.anggota_simpin ?? false;

    // 9. Nomor rumah (hanya untuk orang baru)
    if (isNew) {
      if (!rec.nomor) {
        fail('Nomor rumah wajib diisi.');
        continue;
      }
      const key = normAlamat(alamat);
      const prev = nomorByAlamat.get(key);
      if (prev && prev !== rec.nomor) {
        fail(`Alamat "${alamat}" memiliki Nomor yang berbeda di baris lain. Satu alamat harus satu nomor rumah.`);
        continue;
      }
      nomorByAlamat.set(key, rec.nomor);
    }

    // 10. Peringatan nama kembar (tidak memblokir)
    const nm = deps.normalizeName(nama);
    const dupes = (nameIndex.get(nm) ?? []).filter((w) => w.id !== target?.id);
    if (dupes.length && (isNew || str(target?.nama_lengkap) !== str(nama))) {
      warnings.push(`Ada ${dupes.length} warga lain dengan nama sama (mis. di ${dupes[0].alamat}). Pastikan ini orang berbeda.`);
    } else if (isNew && plannedNames.has(nm)) {
      warnings.push('Nama sama dengan baris lain di file ini. Pastikan ini orang berbeda.');
    }
    plannedNames.add(nm);

    const item: ImportItem = {
      kind: isNew ? 'tambah' : 'perbarui',
      rowNumber: rec.rowNumber,
      id: target?.id,
      nama,
      nik,
      alamat,
      nomor: rec.nomor,
      rt,
      rw,
      rt_rw: `${rt}/${rw}`,
      status,
      tanggal_lahir: tanggal,
      no_kk: noKk,
      hubungan,
      ikut_iuran_kk: ikutKk,
      anggota_simpin: simpin,
      nominal_iuran: explicitNominal ?? target?.nominal_iuran ?? 0,
      tarifAuto: false,
      changeLabels: [],
      warnings,
    };

    if (target) {
      const changes: Record<string, unknown> = {};
      const labels: string[] = [];
      const diff = (field: string, label: string, oldV: unknown, newV: unknown) => {
        if (str(oldV) !== str(newV)) {
          changes[field] = newV;
          labels.push(`${label}: ${str(oldV) || '-'} → ${str(newV) || '-'}`);
        }
      };
      diff('nama_lengkap', 'Nama', target.nama_lengkap, nama);
      diff('nik', 'NIK', target.nik, nik);
      diff('tanggal_lahir', 'Tgl lahir', target.tanggal_lahir, tanggal);
      diff('alamat', 'Alamat', target.alamat, alamat);
      diff('status_tinggal', 'Status', target.status_tinggal, status);
      diff('rt', 'RT', target.rt, rt);
      diff('rw', 'RW', target.rw, rw);
      diff('no_kk', 'No KK', target.no_kk, noKk);
      diff('hubungan', 'Hubungan', target.hubungan, hubungan);
      if (ikutKk !== (target.ikut_iuran_kk ?? false)) {
        changes.ikut_iuran_kk = ikutKk;
        labels.push(`Ikut iuran KK: ${ikutKk ? 'Ya' : 'Tidak'}`);
      }
      if (simpin !== (target.anggota_simpin ?? false)) {
        changes.anggota_simpin = simpin;
        labels.push(`Anggota Simpin: ${simpin ? 'Ya' : 'Tidak'}`);
      }

      const oldNominal = target.nominal_iuran ?? 0;
      if (explicitNominal !== null && explicitNominal !== oldNominal) {
        changes.nominal_iuran = explicitNominal;
        labels.push(`Tarif: ${oldNominal} → ${explicitNominal}`);
      } else if (
        ikutParsed.value === true &&
        !(target.ikut_iuran_kk ?? false) &&
        normKk(noKk) !== '' &&
        oldNominal === 0 &&
        !payerKeys.has(kkKey(alamat, noKk))
      ) {
        // KK tambahan yang baru memutuskan ikut iuran: tarif 27.000 otomatis
        changes.nominal_iuran = TARIF_KK_TAMBAHAN;
        labels.push(`Tarif: 0 → ${TARIF_KK_TAMBAHAN} (otomatis)`);
        item.nominal_iuran = TARIF_KK_TAMBAHAN;
        item.tarifAuto = true;
        payerKeys.add(kkKey(alamat, noKk));
      }

      seenIds.add(target.id);
      if (nik) seenNiks.add(nik);

      if (Object.keys(changes).length === 0) {
        skipped += 1;
        continue;
      }
      item.changes = changes;
      item.changeLabels = labels;
      items.push(item);
      continue;
    }

    if (nik) seenNiks.add(nik);
    items.push(item);
    newOnes.push({ item, explicit: explicitNominal });
  }

  // Tarif orang baru: yang diisi manual dihormati dulu, sisanya dihitung per (alamat, KK)
  newOnes.forEach(({ item, explicit }) => {
    if (explicit !== null && explicit > 0) payerKeys.add(kkKey(item.alamat, item.no_kk));
  });

  const groups = new Map<string, ImportItem[]>();
  newOnes
    .filter((n) => n.explicit === null)
    .forEach(({ item }) => {
      const key = kkKey(item.alamat, item.no_kk);
      groups.set(key, [...(groups.get(key) ?? []), item]);
    });

  groups.forEach((members, key) => {
    members.forEach((m) => {
      m.nominal_iuran = 0;
    });
    if (payerKeys.has(key)) return; // KK ini sudah ada yang bayar
    const utama = normKk(members[0].no_kk) === '';
    const tarif = utama ? TARIF_ALAMAT : members.some((m) => m.ikut_iuran_kk) ? TARIF_KK_TAMBAHAN : 0;
    if (tarif > 0) {
      const holder = members.find((m) => /kepala/i.test(m.hubungan)) ?? members[0];
      holder.nominal_iuran = tarif;
      holder.tarifAuto = true;
      payerKeys.add(key);
    }
  });

  return { items, failed, skipped };
}
