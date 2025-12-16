<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AudienceVotesUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public array $results
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('game-updates');
    }

    public function broadcastWith(): array
    {
        return [
            'results' => $this->results,
        ];
    }
}
