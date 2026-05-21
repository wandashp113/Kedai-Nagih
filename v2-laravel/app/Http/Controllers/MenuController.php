<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function index()
    {
        $menus = Menu::orderBy('created_at', 'desc')->get();
        return view('index', compact('menus'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama' => 'required|string|max:255',
            'harga' => 'required|integer|min:0',
            'kategori' => 'required|string',
            'tersedia' => 'boolean',
            'gambar' => 'nullable|string',
        ]);
        $data['tersedia'] = $request->has('tersedia');
        Menu::create($data);
        return redirect()->route('home')->with('success', 'Menu berhasil ditambahkan!');
    }

    public function update(Request $request, Menu $menu)
    {
        $data = $request->validate([
            'nama' => 'required|string|max:255',
            'harga' => 'required|integer|min:0',
            'kategori' => 'required|string',
            'tersedia' => 'boolean',
            'gambar' => 'nullable|string',
        ]);
        $data['tersedia'] = $request->has('tersedia');
        $menu->update($data);
        return redirect()->route('home')->with('success', 'Menu berhasil diperbarui!');
    }

    public function destroy(Menu $menu)
    {
        $menu->delete();
        return redirect()->route('home')->with('success', 'Menu berhasil dihapus!');
    }

    public function toggle(Menu $menu)
    {
        $menu->update(['tersedia' => !$menu->tersedia]);
        return redirect()->route('home');
    }
}
