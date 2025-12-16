<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TriviaQuestion;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    public function index()
    {
        $questions = TriviaQuestion::orderBy('difficulty_level')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($questions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'question' => 'required|string',
            'answer_a' => 'required|string',
            'answer_b' => 'required|string',
            'answer_c' => 'required|string',
            'answer_d' => 'required|string',
            'correct_answer' => 'required|in:A,B,C,D',
            'difficulty_level' => 'required|integer|min:1|max:15',
            'category' => 'nullable|string',
        ]);

        $question = TriviaQuestion::create($validated);

        return response()->json($question, 201);
    }

    public function update(Request $request, string $id)
    {
        $question = TriviaQuestion::findOrFail($id);

        $validated = $request->validate([
            'question' => 'string',
            'answer_a' => 'string',
            'answer_b' => 'string',
            'answer_c' => 'string',
            'answer_d' => 'string',
            'correct_answer' => 'in:A,B,C,D',
            'difficulty_level' => 'integer|min:1|max:15',
            'category' => 'nullable|string',
        ]);

        $question->update($validated);

        return response()->json($question);
    }

    public function destroy(string $id)
    {
        $question = TriviaQuestion::findOrFail($id);
        $question->delete();

        return response()->json(['message' => 'Question deleted successfully']);
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'questions' => 'required|array',
            'questions.*.question' => 'required|string',
            'questions.*.answer_a' => 'required|string',
            'questions.*.answer_b' => 'required|string',
            'questions.*.answer_c' => 'required|string',
            'questions.*.answer_d' => 'required|string',
            'questions.*.correct_answer' => 'required|in:A,B,C,D',
            'questions.*.difficulty_level' => 'required|integer|min:1|max:15',
            'questions.*.category' => 'nullable|string',
        ]);

        $questions = [];
        foreach ($validated['questions'] as $questionData) {
            $questions[] = TriviaQuestion::create($questionData);
        }

        return response()->json([
            'message' => 'Questions created successfully',
            'count' => count($questions),
        ], 201);
    }
}
