import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.resolve(__dirname, 'shared.db')

const FOOD_IMAGES = {
  'Nasi Goreng Mawut': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop',
  'Mie Goreng Spesial': 'https://images.unsplash.com/photo-1552611052-33e04de1b100?w=400&h=300&fit=crop',
  'Es Teh Manis': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop',
  'Es Jeruk': 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop',
}

export function getDb() {
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  return db
}

export function initDb() {
  const db = getDb()
  db.exec(`
    CREATE TABLE IF NOT EXISTS menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      harga INTEGER NOT NULL,
      kategori TEXT DEFAULT 'Makanan',
      porsi TEXT DEFAULT '',
      tersedia INTEGER DEFAULT 1,
      gambar TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  for (const col of ['gambar', 'porsi']) {
    try { db.exec(`ALTER TABLE menus ADD COLUMN ${col} TEXT DEFAULT ''`) } catch {}
  }

  const count = db.prepare('SELECT COUNT(*) as c FROM menus').get()
  if (count.c === 0) {
    const stmt = db.prepare('INSERT INTO menus (nama, harga, kategori, porsi, gambar) VALUES (?, ?, ?, ?, ?)')
    stmt.run('Nasi Goreng Mawut', 15000, 'Makanan', 'Porsi Besar', FOOD_IMAGES['Nasi Goreng Mawut'])
    stmt.run('Mie Goreng Spesial', 12000, 'Makanan', 'Porsi Sedang', FOOD_IMAGES['Mie Goreng Spesial'])
    stmt.run('Es Teh Manis', 5000, 'Minuman', 'Gelas', FOOD_IMAGES['Es Teh Manis'])
    stmt.run('Es Jeruk', 6000, 'Minuman', 'Gelas', FOOD_IMAGES['Es Jeruk'])
  }
  db.close()
}

export function getMenus() {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM menus ORDER BY id ASC').all()
  db.close()
  return rows
}

export function getMenu(id) {
  const db = getDb()
  const row = db.prepare('SELECT * FROM menus WHERE id = ?').get(id)
  db.close()
  return row
}

export function createMenu(nama, harga, kategori = 'Makanan', porsi = '', gambar = '') {
  const db = getDb()
  const result = db.prepare(
    'INSERT INTO menus (nama, harga, kategori, tersedia, porsi, gambar) VALUES (?, ?, ?, 1, ?, ?)'
  ).run(nama, harga, kategori, porsi, gambar)
  db.close()
  return result.lastInsertRowid
}

export function updateMenu(id, data) {
  const db = getDb()
  const fields = []
  const values = []
  for (const [key, val] of Object.entries(data)) {
    if (['nama', 'harga', 'kategori', 'tersedia', 'porsi', 'gambar'].includes(key)) {
      fields.push(`${key} = ?`)
      values.push(val)
    }
  }
  if (fields.length === 0) { db.close(); return false }
  fields.push("updated_at = datetime('now')")
  values.push(id)
  const result = db.prepare(`UPDATE menus SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  db.close()
  return result.changes > 0
}

export function deleteMenu(id) {
  const db = getDb()
  const result = db.prepare('DELETE FROM menus WHERE id = ?').run(id)
  db.close()
  return result.changes > 0
}
