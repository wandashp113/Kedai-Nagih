@extends('layout')

@section('content')
<section class="menu-section container">
    <div class="menu-header">
        <h2>📋 Menu Kami</h2>
        <input type="text" class="search-input" placeholder="Cari menu..." id="searchInput" oninput="filterMenu(this.value)">
    </div>

    <div class="menu-grid" id="menuGrid">
        @forelse ($menus as $menu)
            <div class="menu-card @if(!$menu->tersedia) unavailable @endif" data-name="{{ strtolower($menu->nama) }}">
                <div class="menu-img-wrapper">
                    @if($menu->gambar)
                        <img src="{{ $menu->gambar }}" alt="{{ $menu->nama }}" class="menu-img" loading="lazy">
                    @else
                        <div class="menu-img-placeholder">🍽️</div>
                    @endif
                </div>
                <div class="menu-body">
                <div class="menu-badge">{{ $menu->kategori }}</div>
                <h3>{{ $menu->nama }}</h3>
                <p class="menu-price">Rp{{ number_format($menu->harga, 0, ',', '.') }}</p>
                <p class="menu-status">{{ $menu->tersedia ? '✅ Tersedia' : '❌ Habis' }}</p>
                <div class="menu-actions">
                    <button class="btn btn-sm btn-success" onclick="addToCart({{ $menu->id }}, '{{ $menu->nama }}', {{ $menu->harga }})" @if(!$menu->tersedia) disabled @endif>
                        + Keranjang
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editMenu({{ $menu->id }}, '{{ $menu->nama }}', {{ $menu->harga }}, '{{ $menu->kategori }}', {{ $menu->tersedia ? 'true' : 'false' }}, '{{ $menu->gambar ?? '' }}')">Edit</button>
                    <form action="{{ route('menu.destroy', $menu) }}" method="POST" style="display:inline" onsubmit="return confirm('Yakin hapus menu ini?')">
                        @csrf @method('DELETE')
                        <button class="btn btn-sm btn-danger">Hapus</button>
                    </form>
                </div>
                <a href="https://wa.me/{{ env('WA_NUMBER', '6282141071853') }}?text={{ urlencode('Halo Kak, saya mau order ' . $menu->nama) }}" target="_blank" class="btn btn-sm btn-wa">📱 Order WA</a>
                </div>
            </div>
        @empty
            <p class="empty-msg">Belum ada menu. Tambahkan menu baru!</p>
        @endforelse
    </div>
</section>
@endsection
