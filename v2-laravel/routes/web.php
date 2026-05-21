<?php

use App\Http\Controllers\MenuController;
use Illuminate\Support\Facades\Route;

Route::get('/', [MenuController::class, 'index'])->name('home');
Route::resource('menu', MenuController::class)->except(['show']);
Route::post('menu/toggle/{menu}', [MenuController::class, 'toggle'])->name('menu.toggle');
