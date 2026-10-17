'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { planWargaImport, pickCol, type ImportItem, type ImportRecord } from '@/lib/wargaImport';
import { useSimStore } from '@/lib/store';
import DatePickerField from '@/components/DatePickerField';
import BirthdayNotifications from '@/components/BirthdayNotifications';
import { RT_LIST, Warga } from '@/lib/types';
import { getAge, getWargaAgeCategory } from '@/lib/wargaUtils';
import { formatRupiahInput, parseRupiahInput } from '@/lib/currency';
import { Users, BarChart2, UserPlus, CheckCircle2, Calendar, MapPin, Trash2, Pencil, X, Download, Upload, FileSpreadsheet } from 'lucide-react';

type PreviewRow = {
  nomor: string;
  alamat: string;
  nama_lengkap: string;
  nik: string;
  tanggal_lahir: string;
  usia: string;
  kategori_usia: string;
  rt_rw: string;
  status: string;
  nominal_iuran: number;
};

const HOUSEHOLD_HEADERS = ['Nomor', 'Alamat', 'Nama Lengkap', 'NIK', 'Tanggal Lahir', 'Usia', 'Kategori Usia', 'RT/RW', 'Status', 'Tarif Iuran Wajib'];
const EXCEL_DATE_FORMAT = '[$-id-ID]dd mmmm yyyy';
type WargaFinance = { saldoSimpanan: number; saldoPinjaman: number; iuran: number; iuran17an: number };

function toExcelDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day) : value;
}

function formatExcelColumns(worksheet: XLSX.WorkSheet, dateColumn: number, nikColumn: number) {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  for (let row = range.s.r + 1; row <= range.e.r; row += 1) {
    const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: dateColumn })];
    if (dateCell && dateCell.v instanceof Date) dateCell.z = EXCEL_DATE_FORMAT;

    const nikCell = worksheet[XLSX.utils.encode_cell({ r: row, c: nikColumn })];
    if (nikCell) {
      nikCell.t = 's';
      nikCell.z = '@';
      nikCell.v = String(nikCell.v ?? '');
    }
  }
}

function normalizeExcelDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
  }

  const text = normalizeCell(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(text)) return text.split(/[/-]/).reverse().join('-');

  const monthNames: Record<string, string> = {
    januari: '01', january: '01', februari: '02', february: '02', maret: '03', march: '03',
    april: '04', mei: '05', may: '05', juni: '06', june: '06', juli: '07', july: '07',
    agustus: '08', august: '08', september: '09', oktober: '10', october: '10',
    november: '11', desember: '12', december: '12',
  };
  const namedMonth = text.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/);
  if (namedMonth) {
    const month = monthNames[namedMonth[2].toLowerCase()];
    if (month) return `${namedMonth[3]}-${month}-${namedMonth[1].padStart(2, '0')}`;
  }

  if (/^\d+(\.\d+)?$/.test(text)) {
    const parsed = XLSX.SSF.parse_date_code(Number(text));
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
  }

  return text;
}

function normalizeHeader(value: string) {
  return value.replace(/[\s_-]+/g, ' ').trim().toLowerCase();
}

function normalizeCell(value: unknown) {
  if (value === null || value === undefined) return '';
  const text = String(value).trim();
  return text;
}

function parseRtRw(rawValue: string, fallbackRt: string) {
  const cleaned = normalizeCell(rawValue);
  if (!cleaned) return { rt: fallbackRt, rw: '012' };
  if (cleaned.includes('/')) {
    const [rtPart, rwPart] = cleaned.split('/');
    return { rt: (rtPart || fallbackRt).replace(/[^0-9]/g, '').padStart(3, '0'), rw: (rwPart || '012').replace(/[^0-9]/g, '').padStart(3, '0') };
  }
  const digits = cleaned.replace(/[^0-9]/g, '');
  return { rt: digits ? digits.padStart(3, '0') : fallbackRt, rw: '012' };
}

function getHouseNumberMap(items: Array<{ alamat: string }>) {
  const uniqueAddresses = [...new Set(items.map((item) => (item.alamat || '').trim()).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second, 'id', { numeric: true, sensitivity: 'base' }));

  return new Map(uniqueAddresses.map((address, index) => [address, index + 1]));
}

function buildExportRows(
  items: Warga[],
  getFinance?: (item: Warga) => WargaFinance,
) {
  const map = getHouseNumberMap(items);

  return [...items]
    .sort((first, second) => {
      const firstNomor = map.get(first.alamat) ?? Number.MAX_SAFE_INTEGER;
      const secondNomor = map.get(second.alamat) ?? Number.MAX_SAFE_INTEGER;
      if (firstNomor !== secondNomor) return firstNomor - secondNomor;
      return (first.nama_lengkap || '').localeCompare(second.nama_lengkap || '', 'id', { sensitivity: 'base' });
    })
    .map((item) => {
      const age = getAge(item.tanggal_lahir);
      const category = getWargaAgeCategory(item as { tanggal_lahir?: string });
      return {
        Nomor: String(map.get(item.alamat) ?? 1),
        Alamat: item.alamat,
        'Nama Lengkap': item.nama_lengkap,
        NIK: String(item.nik ?? '').padStart(16, '0'),
        'Tanggal Lahir': item.tanggal_lahir || '',
        Usia: age === null ? '' : String(age),
        'Kategori Usia': category || '',
        'RT/RW': `${item.rt}/${item.rw}`,
        Status: item.status_tinggal,
        'Tarif Iuran Wajib': Number(item.nominal_iuran ?? 0),
        ...(getFinance ? getFinance(item) : {}),
      };
    });
}

export default function StatistikPage() {
  const { wargaList, kasList, selectedRt, simpanPinjamList, iuranList, addWarga, updateData, deleteData, refreshWarga } = useSimStore();
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [alamat, setAlamat] = useState('');
  const [nomorRumah, setNomorRumah] = useState<number | string>('');
  const [rt, setRt] = useState(selectedRt === 'ALL' ? '002' : selectedRt);
  const [statusTinggal, setStatusTinggal] = useState<'Tetap' | 'Kontrak'>('Tetap');
  const [nominalIuran, setNominalIuran] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<ImportItem[]>([]);
  const [importSkipped, setImportSkipped] = useState(0);
  const [failedImportRows, setFailedImportRows] = useState<Array<{ rowNumber: number; reason: string; row: Record<string, string> }>>([]);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [familyModalAddress, setFamilyModalAddress] = useState('');
  const [familyModalNomor, setFamilyModalNomor] = useState<number | string>(1);
  const [familyForm, setFamilyForm] = useState({
    nama: '',
    nik: '',
    tanggalLahir: '',
    rt: selectedRt === 'ALL' ? '002' : selectedRt,
    status: 'Tetap' as 'Tetap' | 'Kontrak',
    nominalIuran: 0,
  });

  const filteredWarga = selectedRt === 'ALL' ? wargaList : wargaList.filter(w => w.rt === selectedRt);
  const sortedWarga = [...filteredWarga].sort((first, second) =>
    first.alamat.localeCompare(second.alamat, 'id', { numeric: true, sensitivity: 'base' })
  );
  const houseNumberMap = getHouseNumberMap(sortedWarga);
  const groupedByAlamat = Array.from(houseNumberMap.entries()).map(([alamat, nomor]) => ({
    nomor,
    alamat,
    warga: sortedWarga.filter((w) => w.alamat === alamat).sort((first, second) => (first.nama_lengkap || '').localeCompare(second.nama_lengkap || '', 'id', { sensitivity: 'base' })),
  }));

  const totalWarga = filteredWarga.length;
  const totalRumah = new Set(filteredWarga.map((w) => w.alamat)).size;
  const wargaTetap = filteredWarga.filter(w => w.status_tinggal === 'Tetap').length;
  const wargaKontrak = filteredWarga.filter(w => w.status_tinggal === 'Kontrak').length;
  const lansiaCount = filteredWarga.filter(w => getWargaAgeCategory(w) === 'Lansia').length;
  const nextNomorRumah = [...new Set(filteredWarga.map((w) => String(w.alamat || '').trim()).filter(Boolean))].length
    ? Math.max(...Array.from(new Set(filteredWarga.map((w) => String(w.alamat || '').trim()).filter(Boolean))).map((value) => (houseNumberMap.get(value) ?? 0))) + 1
    : 1;
  const usiaSummary = {
    Balita: filteredWarga.filter(w => getWargaAgeCategory(w) === 'Balita').length,
    Anak: filteredWarga.filter(w => getWargaAgeCategory(w) === 'Anak').length,
    Remaja: filteredWarga.filter(w => getWargaAgeCategory(w) === 'Remaja').length,
    Dewasa: filteredWarga.filter(w => getWargaAgeCategory(w) === 'Dewasa').length,
    Lansia: filteredWarga.filter(w => getWargaAgeCategory(w) === 'Lansia').length,
  };
  const rtSummary = Array.from(new Set(filteredWarga.map((w) => w.rt))).sort().map((rt) => ({
    rt,
    count: filteredWarga.filter((w) => w.rt === rt).length,
  }));

  const normalizePersonText = (value: string | undefined) => (value || '').trim().replace(/\s+/g, ' ').toLowerCase();

  const getWargaFinance = (warga: (typeof wargaList)[number]) => {
    const wargaNamaKey = normalizePersonText(warga.nama_lengkap);
    const wargaAlamatKey = normalizePersonText(warga.alamat);
    const transactions = simpanPinjamList.filter((item) =>
      item.warga_id === warga.id ||
      (normalizePersonText(item.nama) === wargaNamaKey && normalizePersonText(item.alamat) === wargaAlamatKey)
    );
    const saldoSimpanan = transactions.filter((item) => item.jenis === 'Simpan').reduce((total, item) => total + item.nominal, 0);
    const saldoPinjaman = transactions.reduce((total, item) => total + (item.jenis === 'Pinjam' ? item.nominal : item.jenis === 'Cicilan' ? -item.nominal : 0), 0);
    const wargaIuran = iuranList.filter((item) => item.warga_id === warga.id);
    const kewajibanIuran = wargaIuran.length
      ? wargaIuran.reduce((total, item) => total + item.nominal_wajib, 0)
      : (kasList.some((item) => item.nama_pembayar?.trim().toLowerCase() === warga.nama_lengkap.trim().toLowerCase() && item.diskon_keringanan)
        ? 28000
        : 55000);
    const pembayaranLangsung = kasList
      .filter((item) => item.jenis === 'Masuk')
      .filter((item) => item.metode !== 'Titipan')
      .filter((item) => normalizePersonText(item.nama_pembayar) === wargaNamaKey)
      .filter((item) => !item.alamat_pembayar || normalizePersonText(item.alamat_pembayar) === wargaAlamatKey)
      .reduce((total, item) => total + item.jumlah, 0);
    const pembayaranTitipan = kasList
      .filter((item) => item.jenis === 'Masuk' && item.metode === 'Titipan')
      .flatMap((item) => item.perantara_list || [])
      .filter((item) => normalizePersonText(item.nama) === wargaNamaKey)
      .filter((item) => !item.alamat || normalizePersonText(item.alamat) === wargaAlamatKey)
      .reduce((total, item) => total + Number(item.nominal || 0), 0);
    const pembayaranIuran = pembayaranLangsung + pembayaranTitipan;
    const pembayaranTercatat = wargaIuran.reduce((total, item) => total + item.nominal_terbayar, 0);
    const iuran = Math.max(0, kewajibanIuran - Math.max(pembayaranIuran, pembayaranTercatat));
    const iuran17an = kasList
      .filter((item) => item.jenis === 'Masuk' && item.pos === 'Dana 17an')
      .filter((item) => normalizePersonText(item.nama_pembayar) === wargaNamaKey)
      .filter((item) => !item.alamat_pembayar || normalizePersonText(item.alamat_pembayar) === wargaAlamatKey)
      .reduce((total, item) => total + item.jumlah, 0)
      + kasList
        .filter((item) => item.jenis === 'Masuk' && item.pos === 'Dana 17an' && item.metode === 'Titipan')
        .flatMap((item) => item.perantara_list || [])
        .filter((item) => normalizePersonText(item.nama) === wargaNamaKey)
        .filter((item) => !item.alamat || normalizePersonText(item.alamat) === wargaAlamatKey)
        .reduce((total, item) => total + Number(item.nominal || 0), 0);
    return { saldoSimpanan, saldoPinjaman, iuran, iuran17an };
  };

  const handleAddWarga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nik || nik.length !== 16) return alert('NIK wajib diisi 16 digit');
    if (!nama || !alamat) return alert('Nama dan Alamat Rumah Wajib diisi');

    const existingNomor = houseNumberMap.get(alamat.trim());
    const computedNomor = existingNomor ?? nextNomorRumah;
    setNomorRumah(computedNomor);

    const data = {
      nama_lengkap: nama,
      nik,
      tanggal_lahir: tanggalLahir,
      alamat,
      status_tinggal: statusTinggal,
      rt,
      rw: '012',
      nominal_iuran: nominalIuran,
    };
    if (editingId) await updateData('warga', editingId, data); else await addWarga(data);

    setToast(`Warga ${nama} (${alamat}) berhasil ditambahkan!`);
    setTimeout(() => setToast(null), 3000);
    setNama('');
    setNik('');
    setTanggalLahir('');
    setAlamat('');
    setNomorRumah('');
    setNominalIuran(0);
    setEditingId(null);
  };
  const startEdit = (item: (typeof wargaList)[number]) => {
    setEditingId(item.id);
    setNik(item.nik || '');
    setNama(item.nama_lengkap);
    setTanggalLahir(item.tanggal_lahir || '');
    setAlamat(item.alamat);
    setNomorRumah(houseNumberMap.get(item.alamat) ?? 1);
    setRt(item.rt);
    setStatusTinggal(item.status_tinggal);
    setNominalIuran(item.nominal_iuran ?? 0);
  };
  const handleDelete = async (id: string, nama: string) => {
    if (window.confirm(`Yakin ingin menghapus data warga ${nama}?`)) {
      try {
        await deleteData('warga', id);
        setToast(`Data warga ${nama} berhasil dihapus.`);
        setTimeout(() => setToast(null), 3000);
      } catch (err) {
        alert('Gagal menghapus data.');
      }
    }
  };

  const IMPORT_HEADERS = ['ID', 'Nomor', 'Alamat', 'Nama Lengkap', 'NIK', 'Tanggal Lahir', 'Usia', 'Kategori Usia', 'RT/RW', 'Status', 'Tarif Iuran Wajib', 'No KK', 'Hubungan', 'Ikut Iuran KK', 'Anggota Simpin'];

  const handleDownloadTemplate = () => {
    const today = new Date();
    const rows = [
      ['', '1', 'AM19 No. 5', 'Budi', '', new Date(1980, 4, 10), '', '', '002/012', 'Tetap', '', '', 'Kepala Keluarga', '', ''],
      ['', '1', 'AM19 No. 5', 'Siti', '', new Date(1985, 7, 15), '', '', '002/012', 'Tetap', '', '', 'Istri', '', ''],
      ['', '1', 'AM19 No. 5', 'Andi', '', new Date(2010, 0, 20), '', '', '002/012', 'Tetap', '', '', 'Anak', '', ''],
      ['', '1', 'AM19 No. 5', 'Joko', '', new Date(1988, 2, 3), '', '', '002/012', 'Tetap', '', 'KK-2', 'Kepala Keluarga', 'Ya', ''],
      ['', '1', 'AM19 No. 5', 'Rina', '', new Date(1990, 5, 9), '', '', '002/012', 'Tetap', '', 'KK-2', 'Istri', '', ''],
      ['', '2', 'AM20 No. 8', 'Rudi', '', today, '', '', '002/012', 'Tetap', '', '', 'Kepala Keluarga', '', 'Ya'],
    ];

    const ws = XLSX.utils.aoa_to_sheet([IMPORT_HEADERS, ...rows]);
    formatExcelColumns(ws, 5, 4);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Warga');
    const instructions = XLSX.utils.aoa_to_sheet([
      ['PETUNJUK PENGISIAN'],
      ['Satu baris', 'Satu baris = satu orang. Alamat yang sama boleh dipakai banyak orang.'],
      ['ID', 'Kosongkan untuk orang baru. Untuk edit data orang lama, pakai file hasil Export dan JANGAN hapus isi kolom ID (dengan ID, NIK pun bisa diubah).'],
      ['Tambah anggota / KK baru', 'Tambah baris baru (boleh di paling bawah), kolom ID kosong, Nomor dan Alamat sama persis dengan rumahnya.'],
      ['No KK', 'Kosong = KK pertama di alamat itu. KK kedua dst WAJIB diisi (nomor KK atau label, contoh KK-2) dan sama untuk semua anggota KK itu. Isi tanda - untuk mengosongkan.'],
      ['Hubungan', 'Kepala Keluarga / Istri / Anak / Lainnya. Tarif otomatis dipasang di Kepala Keluarga.'],
      ['Ikut Iuran KK', 'Ya jika KK kedua ikut iuran Dana Sosial + Kas RT (27.000). Cukup diisi di baris Kepala Keluarga KK itu.'],
      ['Anggota Simpin', 'Ya jika ikut keanggotaan Simpan Pinjam. Pencatatan setoran tetap lewat menu Kas & Iuran.'],
      ['Tarif Iuran Wajib', 'Boleh dikosongkan untuk orang baru: sistem isi 55.000 per alamat (KK pertama) atau 27.000 untuk KK tambahan yang Ikut Iuran. Kalau diisi, angkanya dipakai apa adanya.'],
      ['NIK', 'Format teks, wajib tepat 16 digit angka. Jangan gunakan tanda +, spasi, titik, atau huruf.'],
      ['Tanggal Lahir', 'Gunakan format dd mmmm yyyy. Untuk tanggal hari ini, pilih sel lalu tekan Ctrl+;'],
      ['Status', 'Isi Tetap atau Kontrak.'],
      ['Catatan', 'Import tidak pernah menghapus data. Baris yang dibuang dari file tidak menghapus warga di database.'],
    ]);
    instructions['!cols'] = [{ wch: 24 }, { wch: 110 }];
    XLSX.utils.book_append_sheet(wb, instructions, 'Petunjuk');
    XLSX.writeFile(wb, 'template_warga_rw012.xlsx');
  };

  const handleExportExcel = () => {
    const rows = buildExportRows(filteredWarga, getWargaFinance);
    const byNik = new Map<string, (typeof filteredWarga)[number]>();
    const byNameAlamat = new Map<string, (typeof filteredWarga)[number]>();
    filteredWarga.forEach((w) => {
      const nikDigits = String(w.nik ?? '').replace(/\D/g, '');
      if (nikDigits) byNik.set(nikDigits, w);
      byNameAlamat.set(`${String(w.nama_lengkap ?? '').trim().toLowerCase()}|${String(w.alamat ?? '').trim().toLowerCase()}`, w);
    });

    const worksheetData = [
      [...IMPORT_HEADERS, 'Saldo Simpanan', 'Saldo Pinjaman', 'Iuran Masuk', 'Iuran 17an'],
      ...rows.map((row) => {
        const nikDigits = String(row.NIK ?? '').replace(/\D/g, '');
        const w = (nikDigits ? byNik.get(nikDigits) : undefined)
          ?? byNameAlamat.get(`${String(row['Nama Lengkap'] ?? '').trim().toLowerCase()}|${String(row.Alamat ?? '').trim().toLowerCase()}`);
        return [
          w?.id ?? '',
          row.Nomor,
          row.Alamat,
          row['Nama Lengkap'],
          String(row.NIK ?? ''),
          row['Tanggal Lahir'] ? toExcelDate(String(row['Tanggal Lahir'])) : '',
          row.Usia,
          row['Kategori Usia'],
          row['RT/RW'],
          row.Status,
          row['Tarif Iuran Wajib'],
          w?.no_kk ?? '',
          w?.hubungan ?? '',
          w?.ikut_iuran_kk ? 'Ya' : '',
          w?.anggota_simpin ? 'Ya' : '',
          row.saldoSimpanan,
          row.saldoPinjaman,
          row.iuran,
          row.iuran17an,
        ];
      }),
    ];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    formatExcelColumns(ws, 5, 4);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Warga');
    XLSX.writeFile(wb, `daftar_warga_rt${selectedRt === 'ALL' ? 'semua' : selectedRt}.xlsx`);
  };

  const handleImportPreview = async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
    const normalizedRows = jsonRows.map((row, rowIndex) => {
      const rawRecord: Record<string, string> = {};
      const rawValues: Record<string, unknown> = {};
      Object.entries(row).forEach(([key, value]) => {
        const normalizedKey = normalizeHeader(String(key));
        rawRecord[normalizedKey] = normalizeCell(value);
        rawValues[normalizedKey] = value;
      });
      return { rowIndex, row: rawRecord, rawValues };
    });

    const requiredColumns = ['nomor', 'alamat', 'nama lengkap', 'nik', 'tanggal lahir', 'usia', 'kategori usia', 'rt/rw', 'status'];
    const hasColumns = requiredColumns.every((header) => normalizedRows.some(({ row }) => Object.keys(row).includes(header)));
    if (!hasColumns) {
      setFailedImportRows([{ rowNumber: 1, reason: 'Format Excel tidak sesuai. Pastikan kolom: Nomor, Alamat, Nama Lengkap, NIK, Tanggal Lahir, Usia, Kategori Usia, RT/RW, Status.', row: {} }]);
      setPreviewRows([]);
      setImportSkipped(0);
      return;
    }

    const records: ImportRecord[] = normalizedRows.map(({ row, rowIndex, rawValues }) => ({
      rowNumber: rowIndex + 2,
      raw: row,
      id: pickCol(row, ['id']),
      nomor: normalizeCell(row['nomor']),
      alamat: normalizeCell(row['alamat']),
      nama: normalizeCell(row['nama lengkap']),
      nik: normalizeCell(row['nik']),
      tanggalLahir: normalizeExcelDate(rawValues['tanggal lahir'] ?? row['tanggal lahir']),
      usiaRaw: normalizeCell(row['usia']),
      kategoriRaw: normalizeCell(row['kategori usia']),
      rtRwRaw: normalizeCell(row['rt/rw']),
      statusRaw: normalizeCell(row['status']),
      tarifRaw: normalizeCell(row['tarif iuran wajib'] ?? row['nominal iuran']),
      noKk: pickCol(row, ['no kk', 'nokk']),
      hubungan: pickCol(row, ['hubungan']),
      ikutKkRaw: pickCol(row, ['ikut iuran kk']),
      simpinRaw: pickCol(row, ['anggota simpin']),
    }));

    const plan = planWargaImport(records, wargaList, {
      getAge: (d) => getAge(d),
      getCategory: (d) => String(getWargaAgeCategory({ tanggal_lahir: d }) ?? ''),
      parseRtRw: (raw, fallbackRt) => parseRtRw(raw, fallbackRt),
      parseRupiah: (raw) => parseRupiahInput(raw),
      normalizeName: (s) => normalizePersonText(s),
      defaultRt: selectedRt === 'ALL' ? '002' : selectedRt,
    });

    setPreviewRows(plan.items);
    setFailedImportRows(plan.failed);
    setImportSkipped(plan.skipped);

    if (!plan.items.length && !plan.failed.length) {
      setToast(plan.skipped ? `Tidak ada perubahan: ${plan.skipped} baris sama dengan data di database.` : 'File tidak berisi baris data.');
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleImportPreview(file);
    event.target.value = '';
  };

  const handleImportConfirmed = async () => {
    if (!previewRows.length) return;

    let berhasil = 0;
    const gagalItems: ImportItem[] = [];
    const gagalRows: Array<{ rowNumber: number; reason: string; row: Record<string, string> }> = [];

    for (const item of previewRows) {
      try {
        if (item.kind === 'tambah') {
          await addWarga({
            nama_lengkap: item.nama,
            nik: item.nik,
            tanggal_lahir: item.tanggal_lahir,
            alamat: item.alamat,
            status_tinggal: item.status,
            rt: item.rt,
            rw: item.rw,
            nominal_iuran: item.nominal_iuran,
            no_kk: item.no_kk,
            hubungan: item.hubungan,
            ikut_iuran_kk: item.ikut_iuran_kk,
            anggota_simpin: item.anggota_simpin,
          });
        } else if (item.id && item.changes) {
          await updateData('warga', item.id, item.changes);
        }
        berhasil += 1;
      } catch (error) {
        console.error('[IMPORT WARGA]', error);
        gagalItems.push(item);
        gagalRows.push({
          rowNumber: item.rowNumber,
          reason: error instanceof Error ? error.message : 'Gagal menyimpan ke database.',
          row: {},
        });
      }
    }

    setPreviewRows(gagalItems);
    setFailedImportRows(gagalRows);
    setToast(
      gagalItems.length
        ? `${berhasil} berhasil, ${gagalItems.length} gagal. Cek daftar di preview.`
        : `Import selesai: ${berhasil} data warga diproses.`,
    );
    setTimeout(() => setToast(null), 3500);
  };

  const openFamilyModal = (address: string, nomor: number) => {
    setFamilyModalAddress(address);
    setFamilyModalNomor(nomor);
    setFamilyForm({
      nama: '',
      nik: '',
      tanggalLahir: '',
      rt: selectedRt === 'ALL' ? '002' : selectedRt,
      status: 'Tetap',
      nominalIuran: 0,
    });
    setShowFamilyModal(true);
  };

  const openEditModal = (item: (typeof wargaList)[number]) => {
    setEditingId(item.id);
    setNik(item.nik || '');
    setNama(item.nama_lengkap);
    setTanggalLahir(item.tanggal_lahir || '');
    setAlamat(item.alamat);
    setNomorRumah(houseNumberMap.get(item.alamat) ?? 1);
    setRt(item.rt);
    setStatusTinggal(item.status_tinggal);
    setNominalIuran(item.nominal_iuran ?? 0);
    setShowEditModal(true);
  };

  const handleEditWarga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!nik || nik.length !== 16) {
      alert('NIK wajib diisi 16 digit');
      return;
    }
    if (!nama || !alamat) {
      alert('Nama dan Alamat Rumah wajib diisi');
      return;
    }

    try {
      await updateData('warga', editingId, {
        nama_lengkap: nama,
        nik,
        tanggal_lahir: tanggalLahir,
        alamat,
        status_tinggal: statusTinggal,
        rt,
        rw: '012',
        nominal_iuran: nominalIuran,
      });
      await refreshWarga(selectedRt);

      setToast(`Data warga ${nama} berhasil diperbarui.`);
      setTimeout(() => setToast(null), 3000);
      setShowEditModal(false);
      setEditingId(null);
      setNama('');
      setNik('');
      setTanggalLahir('');
      setAlamat('');
      setNomorRumah('');
      setNominalIuran(0);
    } catch (error) {
      console.error('[EDIT WARGA]', error);
      alert('Gagal memperbarui data warga.');
    }
  };

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyForm.nik || familyForm.nik.length !== 16) {
      alert('NIK wajib diisi 16 digit');
      return;
    }
    if (!familyForm.nama || !familyModalAddress) {
      alert('Nama dan alamat wajib diisi');
      return;
    }

    try {
      await addWarga({
        nama_lengkap: familyForm.nama,
        nik: familyForm.nik,
        tanggal_lahir: familyForm.tanggalLahir,
        alamat: familyModalAddress,
        status_tinggal: familyForm.status,
        rt: familyForm.rt,
        rw: '012',
        nominal_iuran: familyForm.nominalIuran,
      });

      setToast(`Anggota keluarga ${familyForm.nama} berhasil ditambahkan ke alamat ${familyModalAddress}.`);
      setTimeout(() => setToast(null), 3000);
      setShowFamilyModal(false);
      setFamilyForm({
        nama: '',
        nik: '',
        tanggalLahir: '',
        rt: selectedRt === 'ALL' ? '002' : selectedRt,
        status: 'Tetap',
        nominalIuran: 0,
      });
      setFamilyModalAddress('');
      setFamilyModalNomor(1);
    } catch (error) {
      console.error('[ADD FAMILY MEMBER]', error);
      alert('Gagal menambahkan anggota keluarga.');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Data Warga</h3>
                <p className="text-xs text-slate-400">Perbarui data keluarga yang dipilih</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingId(null);
                  setNama('');
                  setNik('');
                  setTanggalLahir('');
                  setAlamat('');
                  setNomorRumah('');
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Tutup popup edit"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditWarga} className="space-y-4 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">NIK *</label>
                  <input
                    type="text"
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="16 digit NIK"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">Nama Lengkap *</label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Nama lengkap"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <DatePickerField
                    label="Tanggal Lahir"
                    value={tanggalLahir}
                    onChange={setTanggalLahir}
                    colorTheme="emerald"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">Status Tempat Tinggal</label>
                  <select
                    value={statusTinggal}
                    onChange={(e) => setStatusTinggal(e.target.value as 'Tetap' | 'Kontrak')}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Tetap">Tetap</option>
                    <option value="Kontrak">Kontrak</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">Tarif Iuran Wajib</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatRupiahInput(nominalIuran)}
                    onChange={(e) => setNominalIuran(parseRupiahInput(e.target.value))}
                    placeholder="Contoh: 55.000"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-300">Alamat Rumah Lengkap *</label>
                  <input
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">RT</label>
                  <select
                    value={rt}
                    onChange={(e) => setRt(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {RT_LIST.map((r) => (
                      <option key={r} value={r}>RT {r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingId(null);
                    setNama('');
                    setNik('');
                    setTanggalLahir('');
                    setAlamat('');
                    setNomorRumah('');
                  }}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFamilyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-white">Tambah Anggota Keluarga</h3>
                <p className="text-xs text-slate-400">Alamat: {familyModalAddress}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFamilyModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFamilyMember} className="space-y-4 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-300">Nomor Rumah</label>
                  <div className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-bold text-emerald-300">
                    {familyModalNomor} • {familyModalAddress}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">NIK *</label>
                  <input
                    type="text"
                    value={familyForm.nik}
                    onChange={(e) => setFamilyForm({ ...familyForm, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                    placeholder="16 digit NIK"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">Nama Lengkap *</label>
                  <input
                    type="text"
                    value={familyForm.nama}
                    onChange={(e) => setFamilyForm({ ...familyForm, nama: e.target.value })}
                    placeholder="Nama anggota keluarga"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <DatePickerField
                    label="Tanggal Lahir"
                    value={familyForm.tanggalLahir}
                    onChange={(value) => setFamilyForm({ ...familyForm, tanggalLahir: value })}
                    colorTheme="emerald"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">Status Tempat Tinggal</label>
                  <select
                    value={familyForm.status}
                    onChange={(e) => setFamilyForm({ ...familyForm, status: e.target.value as 'Tetap' | 'Kontrak' })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Tetap">Tetap</option>
                    <option value="Kontrak">Kontrak</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">Tarif Iuran Wajib</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatRupiahInput(familyForm.nominalIuran)}
                    onChange={(e) => setFamilyForm({ ...familyForm, nominalIuran: parseRupiahInput(e.target.value) })}
                    placeholder="Contoh: 55.000"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">RT</label>
                  <select
                    value={familyForm.rt}
                    onChange={(e) => setFamilyForm({ ...familyForm, rt: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {RT_LIST.map((r) => (
                      <option key={r} value={r}>RT {r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFamilyModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400"
                >
                  Simpan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewRows.length > 0 || failedImportRows.length > 0 ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-white">Preview Import Data Warga</h3>
                <p className="text-xs text-slate-400">Periksa data valid sebelum menambahkan banyak warga sekaligus.</p>
              </div>
              <button
                type="button"
                onClick={() => { setPreviewRows([]); setFailedImportRows([]); }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Tutup preview import"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5">
              <div className="flex flex-wrap gap-3 text-xs font-semibold">
                <span className="rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-300">Ditambah: {previewRows.filter((r) => r.kind === 'tambah').length}</span>
                <span className="rounded-lg bg-sky-500/10 px-3 py-2 text-sky-300">Diperbarui: {previewRows.filter((r) => r.kind === 'perbarui').length}</span>
                <span className="rounded-lg bg-slate-700/40 px-3 py-2 text-slate-300">Tidak berubah: {importSkipped}</span>
                <span className="rounded-lg bg-rose-500/10 px-3 py-2 text-rose-300">Gagal validasi: {failedImportRows.length}</span>
              </div>

              {previewRows.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400">
                      <tr>
                        <th className="px-3 py-2">Aksi</th>
                        <th className="px-3 py-2">Nama</th>
                        <th className="px-3 py-2">NIK</th>
                        <th className="px-3 py-2">Alamat</th>
                        <th className="px-3 py-2">KK / Hubungan</th>
                        <th className="px-3 py-2">Tarif</th>
                        <th className="px-3 py-2">Perubahan / Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {previewRows.map((row) => (
                        <tr key={`${row.rowNumber}-${row.nik}`} className="align-top">
                          <td className="px-3 py-2">
                            <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${row.kind === 'tambah' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-sky-500/30 bg-sky-500/10 text-sky-300'}`}>
                              {row.kind === 'tambah' ? 'Tambah' : 'Perbarui'}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-semibold text-white">{row.nama}</td>
                          <td className="px-3 py-2 font-mono">{row.nik}</td>
                          <td className="px-3 py-2">{row.alamat}</td>
                          <td className="px-3 py-2">{row.no_kk || 'KK utama'}{row.hubungan ? ` · ${row.hubungan}` : ''}</td>
                          <td className="px-3 py-2 whitespace-nowrap">Rp {row.nominal_iuran.toLocaleString('id-ID')}{row.tarifAuto ? ' (otomatis)' : ''}</td>
                          <td className="space-y-1 px-3 py-2">
                            {row.changeLabels.map((label) => (
                              <div key={label}>{label}</div>
                            ))}
                            {row.kind === 'tambah' && (row.ikut_iuran_kk || row.anggota_simpin) && (
                              <div className="text-slate-400">
                                {row.ikut_iuran_kk ? 'Ikut iuran KK' : ''}{row.ikut_iuran_kk && row.anggota_simpin ? ' · ' : ''}{row.anggota_simpin ? 'Anggota Simpin' : ''}
                              </div>
                            )}
                            {row.warnings.map((warning) => (
                              <div key={warning} className="text-amber-300">⚠ {warning}</div>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {failedImportRows.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-rose-300">Baris yang perlu diperbaiki</h4>
                  <div className="space-y-2">
                    {failedImportRows.map((item) => (
                      <div key={item.rowNumber} className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs">
                        <span className="font-bold text-rose-300">Baris {item.rowNumber}:</span>{' '}
                        <span className="text-slate-300">{item.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-800 px-5 py-4">
              <button
                type="button"
                onClick={() => { setPreviewRows([]); setFailedImportRows([]); }}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImportConfirmed}
                disabled={!previewRows.length}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Konfirmasi Import ({previewRows.length})
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Statistik & Demografi Kependudukan</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Pendataan warga dengan NIK, tanggal lahir, alamat rumah & RT 001 - 010</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-xl text-xs sm:text-sm border border-emerald-500/30">
            Total {totalWarga} Kepala Keluarga / Jiwa
          </span>
        </div>
      </div>

      {/* Metric Visual Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block uppercase mb-1">Total Terdata</span>
          <div className="text-3xl font-extrabold text-white mb-2">{totalWarga} <span className="text-sm font-normal text-slate-500">Warga</span></div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-full" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block uppercase mb-1">Warga Tetap</span>
          <div className="text-3xl font-extrabold text-teal-400 mb-2">{wargaTetap} <span className="text-sm font-normal text-slate-500">KK</span></div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-teal-400 h-full" style={{ width: `${totalWarga ? (wargaTetap/totalWarga)*100 : 0}%` }} />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{totalWarga ? Math.round((wargaTetap/totalWarga)*100) : 0}% dari populasi</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block uppercase mb-1">Warga Kontrak / Sewa</span>
          <div className="text-3xl font-extrabold text-purple-400 mb-2">{wargaKontrak} <span className="text-sm font-normal text-slate-500">KK</span></div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-purple-400 h-full" style={{ width: `${totalWarga ? (wargaKontrak/totalWarga)*100 : 0}%` }} />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{totalWarga ? Math.round((wargaKontrak/totalWarga)*100) : 0}% dari populasi</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block uppercase mb-1">Kategori Lansia</span>
          <div className="text-3xl font-extrabold text-amber-400 mb-2">{lansiaCount} <span className="text-sm font-normal text-slate-500">Lansia</span></div>
          <p className="text-[11px] text-slate-400">Penerima Potongan Pos Iuran</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Balita</div>
          <div className="text-2xl font-black text-white mt-1">{usiaSummary.Balita}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Anak</div>
          <div className="text-2xl font-black text-white mt-1">{usiaSummary.Anak}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Remaja</div>
          <div className="text-2xl font-black text-white mt-1">{usiaSummary.Remaja}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Dewasa</div>
          <div className="text-2xl font-black text-white mt-1">{usiaSummary.Dewasa}</div>
        </div>
      </div>

      <BirthdayNotifications wargaList={filteredWarga} />

      {/* Grid Content: Registration & Table */}
      <div className="space-y-6 lg:space-y-8">
        {/* Input Form Warga */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">{editingId ? 'Edit Data Warga' : 'Input Warga Baru'}</h2>{editingId && <button type="button" onClick={() => { setEditingId(null); setNama(''); setTanggalLahir(''); setAlamat(''); }} className="ml-auto text-slate-400 hover:text-white" title="Batal Edit"><X className="w-4 h-4" /></button>}
          </div>

          <form onSubmit={handleAddWarga} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 items-end">
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">NIK *</label>
              <input
                type="text"
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                placeholder="16 digit NIK"
                inputMode="numeric"
                pattern="[0-9]{16}"
                minLength={16}
                maxLength={16}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama Sesuai KTP"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="lg:col-span-1">
              <DatePickerField
                label="Tanggal Lahir"
                value={tanggalLahir}
                onChange={setTanggalLahir}
                colorTheme="emerald"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Rumah Lengkap *</label>
              <input
                type="text"
                value={alamat}
                onChange={(e) => {
                  const nextAddress = e.target.value;
                  setAlamat(nextAddress);
                  const existingNomor = houseNumberMap.get(nextAddress.trim());
                  setNomorRumah(existingNomor ?? (nextAddress.trim() ? nextNomorRumah : ''));
                }}
                placeholder="Contoh: Blok A1 No. 4"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih RT (Urut 001 - 010)</label>
              <select
                value={rt}
                onChange={(e) => setRt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
              >
                {RT_LIST.map((r) => (
                  <option key={r} value={r}>
                    RT {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status Tempat Tinggal</label>
              <select
                value={statusTinggal}
                onChange={(e) => setStatusTinggal(e.target.value as 'Tetap' | 'Kontrak')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Tetap">Warga Tetap</option>
                <option value="Kontrak">Warga Kontrak / Sewa</option>
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tarif Iuran Wajib</label>
              <input
                type="text"
                inputMode="numeric"
                value={formatRupiahInput(nominalIuran)}
                onChange={(e) => setNominalIuran(parseRupiahInput(e.target.value))}
                placeholder="Contoh: 55.000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all lg:col-span-1"
            >
              {editingId ? 'Simpan Perubahan' : '+ Simpan Data Warga'}
            </button>
          </form>
        </div>

        {/* Table Warga */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="mb-4 flex flex-col gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white">Daftar Warga Terdaftar (RT {selectedRt})</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="import-warga-excel"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500 hover:text-slate-950"
                title="Export daftar warga ke Excel"
              >
                <Download className="h-4 w-4" />
                Export Excel
              </button>
              <label
                htmlFor="import-warga-excel"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-300 transition-colors hover:bg-sky-500 hover:text-slate-950"
                title="Import banyak data warga dari Excel"
              >
                <Upload className="h-4 w-4" />
                Import Excel
              </label>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                title="Download template Excel warga"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Template
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Alamat</th>
                        <th className="px-4 py-3">Nama Lengkap</th>
                        <th className="px-4 py-3">Usia</th>
                        <th className="px-4 py-3">Kategori usia</th>
                        <th className="px-4 py-3">NIK</th>
                        <th className="px-4 py-3">Tanggal Lahir</th>
                        <th className="px-4 py-3">RT</th>
                        <th className="px-4 py-3">STATUS RUMAH</th>
                        <th className="px-4 py-3">Saldo Simpanan</th>
                        <th className="px-4 py-3">Saldo Pinjaman</th>
                        <th className="px-4 py-3">Tarif Iuran Wajib</th>
                        <th className="px-4 py-3">IURAN</th>
                        <th className="px-4 py-3">Iuran 17an</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {groupedByAlamat.map((group) => group.warga.map((w, wargaIndex) => (
                        <tr key={w.id} className="hover:bg-slate-850">
                          {wargaIndex === 0 ? (
                            <td rowSpan={group.warga.length} className="px-4 py-3 align-top text-xs font-semibold text-emerald-300 whitespace-nowrap border-r border-slate-800/70">
                              <div>{group.nomor} • {group.alamat || '-'}</div>
                              <button
                                type="button"
                                onClick={() => openFamilyModal(group.alamat, group.nomor)}
                                className="mt-2 inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition-colors"
                                title="Tambah anggota keluarga"
                              >
                                <span className="text-base leading-none">+</span>
                                Tambah Anggota
                              </button>
                            </td>
                          ) : null}
                          <td className="px-4 py-3 font-bold text-white whitespace-nowrap">{w.nama_lengkap}</td>
                          <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">{getAge(w.tanggal_lahir) ?? '-'}{getAge(w.tanggal_lahir) !== null ? ' tahun' : ''}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {getWargaAgeCategory(w) ? (
                              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">{getWargaAgeCategory(w)}</span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-slate-400 whitespace-nowrap">{w.nik || '-'}</td>
                          <td className="px-4 py-3 text-xs font-mono text-slate-400 whitespace-nowrap">{w.tanggal_lahir || '-'}</td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap font-bold text-emerald-400">RT {w.rt}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                              w.status_tinggal === 'Tetap'
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}>
                              {w.status_tinggal}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-emerald-300">Rp {getWargaFinance(w).saldoSimpanan.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-amber-300">Rp {getWargaFinance(w).saldoPinjaman.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-sky-300">Rp {Number(w.nominal_iuran ?? 0).toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-rose-300">Rp {getWargaFinance(w).iuran.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-sky-300">Rp {getWargaFinance(w).iuran17an.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button onClick={() => openEditModal(w)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-300 shadow-sm transition hover:bg-sky-500 hover:text-white" title="Edit Warga"><Pencil className="w-4 h-4" /></button>
                            <button
                              onClick={() => handleDelete(w.id, w.nama_lengkap)}
                              className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 shadow-sm transition hover:bg-rose-500 hover:text-white"
                              title="Hapus Warga"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
