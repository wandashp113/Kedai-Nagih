<?php

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Menu::create(['nama' => 'Nasi Goreng Mawut', 'harga' => 15000, 'kategori' => 'Makanan', 'gambar' => 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop']);
        Menu::create(['nama' => 'Mie Goreng Spesial', 'harga' => 12000, 'kategori' => 'Makanan', 'gambar' => 'https://images.unsplash.com/photo-1552611052-33e04de1b100?w=400&h=300&fit=crop']);
        Menu::create(['nama' => 'Es Teh Manis', 'harga' => 5000, 'kategori' => 'Minuman', 'gambar' => 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop']);
        Menu::create(['nama' => 'Es Jeruk', 'harga' => 6000, 'kategori' => 'Minuman', 'gambar' => 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop']);
    }
}
