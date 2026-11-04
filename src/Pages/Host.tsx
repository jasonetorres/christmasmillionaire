import { useState } from 'react';
import { Play, SkipForward, RotateCcw, X, RefreshCw } from 'lucide-react';
import { TriviaQuestion } from '../types';
import { Lifelines } from '../Components/Lifelines';
import { QuestionDisplay } from '../Components/QuestionDisplay';
import { PhoneCallScreen } from '../Components/PhoneCallScreen';
import { clearHostCode, hostAction, setHostCode, useGameState } from '../lib/api';

export default function Host() {
  const { snapshot, error, setSnapshot } = useGameState();
  const [code, setCode] = useState('');
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('christmasaire-host-code') !== null && sessionStorage.getItem('christmasaire-host-code') !== '');
  const [banner, setBanner] = useState<string | null>(null);

  const game = snapshot?.game ?? null;
  const question = game?.current_question ?? null;

  const run = async (action: string, payload: Record<string, unknown> = {}) => {
    try {
      setBanner(null);
      setSnapshot(await hostAction(action, payload));
    } catch (err) {
      const status = (err as { status?: number }).status;
      const message = err instanceof Error ? err.message : 'Host request failed';
      if (status === 401) {
        clearHostCode();
        setUnlocked(false);
      }
      setBanner(message);
    }
  };

  const unlock = async () => {
    setHostCode(code.trim());
    try {
      setSnapshot(await hostAction('ping'));
      setUnlocked(true);
      setBanner(null);
    } catch (err) {
      clearHostCode();
      setBanner(err instanceof Error ? err.message : 'Host code was rejected');
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-950 p-8 flex items-center justify-center">
        <form
          className="max-w-md w-full bg-black/40 border-4 border-yellow-400 rounded-2xl p-8 text-center"
          onSubmit={(event) => {
            event.preventDefault();
            unlock();
          }}
        >
          <h1 className="text-3xl font-bold text-yellow-300 mb-4">Host code</h1>
          <p className="text-green-100 mb-6">This stays in this browser tab. The server checks it before any host action.</p>
          <input
            type="password"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="w-full rounded-lg px-4 py-3 text-lg text-black mb-4"
            autoFocus
          />
          {(banner || error) && <p className="text-red-200 mb-4">{banner || error}</p>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-700 to-green-800 text-white px-6 py-4 rounded-xl text-xl font-bold border-4 border-yellow-400"
          >
            Unlock host panel
          </button>
        </form>
      </div>
    );
  }

  if (!game || !question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-950 p-8 flex items-center justify-center">
        <div className="text-center">
          {error && <p className="text-red-200 text-xl mb-6">{error}</p>}
          {banner && <p className="text-red-200 text-xl mb-6">{banner}</p>}
          <button
            onClick={() => run('start')}
            className="bg-gradient-to-r from-green-700 to-green-800 text-white px-12 py-6 rounded-xl text-2xl font-bold hover:from-green-800 hover:to-green-900 transition-all shadow-2xl flex items-center gap-4 border-4 border-yellow-400"
          >
            <Play className="w-10 h-10" />
            Start New Game 🎄
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-300 drop-shadow-lg">Host Panel 🎄</h1>
          <div className="flex gap-3">
            <button
              onClick={() => run('new-question')}
              className="bg-gradient-to-r from-green-700 to-green-800 text-white px-4 py-2 rounded-lg hover:from-green-800 hover:to-green-900 transition-all flex items-center gap-2 border-2 border-yellow-400"
            >
              <RefreshCw className="w-5 h-5" />
              New Question
            </button>
            <button
              onClick={() => {
                if (confirm('Reset the game?')) run('reset');
              }}
              className="bg-gradient-to-r from-red-700 to-red-800 text-white px-4 py-2 rounded-lg hover:from-red-800 hover:to-red-900 transition-all flex items-center gap-2 border-2 border-yellow-400"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>
        </div>

        {(error || banner) && (
          <p className="text-red-200 text-center mb-4">{banner || error}</p>
        )}

        <Lifelines
          onFiftyFifty={() => run('fifty')}
          onPhoneFriend={() => run('phone')}
          onAskAudience={() => run('audience')}
          fiftyFiftyUsed={game.lifeline_fifty_fifty_used}
          phoneFriendUsed={game.lifeline_phone_used}
          askAudienceUsed={game.lifeline_audience_used}
          disabled={false}
        />

        <QuestionDisplay
          question={question}
          onAnswer={(answer) => run('select-answer', { answer })}
          selectedAnswer={game.selected_answer as 'A' | 'B' | 'C' | 'D' | null}
          showResult={game.show_correct}
          removedAnswers={new Set(game.removed_answers || []) as Set<'A' | 'B' | 'C' | 'D'>}
          disabled={false}
        />

        <div className="flex gap-4 mt-8">
          {game.game_status !== 'game_over' && (
            <>
              <button
                onClick={() => {
                  if (confirm(`Walk away with ${game.total_winnings}?`)) run('walk-away');
                }}
                disabled={game.show_correct || game.current_level === 1}
                className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white px-6 py-4 rounded-lg font-bold hover:from-yellow-700 hover:to-yellow-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-yellow-300"
              >
                Walk Away
              </button>
              <button
                onClick={() => run('reveal')}
                disabled={!game.selected_answer || game.show_correct}
                className="flex-1 bg-gradient-to-r from-green-700 to-green-800 text-white px-6 py-4 rounded-lg font-bold hover:from-green-800 hover:to-green-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-yellow-400"
              >
                Show Correct Answer
              </button>
              <button
                onClick={() => run('next')}
                disabled={!game.show_correct}
                className="flex-1 bg-gradient-to-r from-red-700 to-red-800 text-white px-6 py-4 rounded-lg font-bold hover:from-red-800 hover:to-red-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-yellow-400"
              >
                <SkipForward className="w-6 h-6" />
                Next Question
              </button>
            </>
          )}
          {game.game_status === 'game_over' && (
            <button
              onClick={() => run('reset')}
              className="flex-1 bg-gradient-to-r from-red-700 to-red-800 text-white px-6 py-4 rounded-lg font-bold hover:from-red-800 hover:to-red-900 transition-all border-2 border-yellow-400"
            >
              End Game
            </button>
          )}
        </div>

        {game.active_lifeline && (
          <div className="mt-4">
            <button
              onClick={() => run('end-lifeline')}
              className="w-full bg-gradient-to-r from-red-700 to-red-800 text-white px-6 py-3 rounded-lg font-bold hover:from-red-800 hover:to-red-900 transition-all flex items-center justify-center gap-2 border-2 border-yellow-400"
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
              {question.correct_answer}: {question[`answer_${question.correct_answer.toLowerCase()}` as keyof TriviaQuestion]}
            </p>
          </div>
        </div>
      </div>

      {game.active_lifeline === 'phone' && (
        <PhoneCallScreen
          questionData={{
            question: question.question,
            answerA: question.answer_a,
            answerB: question.answer_b,
            answerC: question.answer_c,
            answerD: question.answer_d,
            correctAnswer: question.correct_answer,
          }}
          onEnd={() => run('end-lifeline')}
          isHost={true}
        />
      )}
    </div>
  );
}
