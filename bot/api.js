import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDb, getMenus, getMenu, createMenu, updateMenu, deleteMenu } from './db.js'
import { startBot, getCurrentQR, getBotStatus, forceRelogin } from './bot.js'
import QRCode from 'qrcode'

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

app.get('/api/qr.png', async (req, res) => {
  const qr = getCurrentQR()
  if (!qr) return res.status(404).json({ error: 'Tidak ada QR code' })
  try {
    const png = await QRCode.toBuffer(qr, { width: 400, margin: 2 })
    res.type('image/png').send(png)
  } catch {
    res.status(500).json({ error: 'Gagal generate QR' })
  }
})

app.get('/api/qr', async (req, res) => {
  const qr = getCurrentQR()
  const status = getBotStatus()

  if (req.query.force === '1') {
    forceRelogin()
    return res.send(`<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Logout - Kedai Nagih</title><meta http-equiv="refresh" content="5;url=/api/qr">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,sans-serif;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh}
.card{background:#fff;border-radius:16px;padding:32px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.1);max-width:90vw}
h1{font-size:20px;margin-bottom:8px;color:#333}
p{font-size:14px;color:#666}
</style>
</head>
<body><div class="card">
<h1>🚪 Logout...</h1>
<p>Session dihapus. Bot akan restart dan generate QR baru dalam 5 detik.</p>
</div></body></html>`)
  }

  let qrDataUrl = null
  if (qr) {
    try {
      qrDataUrl = await QRCode.toDataURL(qr, { width: 280, margin: 2 })
    } catch {}
  }

  res.send(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>QR Code - Kedai Nagih</title>
${!qr && status !== 'connected' ? '<meta http-equiv="refresh" content="5">' : ''}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,sans-serif;background:#f5f5f7;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:16px}
.card{background:#fff;border-radius:16px;padding:28px 32px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.08);max-width:90vw;width:400px}
h1{font-size:20px;margin:0 0 6px;color:#1d1d1f}
p{font-size:14px;color:#86868b;margin:0 0 20px;line-height:1.6}
img{display:block;margin:16px auto;border-radius:12px;max-width:100%;height:auto;image-rendering:pixelated}
.footer{margin-top:20px;padding-top:16px;border-top:1px solid #f0f0f0;font-size:12px;color:#aeaeb2}
.refresh-info{font-size:13px;color:#aeaeb2;margin-top:16px}
.btn{display:inline-block;margin:16px 4px 0;padding:10px 22px;background:#ff3b30;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;font-family:inherit}
.btn:hover{opacity:0.9}
.btn-secondary{background:#1d1d1f}
.spinner{font-size:48px;margin:24px 0 8px;animation:pulse 1.5s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
</style>
</head>
<body>
<div class="card">
${qr && qrDataUrl ? `
<h1>🔗 Scan QR Code</h1>
<p>Scan dengan WhatsApp > <strong>3 titik</strong> > <strong>Perangkat Tertaut</strong></p>
<img src="${qrDataUrl}" alt="QR Code" width="280" height="280">
<p style="font-size:13px;margin-top:12px">Atau buka WhatsApp > Link Device</p>
` : status === 'connected' ? `
<h1>✅ Bot sudah Login</h1>
<p>Bot WhatsApp sudah terhubung.<br>Silakan kirim <strong>help</strong> ke nomor bot.</p>
<a href="/api/qr.png" class="btn btn-secondary" target="_blank">📷 QR PNG</a>
<a href="/api/qr?force=1" class="btn">🔄 Logout & QR Baru</a>
` : status === 'connecting' ? `
<h1>⏳ Menghubungkan...</h1>
<p>Bot sedang mencoba koneksi ke WhatsApp.</p>
<div class="spinner">⏳</div>
<p class="refresh-info">Halaman refresh otomatis...</p>
` : `
<h1>⏳ Menunggu QR Code...</h1>
<p>Bot sedang menyiapkan QR Code untuk login WhatsApp.</p>
<div class="spinner">⏳</div>
<p class="refresh-info">Halaman refresh otomatis...</p>
`}
<div class="footer">Kedai Nagih Bot</div>
</div>
</body>
</html>`)
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
