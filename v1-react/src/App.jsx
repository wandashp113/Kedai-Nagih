import { useState, useEffect, useRef } from 'react'

const WA_NUMBER = import.meta.env.VITE_WA_NUMBER || '6281234567890'
const NAMA_TOKO = import.meta.env.VITE_NAMA_TOKO || 'Kedai Nagih'
const TAGLINE = import.meta.env.VITE_TAGLINE || 'Makanan Enak, Bikin Nagih!'
const ALAMAT = import.meta.env.VITE_ALAMAT || 'Jl. Merdeka No. 123, Jakarta'
const API_URL = '/api/menu'

function formatWA(message) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`
}

function App() {
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [search, setSearch] = useState('')
  const [activeKategori, setActiveKategori] = useState('Semua')

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => { setMenus(data); setLoading(false) })
      .catch(() => { setLoading(false) })
  }, [])

  const kategoriList = ['Semua', ...new Set(menus.map(m => m.kategori))]

  const filteredMenus = menus.filter(m => {
    const matchSearch = m.nama.toLowerCase().includes(search.toLowerCase())
    const matchKategori = activeKategori === 'Semua' || m.kategori === activeKategori
    return matchSearch && matchKategori
  })

  const grouped = {}
  filteredMenus.forEach(m => {
    if (!grouped[m.kategori]) grouped[m.kategori] = []
    grouped[m.kategori].push(m)
  })

  function addToCart(menu) {
    setCart(prev => {
      const exist = prev.find(c => c.id === menu.id)
      if (exist) {
        return prev.map(c => c.id === menu.id ? { ...c, qty: c.qty + 1 } : c)
      }
      return [...prev, { ...menu, qty: 1 }]
    })
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(c => c.id !== id))
  }

  function updateQty(id, delta) {
    setCart(prev => prev.map(c =>
      c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c
    ))
  }

  function totalCart() {
    return cart.reduce((sum, c) => sum + c.harga * c.qty, 0)
  }

  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(null)

  function handleUpload(menuId, file) {
    if (!file) return
    setUploading(menuId)
    const formData = new FormData()
    formData.append('gambar', file)
    fetch(`/api/upload/${menuId}`, { method: 'POST', body: formData })
      .then(res => res.json())
      .then(() => {
        fetch(API_URL).then(r => r.json()).then(setMenus)
      })
      .finally(() => setUploading(null))
  }

  function checkoutWA() {
    if (cart.length === 0) return
    let msg = `Halo Kak, saya mau order dari *${NAMA_TOKO}*:\n\n`
    cart.forEach(c => {
      msg += `- ${c.nama}${c.porsi ? ` (${c.porsi})` : ''} x${c.qty} = Rp${(c.harga * c.qty).toLocaleString()}\n`
    })
    msg += `\nTotal: Rp${totalCart().toLocaleString()}\n\n`
    msg += `Alamat: ${ALAMAT}\n`
    msg += 'Nama:\nCatatan:'
    window.open(formatWA(msg), '_blank')
  }

  if (loading) return <div className="loading">Memuat menu...</div>

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1 className="logo">🍽️ {NAMA_TOKO}</h1>
          <p className="tagline">{TAGLINE}</p>
          <div className="header-actions">
            <button className="btn btn-cart" onClick={() => setShowCart(true)}>
              🛒 {cart.reduce((s, c) => s + c.qty, 0)}
            </button>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <h2>Selamat Datang di {NAMA_TOKO}</h2>
          <p>{TAGLINE}</p>
          <p className="wa-info">📱 <a href={formatWA('Halo Kak, saya mau order!')} target="_blank">{WA_NUMBER}</a></p>
          <p className="alamat">📍 {ALAMAT}</p>
        </div>
      </section>

      <section className="menu-section container">
        <div className="menu-toolbar">
          <div className="kategori-filter">
            {kategoriList.map(k => (
              <button
                key={k}
                className={`kategori-btn ${activeKategori === k ? 'active' : ''}`}
                onClick={() => setActiveKategori(k)}
              >
                {k}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="Cari menu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {Object.entries(grouped).map(([kategori, items]) => (
          <div key={kategori} className="kategori-group">
            <h2 className="kategori-title">{kategori}</h2>
            <div className="menu-grid">
              {items.map(menu => (
                <div key={menu.id} className={`menu-card ${!menu.tersedia ? 'unavailable' : ''}`}>
                  <div className="menu-img-wrapper" onClick={() => document.getElementById(`file-${menu.id}`).click()}>
                    {menu.gambar ? (
                      <img src={menu.gambar} alt={menu.nama} className="menu-img" loading="lazy" />
                    ) : (
                      <div className="menu-img-placeholder">🍽️</div>
                    )}
                    <div className="menu-img-overlay">
                      {uploading === menu.id ? '⏳' : '📷'}
                    </div>
                    <input
                      type="file"
                      id={`file-${menu.id}`}
                      accept="image/*"
                      className="file-input"
                      onChange={e => handleUpload(menu.id, e.target.files[0])}
                    />
                  </div>
                  <div className="menu-body">
                    <h3>{menu.nama}</h3>
                    {menu.porsi && <span className="menu-porsi">{menu.porsi}</span>}
                    <p className="menu-price">Rp{menu.harga.toLocaleString()}</p>
                    <p className="menu-status">{menu.tersedia ? 'Tersedia' : 'Habis'}</p>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => addToCart(menu)}
                      disabled={!menu.tersedia}
                      style={{ width: '100%' }}
                    >
                      + Keranjang
                    </button>
                    <a
                      href={formatWA(`Halo Kak, saya mau order ${menu.nama}${menu.porsi ? ` (${menu.porsi})` : ''}`)}
                      target="_blank"
                      className="btn btn-sm btn-wa"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Order WA
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filteredMenus.length === 0 && (
          <p className="empty-msg">Menu tidak ditemukan.</p>
        )}
      </section>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 {NAMA_TOKO} — {ALAMAT}</p>
        </div>
      </footer>

      {showCart && (
        <div className="modal-overlay" onClick={() => setShowCart(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🛒 Keranjang</h2>
              <button className="modal-close" onClick={() => setShowCart(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {cart.length === 0 ? (
                <p className="empty-msg">Keranjang kosong.</p>
              ) : (
                cart.map(c => (
                  <div key={c.id} className="cart-item">
                    <div className="cart-info">
                      <h4>{c.nama} {c.porsi && <span className="cart-porsi">{c.porsi}</span>}</h4>
                      <p>Rp{c.harga.toLocaleString()} x{c.qty}</p>
                    </div>
                    <div className="cart-qty">
                      <button onClick={() => updateQty(c.id, -1)}>-</button>
                      <span>{c.qty}</span>
                      <button onClick={() => updateQty(c.id, 1)}>+</button>
                    </div>
                    <p className="cart-subtotal">Rp{(c.harga * c.qty).toLocaleString()}</p>
                    <button className="btn btn-sm btn-danger" onClick={() => removeFromCart(c.id)}>&times;</button>
                  </div>
                ))
              )}
            </div>
            <div className="modal-footer">
              <p className="cart-total">Rp{totalCart().toLocaleString()}</p>
              <button className="btn btn-success" onClick={checkoutWA} disabled={cart.length === 0}>
                📱 Order WA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
