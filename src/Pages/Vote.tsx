import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Vote() {
  const [voted, setVoted] = useState(false);
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    checkGameState();

    const channel = supabase
      .channel('game-state-vote')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, () => {
        checkGameState();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkGameState = async () => {
    const { data } = await supabase
      .from('game_state')
      .select('*')
      .order('updated_at', { ascending: false })
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

  const sendEmoji = async (emoji: string) => {
    if (!gameState) return;

    await supabase
      .from('emoji_reactions')
      .insert({
        game_state_id: gameState.id,
        emoji: emoji,
      });
  };

  const canVote = gameState && gameState.game_status === 'question_shown' && gameState.active_lifeline === 'audience' && !voted;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-950 p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <span className="text-5xl animate-twinkle inline-block" style={{ animationDuration: '2s' }}>⭐</span>
          <h1 className="text-4xl font-bold text-yellow-300 text-center mb-2 drop-shadow-lg">
            Who Wants to Be a Christmasaire? 🎄
          </h1>
        </div>

        {canVote ? (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white text-center mb-4">Cast Your Vote</h2>
            <div className="grid grid-cols-2 gap-4">
              {['A', 'B', 'C', 'D'].map(answer => (
                <button
                  key={answer}
                  onClick={() => handleVote(answer as any)}
                  className="bg-gradient-to-br from-green-700 to-green-800 text-white p-12 rounded-xl text-6xl font-bold hover:from-green-800 hover:to-green-900 transition-all shadow-2xl hover:scale-105 border-4 border-yellow-400"
                >
                  {answer}
                </button>
              ))}
            </div>
          </div>
        ) : voted ? (
          <div className="mb-6 text-center">
            <p className="text-white text-2xl mb-2">Thanks for voting! 🎄</p>
            <span className="text-6xl animate-twinkle inline-block" style={{ animationDuration: '2s' }}>⭐</span>
          </div>
        ) : (
          <div className="mb-6 text-center">
            <p className="text-white text-xl mb-2">
              {!gameState ? 'No active game 🎄' :
               gameState.active_lifeline !== 'audience' ? 'Watching the game...' :
               'Waiting for question... 🎄'}
            </p>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border-2 border-yellow-400">
          <p className="text-white text-center mb-3 font-semibold">Send a Reaction 🎄</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {['👏', '😮', '🤔', '😱', '🎉', '❤️', '🔥', '👍'].map(emoji => (
              <button
                key={emoji}
                onClick={() => sendEmoji(emoji)}
                className="text-4xl hover:scale-125 transition-all active:scale-95 bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-2 hover:from-red-700 hover:to-red-800 border-2 border-yellow-300"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
