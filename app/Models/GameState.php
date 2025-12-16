<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameState extends Model
{
    use HasUuids;

    protected $table = 'game_state';

    protected $fillable = [
        'current_question_id',
        'current_level',
        'game_status',
        'selected_answer',
        'show_correct',
        'lifeline_fifty_fifty_used',
        'lifeline_phone_used',
        'lifeline_audience_used',
        'removed_answers',
        'active_lifeline',
        'total_winnings',
        'friend_name',
    ];

    protected $casts = [
        'current_level' => 'integer',
        'show_correct' => 'boolean',
        'lifeline_fifty_fifty_used' => 'boolean',
        'lifeline_phone_used' => 'boolean',
        'lifeline_audience_used' => 'boolean',
        'removed_answers' => 'array',
    ];

    /**
     * Model-level defaults (NOT database defaults)
     */
    protected $attributes = [
        'removed_answers' => '[]',
        'current_level' => 1,
        'game_status' => 'waiting',
        'show_correct' => false,
        'lifeline_fifty_fifty_used' => false,
        'lifeline_phone_used' => false,
        'lifeline_audience_used' => false,
        'total_winnings' => '$0',
    ];

    public function currentQuestion(): BelongsTo
    {
        return $this->belongsTo(TriviaQuestion::class, 'current_question_id');
    }

    public static function current(): ?self
    {
        return static::first();
    }
}
