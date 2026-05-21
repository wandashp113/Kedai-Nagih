<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    protected $fillable = ['nama', 'harga', 'kategori', 'tersedia', 'gambar'];
    protected $casts = ['tersedia' => 'boolean', 'harga' => 'integer'];
}
