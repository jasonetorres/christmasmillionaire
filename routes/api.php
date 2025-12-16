<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\GameStateController;
use App\Http\Controllers\Api\QuestionController;
use App\Http\Controllers\Api\AudienceVoteController;

Route::prefix('game-state')->group(function () {
    Route::get('/', [GameStateController::class, 'show']);
    Route::post('/', [GameStateController::class, 'update']);
    Route::post('/start', [GameStateController::class, 'startNewGame']);
    Route::post('/next', [GameStateController::class, 'nextQuestion']);
    Route::post('/reset', [GameStateController::class, 'reset']);
});

Route::prefix('questions')->group(function () {
    Route::get('/', [QuestionController::class, 'index']);
    Route::post('/', [QuestionController::class, 'store']);
    Route::post('/bulk', [QuestionController::class, 'bulkStore']);
    Route::put('/{id}', [QuestionController::class, 'update']);
    Route::delete('/{id}', [QuestionController::class, 'destroy']);
});

Route::prefix('votes')->group(function () {
    Route::post('/', [AudienceVoteController::class, 'store']);
    Route::get('/results', [AudienceVoteController::class, 'results']);
    Route::post('/clear', [AudienceVoteController::class, 'clear']);
});
