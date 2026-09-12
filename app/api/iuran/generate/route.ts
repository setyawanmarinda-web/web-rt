import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { IuranKewajibanModel, WargaModel } from '@/lib/mongoose';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const tahun = Number(body.tahun || new Date().getFullYear());
    const rt = body.rt || 'ALL';
    const nominal = Number(body.nominal || 55000);

    if (!Number.isInteger(tahun) || nominal <= 0) {
      return NextResponse.json(
        { error: 'Tahun atau nominal tidak valid' },
        { status: 400 }
      );
    }

    const wargaQuery = rt === 'ALL' ? {} : { rt };
    const warga = await WargaModel.find(wargaQuery).lean();

    let created = 0;
    let skipped = 0;

    for (const w of warga) {
      for (let bulan = 1; bulan <= 12; bulan++) {
        const existing = await IuranKewajibanModel.findOne({
          warga_id: String(w._id),
          tahun,
          bulan,
        });

        if (existing) {
          skipped++;
          continue;
        }

        await IuranKewajibanModel.create({
          warga_id: String(w._id),
          rt: w.rt,
          tahun,
          bulan,
          nominal_normal: nominal,
          nominal_wajib: nominal,
          nominal_terbayar: 0,
          status: 'Belum Bayar',
          keringanan: false,
        });

        created++;
      }
    }

    return NextResponse.json({
      success: true,
      tahun,
      rt,
      warga: warga.length,
      created,
      skipped,
    });
  } catch (error) {
    console.error('POST /api/iuran/generate error:', error);

    return NextResponse.json(
      { error: 'Gagal membuat kewajiban iuran' },
      { status: 500 }
    );
  }
}
