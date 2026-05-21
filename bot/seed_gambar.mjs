import Database from '/home/k1dd13/web/kedai_nagih/bot/node_modules/better-sqlite3/lib/index.js'
const db = new Database('/home/k1dd13/web/kedai_nagih/v2-laravel/database/database.sqlite')
try {
  db.exec("ALTER TABLE menus ADD COLUMN gambar TEXT DEFAULT ''")
} catch (e) {}
const stmt = db.prepare("UPDATE menus SET gambar = ? WHERE id = ? AND (gambar IS NULL OR gambar = '')")
stmt.run('https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop', 1)
stmt.run('https://images.unsplash.com/photo-1552611052-33e04de1b100?w=400&h=300&fit=crop', 2)
stmt.run('https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop', 3)
stmt.run('https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop', 4)
const rows = db.prepare('SELECT id, nama, gambar FROM menus').all()
rows.forEach(r => console.log(r.id, r.nama, r.gambar ? 'OK' : 'MISSING'))
db.close()
