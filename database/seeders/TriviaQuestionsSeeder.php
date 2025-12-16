<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TriviaQuestionsSeeder extends Seeder
{
    public function run(): void
    {
        $json = file_get_contents(database_path('data/questions.json'));
        $questions = json_decode($json, true);

        $chunks = array_chunk($questions, 100);

        foreach ($chunks as $chunk) {
            $data = array_map(function ($q) {
                return [
                    'id' => Str::uuid(),
                    'question' => $q['question'],
                    'answer_a' => $q['answer_a'],
                    'answer_b' => $q['answer_b'],
                    'answer_c' => $q['answer_c'],
                    'answer_d' => $q['answer_d'],
                    'correct_answer' => $q['correct_answer'],
                    'difficulty_level' => $q['difficulty_level'],
                    'category' => $q['category'],
                    'is_used' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }, $chunk);

            DB::table('trivia_questions')->insert($data);
        }

        $this->command->info('Successfully seeded ' . count($questions) . ' trivia questions!');
    }
}
