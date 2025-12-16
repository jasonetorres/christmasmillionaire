<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameState;
use App\Models\TriviaQuestion;
use App\Events\GameStateUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GameStateController extends Controller
{
    public function show()
    {
        $gameState = GameState::current();

        if (!$gameState) {
            return response()->json(null);
        }

        $gameState->load('currentQuestion');

        return response()->json($gameState);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'current_question_id' => 'nullable|uuid',
            'current_level' => 'integer|min:1|max:15',
            'game_status' => 'string',
            'selected_answer' => 'nullable|in:A,B,C,D',
            'show_correct' => 'boolean',
            'lifeline_fifty_fifty_used' => 'boolean',
            'lifeline_phone_used' => 'boolean',
            'lifeline_audience_used' => 'boolean',
            'removed_answers' => 'array',
            'active_lifeline' => 'nullable|string',
            'total_winnings' => 'string',
            'friend_name' => 'string',
        ]);

        $gameState = GameState::current();

        if (!$gameState) {
            $gameState = GameState::create($validated);
        } else {
            $gameState->update($validated);
        }

        $gameState = $gameState->fresh()->load('currentQuestion');

        broadcast(new GameStateUpdated($gameState))->toOthers();

        return response()->json($gameState);
    }

    public function startNewGame()
    {
        DB::table('game_state')->delete();

        $question = TriviaQuestion::unused()->byDifficulty(1)->inRandomOrder()->first();

        if (!$question) {
            return response()->json(['error' => 'No questions available for level 1'], 400);
        }

        $gameState = GameState::create([
            'current_question_id' => $question->id,
            'current_level' => 1,
            'game_status' => 'question_shown',
            'selected_answer' => null,
            'show_correct' => false,
            'lifeline_fifty_fifty_used' => false,
            'lifeline_phone_used' => false,
            'lifeline_audience_used' => false,
            'removed_answers' => [],
            'active_lifeline' => null,
            'total_winnings' => '$0',
            'friend_name' => '',
        ]);

        $gameState = $gameState->fresh()->load('currentQuestion');

        broadcast(new GameStateUpdated($gameState));

        return response()->json($gameState);
    }

    public function nextQuestion()
    {
        $gameState = GameState::current();

        if (!$gameState) {
            return response()->json(['error' => 'No active game'], 400);
        }

        $nextLevel = $gameState->current_level + 1;

        if ($nextLevel > 15) {
            return response()->json(['error' => 'Game completed'], 400);
        }

        $question = TriviaQuestion::unused()->byDifficulty($nextLevel)->inRandomOrder()->first();

        if (!$question) {
            return response()->json(['error' => "No questions available for level $nextLevel"], 400);
        }

        $gameState->update([
            'current_question_id' => $question->id,
            'current_level' => $nextLevel,
            'game_status' => 'question_shown',
            'selected_answer' => null,
            'show_correct' => false,
            'removed_answers' => [],
            'active_lifeline' => null,
        ]);

        $gameState = $gameState->fresh()->load('currentQuestion');

        broadcast(new GameStateUpdated($gameState));

        return response()->json($gameState);
    }

    public function reset()
    {
        TriviaQuestion::query()->update(['is_used' => false]);
        DB::table('game_state')->delete();
        DB::table('audience_votes')->delete();

        broadcast(new GameStateUpdated(new GameState()));

        return response()->json(['message' => 'Game reset successfully']);
    }
}
