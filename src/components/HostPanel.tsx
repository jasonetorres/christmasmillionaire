import { useState, useEffect } from 'react';
import { supabase, TriviaQuestion } from '../lib/supabase';
import { Play, CheckCircle, XCircle, RotateCcw, Phone, Users, Divide, Eye, EyeOff } from 'lucide-react';

interface GameState {
  id: string;
  current_question_id: string | null;
  current_level: number;
  game_status: string;
  selected_answer: string | null;
  show_correct: boolean;
  lifeline_fifty_fifty_used: boolean;
  lifeline_phone_used: boolean;
  lifeline_audience_used: boolean;
  removed_answers: string[];
  active_lifeline: string | null;
  total_winnings: string;
  friend_name: string;
}

const MONEY_VALUES = ['$0', '$100', '$200', '$300', '$500', '$1,000', '$2,000', '$4,000', '$8,000', '$16,000', '$32,000', '$64,000', '$125,000', '$250,000', '$500,000', '$1,000,000'];

export function HostPanel() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingFriendName, setEditingFriendName] = useState(false);
  const [friendNameInput, setFriendNameInput] = useState('');

  useEffect(() => {
    loadGameState();

    const channel = supabase
      .channel('game_state_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, () => {
        loadGameState();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (gameState?.current_question_id) {
      loadQuestion(gameState.current_question_id);
    }
  }, [gameState?.current_question_id]);

  useEffect(() => {
    if (gameState?.friend_name && !friendNameInput) {
      setFriendNameInput(gameState.friend_name);
    }
  }, [gameState?.friend_name]);

  const loadGameState = async () => {
    const { data } = await supabase
      .from('game_state')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setGameState(data);
  };

  const loadQuestion = async (questionId: string) => {
    const { data } = await supabase
      .from('trivia_questions')
      .select('*')
      .eq('id', questionId)
      .maybeSingle();

    setCurrentQuestion(data);
  };

  const startNewGame = async () => {
    setLoading(true);

    await supabase.from('game_state').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { data: question } = await supabase
      .from('trivia_questions')
      .select('*')
      .eq('difficulty_level', 1)
      .eq('is_used', false)
      .limit(1)
      .maybeSingle();

    if (!question) {
      alert('No questions available! Please seed the database first.');
      setLoading(false);
      return;
    }

    await supabase.from('game_state').insert({
      current_question_id: question.id,
      current_level: 1,
      game_status: 'question_shown',
      total_winnings: '$0'
    });

    setLoading(false);
  };

  const selectAnswer = async (answer: 'A' | 'B' | 'C' | 'D') => {
    if (!gameState) return;

    await supabase
      .from('game_state')
      .update({
        selected_answer: answer,
        game_status: 'answer_selected',
        updated_at: new Date().toISOString()
      })
      .eq('id', gameState.id);
  };

  const revealCorrect = async () => {
    if (!gameState || !currentQuestion) return;

    const isCorrect = gameState.selected_answer === currentQuestion.correct_answer;

    await supabase
      .from('game_state')
      .update({
        show_correct: true,
        game_status: isCorrect ? 'correct' : 'incorrect',
        updated_at: new Date().toISOString()
      })
      .eq('id', gameState.id);
  };

  const nextQuestion = async () => {
    if (!gameState || !currentQuestion) return;

    const isCorrect = gameState.selected_answer === currentQuestion.correct_answer;

    if (!isCorrect) {
      let safeWinnings = '$0';
      if (gameState.current_level > 10) safeWinnings = '$32,000';
      else if (gameState.current_level > 5) safeWinnings = '$1,000';

      await supabase
        .from('game_state')
        .update({
          total_winnings: safeWinnings,
          game_status: 'incorrect',
          updated_at: new Date().toISOString()
        })
        .eq('id', gameState.id);
      return;
    }

    await supabase
      .from('trivia_questions')
      .update({ is_used: true })
      .eq('id', currentQuestion.id);

    const newLevel = gameState.current_level + 1;
    const newWinnings = MONEY_VALUES[gameState.current_level];

    if (newLevel > 15) {
      await supabase
        .from('game_state')
        .update({
          total_winnings: '$1,000,000',
          game_status: 'won',
          updated_at: new Date().toISOString()
        })
        .eq('id', gameState.id);
      return;
    }

    const { data: nextQ } = await supabase
      .from('trivia_questions')
      .select('*')
      .eq('difficulty_level', newLevel)
      .eq('is_used', false)
      .limit(1)
      .maybeSingle();

    if (!nextQ) {
      alert('No more questions available for this level!');
      return;
    }

    await supabase
      .from('game_state')
      .update({
        current_question_id: nextQ.id,
        current_level: newLevel,
        game_status: 'question_shown',
        selected_answer: null,
        show_correct: false,
        removed_answers: [],
        active_lifeline: null,
        total_winnings: newWinnings,
        updated_at: new Date().toISOString()
      })
      .eq('id', gameState.id);
  };

  const useLifeline = async (type: 'fifty_fifty' | 'phone' | 'audience') => {
    if (!gameState || !currentQuestion) return;

    const updates: any = { updated_at: new Date().toISOString() };

    if (type === 'fifty_fifty') {
      if (gameState.lifeline_fifty_fifty_used) return;

      const correctAnswer = currentQuestion.correct_answer;
      const allAnswers: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
      const wrongAnswers = allAnswers.filter(a => a !== correctAnswer);
      const toRemove = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 2);

      updates.lifeline_fifty_fifty_used = true;
      updates.removed_answers = toRemove;
    } else if (type === 'phone') {
      if (gameState.lifeline_phone_used) return;
      updates.lifeline_phone_used = true;
      updates.active_lifeline = 'phone';
    } else if (type === 'audience') {
      if (gameState.lifeline_audience_used) return;
      updates.lifeline_audience_used = true;
      updates.active_lifeline = 'audience';
    }

    await supabase
      .from('game_state')
      .update(updates)
      .eq('id', gameState.id);
  };

  const clearLifeline = async () => {
    if (!gameState) return;

    await supabase
      .from('game_state')
      .update({
        active_lifeline: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', gameState.id);
  };

  const updateFriendName = async () => {
    if (!gameState || !friendNameInput.trim()) return;

    await supabase
      .from('game_state')
      .update({
        friend_name: friendNameInput.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', gameState.id);

    setEditingFriendName(false);
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 flex items-center justify-center">
        <button
          onClick={startNewGame}
          disabled={loading}
          className="bg-green-600 text-white px-12 py-8 rounded-2xl text-3xl font-bold hover:bg-green-700 disabled:bg-gray-600 transition-all shadow-2xl flex items-center gap-4"
        >
          <Play className="w-12 h-12" />
          Start New Game
        </button>
      </div>
    );
  }

  if (gameState.game_status === 'won' || gameState.game_status === 'incorrect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            {gameState.game_status === 'won' ? 'WINNER!' : 'Game Over'}
          </h1>
          <h2 className="text-4xl font-bold text-yellow-400 mb-8">
            Final Winnings: {gameState.total_winnings}
          </h2>
          <button
            onClick={startNewGame}
            disabled={loading}
            className="bg-blue-600 text-white px-12 py-8 rounded-2xl text-3xl font-bold hover:bg-blue-700 disabled:bg-gray-600 transition-all shadow-2xl flex items-center gap-4 mx-auto"
          >
            <RotateCcw className="w-12 h-12" />
            New Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-white">Level {gameState.current_level}</h2>
            <div className="text-2xl font-bold text-yellow-400">{gameState.total_winnings}</div>
          </div>
          {currentQuestion && (
            <div className="text-gray-300 text-lg">{currentQuestion.question}</div>
          )}
        </div>

        {gameState.game_status === 'question_shown' && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => selectAnswer('A')}
              className="bg-blue-600 text-white p-8 rounded-xl text-3xl font-bold hover:bg-blue-700 transition-all shadow-lg"
            >
              A
            </button>
            <button
              onClick={() => selectAnswer('B')}
              className="bg-blue-600 text-white p-8 rounded-xl text-3xl font-bold hover:bg-blue-700 transition-all shadow-lg"
            >
              B
            </button>
            <button
              onClick={() => selectAnswer('C')}
              className="bg-blue-600 text-white p-8 rounded-xl text-3xl font-bold hover:bg-blue-700 transition-all shadow-lg"
            >
              C
            </button>
            <button
              onClick={() => selectAnswer('D')}
              className="bg-blue-600 text-white p-8 rounded-xl text-3xl font-bold hover:bg-blue-700 transition-all shadow-lg"
            >
              D
            </button>
          </div>
        )}

        {gameState.game_status === 'answer_selected' && !gameState.show_correct && (
          <button
            onClick={revealCorrect}
            className="w-full bg-yellow-600 text-white p-8 rounded-xl text-3xl font-bold hover:bg-yellow-700 transition-all shadow-lg flex items-center justify-center gap-4"
          >
            <Eye className="w-10 h-10" />
            Reveal Answer
          </button>
        )}

        {gameState.show_correct && (
          <button
            onClick={nextQuestion}
            className="w-full bg-green-600 text-white p-8 rounded-xl text-3xl font-bold hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-4"
          >
            {currentQuestion && gameState.selected_answer === currentQuestion.correct_answer ? (
              <>
                <CheckCircle className="w-10 h-10" />
                Next Question
              </>
            ) : (
              <>
                <XCircle className="w-10 h-10" />
                End Game
              </>
            )}
          </button>
        )}

        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Lifelines</h3>

          {!gameState.lifeline_phone_used && gameState.game_status === 'question_shown' && !gameState.active_lifeline && (
            <div className="mb-4 bg-gray-700 p-4 rounded-lg">
              <label className="text-white text-sm block mb-2">Friend's Name (for Phone a Friend)</label>
              <input
                type="text"
                value={friendNameInput}
                onChange={(e) => setFriendNameInput(e.target.value)}
                onBlur={updateFriendName}
                placeholder="Enter friend's name..."
                className="w-full px-3 py-2 rounded bg-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => useLifeline('fifty_fifty')}
              disabled={gameState.lifeline_fifty_fifty_used || gameState.game_status !== 'question_shown'}
              className={`p-6 rounded-xl font-bold transition-all ${
                gameState.lifeline_fifty_fifty_used
                  ? 'bg-gray-700 text-gray-500'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Divide className="w-8 h-8 mx-auto mb-2" />
              50:50
            </button>
            <button
              onClick={() => useLifeline('phone')}
              disabled={gameState.lifeline_phone_used || gameState.game_status !== 'question_shown'}
              className={`p-6 rounded-xl font-bold transition-all ${
                gameState.lifeline_phone_used
                  ? 'bg-gray-700 text-gray-500'
                  : 'bg-green-600 text-white hover:bg-green-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Phone className="w-8 h-8 mx-auto mb-2" />
              Phone
            </button>
            <button
              onClick={() => useLifeline('audience')}
              disabled={gameState.lifeline_audience_used || gameState.game_status !== 'question_shown'}
              className={`p-6 rounded-xl font-bold transition-all ${
                gameState.lifeline_audience_used
                  ? 'bg-gray-700 text-gray-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Users className="w-8 h-8 mx-auto mb-2" />
              Audience
            </button>
          </div>
          {gameState.active_lifeline && (
            <div className="mt-4 bg-purple-600 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white font-bold">
                  {gameState.active_lifeline === 'phone' && '📞 Phone a Friend Active'}
                  {gameState.active_lifeline === 'audience' && '👥 Ask the Audience Active'}
                </span>
                <button
                  onClick={clearLifeline}
                  className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-all text-sm"
                >
                  <EyeOff className="w-4 h-4 inline mr-1" />
                  Clear
                </button>
              </div>

              {gameState.active_lifeline === 'phone' && (
                <div className="bg-purple-700 p-3 rounded">
                  {editingFriendName ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={friendNameInput}
                        onChange={(e) => setFriendNameInput(e.target.value)}
                        placeholder="Friend's name"
                        className="flex-1 px-3 py-2 rounded bg-white text-gray-900"
                        autoFocus
                      />
                      <button
                        onClick={updateFriendName}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingFriendName(false)}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-white">
                        Calling: <span className="font-bold">{gameState.friend_name || 'Your Friend'}</span>
                      </span>
                      <button
                        onClick={() => {
                          setFriendNameInput(gameState.friend_name || '');
                          setEditingFriendName(true);
                        }}
                        className="bg-purple-800 text-white px-3 py-1 rounded text-sm hover:bg-purple-900"
                      >
                        Edit Name
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {currentQuestion && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Answer Key</h3>
            <div className="grid grid-cols-2 gap-2 text-white">
              <div className={currentQuestion.correct_answer === 'A' ? 'text-green-400 font-bold' : ''}>
                A: {currentQuestion.answer_a}
              </div>
              <div className={currentQuestion.correct_answer === 'B' ? 'text-green-400 font-bold' : ''}>
                B: {currentQuestion.answer_b}
              </div>
              <div className={currentQuestion.correct_answer === 'C' ? 'text-green-400 font-bold' : ''}>
                C: {currentQuestion.answer_c}
              </div>
              <div className={currentQuestion.correct_answer === 'D' ? 'text-green-400 font-bold' : ''}>
                D: {currentQuestion.answer_d}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
