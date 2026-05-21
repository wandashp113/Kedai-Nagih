import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDb, getMenus, getMenu, createMenu, updateMenu, deleteMenu } from './db.js'
import { startBot, getCurrentQR } from './bot.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3456
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(__dirname, 'uploads')
const REACT_DIST = process.env.REACT_DIST || path.resolve(__dirname, '../v1-react/dist')

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    const name = `menu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}${ext}`
    cb(null, name)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Hanya file gambar yang diizinkan'))
  },
})

const app = express()
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(UPLOAD_DIR))

// API Key authentication
const API_KEY = process.env.API_KEY || null
function requireAuth(req, res, next) {
  if (!API_KEY) return next()
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized. Gunakan header: Authorization: Bearer <API_KEY>' })
  }
  next()
}

initDb()

const VALID_KATEGORI = ['Makanan', 'Minuman', 'Camilan', 'Lainnya']

app.get('/api/menu', (req, res) => {
  res.json(getMenus())
})

app.get('/api/menu/:id', (req, res) => {
  const menu = getMenu(parseInt(req.params.id))
  if (!menu) return res.status(404).json({ error: 'Menu tidak ditemukan' })
  res.json(menu)
})

app.post('/api/menu', requireAuth, (req, res) => {
  const { nama, harga, kategori, porsi, gambar } = req.body
  if (!nama || !harga) return res.status(400).json({ error: 'Nama dan harga wajib diisi' })
  if (typeof nama !== 'string' || nama.length > 100) return res.status(400).json({ error: 'Nama harus string maks 100 karakter' })
  const hargaNum = parseInt(harga)
  if (isNaN(hargaNum) || hargaNum < 100 || hargaNum > 99999999) return res.status(400).json({ error: 'Harga harus antara 100 dan 99999999' })
  const kat = kategori || 'Makanan'
  if (!VALID_KATEGORI.includes(kat)) return res.status(400).json({ error: `Kategori harus: ${VALID_KATEGORI.join(', ')}` })
  const id = createMenu(nama, hargaNum, kat, porsi || '', gambar || '')
  res.status(201).json({ id, message: 'Menu berhasil ditambahkan' })
})

app.put('/api/menu/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id)
  const { nama, harga, kategori, porsi, tersedia } = req.body
  const data = {}
  if (nama !== undefined) {
    if (typeof nama !== 'string' || nama.length > 100) return res.status(400).json({ error: 'Nama harus string maks 100 karakter' })
    data.nama = nama
  }
  if (harga !== undefined) {
    const hargaNum = parseInt(harga)
    if (isNaN(hargaNum) || hargaNum < 100 || hargaNum > 99999999) return res.status(400).json({ error: 'Harga harus antara 100 dan 99999999' })
    data.harga = hargaNum
  }
  if (kategori !== undefined) {
    if (!VALID_KATEGORI.includes(kategori)) return res.status(400).json({ error: `Kategori harus: ${VALID_KATEGORI.join(', ')}` })
    data.kategori = kategori
  }
  if (porsi !== undefined) data.porsi = String(porsi)
  if (tersedia !== undefined) data.tersedia = tersedia ? 1 : 0
  const updated = updateMenu(id, data)
  if (!updated) return res.status(404).json({ error: 'Menu tidak ditemukan' })
  res.json({ message: 'Menu berhasil diupdate' })
})

app.delete('/api/menu/:id', requireAuth, (req, res) => {
  const deleted = deleteMenu(parseInt(req.params.id))
  if (!deleted) return res.status(404).json({ error: 'Menu tidak ditemukan' })
  res.json({ message: 'Menu berhasil dihapus' })
})

app.post('/api/upload/:id', requireAuth, upload.single('gambar'), (req, res) => {
  const id = parseInt(req.params.id)
  if (!req.file) return res.status(400).json({ error: 'File tidak ditemukan' })
  const imageUrl = `${BASE_URL}/uploads/${req.file.filename}`
  const updated = updateMenu(id, { gambar: imageUrl })
  if (!updated) return res.status(404).json({ error: 'Menu tidak ditemukan' })
  res.json({ message: 'Gambar berhasil diupload', url: imageUrl })
})

app.get('/api/qr', (req, res) => {
  const qr = getCurrentQR()
  if (!qr) return res.status(404).json({ error: 'Tidak ada QR code. Bot sudah login atau belum siap.' })
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`
  res.redirect(qrUrl)
})

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message })
  }
  if (err) return res.status(400).json({ error: err.message })
  next()
})

// Serve React build — SPA fallback
app.use(express.static(REACT_DIST))
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next()
  res.sendFile(path.join(REACT_DIST, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Kedai Nagih berjalan di http://0.0.0.0:${PORT}`)
  console.log(`📋 API: http://0.0.0.0:${PORT}/api/menu`)
  startBot().catch(err => console.error('Bot error:', err))
})
