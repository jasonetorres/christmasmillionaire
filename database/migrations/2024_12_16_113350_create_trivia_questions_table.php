<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trivia_questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('question');
            $table->text('answer_a');
            $table->text('answer_b');
            $table->text('answer_c');
            $table->text('answer_d');
            $table->string('correct_answer', 1);
            $table->integer('difficulty_level');
            $table->string('category')->default('General');
            $table->boolean('is_used')->default(false);
            $table->timestamps();
            $table->index('difficulty_level');
            $table->index('is_used');
            $table->index(['difficulty_level', 'is_used']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trivia_questions');
    }
};
