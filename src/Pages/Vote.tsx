import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Vote() {
  const [voted, setVoted] = useState(false);
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    checkGameState();
  }, []);

  const checkGameState = async () => {
    const { data } = await supabase
      .from('game_state')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setGameState(data);
  };

  const handleVote = async (answer: 'A' | 'B' | 'C' | 'D') => {
    if (!gameState) return;

    const { error } = await supabase
      .from('audience_votes')
      .insert({
        game_state_id: gameState.id,
        vote: answer,
      });

    if (!error) {
      setVoted(true);
    } else {
      alert('Failed to submit vote');
    }
  };

  if (!gameState || gameState.game_status !== 'question_shown') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 flex items-center justify-center">
        <p className="text-white text-2xl">No active game</p>
      </div>
    );
  }

  if (voted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 flex items-center justify-center">
        <p className="text-white text-2xl">Thanks for voting!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-yellow-400 text-center mb-8">Cast Your Vote</h1>
        <div className="grid grid-cols-2 gap-4">
          {['A', 'B', 'C', 'D'].map(answer => (
            <button
              key={answer}
              onClick={() => handleVote(answer as any)}
              className="bg-blue-600 text-white p-12 rounded-xl text-6xl font-bold hover:bg-blue-700 transition-all shadow-2xl hover:scale-105"
            >
              {answer}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
