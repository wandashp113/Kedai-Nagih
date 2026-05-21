const WA_NUMBER = '6282141071853'
let cart = []

function formatWA(msg) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`
}

function openModal(type, data = null) {
  if (type === 'add') {
    document.getElementById('formTitle').textContent = 'Tambah Menu Baru'
    document.getElementById('formMethod').value = 'POST'
    document.getElementById('menuForm').action = '/menu'
    document.getElementById('menuNama').value = ''
    document.getElementById('menuHarga').value = ''
    document.getElementById('menuKategori').value = 'Makanan'
    document.getElementById('menuTersedia').checked = true
    document.getElementById('menuGambar').value = ''
    document.getElementById('formSubmit').textContent = 'Tambah'
  }
  document.getElementById('formModal').classList.add('show')
}

function closeModal(id) {
  document.getElementById(id).classList.remove('show')
}

function editMenu(id, nama, harga, kategori, tersedia, gambar) {
  document.getElementById('formTitle').textContent = 'Edit Menu'
  document.getElementById('formMethod').value = 'PUT'
  document.getElementById('menuForm').action = `/menu/${id}`
  document.getElementById('menuNama').value = nama
  document.getElementById('menuHarga').value = harga
  document.getElementById('menuKategori').value = kategori
  document.getElementById('menuTersedia').checked = tersedia
  document.getElementById('menuGambar').value = gambar || ''
  document.getElementById('formSubmit').textContent = 'Simpan'
  document.getElementById('formModal').classList.add('show')
}

function filterMenu(query) {
  const cards = document.querySelectorAll('.menu-card')
  const q = query.toLowerCase()
  cards.forEach(c => {
    const name = c.getAttribute('data-name') || ''
    c.style.display = name.includes(q) ? '' : 'none'
  })
}

function addToCart(id, nama, harga) {
  const exist = cart.find(c => c.id === id)
  if (exist) {
    exist.qty++
  } else {
    cart.push({ id, nama, harga, qty: 1 })
  }
  updateCartUI()
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id)
  updateCartUI()
}

function updateQty(id, delta) {
  const item = cart.find(c => c.id === id)
  if (item) {
    item.qty = Math.max(1, item.qty + delta)
    updateCartUI()
  }
}

function totalCart() {
  return cart.reduce((sum, c) => sum + c.harga * c.qty, 0)
}

function updateCartUI() {
  const totalItems = cart.reduce((s, c) => s + c.qty, 0)
  document.getElementById('cartBtn').textContent = `🛒 Keranjang (${totalItems})`

  const body = document.getElementById('cartBody')
  const total = document.getElementById('cartTotal')
  const checkout = document.getElementById('checkoutBtn')

  if (cart.length === 0) {
    body.innerHTML = '<p class="empty-msg">Keranjang kosong.</p>'
    total.textContent = 'Total: Rp0'
    checkout.disabled = true
    return
  }

  let html = ''
  cart.forEach(c => {
    html += `
      <div class="cart-item">
        <div class="cart-info">
          <h4>${c.nama}</h4>
          <p>Rp${c.harga.toLocaleString()} x${c.qty}</p>
        </div>
        <div class="cart-qty">
          <button onclick="updateQty(${c.id}, -1)">-</button>
          <span>${c.qty}</span>
          <button onclick="updateQty(${c.id}, 1)">+</button>
        </div>
        <p class="cart-subtotal">Rp${(c.harga * c.qty).toLocaleString()}</p>
        <button class="btn btn-sm btn-danger" onclick="removeFromCart(${c.id})">&times;</button>
      </div>
    `
  })
  body.innerHTML = html
  total.textContent = `Total: Rp${totalCart().toLocaleString()}`
  checkout.disabled = false
}

function toggleCart() {
  document.getElementById('cartModal').classList.add('show')
}

function checkoutWA() {
  if (cart.length === 0) return
  let msg = 'Halo Kak, saya mau order:\n\n'
  cart.forEach(c => {
    msg += `- ${c.nama} x${c.qty} = Rp${(c.harga * c.qty).toLocaleString()}\n`
  })
  msg += `\nTotal: Rp${totalCart().toLocaleString()}\n\n`
  msg += 'Nama:\nAlamat:\nCatatan:'
  window.open(formatWA(msg), '_blank')
}

// Close modal on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'))
  }
})
