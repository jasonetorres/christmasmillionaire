<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GameController;

Route::get('/', [GameController::class, 'index']);
Route::get('/host', [GameController::class, 'host']);
Route::get('/display', [GameController::class, 'display']);
Route::get('/admin', [GameController::class, 'admin']);
Route::get('/vote', [GameController::class, 'vote']);
