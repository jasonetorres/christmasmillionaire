import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { TriviaQuestion, GameState } from '../types';
import { MoneyLadder } from '../Components/MoneyLadder';
import { QuestionDisplay } from '../Components/QuestionDisplay';
import { QRCodeSVG } from 'qrcode.react';
import { PhoneCallScreen } from '../Components/PhoneCallScreen';
import { EmojiReactions } from '../Components/EmojiReactions';
import { SoundSystemController } from '../Components/SoundSystem';

const Snowflakes = () => {
  const snowflakes = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDuration: 10 + Math.random() * 20,
    animationDelay: Math.random() * 5,
    size: 0.5 + Math.random() * 1.5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute animate-snowfall text-white"
          style={{
            left: `${flake.left}%`,
            animationDuration: `${flake.animationDuration}s`,
            animationDelay: `${flake.animationDelay}s`,
            fontSize: `${flake.size}rem`,
          }}
        >
          ❄️
        </div>
      ))}
    </div>
  );
};

const Celebration = ({ isWin = false }: { isWin?: boolean }) => {
  const particles = Array.from({ length: isWin ? 100 : 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDuration: 2 + Math.random() * 3,
    animationDelay: Math.random() * 0.5,
    rotation: Math.random() * 360,
    color: ['#FFD700', '#C41E3A', '#165B33', '#FFFFFF', '#FFD700', '#C41E3A'][Math.floor(Math.random() * 6)],
  }));

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
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: particle.color }}
          />
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
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [audienceResults, setAudienceResults] = useState<any>(null);
  const voteUrl = `${window.location.origin}/vote`;

  const loadGameState = useCallback(async () => {
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

      if (data.id) {
        const { data: votes } = await supabase
          .from('audience_votes')
          .select('vote')
          .eq('game_state_id', data.id);

        if (votes && votes.length > 0) {
          const counts = { A: 0, B: 0, C: 0, D: 0 };
          votes.forEach((v: any) => counts[v.vote as keyof typeof counts]++);

          const total = votes.length;
          const results = {
            A: { percentage: Math.round((counts.A / total) * 100) },
            B: { percentage: Math.round((counts.B / total) * 100) },
            C: { percentage: Math.round((counts.C / total) * 100) },
            D: { percentage: Math.round((counts.D / total) * 100) },
          };

          setAudienceResults(results);
        } else {
          setAudienceResults(null);
        }
      }
    }
  }, []);

  useEffect(() => {
    loadGameState();

    const gameStateChannel = supabase
      .channel('game-state-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, () => {
        loadGameState();
      })
      .subscribe();

    const votesChannel = supabase
      .channel('votes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audience_votes' }, () => {
        loadGameState();
      })
      .subscribe();

    const pollInterval = setInterval(() => {
      loadGameState();
    }, 2000);

    return () => {
      supabase.removeChannel(gameStateChannel);
      supabase.removeChannel(votesChannel);
      clearInterval(pollInterval);
    };
  }, [loadGameState]);

  if (!gameState || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-950 flex items-center justify-center relative overflow-hidden">
        <Snowflakes />
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

  const isCorrectAnswer = gameState.show_correct &&
    gameState.selected_answer === currentQuestion.correct_answer;
  const hasWon = gameState.current_level >= 15 && isCorrectAnswer;
  const isGameOver = gameState.game_status === 'game_over';
  const isWrongAnswer = gameState.show_correct && gameState.selected_answer !== currentQuestion.correct_answer;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-950 p-8 relative overflow-hidden">
      <Snowflakes />
      <div className="relative z-10">
        <SoundSystemController
          gameStatus={gameState?.game_status}
          showCorrect={gameState?.show_correct}
          selectedAnswer={gameState?.selected_answer}
          correctAnswer={currentQuestion?.correct_answer}
          activeLifeline={gameState?.active_lifeline}
          currentLevel={gameState?.current_level}
        />
        <EmojiReactions gameStateId={gameState?.id || null} />
        {isCorrectAnswer && <Celebration isWin={hasWon} />}

        {isGameOver && isWrongAnswer && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-red-900 to-red-950 border-4 border-yellow-400 rounded-2xl p-12 max-w-2xl mx-4 text-center shadow-2xl">
              <h2 className="text-5xl font-bold text-white mb-6">GAME OVER 🎄</h2>
              <p className="text-2xl text-gray-200 mb-8">
                Unfortunately, that was the wrong answer.
              </p>
              <div className="bg-black/40 rounded-xl p-6 mb-6">
                <p className="text-xl text-gray-300 mb-2">You're taking home</p>
                <p className="text-6xl font-bold text-yellow-300">{gameState.total_winnings}</p>
              </div>
              <p className="text-xl text-gray-300">
                Thank you for playing!
              </p>
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
            question={currentQuestion}
            onAnswer={() => {}}
            selectedAnswer={gameState.selected_answer as any}
            showResult={gameState.show_correct}
            removedAnswers={new Set((gameState.removed_answers as any[]) || [])}
            disabled={true}
          />


          {gameState.active_lifeline === 'audience' && (
            <div className="mt-8 bg-red-900/50 border-2 border-yellow-400 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-white text-center mb-6">
                👥 Ask the Audience Results
              </h3>

              <div className="grid grid-cols-4 gap-4">
                {['A', 'B', 'C', 'D'].map(answer => (
                  <div key={answer} className="text-center">
                    <div className="text-3xl font-bold text-yellow-300 mb-2">
                      {audienceResults?.[answer]?.percentage || 0}%
                    </div>
                    <div className="bg-green-800 h-32 relative rounded-lg overflow-hidden border-2 border-yellow-400">
                      <div
                        className="absolute bottom-0 w-full bg-gradient-to-t from-yellow-400 to-yellow-300 transition-all duration-500"
                        style={{ height: `${audienceResults?.[answer]?.percentage || 0}%` }}
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
            <MoneyLadder
              currentLevel={gameState.current_level}
              isActive={gameState.game_status === 'question_shown'}
            />

            <div className="mt-6 bg-white/10 backdrop-blur-sm border-2 border-yellow-400 rounded-lg p-4">
              <div className="bg-white p-3 rounded-lg text-center">
                <QRCodeSVG value={voteUrl} size={160} />
                <p className="text-xs font-bold text-gray-800 mt-2">Scan to Join</p>
              </div>
              <p className="text-white text-sm text-center mt-3 font-semibold">
                Audience Reactions
              </p>
            </div>
          </div>
        </div>
      </div>

      {gameState.active_lifeline === 'phone' && currentQuestion && (
        <PhoneCallScreen
          questionData={{
            question: currentQuestion.question,
            answerA: currentQuestion.answer_a,
            answerB: currentQuestion.answer_b,
            answerC: currentQuestion.answer_c,
            answerD: currentQuestion.answer_d,
            correctAnswer: currentQuestion.correct_answer,
          }}
          onEnd={async () => {
            if (gameState?.id) {
              await supabase
                .from('game_state')
                .update({ active_lifeline: null })
                .eq('id', gameState.id);
            }
          }}
          isHost={false}
        />
      )}
    </div>
  );
}
