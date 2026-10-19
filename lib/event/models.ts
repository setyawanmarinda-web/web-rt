// lib/event/models.ts
// Koleksi modul Agenda 17an. Relasi ke akun/warga memakai id string (sama seperti User.warga_id).
import mongoose, { Schema, models, model } from 'mongoose';

// Saat hot-reload (next dev) mongoose.models menyimpan model berskema LAMA; field baru lalu dibuang diam-diam
// (mis. tata letak, juara 3, feeder bagan tidak tersimpan). Daftarkan ulang model agar selalu memakai skema terbaru.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fresh(name: string, schema: Schema, collection: string): mongoose.Model<any> {
  if (models[name]) mongoose.deleteModel(name);
  return model(name, schema, collection);
}

export const EVENT_KATEGORI = ['Jadwal', 'Lomba', 'Informasi'] as const;
export const EVENT_STATUS = ['Akan Datang', 'Berlangsung', 'Selesai', 'Dibatalkan'] as const;

const EventSchema = new Schema({
  judul: { type: String, required: true, trim: true, maxlength: 150 },
  kategori: { type: String, enum: EVENT_KATEGORI, required: true },
  deskripsi: { type: String, trim: true, maxlength: 2000, default: '' },
  tanggal: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  waktu: { type: String, trim: true, maxlength: 20, default: '' },
  lokasi: { type: String, trim: true, maxlength: 150, default: '' },
  status: { type: String, enum: EVENT_STATUS, default: 'Akan Datang' },
  dibuat_oleh: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
});
EventSchema.index({ tanggal: 1, waktu: 1 });

export const EventModel = fresh('Event17', EventSchema, 'events');

// ─── Turnamen (peserta, grup, dan pertandingan disimpan dalam satu dokumen agar tiap perubahan atomik) ──
const TParticipant = new Schema({
  id: { type: String, required: true },
  nama: { type: String, required: true, trim: true, maxlength: 80 },
  tim: { type: String, trim: true, maxlength: 80, default: '' },
}, { _id: false });

const TMatch = new Schema({
  id: { type: String, required: true },
  stage: { type: String, enum: ['group', 'ko'], required: true },
  group: Number,
  round: { type: Number, required: true },
  index: { type: Number, required: true },
  fa: String,
  fb: String,
  laLoser: Boolean,
  lbLoser: Boolean,
  half: { type: Number, enum: [0, 1] },
  third: Boolean,
  a: { type: String, default: null },
  b: { type: String, default: null },
  status: { type: String, enum: ['pending', 'done', 'bye'], default: 'pending' },
  scoreA: Number,
  scoreB: Number,
  winner: { type: String, default: null },
  decidedBy: { type: String, enum: ['skor', 'manual'] },
  jadwal: { type: String, maxlength: 40 },
  lokasi: { type: String, maxlength: 100 },
}, { _id: false });

const TournamentSchema = new Schema({
  nama: { type: String, required: true, trim: true, maxlength: 100 },
  cabang: { type: String, trim: true, maxlength: 60, default: '' },
  mode: { type: String, enum: ['single', 'group'], required: true },
  status: { type: String, enum: ['draft', 'berjalan', 'selesai'], default: 'draft' },
  group_count: { type: Number, min: 1, max: 32, default: 2 },
  advance_per_group: { type: Number, min: 0, max: 8, default: 2 },
  layout: { type: String, enum: ['standard', 'dua-kelompok'], default: 'standard' },
  third_place: { type: Boolean, default: false },
  tata_letak: { type: Schema.Types.Mixed }, // lihat lib/event/tata.ts
  tata_pending: { type: Schema.Types.Mixed }, // tata letak babak gugur dari template (mode grup), dipasang saat babak gugur dibuat
  participants: { type: [TParticipant], default: [] },
  groups: { type: [new Schema({ name: String, members: [String] }, { _id: false })], default: [] },
  matches: { type: [TMatch], default: [] },
  dibuat_oleh: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() },
});

export const TournamentModel = fresh('Tournament17', TournamentSchema, 'tournaments');

// ─── Undian doorprize ───────────────────────────────────────────────────────
const DrawSchema = new Schema({
  nama: { type: String, required: true, trim: true, maxlength: 100 },
  status: { type: String, enum: ['draft', 'terkunci', 'menjalankan', 'selesai', 'disahkan'], default: 'draft' },
  allow_multi_win: { type: Boolean, default: false },
  // Putaran berantai: tiap putaran adalah undian sendiri (komitmen & bukti sendiri); putaran 1 tidak punya parent.
  putaran: { type: Number, default: 1 },
  parent_id: String,
  seri_id: String,
  prizes: { type: [new Schema({ id: String, nama: { type: String, maxlength: 100 }, jumlah: { type: Number, min: 1, max: 1000 } }, { _id: false })], default: [] },
  // Hanya id|nama|alamat; NIK tidak disalin.
  participants: { type: [new Schema({ id: String, nama: { type: String, maxlength: 80 }, alamat: { type: String, maxlength: 150, default: '' }, warga_id: String }, { _id: false })], default: [] },
  lock: {
    list_hash: String, commitment: String, drand_round: Number, locked_at: String, locked_by: String,
  },
  server_seed: { type: String, select: false }, // rahasia sampai disahkan
  result: {
    seed: String, drand_round: Number, drand_randomness: String, drand_signature: String,
    source: { type: String, enum: ['drand', 'server-only'] },
    winners: [new Schema({ prizeId: String, participantId: String, revealed: { type: Boolean, default: false }, absent: { type: Boolean, default: false }, revealed_at: String }, { _id: false })],
    redraws: [new Schema({ n: Number, prizeId: String, absentId: String, newId: String, at: String, by: String }, { _id: false })],
    ran_at: String, ran_by: String,
    server_seed: String, // diisi saat disahkan
  },
  voided: { type: [Schema.Types.Mixed], default: [] },
  audit: { type: [new Schema({ at: String, by: String, action: String, detail: String }, { _id: false })], default: [] },
  created_at: { type: String, default: () => new Date().toISOString() },
});

export const DrawModel = fresh('Draw17', DrawSchema, 'draw_events');

// ─── Template bagan ──────────────────────────────────────────────────────────
const TemplateSchema = new Schema({
  nama: { type: String, required: true, trim: true, maxlength: 100 },
  mode: { type: String, enum: ['single', 'group'], required: true },
  layout: { type: String, enum: ['standard', 'dua-kelompok'], default: 'standard' },
  third_place: { type: Boolean, default: false },
  group_count: { type: Number, default: 2 },
  advance_per_group: { type: Number, default: 2 },
  jumlah_peserta: { type: Number, required: true, min: 2, max: 512 },
  slots: { type: [Number], default: [] }, // mode single: indeks peserta per slot babak 1, -1 = BYE
  groups: { type: [new Schema({ name: String, members: [Number] }, { _id: false })], default: [] },
  tata: { type: Schema.Types.Mixed },
  dibuat_oleh: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() },
});

export const TemplateModel = fresh('Template17', TemplateSchema, 'tournament_templates');
