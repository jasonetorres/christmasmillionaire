import { useState, useEffect } from 'react';
import { supabase, TriviaQuestion } from '../lib/supabase';
import { Trophy, Phone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface GameState {
  id: string;
  current_question_id: string | null;
  current_level: number;
  game_status: string;
  selected_answer: string | null;
  show_correct: boolean;
  lifeline_fifty_fifty_used: boolean;
  lifeline_phone_used: boolean;
  lifeline_audience_used: boolean;
  removed_answers: string[];
  active_lifeline: string | null;
  total_winnings: string;
  friend_name: string;
}

interface VoteCounts {
  A: number;
  B: number;
  C: number;
  D: number;
}

const MONEY_LADDER = [
  { level: 15, amount: '$1,000,000', milestone: true },
  { level: 14, amount: '$500,000', milestone: false },
  { level: 13, amount: '$250,000', milestone: false },
  { level: 12, amount: '$125,000', milestone: false },
  { level: 11, amount: '$64,000', milestone: false },
  { level: 10, amount: '$32,000', milestone: true },
  { level: 9, amount: '$16,000', milestone: false },
  { level: 8, amount: '$8,000', milestone: false },
  { level: 7, amount: '$4,000', milestone: false },
  { level: 6, amount: '$2,000', milestone: false },
  { level: 5, amount: '$1,000', milestone: true },
  { level: 4, amount: '$500', milestone: false },
  { level: 3, amount: '$300', milestone: false },
  { level: 2, amount: '$200', milestone: false },
  { level: 1, amount: '$100', milestone: false },
];

export function DisplayPanel() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({ A: 0, B: 0, C: 0, D: 0 });
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    loadGameState();

    const channel = supabase
      .channel('display_game_state')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, () => {
        loadGameState();
      })
      .subscribe();

    const votesChannel = supabase
      .channel('audience_votes_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audience_votes' }, () => {
        loadVotes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(votesChannel);
    };
  }, []);

  useEffect(() => {
    if (gameState?.current_question_id) {
      loadQuestion(gameState.current_question_id);
    }
  }, [gameState?.current_question_id]);

  useEffect(() => {
    if (gameState?.active_lifeline === 'audience' && gameState?.id) {
      loadVotes();
    }
  }, [gameState?.active_lifeline, gameState?.id]);

  useEffect(() => {
    if (gameState?.active_lifeline === 'phone') {
      setCallDuration(0);
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState?.active_lifeline]);

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

  const loadVotes = async () => {
    if (!gameState?.id) return;

    const { data } = await supabase
      .from('audience_votes')
      .select('vote')
      .eq('game_state_id', gameState.id);

    const counts = { A: 0, B: 0, C: 0, D: 0 };
    data?.forEach((v) => {
      if (v.vote in counts) {
        counts[v.vote as keyof VoteCounts]++;
      }
    });

    setVoteCounts(counts);
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnswerStyle = (letter: 'A' | 'B' | 'C' | 'D') => {
    if (!gameState || !currentQuestion) return 'bg-blue-900 text-white border-blue-600';

    const isRemoved = gameState.removed_answers.includes(letter);
    if (isRemoved) {
      return 'opacity-30 bg-gray-800 text-gray-600 border-gray-700';
    }

    if (gameState.show_correct) {
      if (letter === currentQuestion.correct_answer) {
        return 'bg-green-600 text-white border-green-400 animate-pulse shadow-lg shadow-green-500/50';
      }
      if (letter === gameState.selected_answer && gameState.selected_answer !== currentQuestion.correct_answer) {
        return 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-500/50';
      }
    }

    if (gameState.selected_answer === letter) {
      return 'bg-yellow-500 text-black border-yellow-400 shadow-lg shadow-yellow-500/50';
    }

    return 'bg-blue-900 text-white border-blue-600';
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-6xl md:text-8xl font-bold text-yellow-400 mb-8 drop-shadow-lg">
            Who Wants to Be a Millionaire?
          </h1>
          <h2 className="text-4xl md:text-5xl font-semibold text-red-400">
            🎄 Christmas Edition 🎅
          </h2>
          <p className="text-2xl text-white mt-8">Waiting for host to start the game...</p>
        </div>
      </div>
    );
  }

  if (gameState.game_status === 'won') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-600 via-yellow-500 to-orange-500 flex items-center justify-center p-8">
        <div className="text-center">
          <Trophy className="w-48 h-48 text-white mx-auto mb-8 animate-bounce" />
          <h1 className="text-8xl font-bold text-white mb-8 drop-shadow-2xl">CONGRATULATIONS!</h1>
          <h2 className="text-6xl font-bold text-yellow-900">
            You won {gameState.total_winnings}!
          </h2>
          <div className="mt-12 text-5xl">🎉 🎊 ✨</div>
        </div>
      </div>
    );
  }

  if (gameState.game_status === 'incorrect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-gray-900 to-red-950 flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-7xl font-bold text-red-400 mb-8">Game Over!</h1>
          <h2 className="text-5xl font-bold text-white mb-4">
            Final Winnings: {gameState.total_winnings}
          </h2>
          <p className="text-3xl text-gray-400 mt-8">Thank you for playing!</p>
        </div>
      </div>
    );
  }

  const answers: Array<{ letter: 'A' | 'B' | 'C' | 'D'; text: string }> = currentQuestion ? [
    { letter: 'A', text: currentQuestion.answer_a },
    { letter: 'B', text: currentQuestion.answer_b },
    { letter: 'C', text: currentQuestion.answer_c },
    { letter: 'D', text: currentQuestion.answer_d },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-center text-yellow-400 mb-8 drop-shadow-lg">
          🎄 Christmas Millionaire 🎅
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 order-2 lg:order-1">
            {currentQuestion && (
              <>
                <div className="bg-gradient-to-b from-blue-950 to-blue-900 p-8 rounded-lg shadow-2xl border-2 border-blue-600 mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
                    {currentQuestion.question}
                  </h2>
                  <p className="text-center text-blue-300 text-xl">
                    {currentQuestion.category}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {answers.map(({ letter, text }) => (
                    <div
                      key={letter}
                      className={`
                        ${getAnswerStyle(letter)}
                        p-8 rounded-lg border-2 transition-all duration-500
                        text-left text-xl md:text-2xl font-semibold
                      `}
                    >
                      <span className="inline-block w-10 h-10 rounded-full bg-white/20 text-center leading-10 mr-4 text-2xl">
                        {letter}
                      </span>
                      {text}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-gradient-to-b from-blue-950 to-blue-900 p-6 rounded-lg shadow-2xl border-2 border-yellow-600">
              <div className="space-y-2">
                {MONEY_LADDER.map(({ level, amount, milestone }) => {
                  const isCurrent = level === gameState.current_level;
                  const isPassed = level < gameState.current_level;

                  return (
                    <div
                      key={level}
                      className={`
                        px-4 py-3 rounded-lg text-center font-bold transition-all duration-500 text-lg
                        ${isCurrent
                          ? 'bg-yellow-500 text-black scale-110 shadow-xl shadow-yellow-500/50 animate-pulse'
                          : isPassed
                          ? 'bg-gray-700 text-gray-400'
                          : milestone
                          ? 'bg-orange-600 text-white border-2 border-orange-400'
                          : 'bg-blue-800 text-blue-200'
                        }
                      `}
                    >
                      <span className="text-sm">{level}.</span> {amount}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-around bg-blue-900 p-4 rounded-lg">
              <div className={`text-center ${gameState.lifeline_fifty_fifty_used ? 'opacity-30' : ''}`}>
                <div className="text-3xl mb-1">➗</div>
                <div className="text-white text-sm">50:50</div>
              </div>
              <div className={`text-center ${gameState.lifeline_phone_used ? 'opacity-30' : ''}`}>
                <div className="text-3xl mb-1">📞</div>
                <div className="text-white text-sm">Phone</div>
              </div>
              <div className={`text-center ${gameState.lifeline_audience_used ? 'opacity-30' : ''}`}>
                <div className="text-3xl mb-1">👥</div>
                <div className="text-white text-sm">Audience</div>
              </div>
            </div>
          </div>
        </div>

        {gameState?.active_lifeline === 'audience' && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8">
            <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-12 rounded-3xl shadow-2xl max-w-4xl w-full border-4 border-purple-500">
              <h2 className="text-5xl font-bold text-center text-white mb-8">Ask the Audience</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="bg-white p-8 rounded-xl">
                  <h3 className="text-2xl font-bold text-center text-purple-900 mb-4">Scan to Vote!</h3>
                  <div className="flex justify-center">
                    <QRCodeSVG
                      value={`${window.location.origin}/vote`}
                      size={280}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-center text-gray-600 mt-4 text-lg">
                    {window.location.origin}/vote
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-white text-center mb-6">Live Results</h3>
                  {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                    const total = voteCounts.A + voteCounts.B + voteCounts.C + voteCounts.D;
                    const percentage = total > 0 ? Math.round((voteCounts[letter] / total) * 100) : 0;
                    return (
                      <div key={letter} className="bg-white/10 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-2xl font-bold text-white">{letter}</span>
                          <span className="text-2xl font-bold text-yellow-400">{percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-400 h-full transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ width: `${percentage}%` }}
                          >
                            {percentage > 10 && (
                              <span className="text-white text-sm font-bold">{voteCounts[letter]}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-center text-gray-300 mt-6 text-xl">
                    Total Votes: {voteCounts.A + voteCounts.B + voteCounts.C + voteCounts.D}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {gameState?.active_lifeline === 'phone' && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8">
            <div className="bg-black rounded-3xl shadow-2xl max-w-xl w-full border-4 border-gray-800 overflow-hidden">
              <div className="flex flex-col py-12 px-8">
                <div className="text-center space-y-8">
                  <p className="text-gray-400 text-xl">Phone a Friend</p>

                  <div className="flex justify-center">
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center shadow-2xl">
                      <span className="text-7xl">👤</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-white text-5xl font-light">
                      {gameState.friend_name || 'Your Friend'}
                    </h2>
                    <p className="text-green-400 text-2xl font-light animate-pulse">
                      {callDuration < 2 ? 'calling...' : formatCallDuration(callDuration)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center gap-12 mt-12">
                  <button className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
                    <span className="text-3xl">🔇</span>
                  </button>
                  <button className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
                    <span className="text-3xl">⏸️</span>
                  </button>
                  <button className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/50 hover:bg-red-700 transition-colors">
                    <Phone className="w-8 h-8 text-white transform rotate-135" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
