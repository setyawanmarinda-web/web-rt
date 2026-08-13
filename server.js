
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Koneksi ke MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Koneksi MongoDB Berhasil!'))
  .catch(err => console.error('Gagal konek:', err));

// Schema (Struktur Data)
const ItemSchema = new mongoose.Schema({
  nama: String,
  pesan: String
});
const Item = mongoose.model('Item', ItemSchema);

// Endpoint API untuk kirim data dari web
app.post('/api/data', async (req, res) => {
  const newItem = new Item(req.body);
  await newItem.save();
  res.json({ message: "Data berhasil disimpan!" });
});

// Jalankan Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server jalan di http://localhost:${PORT}`));