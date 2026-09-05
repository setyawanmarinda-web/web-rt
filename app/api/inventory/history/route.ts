// app/api/inventory/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import {
  InventoryHistoryModel,
  InventoryModel,
} from '@/lib/mongoose';

// GET /api/inventory/history?rt=002
// GET /api/inventory/history?barang_id=xyz
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const rt = req.nextUrl.searchParams.get('rt');
    const barangId = req.nextUrl.searchParams.get('barang_id');

    const query: Record<string, string> = {};

    if (barangId) {
      query.barang_id = barangId;
    }

    let docs;

    if (rt && rt !== 'ALL') {
      const inventoryItems = await InventoryModel
        .find({ rt })
        .select('_id')
        .lean();

      const barangIds = inventoryItems.map((item) => item._id.toString());

      if (barangId) {
        if (!barangIds.includes(barangId)) {
          return NextResponse.json([]);
        }
      } else {
        query.barang_id = { $in: barangIds } as unknown as string;
      }
    }

    docs = await InventoryHistoryModel
      .find(query)
      .sort({ tanggal: -1 })
      .lean();

    const data = docs.map((d) => {
      const obj = { ...d } as Record<string, unknown>;

      obj.id = (obj._id as { toString(): string })?.toString();

      delete obj._id;
      delete obj.__v;

      return obj;
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error('[API/inventory/history GET]', err);

    return NextResponse.json(
      { error: 'Gagal mengambil riwayat inventory' },
      { status: 500 }
    );
  }
}

// POST /api/inventory/history
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    const {
      barang_id,
      jenis,
      jumlah,
      keterangan,
      dilakukan_oleh,
      tanggal,
    } = body;

    if (!barang_id || !jenis || !jumlah || !dilakukan_oleh) {
      return NextResponse.json(
        { error: 'Data riwayat inventory belum lengkap' },
        { status: 400 }
      );
    }

    const inventory = await InventoryModel.findById(barang_id);

    if (!inventory) {
      return NextResponse.json(
        { error: 'Barang inventory tidak ditemukan' },
        { status: 404 }
      );
    }

    const qty = Number(jumlah);

    if (!Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json(
        { error: 'Jumlah harus berupa angka bulat lebih dari 0' },
        { status: 400 }
      );
    }

    // ─── Validasi & perubahan stok ────────────────────────────────────────

    const stokTotal = Number(inventory.stok_total || 0);
    const stokTersedia = Number(inventory.stok_tersedia || 0);
    const stokDipinjam = Number(inventory.stok_dipinjam || 0);

    let newTotal = stokTotal;
    let newTersedia = stokTersedia;
    let newDipinjam = stokDipinjam;

    switch (jenis) {
      case 'Masuk':
        newTotal += qty;
        newTersedia += qty;
        break;

      case 'Keluar':
      case 'Dipakai':
        if (qty > stokTersedia) {
          return NextResponse.json(
            { error: 'Stok tersedia tidak mencukupi' },
            { status: 400 }
          );
        }

        newTotal -= qty;
        newTersedia -= qty;
        break;

      case 'Rusak':
      case 'Hilang':
        if (qty > stokTersedia) {
          return NextResponse.json(
            { error: 'Stok tersedia tidak mencukupi' },
            { status: 400 }
          );
        }

        newTersedia -= qty;
        newTotal -= qty;
        break;

      case 'Dikembalikan':
        newTersedia += qty;

        if (newDipinjam < qty) {
          return NextResponse.json(
            { error: 'Jumlah yang dikembalikan melebihi stok yang dipinjam' },
            { status: 400 }
          );
        }

        newDipinjam -= qty;
        break;

      default:
        return NextResponse.json(
          { error: 'Jenis mutasi inventory tidak valid' },
          { status: 400 }
        );
    }

    // Pastikan tidak pernah ada stok negatif
    if (
      newTotal < 0 ||
      newTersedia < 0 ||
      newDipinjam < 0
    ) {
      return NextResponse.json(
        { error: 'Perubahan stok menghasilkan nilai tidak valid' },
        { status: 400 }
      );
    }

    // Update status otomatis
    let status: 'Tersedia' | 'Habis' | 'Rusak' | 'Hilang' = 'Tersedia';

    if (newTersedia <= 0 && newTotal <= 0) {
      status = 'Habis';
    }

    // Simpan perubahan stok
    inventory.stok_total = newTotal;
    inventory.stok_tersedia = newTersedia;
    inventory.stok_dipinjam = newDipinjam;
    inventory.status = status;

    await inventory.save();

    // Simpan history
    const history = await InventoryHistoryModel.create({
      barang_id,
      jenis,
      jumlah: qty,
      keterangan,
      dilakukan_oleh,
      tanggal: tanggal || new Date().toISOString(),
    });

    const obj = history.toObject() as Record<string, unknown>;

    const result = {
      ...obj,
      id: (obj._id as { toString(): string })?.toString(),
      _id: undefined,
      __v: undefined,
    };

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('[API/inventory/history POST]', err);

    return NextResponse.json(
      { error: 'Gagal menyimpan riwayat inventory' },
      { status: 500 }
    );
  }
}

// PATCH /api/inventory/history
// Koreksi jumlah transaksi tanpa menghapus riwayat asli
export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    const {
      id,
      jumlah_baru,
      dikoreksi_oleh,
      koreksi_keterangan,
    } = body;

    if (!id || jumlah_baru === undefined || !dikoreksi_oleh) {
      return NextResponse.json(
        { error: 'Data koreksi inventory belum lengkap' },
        { status: 400 }
      );
    }

    const history = await InventoryHistoryModel.findById(id);

    if (!history) {
      return NextResponse.json(
        { error: 'Riwayat inventory tidak ditemukan' },
        { status: 404 }
      );
    }

    if (history.dikoreksi) {
      return NextResponse.json(
        { error: 'Riwayat ini sudah pernah dikoreksi' },
        { status: 400 }
      );
    }

    const jumlahBaru = Number(jumlah_baru);
    const jumlahLama = Number(history.jumlah);

    if (!Number.isInteger(jumlahBaru) || jumlahBaru <= 0) {
      return NextResponse.json(
        { error: 'Jumlah baru harus berupa angka bulat lebih dari 0' },
        { status: 400 }
      );
    }

    if (jumlahBaru === jumlahLama) {
      return NextResponse.json(
        { error: 'Jumlah baru sama dengan jumlah sebelumnya' },
        { status: 400 }
      );
    }

    const inventory = await InventoryModel.findById(history.barang_id);

    if (!inventory) {
      return NextResponse.json(
        { error: 'Barang inventory tidak ditemukan' },
        { status: 404 }
      );
    }

    const selisih = jumlahBaru - jumlahLama;

    let newTotal = Number(inventory.stok_total || 0);
    let newTersedia = Number(inventory.stok_tersedia || 0);
    const newDipinjam = Number(inventory.stok_dipinjam || 0);

    if (
      history.jenis === 'Rusak' ||
      history.jenis === 'Hilang' ||
      history.jenis === 'Dipakai' ||
      history.jenis === 'Keluar'
    ) {
      newTotal -= selisih;
      newTersedia -= selisih;
    } else if (history.jenis === 'Masuk') {
      newTotal += selisih;
      newTersedia += selisih;
    } else if (history.jenis === 'Dikembalikan') {
      newTersedia += selisih;
    }

    if (
      newTotal < 0 ||
      newTersedia < 0 ||
      newDipinjam < 0
    ) {
      return NextResponse.json(
        { error: 'Koreksi menghasilkan nilai stok yang tidak valid' },
        { status: 400 }
      );
    }

    inventory.stok_total = newTotal;
    inventory.stok_tersedia = newTersedia;
    inventory.stok_dipinjam = newDipinjam;

    if (newTersedia <= 0 && newTotal <= 0) {
      inventory.status = 'Habis';
    } else {
      inventory.status = 'Tersedia';
    }

    history.dikoreksi = true;
    history.jumlah_sebelumnya = jumlahLama;
    history.jumlah = jumlahBaru;
    history.dikoreksi_pada = new Date().toISOString();
    history.dikoreksi_oleh = dikoreksi_oleh;
    history.koreksi_keterangan =
      koreksi_keterangan?.trim() || 'Koreksi jumlah transaksi';

    await inventory.save();
    await history.save();

    const obj = history.toObject() as Record<string, unknown>;

    const result = {
      ...obj,
      id: (obj._id as { toString(): string })?.toString(),
      _id: undefined,
      __v: undefined,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[API/inventory/history PATCH]', err);

    return NextResponse.json(
      { error: 'Gagal melakukan koreksi riwayat inventory' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/history?id=xyz
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const id = req.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID tidak diberikan' },
        { status: 400 }
      );
    }

    const doc = await InventoryHistoryModel.findByIdAndDelete(id);

    if (!doc) {
      return NextResponse.json(
        { error: 'Riwayat inventory tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/inventory/history DELETE]', err);

    return NextResponse.json(
      { error: 'Gagal menghapus riwayat inventory' },
      { status: 500 }
    );
  }
}