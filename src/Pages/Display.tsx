import { useState } from 'react';
import { BroadcastFrame } from '../show/BroadcastFrame';
import { TriviaQuestion } from '../types';
import { MoneyLadder } from '../Components/MoneyLadder';
import { QuestionDisplay } from '../Components/QuestionDisplay';
import { QRCodeSVG } from 'qrcode.react';
import { PhoneCallScreen } from '../Components/PhoneCallScreen';
import { EmojiReactions } from '../Components/EmojiReactions';
import { SoundSystemController } from '../Components/SoundSystem';
import { hangUpPhone, useGameState } from '../lib/api';

const Celebration = ({ isWin = false }: { isWin?: boolean }) => {
  const [particles] = useState(() => Array.from({ length: isWin ? 100 : 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDuration: 2 + Math.random() * 3,
    animationDelay: Math.random() * 0.5,
    rotation: Math.random() * 360,
    color: ['#FFD700', '#C41E3A', '#165B33', '#FFFFFF', '#FFD700', '#C41E3A'][Math.floor(Math.random() * 6)],
  })));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-confetti"
          style={{
            left: `${particle.left}%`,
            animationDuration: `${particle.animationDuration}s`,
            animationDelay: `${particle.animationDelay}s`,
            transform: `rotate(${particle.rotation}deg)`,
          }}
        >
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: particle.color }} />
        </div>
      ))}
      {isWin && (
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
          <div className="text-9xl font-bold np-ink drop-shadow-2xl">
            🎄 WINNER! 🎄
          </div>
        </div>
      )}
    </div>
  );
};

export default function Display() {
  const { snapshot, error, reload } = useGameState();
  const game = snapshot?.game ?? null;
  const question: TriviaQuestion | null = game?.current_question ?? null;
  const votes = snapshot?.votes ?? { A: 0, B: 0, C: 0, D: 0 };
  const voteTotal = votes.A + votes.B + votes.C + votes.D;
  const percent = (count: number) => (voteTotal === 0 ? 0 : Math.round((count / voteTotal) * 100));
  const voteUrl = `${window.location.origin}/vote`;

  if (!game || !question) {
    return (
      <BroadcastFrame game="millionaire" title="Christmas Millionaire" detail="Finale">
        <section className="broadcast-board broadcast-standby">
          <div className="broadcast-star" aria-hidden="true">✦</div>
          <h2>Who Wants to Be a<br />Christmas Millionaire?</h2>
          <p>{error ? 'Waiting for a connection to the game' : 'Waiting for the host'}</p>
        </section>
      </BroadcastFrame>
    );
  }

  const isCorrectAnswer = game.show_correct && game.selected_answer === question.correct_answer;
  const hasWon = game.current_level >= 15 && isCorrectAnswer;
  const isGameOver = game.game_status === 'game_over';
  const isWrongAnswer = game.show_correct && game.selected_answer !== question.correct_answer;

  return (
    <BroadcastFrame game="millionaire" title="Christmas Millionaire" detail={'Question ' + game.current_level + ' / 15'}>
      <div className="broadcast-millionaire">
        <SoundSystemController
          gameStatus={game.game_status}
          showCorrect={game.show_correct}
          selectedAnswer={game.selected_answer}
          correctAnswer={question.correct_answer}
          activeLifeline={game.active_lifeline}
          currentLevel={game.current_level}
        />
        <EmojiReactions reactions={snapshot?.reactions ?? []} />
        {isCorrectAnswer && <Celebration isWin={hasWon} />}

        {isGameOver && isWrongAnswer && (
          <div className="np-call-scrim">
            <div className="np-panel p-12 max-w-2xl mx-4 text-center shadow-2xl">
              <h2 className="text-5xl font-bold np-ink mb-6">GAME OVER 🎄</h2>
              <p className="text-2xl np-ink mb-8">Unfortunately, that was the wrong answer.</p>
              <div className="bg-[#d9efc8] rounded-xl p-6 mb-6">
                <p className="text-xl np-ink mb-2">You're taking home</p>
                <p className="text-6xl font-bold np-ink">{game.total_winnings}</p>
              </div>
              <p className="text-xl np-ink">Thank you for playing!</p>
            </div>
          </div>
        )}

        <div className="broadcast-millionaire-grid">
          <section className="broadcast-questions">
            <QuestionDisplay
              question={question}
              onAnswer={() => {}}
              selectedAnswer={game.selected_answer as 'A' | 'B' | 'C' | 'D' | null}
              showResult={game.show_correct}
              removedAnswers={new Set(game.removed_answers || []) as Set<'A' | 'B' | 'C' | 'D'>}
              disabled={true}
            />

            {game.active_lifeline === 'audience' && (
              <div className="np-panel broadcast-audience">
                <h3 className="text-2xl font-bold np-ink text-center mb-6">👥 Ask the Audience Results</h3>
                <div className="grid grid-cols-4 gap-4">
                  {(['A', 'B', 'C', 'D'] as const).map((answer) => (
                    <div key={answer} className="text-center">
                      <div className="text-3xl font-bold np-ink mb-2">{percent(votes[answer])}%</div>
                      <div className="bg-[#d9efc8] h-32 relative rounded-lg overflow-hidden border-2 border-[#fbd475]">
                        <div
                          className="absolute bottom-0 w-full bg-gradient-to-t from-yellow-400 to-yellow-300 transition-all duration-500"
                          style={{ height: `${percent(votes[answer])}%` }}
                        />
                      </div>
                      <div className="text-xl font-bold np-ink mt-2">{answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="broadcast-millionaire-side">
            <MoneyLadder currentLevel={game.current_level} isActive={game.game_status === 'question_shown'} />
            <div className="np-panel broadcast-qr">
              <div className="bg-white p-3 rounded-lg flex flex-col items-center justify-center">
                <QRCodeSVG value={voteUrl} size={128} />
                <p className="text-xs font-bold text-gray-800 mt-2">Scan to Join</p>
              </div>
              <p className="np-ink text-sm text-center mt-3 font-semibold">Audience Reactions</p>
            </div>
          </aside>
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
          onEnd={async () => {
            await hangUpPhone();
            await reload();
          }}
          isHost={false}
        />
      )}
    </BroadcastFrame>
  );
}
