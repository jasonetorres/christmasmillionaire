import { useState, useEffect } from 'react';
import { supabase, TriviaQuestion } from '../lib/supabase';
import { CheckCircle } from 'lucide-react';

interface GameState {
  id: string;
  current_question_id: string | null;
  current_level: number;
  game_status: string;
  active_lifeline: string | null;
}

export function AudienceVoting() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [voted, setVoted] = useState(false);
  const [selectedVote, setSelectedVote] = useState<'A' | 'B' | 'C' | 'D' | null>(null);

  useEffect(() => {
    loadGameState();

    const channel = supabase
      .channel('voting_game_state')
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

  const submitVote = async (vote: 'A' | 'B' | 'C' | 'D') => {
    if (!gameState || voted) return;

    const { error } = await supabase
      .from('audience_votes')
      .insert({
        game_state_id: gameState.id,
        vote: vote
      });

    if (!error) {
      setVoted(true);
      setSelectedVote(vote);
    }
  };

  if (!gameState || gameState.active_lifeline !== 'audience') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-4">
            Who Wants to Be a Millionaire?
          </h1>
          <p className="text-xl text-white">
            {!gameState ? 'Waiting for game to start...' : 'Audience poll is not active right now.'}
          </p>
        </div>
      </div>
    );
  }

  if (voted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-green-950 flex items-center justify-center p-8">
        <div className="text-center">
          <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6 animate-pulse" />
          <h1 className="text-5xl font-bold text-white mb-4">Vote Submitted!</h1>
          <p className="text-2xl text-green-300">You voted: {selectedVote}</p>
          <p className="text-lg text-gray-300 mt-4">Thank you for participating!</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-xl text-white">Loading question...</p>
        </div>
      </div>
    );
  }

  const answers: Array<{ letter: 'A' | 'B' | 'C' | 'D'; text: string }> = [
    { letter: 'A', text: currentQuestion.answer_a },
    { letter: 'B', text: currentQuestion.answer_b },
    { letter: 'C', text: currentQuestion.answer_c },
    { letter: 'D', text: currentQuestion.answer_d },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold text-center text-yellow-400 mb-8">
          Ask the Audience
        </h1>

        <div className="bg-gradient-to-b from-blue-900 to-blue-800 p-6 md:p-8 rounded-xl shadow-2xl border-2 border-blue-600 mb-8">
          <h2 className="text-xl md:text-3xl font-bold text-center text-white mb-4">
            {currentQuestion.question}
          </h2>
          <p className="text-center text-blue-300 text-lg">
            {currentQuestion.category}
          </p>
        </div>

        <div className="space-y-4">
          {answers.map(({ letter, text }) => (
            <button
              key={letter}
              onClick={() => submitVote(letter)}
              className="w-full bg-blue-900 hover:bg-blue-700 text-white p-6 md:p-8 rounded-xl border-2 border-blue-600 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50 text-left"
            >
              <span className="inline-block w-12 h-12 rounded-full bg-white/20 text-center leading-[3rem] mr-4 text-2xl font-bold">
                {letter}
              </span>
              <span className="text-lg md:text-xl font-semibold">{text}</span>
            </button>
          ))}
        </div>

        <p className="text-center text-gray-400 mt-8 text-sm">
          Cast your vote to help the contestant!
        </p>
      </div>
    </div>
  );
}
