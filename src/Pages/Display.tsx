import { useState } from 'react';
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
          <div className="text-9xl font-bold text-yellow-300 drop-shadow-2xl">
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

  if (error && !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-950 flex items-center justify-center p-8">
        <p className="text-2xl text-red-100 text-center max-w-2xl">{error}</p>
      </div>
    );
  }

  if (!game || !question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-950 flex items-center justify-center relative overflow-hidden">
        <div className="text-center relative z-10">
          <div className="mb-6">
            <span className="text-7xl animate-twinkle inline-block" style={{ animationDuration: '2s' }}>⭐</span>
          </div>
          <h1 className="text-6xl font-bold text-yellow-300 mb-4 drop-shadow-lg">
            Who Wants to Be a Christmasaire? 🎄
          </h1>
          <p className="text-white text-2xl mt-8">Waiting for game to start...</p>
        </div>
      </div>
    );
  }

  const isCorrectAnswer = game.show_correct && game.selected_answer === question.correct_answer;
  const hasWon = game.current_level >= 15 && isCorrectAnswer;
  const isGameOver = game.game_status === 'game_over';
  const isWrongAnswer = game.show_correct && game.selected_answer !== question.correct_answer;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-950 p-8 relative overflow-hidden">
      <div className="relative z-10">
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
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-red-900 to-red-950 border-4 border-yellow-400 rounded-2xl p-12 max-w-2xl mx-4 text-center shadow-2xl">
              <h2 className="text-5xl font-bold text-white mb-6">GAME OVER 🎄</h2>
              <p className="text-2xl text-gray-200 mb-8">Unfortunately, that was the wrong answer.</p>
              <div className="bg-black/40 rounded-xl p-6 mb-6">
                <p className="text-xl text-gray-300 mb-2">You're taking home</p>
                <p className="text-6xl font-bold text-yellow-300">{game.total_winnings}</p>
              </div>
              <p className="text-xl text-gray-300">Thank you for playing!</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-center gap-4">
              <span className="text-4xl animate-twinkle" style={{ animationDuration: '2s' }}>⭐</span>
              <h1 className="text-4xl font-bold text-yellow-300 text-center drop-shadow-lg">
                Who Wants to Be a Christmasaire? 🎄
              </h1>
              <span className="text-4xl animate-twinkle" style={{ animationDuration: '2.5s' }}>⭐</span>
            </div>

            <QuestionDisplay
              question={question}
              onAnswer={() => {}}
              selectedAnswer={game.selected_answer as 'A' | 'B' | 'C' | 'D' | null}
              showResult={game.show_correct}
              removedAnswers={new Set(game.removed_answers || []) as Set<'A' | 'B' | 'C' | 'D'>}
              disabled={true}
            />

            {game.active_lifeline === 'audience' && (
              <div className="mt-8 bg-red-900/50 border-2 border-yellow-400 p-6 rounded-lg">
                <h3 className="text-2xl font-bold text-white text-center mb-6">👥 Ask the Audience Results</h3>
                <div className="grid grid-cols-4 gap-4">
                  {(['A', 'B', 'C', 'D'] as const).map((answer) => (
                    <div key={answer} className="text-center">
                      <div className="text-3xl font-bold text-yellow-300 mb-2">{percent(votes[answer])}%</div>
                      <div className="bg-green-800 h-32 relative rounded-lg overflow-hidden border-2 border-yellow-400">
                        <div
                          className="absolute bottom-0 w-full bg-gradient-to-t from-yellow-400 to-yellow-300 transition-all duration-500"
                          style={{ height: `${percent(votes[answer])}%` }}
                        />
                      </div>
                      <div className="text-xl font-bold text-white mt-2">{answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <MoneyLadder currentLevel={game.current_level} isActive={game.game_status === 'question_shown'} />
            <div className="mt-6 bg-white/10 backdrop-blur-sm border-2 border-yellow-400 rounded-lg p-4">
              <div className="bg-white p-3 rounded-lg flex flex-col items-center justify-center">
                <QRCodeSVG value={voteUrl} size={160} />
                <p className="text-xs font-bold text-gray-800 mt-2">Scan to Join</p>
              </div>
              <p className="text-white text-sm text-center mt-3 font-semibold">Audience Reactions</p>
            </div>
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
          onEnd={async () => {
            await hangUpPhone();
            await reload();
          }}
          isHost={false}
        />
      )}
    </div>
  );
}
