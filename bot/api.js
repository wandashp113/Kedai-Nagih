import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDb, getMenus, getMenu, createMenu, updateMenu, deleteMenu } from './db.js'

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

initDb()

app.get('/api/menu', (req, res) => {
  res.json(getMenus())
})

app.get('/api/menu/:id', (req, res) => {
  const menu = getMenu(parseInt(req.params.id))
  if (!menu) return res.status(404).json({ error: 'Menu tidak ditemukan' })
  res.json(menu)
})

app.post('/api/menu', (req, res) => {
  const { nama, harga, kategori, porsi, gambar } = req.body
  if (!nama || !harga) return res.status(400).json({ error: 'Nama dan harga wajib diisi' })
  const id = createMenu(nama, parseInt(harga), kategori || 'Makanan', porsi || '', gambar || '')
  res.status(201).json({ id, message: 'Menu berhasil ditambahkan' })
})

app.put('/api/menu/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const updated = updateMenu(id, req.body)
  if (!updated) return res.status(404).json({ error: 'Menu tidak ditemukan' })
  res.json({ message: 'Menu berhasil diupdate' })
})

app.delete('/api/menu/:id', (req, res) => {
  const deleted = deleteMenu(parseInt(req.params.id))
  if (!deleted) return res.status(404).json({ error: 'Menu tidak ditemukan' })
  res.json({ message: 'Menu berhasil dihapus' })
})

app.post('/api/upload/:id', upload.single('gambar'), (req, res) => {
  const id = parseInt(req.params.id)
  if (!req.file) return res.status(400).json({ error: 'File tidak ditemukan' })
  const imageUrl = `${BASE_URL}/uploads/${req.file.filename}`
  const updated = updateMenu(id, { gambar: imageUrl })
  if (!updated) return res.status(404).json({ error: 'Menu tidak ditemukan' })
  res.json({ message: 'Gambar berhasil diupload', url: imageUrl })
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
})
