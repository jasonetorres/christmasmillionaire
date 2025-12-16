<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AudienceVote;
use App\Models\GameState;
use App\Events\AudienceVotesUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AudienceVoteController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'answer' => 'required|in:A,B,C,D',
        ]);

        $gameState = GameState::current();

        if (!$gameState) {
            return response()->json(['error' => 'No active game'], 400);
        }

        $vote = AudienceVote::create([
            'game_state_id' => $gameState->id,
            'answer' => $validated['answer'],
        ]);

        $results = $this->calculateResults($gameState->id);
        broadcast(new AudienceVotesUpdated($results));

        return response()->json($vote, 201);
    }

    public function results()
    {
        $gameState = GameState::current();

        if (!$gameState) {
            return response()->json(['error' => 'No active game'], 400);
        }

        $results = $this->calculateResults($gameState->id);

        return response()->json($results);
    }

    public function clear()
    {
        $gameState = GameState::current();

        if (!$gameState) {
            return response()->json(['error' => 'No active game'], 400);
        }

        DB::table('audience_votes')
            ->where('game_state_id', $gameState->id)
            ->delete();

        return response()->json(['message' => 'Votes cleared successfully']);
    }

    private function calculateResults(string $gameStateId): array
    {
        $votes = DB::table('audience_votes')
            ->select('answer', DB::raw('count(*) as count'))
            ->where('game_state_id', $gameStateId)
            ->groupBy('answer')
            ->get();

        $total = $votes->sum('count');

        $results = [];
        foreach (['A', 'B', 'C', 'D'] as $answer) {
            $vote = $votes->firstWhere('answer', $answer);
            $count = $vote ? $vote->count : 0;
            $percentage = $total > 0 ? round(($count / $total) * 100) : 0;

            $results[$answer] = [
                'count' => $count,
                'percentage' => $percentage,
            ];
        }

        return $results;
    }
}
