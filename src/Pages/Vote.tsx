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
    <div className="min-h-screen np-stage p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <span className="text-5xl animate-twinkle inline-block" style={{ animationDuration: '2s' }}>⭐</span>
          <h1 className="text-4xl font-bold np-ink text-center mb-2 ">
            Who Wants to Be a Christmas Millionaire? 🎄
          </h1>
        </div>

        {(error || banner) && (
          <p className="text-[#85252e] text-center mb-4">{banner || error}</p>
        )}

        {canVote ? (
          <div className="mb-14">
            <h2 className="text-2xl font-bold np-ink text-center mb-4">Cast Your Vote</h2>
            <div className="grid grid-cols-2 gap-4 gap-y-12">
              {(['A', 'B', 'C', 'D'] as const).map((answer) => (
                <div key={answer} className="relative">
                  <button
                    onClick={() => submitVote(answer)}
                    className="w-full np-panel np-ink p-12 rounded-xl text-6xl font-bold border-4 border-[#fbd475]"
                  >
                    {answer}
                  </button>
                  <div className="absolute -bottom-8 left-0 right-0 text-center">
                    <span className="np-ink text-xl font-bold">{votes[answer]} votes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : voted ? (
          <div className="mb-6">
            <div className="text-center mb-6">
              <p className="np-ink text-2xl mb-2">Thanks for voting! 🎄</p>
              <span className="text-6xl animate-twinkle inline-block" style={{ animationDuration: '2s' }}>⭐</span>
            </div>
            <div className="np-panel p-6">
              <h3 className="text-xl font-bold np-ink text-center mb-4">Current Vote Count</h3>
              <div className="grid grid-cols-2 gap-4">
                {(['A', 'B', 'C', 'D'] as const).map((answer) => (
                  <div key={answer} className="np-tile p-4 text-center">
                    <div className="text-4xl font-bold np-ink mb-1">{answer}</div>
                    <div className="text-2xl font-bold np-ink">{votes[answer]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 text-center">
            <p className="np-ink text-xl mb-2">
              {!game ? 'No active game 🎄' :
                game.active_lifeline !== 'audience' ? 'Watching the game...' :
                  'Waiting for question... 🎄'}
            </p>
          </div>
        )}

        <div className="np-panel p-4">
          <p className="np-ink text-center mb-3 font-semibold">Send a Reaction 🎄</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => react(emoji)}
                className="text-4xl rounded-2xl p-2 border border-[#c6dbcc] bg-[#edf6e7] shadow-[0_4px_0_#c6dbcc]"
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
            className="np-button block w-full font-bold text-2xl py-6 px-8 text-center"
          >
            🎁 Enter Drawing 🎁
          </a>
        </div>
      </div>
    </div>
  );
}
