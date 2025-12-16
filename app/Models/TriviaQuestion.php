<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TriviaQuestion extends Model
{
    use HasUuids;

    protected $table = 'trivia_questions';

    protected $fillable = [
        'question',
        'answer_a',
        'answer_b',
        'answer_c',
        'answer_d',
        'correct_answer',
        'difficulty_level',
        'category',
        'is_used',
    ];

    protected $casts = [
        'is_used' => 'boolean',
        'difficulty_level' => 'integer',
    ];

    public function scopeUnused($query)
    {
        return $query->where('is_used', false);
    }

    public function scopeByDifficulty($query, int $level)
    {
        return $query->where('difficulty_level', $level);
    }
}
