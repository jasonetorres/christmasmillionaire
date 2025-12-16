<?php

namespace App\Events;

use App\Models\GameState;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameStateUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public GameState $gameState
    ) {
        if ($this->gameState->id) {
            $this->gameState->load('currentQuestion');
        }
    }

    public function broadcastOn(): Channel
    {
        return new Channel('game-updates');
    }

    public function broadcastWith(): array
    {
        return [
            'gameState' => $this->gameState->toArray(),
        ];
    }
}
