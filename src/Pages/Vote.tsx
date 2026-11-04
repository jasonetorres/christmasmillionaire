import { useState } from 'react';
import { castVote, sendReaction, useGameState } from '../lib/api';

const REACTIONS = ['👏', '😮', '🤔', '😱', '🎉', '❤️', '🔥', '👍', '🎄', '🎅', '⛄', '🎁', '⭐', '🎊', '🤶', '🦌'];

export default function Vote() {
  const { snapshot, error, setSnapshot } = useGameState();
  const [voted, setVoted] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const game = snapshot?.game ?? null;
  const votes = snapshot?.votes ?? { A: 0, B: 0, C: 0, D: 0 };
  const canVote = Boolean(game && game.game_status === 'question_shown' && game.active_lifeline === 'audience' && !voted);

  const submitVote = async (answer: 'A' | 'B' | 'C' | 'D') => {
    try {
      setSnapshot(await castVote(answer));
      setVoted(true);
      setBanner(null);
    } catch (err) {
      setBanner(err instanceof Error ? err.message : 'Failed to submit vote');
    }
  };

  const react = async (emoji: string) => {
    try {
      setSnapshot(await sendReaction(emoji));
    } catch (err) {
      setBanner(err instanceof Error ? err.message : 'Failed to send reaction');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-950 p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <span className="text-5xl animate-twinkle inline-block" style={{ animationDuration: '2s' }}>⭐</span>
          <h1 className="text-4xl font-bold text-yellow-300 text-center mb-2 drop-shadow-lg">
            Who Wants to Be a Christmasaire? 🎄
          </h1>
        </div>

        {(error || banner) && (
          <p className="text-red-200 text-center mb-4">{banner || error}</p>
        )}

        {canVote ? (
          <div className="mb-14">
            <h2 className="text-2xl font-bold text-white text-center mb-4">Cast Your Vote</h2>
            <div className="grid grid-cols-2 gap-4 gap-y-12">
              {(['A', 'B', 'C', 'D'] as const).map((answer) => (
                <div key={answer} className="relative">
                  <button
                    onClick={() => submitVote(answer)}
                    className="w-full bg-gradient-to-br from-green-700 to-green-800 text-white p-12 rounded-xl text-6xl font-bold hover:from-green-800 hover:to-green-900 transition-all shadow-2xl hover:scale-105 border-4 border-yellow-400"
                  >
                    {answer}
                  </button>
                  <div className="absolute -bottom-8 left-0 right-0 text-center">
                    <span className="text-yellow-300 text-xl font-bold">{votes[answer]} votes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : voted ? (
          <div className="mb-6">
            <div className="text-center mb-6">
              <p className="text-white text-2xl mb-2">Thanks for voting! 🎄</p>
              <span className="text-6xl animate-twinkle inline-block" style={{ animationDuration: '2s' }}>⭐</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-400">
              <h3 className="text-xl font-bold text-white text-center mb-4">Current Vote Count</h3>
              <div className="grid grid-cols-2 gap-4">
                {(['A', 'B', 'C', 'D'] as const).map((answer) => (
                  <div key={answer} className="bg-gradient-to-br from-red-800 to-red-900 p-4 rounded-lg border-2 border-yellow-400 text-center">
                    <div className="text-4xl font-bold text-yellow-300 mb-1">{answer}</div>
                    <div className="text-2xl font-bold text-white">{votes[answer]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 text-center">
            <p className="text-white text-xl mb-2">
              {!game ? 'No active game 🎄' :
                game.active_lifeline !== 'audience' ? 'Watching the game...' :
                  'Waiting for question... 🎄'}
            </p>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border-2 border-yellow-400">
          <p className="text-white text-center mb-3 font-semibold">Send a Reaction 🎄</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => react(emoji)}
                className="text-4xl hover:scale-125 transition-all active:scale-95 bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-2 hover:from-red-700 hover:to-red-800 border-2 border-yellow-300"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSdLo2ycnyWO1WrS69KM9YWRtz6o2rouRgVPkL_lDhM-JsEFXQ/viewform?usp=publish-editor"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-900 font-bold text-2xl py-6 px-8 rounded-xl shadow-2xl hover:from-yellow-300 hover:to-yellow-400 transition-all transform hover:scale-105 text-center border-4 border-red-700"
          >
            🎁 Enter Drawing 🎁
          </a>
        </div>
      </div>
    </div>
  );
}
