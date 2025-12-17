import { useState, useEffect } from 'react';
import { Play, SkipForward, RotateCcw, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GameState, TriviaQuestion } from '../types';
import { Lifelines } from '../Components/Lifelines';
import { QuestionDisplay } from '../Components/QuestionDisplay';

const moneyLadder = ['$100', '$200', '$300', '$500', '$1,000', '$2,000', '$4,000', '$8,000', '$16,000', '$32,000', '$64,000', '$125,000', '$250,000', '$500,000', '$1,000,000'];

export default function Host() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);

  useEffect(() => {
    loadGameState();
  }, []);

  const loadGameState = async () => {
    const { data } = await supabase
      .from('game_state')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setGameState(data);
      if (data.current_question_id) {
        const { data: question } = await supabase
          .from('trivia_questions')
          .select('*')
          .eq('id', data.current_question_id)
          .maybeSingle();
        setCurrentQuestion(question);
      }
    }
  };

  const startNewGame = async () => {
    await supabase.from('game_state').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('trivia_questions').update({ is_used: false }).eq('is_used', true);

    const { data: questions } = await supabase
      .from('trivia_questions')
      .select('*')
      .eq('difficulty_level', 1)
      .eq('is_used', false);

    if (questions && questions.length > 0) {
      const question = questions[Math.floor(Math.random() * questions.length)];
      await supabase.from('trivia_questions').update({ is_used: true }).eq('id', question.id);

      const { data: newGame } = await supabase
        .from('game_state')
        .insert({
          current_question_id: question.id,
          current_level: 1,
          game_status: 'question_shown',
          total_winnings: '$0',
        })
        .select()
        .single();

      setGameState(newGame);
      setCurrentQuestion(question);
    }
  };

  const updateGameState = async (updates: Partial<GameState>) => {
    if (!gameState) return;

    const { data, error } = await supabase
      .from('game_state')
      .update(updates)
      .eq('id', gameState.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating game state:', error);
      alert('Failed to update game state: ' + error.message);
      return;
    }

    setGameState(data);
  };

  const handleAnswerSelect = async (answer: 'A' | 'B' | 'C' | 'D') => {
    await updateGameState({ selected_answer: answer });
  };

  const showCorrectAnswer = async () => {
    if (!gameState || !currentQuestion) return;

    const isCorrect = gameState.selected_answer === currentQuestion.correct_answer;
    if (!isCorrect) {
      const guaranteedMoney = gameState.current_level <= 5 ? '$0' :
                              gameState.current_level <= 10 ? '$1,000' : '$32,000';
      await updateGameState({
        show_correct: true,
        game_status: 'game_over',
        total_winnings: guaranteedMoney
      });
    } else {
      await updateGameState({ show_correct: true });
    }
  };

  const nextQuestion = async () => {
    if (!gameState) return;

    const nextLevel = gameState.current_level + 1;
    if (nextLevel > 15) {
      alert('Game completed! The contestant wins $1,000,000!');
      return;
    }

    const { data: questions } = await supabase
      .from('trivia_questions')
      .select('*')
      .eq('difficulty_level', nextLevel)
      .eq('is_used', false);

    if (!questions || questions.length === 0) {
      alert('No more questions available at this level');
      return;
    }

    const question = questions[Math.floor(Math.random() * questions.length)];
    await supabase.from('trivia_questions').update({ is_used: true }).eq('id', question.id);
    await supabase.from('audience_votes').delete().eq('game_state_id', gameState.id);

    await updateGameState({
      current_question_id: question.id,
      current_level: nextLevel,
      selected_answer: null,
      show_correct: false,
      removed_answers: [] as any,
      active_lifeline: null,
      total_winnings: moneyLadder[nextLevel - 1],
    });

    setCurrentQuestion(question);
  };

  const resetGame = async () => {
    if (confirm('Reset the game?')) {
      await supabase.from('game_state').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('trivia_questions').update({ is_used: false }).eq('is_used', true);
      setGameState(null);
      setCurrentQuestion(null);
    }
  };

  const handleFiftyFifty = async () => {
    if (!gameState || !currentQuestion) return;
    const correct = currentQuestion.correct_answer;
    const others = ['A', 'B', 'C', 'D'].filter(a => a !== correct);
    const toRemove = others.sort(() => 0.5 - Math.random()).slice(0, 2);

    await updateGameState({
      lifeline_fifty_fifty_used: true,
      removed_answers: toRemove as any,
    });
  };

  const handlePhoneFriend = async () => {
    if (!gameState || !currentQuestion) return;

    await updateGameState({
      lifeline_phone_used: true,
      active_lifeline: 'phone',
    });
  };

  const handleAskAudience = async () => {
    if (!gameState) return;

    await supabase.from('audience_votes').delete().eq('game_state_id', gameState.id);

    await updateGameState({
      lifeline_audience_used: true,
      active_lifeline: 'audience',
    });
  };

  const endLifeline = async () => {
    await updateGameState({ active_lifeline: null });
  };

  if (!gameState || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 p-8 flex items-center justify-center">
        <button
          onClick={startNewGame}
          className="bg-green-600 text-white px-12 py-6 rounded-xl text-2xl font-bold hover:bg-green-700 transition-all shadow-2xl flex items-center gap-4"
        >
          <Play className="w-10 h-10" />
          Start New Game
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">Host Panel</h1>
          <button
            onClick={resetGame}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>

        <Lifelines
          onFiftyFifty={handleFiftyFifty}
          onPhoneFriend={handlePhoneFriend}
          onAskAudience={handleAskAudience}
          fiftyFiftyUsed={gameState.lifeline_fifty_fifty_used}
          phoneFriendUsed={gameState.lifeline_phone_used}
          askAudienceUsed={gameState.lifeline_audience_used}
          disabled={false}
        />

        <QuestionDisplay
          question={currentQuestion}
          onAnswer={handleAnswerSelect}
          selectedAnswer={gameState.selected_answer as any}
          showResult={gameState.show_correct}
          removedAnswers={new Set((gameState.removed_answers as any[]) || [])}
          disabled={false}
        />

        <div className="flex gap-4 mt-8">
          {gameState.game_status !== 'game_over' && (
            <>
              <button
                onClick={showCorrectAnswer}
                disabled={!gameState.selected_answer || gameState.show_correct}
                className="flex-1 bg-yellow-600 text-white px-6 py-4 rounded-lg font-bold hover:bg-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Show Correct Answer
              </button>
              <button
                onClick={nextQuestion}
                disabled={!gameState.show_correct}
                className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SkipForward className="w-6 h-6" />
                Next Question
              </button>
            </>
          )}
          {gameState.game_status === 'game_over' && (
            <button
              onClick={resetGame}
              className="flex-1 bg-red-600 text-white px-6 py-4 rounded-lg font-bold hover:bg-red-700 transition-all"
            >
              End Game
            </button>
          )}
        </div>

        {gameState.active_lifeline && (
          <div className="mt-4">
            <button
              onClick={endLifeline}
              className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              End Lifeline
            </button>
          </div>
        )}

        <div className="mt-8 bg-green-900/50 border-2 border-green-500 rounded-lg p-6">
          <div className="text-center">
            <p className="text-green-300 text-sm font-semibold mb-2">CORRECT ANSWER</p>
            <p className="text-green-100 text-3xl font-bold">
              {currentQuestion.correct_answer}: {currentQuestion[`answer_${currentQuestion.correct_answer.toLowerCase()}` as keyof TriviaQuestion]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
