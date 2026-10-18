'use client';

import React from 'react';
import * as XLSX from 'xlsx';
import { useSimStore } from '@/lib/store';
import { SortGroup } from '@/components/LayoutEdit';
import { useScope } from '@/lib/scope';
import { useStatistikRingkas, ringkasUntuk } from '@/lib/useStatistikRingkas';
import type { KasRT } from '@/lib/types';
import {
  Download, Printer, FileSpreadsheet, Wallet, TrendingUp, TrendingDown, PiggyBank,
} from 'lucide-react';

type PosName = KasRT['pos'];

const POS_META: {
  pos: PosName; id: string; badge: string; badgeCls: string; border: string; total: string;
}[] = [
  { pos: 'Kas RT', id: 'kasrt', badge: 'Operasional', badgeCls: 'bg-emerald-500/20 text-emerald-300', border: 'border-slate-800 hover:border-emerald-500/50', total: 'text-emerald-400' },
  { pos: 'Sampah & Keamanan', id: 'sampah', badge: 'Wajib', badgeCls: 'bg-amber-500/20 text-amber-300', border: 'border-slate-800 hover:border-emerald-500/50', total: 'text-white' },
  { pos: 'Dana Sosial', id: 'dansos', badge: 'Dansos', badgeCls: 'bg-teal-500/20 text-teal-300', border: 'border-slate-800 hover:border-emerald-500/50', total: 'text-white' },
  { pos: 'Dana 17an', id: 'dana17', badge: '17an', badgeCls: 'bg-sky-500/20 text-sky-300', border: 'border-sky-500/30 hover:border-sky-400/70', total: 'text-sky-300' },
];

type Card = {
  id: string; name: string; badge: string; badgeCls: string; border: string; total: string;
  masuk: number; keluar: number; saldo: number; masukNote?: string; keluarNote?: string;
};

type MemberRow = {
  key: string; nama: string; alamat: string; anggota: boolean;
  simpanan: number; pinjam: number; cicilan: number; sisa: number;
};

const rp = (n: number) => `${n < 0 ? '-' : ''}Rp ${Math.abs(Math.round(n)).toLocaleString('id-ID')}`;
const pct = (v: number, t: number) => (t > 0 ? Math.round((v / t) * 100) : 0);
const norm = (s?: string) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
const keyOf = (nama?: string, alamat?: string) => `${norm(nama)}|${norm(alamat)}`;
const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const fmtCurrency = (ws: XLSX.WorkSheet, cols?: number[]) => {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      if (cols && !cols.includes(c)) continue;
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell && cell.t === 'n') cell.z = '#,##0';
    }
  }
};

export default function LaporanPage() {
  const { kasList, wargaList, simpanPinjamList, selectedRt } = useSimStore();
  const { user: scopeUser } = useScope();
  const viewOnly = scopeUser?.role === 'warga';

  // Warga Terdata: angka dari server (RT terpilih; RW 012 = jumlah RT 001-010), bukan dari wargaList
  const warga = ringkasUntuk(useStatistikRingkas(), selectedRt);

  const rtLabel = selectedRt === 'ALL' ? 'RW 012' : `RT ${selectedRt}`;
  const filteredKas = selectedRt === 'ALL' ? kasList : kasList.filter((k) => k.rt === selectedRt);
  const filteredWarga = selectedRt === 'ALL' ? wargaList : wargaList.filter((w) => w.rt === selectedRt);
  const filteredSP =
    selectedRt === 'ALL' ? simpanPinjamList : simpanPinjamList.filter((s) => s.rt === selectedRt);

  const sumBy = <T,>(arr: T[], f: (x: T) => number) => arr.reduce((s, x) => s + f(x), 0);

  // ---- 4 pos kas ----
  const perPos = POS_META.map((m) => {
    const masuk = sumBy(filteredKas.filter((k) => k.pos === m.pos && k.jenis === 'Masuk'), (k) => Number(k.jumlah));
    const keluar = sumBy(filteredKas.filter((k) => k.pos === m.pos && k.jenis === 'Keluar'), (k) => Number(k.jumlah));
    return { ...m, masuk, keluar, saldo: masuk - keluar };
  });
  const totalMasuk = sumBy(perPos, (p) => p.masuk);
  const totalKeluar = sumBy(perPos, (p) => p.keluar);
  const saldoKas = totalMasuk - totalKeluar;

  // ---- simpan pinjam ----
  const spSimpan = filteredSP.filter((s) => s.jenis === 'Simpan');
  const spPinjam = filteredSP.filter((s) => s.jenis === 'Pinjam');
  const spCicilan = filteredSP.filter((s) => s.jenis === 'Cicilan');
  const simpanan = sumBy(spSimpan, (s) => Number(s.nominal));
  const pinjam = sumBy(spPinjam, (s) => Number(s.nominal));
  const cicilan = sumBy(spCicilan, (s) => Number(s.nominal));
  const bunga = sumBy(spPinjam, (s) => Math.round((Number(s.nominal) * (s.bunga_persen ?? 0)) / 100));
  const sisaPinjaman = Math.max(0, pinjam - cicilan);
  const simpinMasuk = simpanan + cicilan + bunga;
  const simpinKeluar = pinjam;
  const simpinSaldo = simpinMasuk - simpinKeluar;

  // ---- anggota simpin ----
  const wargaById = new Map(filteredWarga.map((w) => [w.id, w]));
  const memberMap = new Map<string, MemberRow>();
  filteredWarga
    .filter((w) => w.anggota_simpin)
    .forEach((w) => {
      memberMap.set(keyOf(w.nama_lengkap, w.alamat), {
        key: keyOf(w.nama_lengkap, w.alamat),
        nama: w.nama_lengkap,
        alamat: w.alamat,
        anggota: true,
        simpanan: 0, pinjam: 0, cicilan: 0, sisa: 0,
      });
    });
  filteredSP.forEach((s) => {
    const w = s.warga_id ? wargaById.get(s.warga_id) : undefined;
    const k = w ? keyOf(w.nama_lengkap, w.alamat) : keyOf(s.nama, s.alamat);
    let r = memberMap.get(k);
    if (!r) {
      r = {
        key: k,
        nama: w ? w.nama_lengkap : s.nama,
        alamat: w ? w.alamat : s.alamat,
        anggota: false,
        simpanan: 0, pinjam: 0, cicilan: 0, sisa: 0,
      };
      memberMap.set(k, r);
    }
    if (s.jenis === 'Simpan') r.simpanan += Number(s.nominal);
    else if (s.jenis === 'Pinjam') r.pinjam += Number(s.nominal);
    else r.cicilan += Number(s.nominal);
  });
  const memberRows = Array.from(memberMap.values())
    .map((r) => ({ ...r, sisa: Math.max(0, r.pinjam - r.cicilan) }))
    .sort((a, b) => a.nama.localeCompare(b.nama));
  const jumlahAnggota = memberRows.filter((r) => r.anggota).length;
  const peminjamAktif = memberRows.filter((r) => r.sisa > 0).length;

  // ---- kartu 5 pos ----
  const posCards: Card[] = perPos.map((p) => ({
    id: p.id, name: p.pos, badge: p.badge, badgeCls: p.badgeCls, border: p.border, total: p.total,
    masuk: p.masuk, keluar: p.keluar, saldo: p.saldo,
  }));
  const simpinCard: Card = {
    id: 'simpin', name: 'Simpan Pinjam', badge: 'Simpin',
    badgeCls: 'bg-amber-500/20 text-amber-300',
    border: 'border-amber-500/30 hover:border-amber-400/70', total: 'text-amber-300',
    masuk: simpinMasuk, keluar: simpinKeluar, saldo: simpinSaldo,
    masukNote: 'Simpanan + cicilan + bunga', keluarNote: 'Pinjaman disalurkan',
  };
  const cards: Card[] = [posCards[0], posCards[1], posCards[2], simpinCard, posCards[3]];

  // ---- export excel ----
  const handleExportExcel = () => {
    const now = new Date();
    const tglCetak = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const isoToday = now.toISOString().slice(0, 10);
    const wb = XLSX.utils.book_new();

    const ringkasan: (string | number)[][] = [
      [`LAPORAN KEUANGAN ${rtLabel.toUpperCase()} / RW 012`],
      ['Kelurahan Bahagia'],
      [`Periode Tahun ${now.getFullYear()}`],
      [`Dicetak: ${tglCetak}`],
      [],
      ['Pos', 'Pemasukan (Rp)', 'Pengeluaran (Rp)', 'Saldo (Rp)'],
      ...perPos.map((p) => [p.pos, p.masuk, p.keluar, p.saldo]),
      ['Total Kas (4 Pos)', totalMasuk, totalKeluar, saldoKas],
      [],
      ['Simpan Pinjam', simpinMasuk, simpinKeluar, simpinSaldo],
      [],
      ['Rincian Simpan Pinjam', 'Nilai (Rp)'],
      ['Simpanan', simpanan],
      ['Cicilan Diterima', cicilan],
      ['Bunga Pinjaman', bunga],
      ['Pinjaman Disalurkan', pinjam],
      ['Sisa Pinjaman Beredar', sisaPinjaman],
      ['Anggota Simpin', `${jumlahAnggota} orang`],
      ['Peminjam Aktif', `${peminjamAktif} orang`],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(ringkasan);
    ws1['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    fmtCurrency(ws1);
    XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan');

    const mutasi = [...filteredKas].sort((a, b) =>
      (a.tanggal_transaksi || a.created_at || '').localeCompare(b.tanggal_transaksi || b.created_at || ''),
    );
    const ws2 = XLSX.utils.aoa_to_sheet([
      ['Tanggal', 'RT', 'Jenis', 'Pos', 'Nominal (Rp)', 'Metode', 'Pembayar', 'Alamat', 'Keterangan'],
      ...mutasi.map((k) => [
        (k.tanggal_transaksi || k.created_at || '').slice(0, 10),
        k.rt, k.jenis, k.pos, Number(k.jumlah), k.metode,
        k.nama_pembayar || '', k.alamat_pembayar || '', k.keterangan || '',
      ]),
    ]);
    ws2['!cols'] = [{ wch: 12 }, { wch: 6 }, { wch: 9 }, { wch: 20 }, { wch: 15 }, { wch: 11 }, { wch: 22 }, { wch: 22 }, { wch: 50 }];
    fmtCurrency(ws2, [4]);
    XLSX.utils.book_append_sheet(wb, ws2, 'Mutasi Kas');

    const spSorted = [...filteredSP].sort((a, b) =>
      (a.tanggal_transaksi || '').localeCompare(b.tanggal_transaksi || ''),
    );
    const ws3 = XLSX.utils.aoa_to_sheet([
      ['Tanggal', 'RT', 'Nama', 'Alamat', 'Jenis', 'Nominal (Rp)', 'Tenor', 'Bunga', 'Bunga Dibayar (Rp)'],
      ...spSorted.map((s) => [
        s.tanggal_transaksi, s.rt, s.nama, s.alamat, s.jenis, Number(s.nominal),
        s.tenor_bulan ? `${s.tenor_bulan} bulan` : '',
        s.jenis === 'Pinjam' ? `${s.bunga_persen ?? 0}%` : '',
        s.jenis === 'Pinjam' ? Math.round((Number(s.nominal) * (s.bunga_persen ?? 0)) / 100) : '',
      ]),
    ]);
    ws3['!cols'] = [{ wch: 12 }, { wch: 6 }, { wch: 22 }, { wch: 22 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 8 }, { wch: 18 }];
    fmtCurrency(ws3, [5, 8]);
    XLSX.utils.book_append_sheet(wb, ws3, 'Simpan Pinjam');

    const ws4 = XLSX.utils.aoa_to_sheet([
      ['No', 'Nama', 'Alamat', 'Status', 'Simpanan (Rp)', 'Pinjaman (Rp)', 'Cicilan (Rp)', 'Sisa Pinjaman (Rp)'],
      ...memberRows.map((r, i) => [
        String(i + 1), r.nama, r.alamat, r.anggota ? 'Anggota' : 'Non-anggota',
        r.simpanan, r.pinjam, r.cicilan, r.sisa,
      ]),
      ['', 'TOTAL', '', '', sumBy(memberRows, (r) => r.simpanan), sumBy(memberRows, (r) => r.pinjam), sumBy(memberRows, (r) => r.cicilan), sumBy(memberRows, (r) => r.sisa)],
    ]);
    ws4['!cols'] = [{ wch: 5 }, { wch: 24 }, { wch: 24 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 }];
    fmtCurrency(ws4, [4, 5, 6, 7]);
    XLSX.utils.book_append_sheet(wb, ws4, 'Anggota Simpin');

    XLSX.writeFile(wb, `Laporan_${rtLabel.replace(/\s+/g, '_')}_RW012_${isoToday}.xlsx`);
  };

  // ---- export pdf (jendela cetak A4) ----
  const handlePrintPdf = () => {
    const now = new Date();
    const tglCetak = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const td = (v: string | number, right = false) => `<td${right ? ' class="n"' : ''}>${esc(v)}</td>`;
    const ketua = selectedRt === 'ALL' ? 'Ketua RW 012' : `Ketua RT ${selectedRt}`;

    const ringkasanRows =
      perPos
        .map((p) => `<tr>${td(p.pos)}${td(rp(p.masuk), true)}${td(rp(p.keluar), true)}${td(rp(p.saldo), true)}</tr>`)
        .join('') +
      `<tr class="total">${td('Total Kas (4 Pos)')}${td(rp(totalMasuk), true)}${td(rp(totalKeluar), true)}${td(rp(saldoKas), true)}</tr>` +
      `<tr>${td('Simpan Pinjam')}${td(rp(simpinMasuk), true)}${td(rp(simpinKeluar), true)}${td(rp(simpinSaldo), true)}</tr>`;

    const masukRows =
      perPos.map((p) => `<tr>${td(p.pos)}${td(rp(p.masuk), true)}</tr>`).join('') +
      `<tr class="total">${td('Total Pemasukan')}${td(rp(totalMasuk), true)}</tr>`;
    const keluarRows =
      perPos.map((p) => `<tr>${td(p.pos)}${td(rp(p.keluar), true)}</tr>`).join('') +
      `<tr class="total">${td('Total Pengeluaran')}${td(rp(totalKeluar), true)}</tr>`;

    const spMasukRows =
      `<tr>${td('Simpanan')}${td(rp(simpanan), true)}</tr>` +
      `<tr>${td('Cicilan Diterima')}${td(rp(cicilan), true)}</tr>` +
      `<tr>${td('Bunga Pinjaman')}${td(rp(bunga), true)}</tr>` +
      `<tr class="total">${td('Total Pemasukan Simpin')}${td(rp(simpinMasuk), true)}</tr>`;
    const spPinjamRows =
      `<tr>${td('Pinjaman Disalurkan')}${td(rp(pinjam), true)}</tr>` +
      `<tr>${td('Sudah Dicicil')}${td(rp(cicilan), true)}</tr>` +
      `<tr>${td('Sisa Pinjaman Beredar')}${td(rp(sisaPinjaman), true)}</tr>` +
      `<tr class="total">${td('Peminjam Aktif')}${td(`${peminjamAktif} orang`, true)}</tr>`;

    const anggotaRows = memberRows.length
      ? memberRows
          .map(
            (r, i) =>
              `<tr>${td(i + 1)}${td(r.nama)}${td(r.alamat)}${td(r.anggota ? 'Anggota' : 'Non-anggota')}${td(rp(r.simpanan), true)}${td(rp(r.pinjam), true)}${td(rp(r.cicilan), true)}${td(rp(r.sisa), true)}</tr>`,
          )
          .join('') +
        `<tr class="total"><td colspan="4">TOTAL</td>${td(rp(sumBy(memberRows, (r) => r.simpanan)), true)}${td(rp(sumBy(memberRows, (r) => r.pinjam)), true)}${td(rp(sumBy(memberRows, (r) => r.cicilan)), true)}${td(rp(sumBy(memberRows, (r) => r.sisa)), true)}</tr>`
      : `<tr><td colspan="8">Belum ada anggota atau transaksi Simpan Pinjam.</td></tr>`;

    const title = `Laporan Keuangan ${rtLabel} RW 012`;
    const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 12px; margin: 0; }
  h1 { font-size: 18px; margin: 0; }
  h2 { font-size: 13px; margin: 18px 0 6px; text-transform: uppercase; letter-spacing: .04em; }
  .muted { color: #555; font-size: 11px; }
  .head { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #111; padding-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #bbb; padding: 5px 7px; vertical-align: top; }
  th { background: #eee; text-align: left; }
  td.n, th.n { text-align: right; white-space: nowrap; }
  tr.total td { font-weight: bold; background: #f4f4f4; }
  tr { page-break-inside: avoid; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .sign { display: flex; justify-content: space-between; margin-top: 36px; text-align: center; page-break-inside: avoid; }
  .sign div { width: 40%; }
  .sign .space { height: 64px; }
</style></head><body>
<div class="head">
  <div>
    <h1>LAPORAN KEUANGAN ${esc(rtLabel.toUpperCase())} / RW 012</h1>
    <div class="muted">Kelurahan Bahagia &bull; Periode Tahun ${now.getFullYear()}</div>
  </div>
  <div class="muted">Dicetak: ${esc(tglCetak)}</div>
</div>

<h2>A. Ringkasan Saldo per Pos</h2>
<table>
  <tr><th>Pos</th><th class="n">Pemasukan</th><th class="n">Pengeluaran</th><th class="n">Saldo</th></tr>
  ${ringkasanRows}
</table>

<h2>B. Pemasukan dan Pengeluaran per Pos</h2>
<div class="two">
  <table><tr><th>Pemasukan</th><th class="n">Jumlah</th></tr>${masukRows}</table>
  <table><tr><th>Pengeluaran</th><th class="n">Jumlah</th></tr>${keluarRows}</table>
</div>

<h2>C. Simpan Pinjam</h2>
<div class="two">
  <table><tr><th>Pemasukan Simpin</th><th class="n">Jumlah</th></tr>${spMasukRows}</table>
  <table><tr><th>Peminjaman</th><th class="n">Jumlah</th></tr>${spPinjamRows}</table>
</div>

<h2>D. Anggota Simpin (${jumlahAnggota} orang)</h2>
<table>
  <tr><th>No</th><th>Nama</th><th>Alamat</th><th>Status</th><th class="n">Simpanan</th><th class="n">Pinjaman</th><th class="n">Cicilan</th><th class="n">Sisa Pinjaman</th></tr>
  ${anggotaRows}
</table>

<div class="sign">
  <div>Bendahara<div class="space"></div>( ........................ )</div>
  <div>Bekasi, ${esc(tglCetak)}<br>${esc(ketua)}<div class="space"></div>( ........................ )</div>
</div>
</body></html>`;

    const w = window.open('', '_blank', 'width=900,height=1000');
    if (!w) {
      alert('Pop-up diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 400);
  };

  const panel = 'bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl';
  const sectionTitle =
    'text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2';

  return (
    <div className="space-y-6 sm:space-y-8">
      <SortGroup attr="data-lo" storageKey="lo-laporan-v2" className="space-y-6 sm:space-y-8">
        {/* Judul & Export */}
        <div data-lo="head">
          <SortGroup attr="data-lo-p" storageKey="lo-laporan-v2-head" layout="flow">
            <div data-lo-p="judul" data-lo-w="7" className={panel}>
              <h1 className="text-2xl font-black text-white">Laporan & Rekapitulasi {rtLabel}</h1>
              <p className="text-slate-400 text-sm mt-1">
                Dashboard seluruh aktivitas keuangan, Simpan Pinjam, dan data warga. Bahan laporan RT ke warga.
              </p>
            </div>
            {!viewOnly && (
<div data-lo-p="export" data-lo-w="5" className={`${panel} flex flex-col justify-center gap-3`}>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Laporan Excel (.xlsx)</span>
              </button>
              <button
                onClick={handlePrintPdf}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
)}
          </SortGroup>
        </div>

        {/* Ringkasan umum */}
        <div data-lo="kpi">
          <SortGroup attr="data-lo-p" storageKey="lo-laporan-v2-kpi" layout="flow" gap="0.75rem">
            <div data-lo-p="masuk" data-lo-w="3" className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Total Pemasukan
              </span>
              <span className="text-xl font-bold text-emerald-400">{rp(totalMasuk)}</span>
            </div>
            <div data-lo-p="keluar" data-lo-w="3" className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-red-400" /> Total Pengeluaran
              </span>
              <span className="text-xl font-bold text-red-400">{rp(totalKeluar)}</span>
            </div>
            <div data-lo-p="saldo" data-lo-w="3" className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-teal-300" /> Saldo Akhir Bersih
              </span>
              <span className="text-xl font-bold text-teal-300">{rp(saldoKas)}</span>
            </div>
            <div data-lo-p="warga" data-lo-w="3" className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 mb-1 block">Warga Terdata</span>
              <span className="text-xl font-bold text-white">{warga?.total ?? '-'} Warga</span>
            </div>
          </SortGroup>
        </div>

        {/* 5 kartu pos */}
        <div data-lo="pos">
          <h3 className={sectionTitle}>
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Rincian Saldo per Pos ({rtLabel})</span>
          </h3>
          <SortGroup attr="data-lo-p" storageKey="lo-laporan-v2-pos" layout="flow" gap="0.75rem">
            {cards.map((c) => (
              <div
                key={c.id}
                data-lo-p={c.id}
                data-lo-w="4"
                className={`bg-slate-900/90 border ${c.border} p-4 rounded-xl transition-all`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">{c.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${c.badgeCls}`}>{c.badge}</span>
                </div>
                <div className={`text-2xl sm:text-3xl font-black mb-3 ${c.saldo < 0 ? 'text-red-400' : c.total}`}>
                  {rp(c.saldo)}
                </div>
                <div className="space-y-3 text-xs border-t border-slate-800 pt-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400">
                        Pemasukan
                        {c.masukNote && <span className="block text-[10px] text-slate-500">{c.masukNote}</span>}
                      </span>
                      <span className="font-semibold text-emerald-400 whitespace-nowrap">+ {rp(c.masuk)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${pct(c.masuk, Math.max(c.masuk, c.keluar))}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400">
                        Pengeluaran
                        {c.keluarNote && <span className="block text-[10px] text-slate-500">{c.keluarNote}</span>}
                      </span>
                      <span className="font-semibold text-red-400 whitespace-nowrap">- {rp(c.keluar)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all duration-500"
                        style={{ width: `${pct(c.keluar, Math.max(c.masuk, c.keluar))}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {c.masuk > 0
                      ? `${pct(c.keluar, c.masuk)}% pemasukan terpakai`
                      : c.keluar > 0
                      ? 'Belum ada pemasukan'
                      : 'Belum ada transaksi'}
                  </p>
                </div>
              </div>
            ))}
          </SortGroup>
        </div>

        {/* Pemasukan vs Pengeluaran */}
        <div data-lo="mk">
          <SortGroup attr="data-lo-p" storageKey="lo-laporan-v2-mk" layout="flow">
            <div data-lo-p="pemasukan" data-lo-w="6" className={panel}>
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Pemasukan per Pos
              </h3>
              <div className="space-y-3">
                {perPos.map((p) => (
                  <div key={p.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{p.pos}</span>
                      <span className="font-bold text-emerald-400">{rp(p.masuk)}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct(p.masuk, totalMasuk)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Total Pemasukan</span>
                <span className="text-lg font-black text-emerald-400">{rp(totalMasuk)}</span>
              </div>
            </div>

            <div data-lo-p="pengeluaran" data-lo-w="6" className={panel}>
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-400" /> Pengeluaran per Pos
              </h3>
              <div className="space-y-3">
                {perPos.map((p) => (
                  <div key={p.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{p.pos}</span>
                      <span className="font-bold text-red-400">{rp(p.keluar)}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-red-500" style={{ width: `${pct(p.keluar, totalKeluar)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Total Pengeluaran</span>
                <span className="text-lg font-black text-red-400">{rp(totalKeluar)}</span>
              </div>
            </div>
          </SortGroup>
        </div>

        {/* Rincian Simpin */}
        <div data-lo="simpin">
          <h3 className={sectionTitle}>
            <PiggyBank className="w-4 h-4 text-amber-300" />
            <span>Rincian Simpan Pinjam</span>
          </h3>
          <SortGroup attr="data-lo-p" storageKey="lo-laporan-v2-simpin" layout="flow">
            <div data-lo-p="sp-masuk" data-lo-w="6" className={panel}>
              <h4 className="text-base font-bold text-white mb-4">Pemasukan Simpin</h4>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-300">Simpanan</span><span className="font-semibold text-emerald-400">{rp(simpanan)}</span></div>
                <div className="flex justify-between"><span className="text-slate-300">Cicilan Diterima</span><span className="font-semibold text-emerald-400">{rp(cicilan)}</span></div>
                <div className="flex justify-between"><span className="text-slate-300">Bunga Pinjaman</span><span className="font-semibold text-emerald-400">{rp(bunga)}</span></div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Total Pemasukan Simpin</span>
                <span className="text-lg font-black text-amber-300">{rp(simpinMasuk)}</span>
              </div>
            </div>

            <div data-lo-p="sp-pinjam" data-lo-w="6" className={panel}>
              <h4 className="text-base font-bold text-white mb-4">Peminjaman</h4>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-300">Pinjaman Disalurkan</span><span className="font-semibold text-red-400">{rp(pinjam)}</span></div>
                <div className="flex justify-between"><span className="text-slate-300">Sudah Dicicil</span><span className="font-semibold text-emerald-400">{rp(cicilan)}</span></div>
                <div className="flex justify-between"><span className="text-slate-300">Peminjam Aktif</span><span className="font-semibold text-white">{peminjamAktif} orang</span></div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Sisa Pinjaman Beredar</span>
                <span className="text-lg font-black text-amber-300">{rp(sisaPinjaman)}</span>
              </div>
            </div>
          </SortGroup>
        </div>

        {/* Anggota Simpin */}
        {!viewOnly && (
<div data-lo="anggota" className={panel}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-300" /> Anggota Simpin
              </h3>
              <p className="text-xs text-slate-400">
                {jumlahAnggota} anggota terdaftar. Simpanan, pinjaman, dan sisa pinjaman per orang.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">No</th>
                  <th className="px-3 py-2.5">Nama</th>
                  <th className="px-3 py-2.5">Alamat</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Simpanan</th>
                  <th className="px-3 py-2.5 text-right">Pinjaman</th>
                  <th className="px-3 py-2.5 text-right">Cicilan</th>
                  <th className="px-3 py-2.5 text-right">Sisa Pinjaman</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {memberRows.map((r, i) => (
                  <tr key={r.key} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-2.5 text-xs text-slate-500">{i + 1}</td>
                    <td className="px-3 py-2.5 font-semibold text-white whitespace-nowrap">{r.nama}</td>
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap">{r.alamat}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                          r.anggota
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border-slate-700 bg-slate-800 text-slate-400'
                        }`}
                      >
                        {r.anggota ? 'Anggota' : 'Non-anggota'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-emerald-300">{rp(r.simpanan)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-amber-300">{rp(r.pinjam)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-sky-300">{rp(r.cicilan)}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold">{rp(r.sisa)}</td>
                  </tr>
                ))}
                {!memberRows.length && (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-sm text-slate-500">
                      Belum ada anggota atau transaksi Simpan Pinjam.
                    </td>
                  </tr>
                )}
              </tbody>
              {memberRows.length > 0 && (
                <tfoot>
                  <tr className="border-t border-slate-700 bg-slate-950/60 font-bold">
                    <td className="px-3 py-2.5" colSpan={4}>TOTAL</td>
                    <td className="px-3 py-2.5 text-right font-mono text-emerald-300">{rp(sumBy(memberRows, (r) => r.simpanan))}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-amber-300">{rp(sumBy(memberRows, (r) => r.pinjam))}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-sky-300">{rp(sumBy(memberRows, (r) => r.cicilan))}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{rp(sumBy(memberRows, (r) => r.sisa))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
)}
      </SortGroup>
    </div>
  );
}
