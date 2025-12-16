import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { TriviaQuestion, GameState } from '../types';
import { MoneyLadder } from '../Components/MoneyLadder';
import { QuestionDisplay } from '../Components/QuestionDisplay';
import { QRCodeSVG } from 'qrcode.react';
import { PhoneCallSimulator } from '../Components/PhoneCallSimulator';

const Celebration = ({ isWin = false }: { isWin?: boolean }) => {
  const particles = Array.from({ length: isWin ? 100 : 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDuration: 2 + Math.random() * 3,
    animationDelay: Math.random() * 0.5,
    rotation: Math.random() * 360,
    color: ['#FFD700', '#FFA500', '#FF4500', '#00FF00', '#0000FF', '#FF1493'][Math.floor(Math.random() * 6)],
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
          <div className="text-9xl font-bold text-yellow-400 drop-shadow-2xl">
            WINNER!
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
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-yellow-400 mb-4">
            Who Wants to Be a Christmasaire?
          </h1>
          <p className="text-white text-2xl mt-8">Waiting for game to start...</p>
        </div>
      </div>
    );
  }

  const isCorrectAnswer = gameState.show_correct &&
    gameState.selected_answer === currentQuestion.correct_answer;
  const hasWon = gameState.current_level >= 15 && isCorrectAnswer;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 p-8">
      {isCorrectAnswer && <Celebration isWin={hasWon} />}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        <div className="lg:col-span-3">
          <h1 className="text-4xl font-bold text-yellow-400 text-center mb-8">
            Who Wants to Be a Christmasaire?
          </h1>

          <QuestionDisplay
            question={currentQuestion}
            onAnswer={() => {}}
            selectedAnswer={gameState.selected_answer as any}
            showResult={gameState.show_correct}
            removedAnswers={new Set((gameState.removed_answers as any[]) || [])}
            disabled={true}
          />


          {gameState.active_lifeline === 'audience' && (
            <div className="mt-8 bg-blue-900/50 border-2 border-blue-500 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-white text-center mb-4">
                👥 Ask the Audience
              </h3>

              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-lg text-center">
                  <QRCodeSVG value={voteUrl} size={180} />
                  <p className="text-sm font-bold text-gray-800 mt-2">Scan to Vote</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {['A', 'B', 'C', 'D'].map(answer => (
                  <div key={answer} className="text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">
                      {audienceResults?.[answer]?.percentage || 0}%
                    </div>
                    <div className="bg-blue-700 h-32 relative rounded-lg overflow-hidden">
                      <div
                        className="absolute bottom-0 w-full bg-yellow-400 transition-all duration-500"
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
        </div>
      </div>

      {gameState.active_lifeline === 'phone' && gameState.ai_response && (
        <PhoneCallSimulator
          friendName={gameState.friend_name || 'AI Friend'}
          aiResponse={gameState.ai_response}
          onEnd={() => {}}
        />
      )}
    </div>
  );
}
