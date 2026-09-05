// app/api/inventory/loans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import {
  InventoryLoanModel,
  InventoryModel,
  InventoryHistoryModel,
} from '@/lib/mongoose';

// Helper: convert Mongoose doc ke plain object
function toPlain(doc: Record<string, unknown>) {
  return {
    ...doc,
    id: (doc._id as { toString(): string })?.toString(),
    _id: undefined,
    __v: undefined,
  };
}

// GET /api/inventory/loans?rt=002
// GET /api/inventory/loans?barang_id=xyz
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const rt = req.nextUrl.searchParams.get('rt');
    const barangId = req.nextUrl.searchParams.get('barang_id');

    const query: Record<string, string> = {};

    if (rt && rt !== 'ALL') {
      query.rt = rt;
    }

    if (barangId) {
      query.barang_id = barangId;
    }

    const docs = await InventoryLoanModel
      .find(query)
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json(
      docs.map((d) => toPlain(d as Record<string, unknown>))
    );
  } catch (err) {
    console.error('[API/inventory/loans GET]', err);

    return NextResponse.json(
      { error: 'Gagal mengambil data peminjaman inventory' },
      { status: 500 }
    );
  }
}

// POST /api/inventory/loans
// Membuat pengajuan peminjaman
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    const {
      barang_id,
      peminjam,
      jumlah,
      tanggal_pinjam,
      tanggal_rencana_kembali,
      catatan,
      rt,
    } = body;

    if (
      !barang_id ||
      !peminjam ||
      !jumlah ||
      !tanggal_pinjam ||
      !tanggal_rencana_kembali ||
      !rt
    ) {
      return NextResponse.json(
        { error: 'Data pengajuan peminjaman belum lengkap' },
        { status: 400 }
      );
    }

    const qty = Number(jumlah);

    if (!Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json(
        { error: 'Jumlah harus berupa angka bulat lebih dari 0' },
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

    // Hanya barang Tidak Habis Pakai yang boleh dipinjam
    if (inventory.tipe !== 'Tidak Habis Pakai') {
      return NextResponse.json(
        { error: 'Barang Habis Pakai tidak dapat dipinjam' },
        { status: 400 }
      );
    }

    if (qty > inventory.stok_tersedia) {
      return NextResponse.json(
        { error: 'Jumlah yang diajukan melebihi stok tersedia' },
        { status: 400 }
      );
    }

    const doc = await InventoryLoanModel.create({
      barang_id,
      peminjam,
      jumlah: qty,
      tanggal_pinjam,
      tanggal_rencana_kembali,
      status: 'Pending',
      catatan,
      rt,
    });

    return NextResponse.json(
      toPlain(doc.toObject() as Record<string, unknown>),
      { status: 201 }
    );
  } catch (err) {
    console.error('[API/inventory/loans POST]', err);

    return NextResponse.json(
      { error: 'Gagal membuat pengajuan peminjaman' },
      { status: 500 }
    );
  }
}

// PATCH /api/inventory/loans
//
// Approve:
// { id, action: "approve" }
//
// Reject:
// { id, action: "reject" }
//
// Return:
// {
//   id,
//   action: "return",
//   kondisi_kembali: "Baik" | "Rusak" | "Hilang",
//   kontribusi_pemeliharaan?: number,
//   catatan?: string
// }
export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    const {
      id,
      action,
      kondisi_kembali,
      kontribusi_pemeliharaan,
      catatan,
    } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: 'ID dan action wajib diberikan' },
        { status: 400 }
      );
    }

    const loan = await InventoryLoanModel.findById(id);

    if (!loan) {
      return NextResponse.json(
        { error: 'Data peminjaman tidak ditemukan' },
        { status: 404 }
      );
    }

    const inventory = await InventoryModel.findById(loan.barang_id);

    if (!inventory) {
      return NextResponse.json(
        { error: 'Barang inventory tidak ditemukan' },
        { status: 404 }
      );
    }

    // ─── APPROVE ──────────────────────────────────────────────────────────

    if (action === 'approve') {
      if (loan.status !== 'Pending') {
        return NextResponse.json(
          { error: 'Pengajuan ini sudah diproses' },
          { status: 400 }
        );
      }

      const qty = Number(loan.jumlah);

      if (qty > inventory.stok_tersedia) {
        return NextResponse.json(
          { error: 'Stok tersedia sudah tidak mencukupi' },
          { status: 400 }
        );
      }

      inventory.stok_tersedia -= qty;
      inventory.stok_dipinjam += qty;

      if (inventory.stok_tersedia <= 0) {
        inventory.status = 'Habis';
      } else {
        inventory.status = 'Tersedia';
      }

      await inventory.save();

      loan.status = 'Dipinjam';

      await loan.save();

      await InventoryHistoryModel.create({
        barang_id: loan.barang_id,
        jenis: 'Keluar',
        jumlah: qty,
        keterangan: `Peminjaman oleh ${loan.peminjam}`,
        dilakukan_oleh: 'Pengurus RT',
        tanggal: new Date().toISOString(),
      });

      return NextResponse.json(
        toPlain(loan.toObject() as Record<string, unknown>)
      );
    }

    // ─── REJECT ───────────────────────────────────────────────────────────

    if (action === 'reject') {
      if (loan.status !== 'Pending') {
        return NextResponse.json(
          { error: 'Pengajuan ini sudah diproses' },
          { status: 400 }
        );
      }

      loan.status = 'Ditolak';

      if (catatan) {
        loan.catatan = catatan;
      }

      await loan.save();

      return NextResponse.json(
        toPlain(loan.toObject() as Record<string, unknown>)
      );
    }

    // ─── RETURN ───────────────────────────────────────────────────────────

    if (action === 'return') {
      if (loan.status !== 'Dipinjam') {
        return NextResponse.json(
          { error: 'Barang belum berstatus Dipinjam' },
          { status: 400 }
        );
      }

      if (!kondisi_kembali) {
        return NextResponse.json(
          { error: 'Kondisi barang saat dikembalikan wajib dipilih' },
          { status: 400 }
        );
      }

      const qty = Number(loan.jumlah);

      loan.status = 'Dikembalikan';
      loan.tanggal_dikembalikan = new Date().toISOString().split('T')[0];
      loan.kondisi_kembali = kondisi_kembali;

      if (
        kontribusi_pemeliharaan !== undefined &&
        kontribusi_pemeliharaan !== null
      ) {
        const kontribusi = Number(kontribusi_pemeliharaan);

        if (!Number.isFinite(kontribusi) || kontribusi < 0) {
          return NextResponse.json(
            { error: 'Kontribusi pemeliharaan tidak valid' },
            { status: 400 }
          );
        }

        loan.kontribusi_pemeliharaan = kontribusi;
      }

      if (catatan) {
        loan.catatan = catatan;
      }

      inventory.stok_dipinjam = Math.max(
        0,
        Number(inventory.stok_dipinjam || 0) - qty
      );

      // Barang baik kembali ke stok tersedia.
      // Barang rusak/hilang tidak kembali ke stok tersedia.
      if (kondisi_kembali === 'Baik') {
        inventory.stok_tersedia += qty;

        if (inventory.stok_tersedia > 0) {
          inventory.status = 'Tersedia';
        }
      }

      if (kondisi_kembali === 'Rusak') {
        inventory.stok_total = Math.max(
          0,
          Number(inventory.stok_total || 0) - qty
        );

        if (inventory.stok_tersedia <= 0) {
          inventory.status = 'Rusak';
        }
      }

      if (kondisi_kembali === 'Hilang') {
        inventory.stok_total = Math.max(
          0,
          Number(inventory.stok_total || 0) - qty
        );

        if (inventory.stok_tersedia <= 0) {
          inventory.status = 'Hilang';
        }
      }

      await inventory.save();

      await loan.save();

      await InventoryHistoryModel.create({
        barang_id: loan.barang_id,
        jenis: 'Dikembalikan',
        jumlah: qty,
        keterangan:
          `Pengembalian oleh ${loan.peminjam} - Kondisi: ${kondisi_kembali}`,
        dilakukan_oleh: 'Pengurus RT',
        tanggal: new Date().toISOString(),
      });

      return NextResponse.json(
        toPlain(loan.toObject() as Record<string, unknown>)
      );
    }

    return NextResponse.json(
      { error: 'Action tidak valid' },
      { status: 400 }
    );
  } catch (err) {
    console.error('[API/inventory/loans PATCH]', err);

    return NextResponse.json(
      { error: 'Gagal memperbarui peminjaman inventory' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/loans?id=xyz
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

    const loan = await InventoryLoanModel.findById(id);

    if (!loan) {
      return NextResponse.json(
        { error: 'Data peminjaman tidak ditemukan' },
        { status: 404 }
      );
    }

    // Jangan izinkan menghapus transaksi yang masih aktif.
    if (loan.status === 'Dipinjam') {
      return NextResponse.json(
        {
          error:
            'Peminjaman yang masih aktif tidak dapat dihapus. Kembalikan barang terlebih dahulu.',
        },
        { status: 400 }
      );
    }

    await InventoryLoanModel.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/inventory/loans DELETE]', err);

    return NextResponse.json(
      { error: 'Gagal menghapus data peminjaman' },
      { status: 500 }
    );
  }
}