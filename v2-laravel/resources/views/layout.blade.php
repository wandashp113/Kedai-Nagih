<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kedai Nagih - Makanan Enak</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <h1 class="logo">🍽️ Kedai Nagih</h1>
            <p class="tagline">Makanan Enak, Bikin Nagih!</p>
            <div class="header-actions">
                <button class="btn btn-primary" onclick="openModal('add')">+ Tambah Menu</button>
                <button class="btn btn-cart" id="cartBtn" onclick="toggleCart()">🛒 Keranjang (0)</button>
            </div>
        </div>
    </header>

    <section class="hero">
        <div class="container">
            <h2>Selamat Datang di Kedai Nagih</h2>
            <p>Nikmati berbagai makanan dan minuman lezat dengan harga merakyat.</p>
            <p class="wa-info">📱 Order via WhatsApp: <a href="https://wa.me/{{ env('WA_NUMBER', '6282141071853') }}" target="_blank">{{ env('WA_NUMBER', '6282141071853') }}</a></p>
        </div>
    </section>

    @if (session('success'))
        <div class="alert alert-success">{{ session('success') }}</div>
    @endif

    <main>
        @yield('content')
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2026 Kedai Nagih. All rights reserved.</p>
        </div>
    </footer>

    <!-- Modal Form -->
    <div class="modal-overlay" id="formModal" onclick="closeModal('formModal')">
        <div class="modal" onclick="event.stopPropagation()">
            <div class="modal-header">
                <h2 id="formTitle">Tambah Menu Baru</h2>
                <button class="modal-close" onclick="closeModal('formModal')">&times;</button>
            </div>
            <form id="menuForm" method="POST" action="{{ route('menu.store') }}">
                @csrf
                <input type="hidden" name="_method" id="formMethod" value="POST">
                <input type="hidden" name="menu_id" id="menuId">
                <div class="modal-body">
                    <div class="form-group">
                        <input type="text" name="nama" id="menuNama" placeholder="Nama Menu" required>
                    </div>
                    <div class="form-group">
                        <input type="number" name="harga" id="menuHarga" placeholder="Harga (Rp)" required>
                    </div>
                    <div class="form-group">
                        <select name="kategori" id="menuKategori">
                            <option value="Makanan">Makanan</option>
                            <option value="Minuman">Minuman</option>
                            <option value="Cemilan">Cemilan</option>
                        </select>
                    </div>
                    <div class="form-group checkbox-group">
                        <label>
                            <input type="checkbox" name="tersedia" id="menuTersedia" checked>
                            Tersedia
                        </label>
                    </div>
                    <div class="form-group">
                        <input type="text" name="gambar" id="menuGambar" placeholder="URL Gambar (opsional)">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('formModal')">Batal</button>
                    <button type="submit" class="btn btn-primary" id="formSubmit">Tambah</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Cart Modal -->
    <div class="modal-overlay" id="cartModal" onclick="closeModal('cartModal')">
        <div class="modal" onclick="event.stopPropagation()">
            <div class="modal-header">
                <h2>🛒 Keranjang Belanja</h2>
                <button class="modal-close" onclick="closeModal('cartModal')">&times;</button>
            </div>
            <div class="modal-body" id="cartBody">
                <p class="empty-msg">Keranjang kosong.</p>
            </div>
            <div class="modal-footer">
                <p class="cart-total" id="cartTotal">Total: Rp0</p>
                <button class="btn btn-success" onclick="checkoutWA()" id="checkoutBtn" disabled>📱 Order via WhatsApp</button>
            </div>
        </div>
    </div>

    <script src="/js/app.js"></script>
</body>
</html>
