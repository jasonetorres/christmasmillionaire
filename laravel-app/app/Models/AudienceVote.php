<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AudienceVote extends Model
{
    use HasUuids;

    protected $table = 'audience_votes';

    protected $fillable = [
        'game_state_id',
        'answer',
    ];
}
