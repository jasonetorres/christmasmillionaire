<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_state', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('current_question_id')->nullable();
            $table->integer('current_level')->default(1);
            $table->string('game_status')->default('waiting');
            $table->string('selected_answer', 1)->nullable();
            $table->boolean('show_correct')->default(false);
            $table->boolean('lifeline_fifty_fifty_used')->default(false);
            $table->boolean('lifeline_phone_used')->default(false);
            $table->boolean('lifeline_audience_used')->default(false);
            $table->json('removed_answers')->default('[]');
            $table->string('total_winnings')->default('$0');
            $table->string('active_lifeline')->nullable();
            $table->string('friend_name')->nullable();
            $table->timestamps();

            $table->foreign('current_question_id')
                  ->references('id')
                  ->on('trivia_questions')
                  ->nullOnDelete();

            $table->index('updated_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_state');
    }
};
