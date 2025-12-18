<?php

use App\Http\Controllers\GameController;
use Illuminate\Support\Facades\Route;

Route::get('/', [GameController::class, 'welcome'])->name('welcome');
Route::get('/host', [GameController::class, 'host'])->name('host');
Route::get('/display', [GameController::class, 'display'])->name('display');
Route::get('/vote', [GameController::class, 'vote'])->name('vote');
