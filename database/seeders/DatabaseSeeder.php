<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use App\Models\TriviaQuestion;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/questions.json');

        if (! File::exists($path)) {
            $this->command->error('questions.json not found at database/data/questions.json');
            return;
        }

        $questions = json_decode(File::get($path), true);

        if (! is_array($questions)) {
            $this->command->error('questions.json is not valid JSON');
            return;
        }

        $rows = [];

        foreach ($questions as $q) {
            $rows[] = [
                'id' => (string) Str::uuid(),
                'question' => $q['question'],
                'answer_a' => $q['answer_a'],
                'answer_b' => $q['answer_b'],
                'answer_c' => $q['answer_c'],
                'answer_d' => $q['answer_d'],
                'correct_answer' => $q['correct_answer'],
                'difficulty_level' => (int) $q['difficulty_level'],
                'category' => $q['category'] ?? 'General',
                'is_used' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Insert in chunks to avoid memory / packet limits
        collect($rows)->chunk(500)->each(function ($chunk) {
            TriviaQuestion::insert($chunk->toArray());
        });

        $this->command->info('Seeded trivia questions: ' . count($rows));
    }
}
