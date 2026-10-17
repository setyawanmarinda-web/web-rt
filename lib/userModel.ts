// lib/userModel.ts
import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  // warga: username = NIK. admin/master: bebas (unik)
  username: { type: String, required: true, unique: true, trim: true },
  password_hash: { type: String, required: true },
  nama: { type: String, required: true, trim: true },

  role: {
    type: String,
    enum: ['master', 'admin_rw', 'admin_rt', 'warga'],
    required: true,
  },

  // master: kosong semua. admin_rw: rw saja. admin_rt & warga: rw + rt
  rw: { type: String, default: '012' },
  rt: { type: String },

  // khusus akun warga: tautan ke data warga
  warga_id: { type: String },

  aktif: { type: Boolean, default: true },
  wajib_ganti_password: { type: Boolean, default: true },

  created_at: { type: String, default: () => new Date().toISOString() },
});

export const UserModel = models.User || model('User', UserSchema);
