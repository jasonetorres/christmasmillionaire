<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audience_votes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('game_state_id');
            $table->string('vote', 1);
            $table->timestamps();

            $table->foreign('game_state_id')
                  ->references('id')
                  ->on('game_state')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audience_votes');
    }
};
