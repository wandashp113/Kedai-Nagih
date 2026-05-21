import { makeWASocket, useMultiFileAuthState, DisconnectReason, downloadContentFromMessage } from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { initDb, getMenus, createMenu, updateMenu, deleteMenu } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SESSION_DIR = path.resolve(__dirname, 'session')
const UPLOAD_DIR = path.resolve(__dirname, 'uploads')

fs.mkdirSync(UPLOAD_DIR, { recursive: true })

initDb()

const pendingImage = {}

function formatMenuList(menus) {
  if (menus.length === 0) return '🍽️ *Belum ada menu.*'
  let msg = '🍽️ *MENU KEDAI NAGIH*\n'
  msg += '─────────────────\n'
  menus.forEach(m => {
    const status = m.tersedia ? '✅' : '❌'
    msg += `\n${status} *${m.nama}*\n`
    msg += `   ID: ${m.id} | Rp${m.harga.toLocaleString()} (${m.kategori})`
    if (m.porsi) msg += `\n   Porsi: ${m.porsi}`
    if (m.gambar) msg += `\n   🖼️ Ada gambar`
    msg += '\n'
  })
  msg += '\n─────────────────\n'
  msg += `Total: ${menus.length} menu`
  return msg
}

function getHelp() {
  return `🤖 *CARA PAKAI BOT KEDAI NAGIH*

📋 *Lihat Menu*
\`menu\` atau \`list\`

➕ *Tambah Menu*
\`tambah [nama] | [harga]\`
\`tambah [nama] | [harga] | [kategori]\`
\`tambah [nama] | [harga] | [kategori] | [porsi]\`
Contoh: \`tambah Nasi Goreng | 15000 | Makanan | Porsi Besar\`

🖼️ *Gambar Menu*
\`gambar [id]\` — lalu kirim fotonya
\`hapusgambar [id]\` — hapus gambar menu
Contoh: \`gambar 7\` lalu kirim foto

✏️ *Edit Menu*
\`edit [id] [field]:[value]\`
Field: nama, harga, kategori, porsi, tersedia
Contoh: \`edit 7 harga:18000\`

🗑️ *Hapus Menu*
\`hapus [id]\`

❓ *Bantuan*
\`help\` atau \`bantuan\``
}

async function saveImage(msg, menuId) {
  try {
    const stream = await downloadContentFromMessage(msg.message.imageMessage, 'image')
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    const buffer = Buffer.concat(chunks)
    const ext = msg.message.imageMessage.mimetype?.split('/')[1] || 'jpg'
    const filename = `menu_${menuId}_${Date.now()}.${ext}`
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer)
    const imageUrl = `http://localhost:3456/uploads/${filename}`
    updateMenu(menuId, { gambar: imageUrl })
    return imageUrl
  } catch (err) {
    console.error('Error saving image:', err)
    return null
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ['Kedai Nagih Bot', 'Safari', '1.0'],
  })

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) {
      console.log('\n╔══════════════════════════════════╗')
      console.log('║  SCAN QR CODE INI DENGAN WHATSAPP  ║')
      console.log('╚══════════════════════════════════╝\n')
      qrcode.generate(qr, { small: true })
      console.log('\nAtau buka WhatsApp > 3 titik > Linked Devices > Link a Device')
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) {
        console.log('🔌 Koneksi terputus, reconnect...')
        startBot()
      } else {
        console.log('🚪 Bot telah logout. Hapus folder session/ untuk login ulang.')
      }
    }
    if (connection === 'open') {
      console.log('✅ Bot WhatsApp Kedai Nagih siap!')
      console.log(`📱 Nomor bot: ${sock.user?.id?.split(':')[0] || 'unknown'}`)
      console.log('💬 Kirim "help" ke nomor ini untuk bantuan\n')
    }
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe || msg.key.remoteJid?.includes('@g.us')) continue

      const sender = msg.key.remoteJid

      // Handle incoming image
      if (msg.message.imageMessage) {
        const pending = pendingImage[sender]
        if (pending) {
          const imageUrl = await saveImage(msg, pending.menuId)
          if (imageUrl) {
            delete pendingImage[sender]
            await sock.sendMessage(sender, {
              text: `✅ *Gambar berhasil disimpan!*\n   Menu: ${pending.nama}\n   🖼️ ${imageUrl}`
            })
          } else {
            await sock.sendMessage(sender, { text: '❌ Gagal menyimpan gambar. Coba lagi.' })
          }
        } else {
          await sock.sendMessage(sender, { text: 'Kirim *gambar [id]* dulu sebelum mengirim foto.\nContoh: *gambar 7*' })
        }
        continue
      }

      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
      if (!text) continue

      const parts = text.trim().split(/\s+/)
      const cmd = parts[0].toLowerCase()
      const args = parts.slice(1)
      const raw = text.trim()

      try {
        let reply = ''

        if (cmd === 'menu' || cmd === 'list' || cmd === 'daftar') {
          reply = formatMenuList(getMenus())

        } else if (cmd === 'tambah' || cmd === 'add') {
          const fullText = raw.slice(cmd.length).trim()
          const p = fullText.split('|').map(s => s.trim())
          const nama = p[0]
          const harga = parseInt(p[1])
          const kategori = p[2] || 'Makanan'
          const porsi = p[3] || ''

          if (!nama || isNaN(harga)) {
            reply = '❌ Format salah!\nGunakan:\n`tambah [nama] | [harga]`\nContoh: `tambah Nasi Goreng | 15000`'
          } else {
            const id = createMenu(nama, harga, kategori, porsi)
            reply = `✅ *Menu berhasil ditambahkan!*\n   ID: ${id}\n   ${nama} - Rp${harga.toLocaleString()} (${kategori})${porsi ? `\n   Porsi: ${porsi}` : ''}\n\nKirim *gambar ${id}* untuk menambahkan foto.`
          }

        } else if (cmd === 'gambar' || cmd === 'foto') {
          const id = parseInt(args[0])
          if (isNaN(id)) {
            reply = '❌ Gunakan: `gambar [id]`\nContoh: `gambar 7`'
          } else {
            const menus = getMenus()
            const menu = menus.find(m => m.id === id)
            if (!menu) {
              reply = `❌ Menu ID ${id} tidak ditemukan.`
            } else {
              pendingImage[sender] = { menuId: id, nama: menu.nama }
              // Auto-expire after 2 minutes
              setTimeout(() => { delete pendingImage[sender] }, 120000)
              reply = `📸 Kirim fotonya sekarang untuk *${menu.nama}*.\n(2 menit)`
            }
          }

        } else if (cmd === 'hapusgambar' || cmd === 'delfoto') {
          const id = parseInt(args[0])
          if (isNaN(id)) {
            reply = '❌ Gunakan: `hapusgambar [id]`'
          } else if (updateMenu(id, { gambar: '' })) {
            reply = `✅ Gambar menu ID ${id} berhasil dihapus.`
          } else {
            reply = `❌ Menu ID ${id} tidak ditemukan.`
          }

        } else if (cmd === 'edit' || cmd === 'update') {
          if (args.length < 2) {
            reply = '❌ Format salah!\nGunakan:\n`edit [id] [field]:[value]`\nContoh: `edit 7 harga:18000`'
          } else {
            const id = parseInt(args[0])
            const field = args[1].split(':')[0]
            const value = args.slice(1).join(' ').split(':').slice(1).join(':')

            if (!field || !value) {
              reply = '❌ Format salah! Gunakan: `edit [id] [field]:[value]`'
            } else {
              const val = field === 'tersedia' ? (value === '1' || value === 'true' ? 1 : 0)
                : field === 'harga' ? parseInt(value) : value
              if (updateMenu(id, { [field]: val })) {
                reply = `✅ Menu ID ${id} berhasil diupdate!\n   ${field} → ${value}`
              } else {
                reply = `❌ Menu ID ${id} tidak ditemukan.`
              }
            }
          }

        } else if (cmd === 'hapus' || cmd === 'delete' || cmd === 'remove') {
          const id = parseInt(args[0])
          if (isNaN(id)) {
            reply = '❌ Gunakan: `hapus [id]`\nContoh: `hapus 5`'
          } else if (deleteMenu(id)) {
            reply = `✅ Menu ID ${id} berhasil dihapus.`
          } else {
            reply = `❌ Menu ID ${id} tidak ditemukan.`
          }

        } else if (cmd === 'help' || cmd === 'bantuan' || cmd === '?') {
          reply = getHelp()

        } else {
          reply = 'Halo! Saya bot Kedai Nagih 🤖\nKetik *help* untuk bantuan.'
        }

        await sock.sendMessage(sender, { text: reply })
      } catch (err) {
        console.error('Error:', err)
        await sock.sendMessage(sender, { text: '❌ Terjadi kesalahan.' })
      }
    }
  })
}

console.log('╔══════════════════════════════════╗')
console.log('║     🤖 KEDAI NAGIH WA BOT        ║')
console.log('╚══════════════════════════════════╝')
console.log('Memulai bot...\n')

startBot().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
