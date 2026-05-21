import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDb, getMenus, getMenu, createMenu, updateMenu, deleteMenu } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = path.resolve(__dirname, 'uploads')

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
const PORT = 3456

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
  const imageUrl = `http://localhost:3456/uploads/${req.file.filename}`
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 API Server Kedai Nagih berjalan di http://localhost:${PORT}`)
  console.log(`📋 GET  http://localhost:${PORT}/api/menu`)
  console.log(`➕ POST http://localhost:${PORT}/api/menu`)
  console.log(`🖼️  POST http://localhost:${PORT}/api/upload/:id`)
})
