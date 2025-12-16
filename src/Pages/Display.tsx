import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TriviaQuestion, GameState } from '../types';
import { MoneyLadder } from '../Components/MoneyLadder';
import { QuestionDisplay } from '../Components/QuestionDisplay';

export default function Display() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [audienceResults, setAudienceResults] = useState<any>(null);

  useEffect(() => {
    loadGameState();

    const gameStateChannel = supabase
      .channel('game-state-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, handleGameStateChange)
      .subscribe();

    const votesChannel = supabase
      .channel('votes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audience_votes' }, loadAudienceResults)
      .subscribe();

    return () => {
      supabase.removeChannel(gameStateChannel);
      supabase.removeChannel(votesChannel);
    };
  }, []);

  const handleGameStateChange = async () => {
    await loadGameState();
    await loadAudienceResults();
  };

  const loadGameState = async () => {
    const { data } = await supabase
      .from('game_state')
      .select('*')
      .order('created_at', { ascending: false })
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
    }
  };

  const loadAudienceResults = async () => {
    if (!gameState?.id) return;

    const { data: votes } = await supabase
      .from('audience_votes')
      .select('vote')
      .eq('game_state_id', gameState.id);

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
    }
  };

  useEffect(() => {
    if (gameState?.active_lifeline === 'audience') {
      loadAudienceResults();
    }
  }, [gameState?.active_lifeline]);

  if (!gameState || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-yellow-400 mb-4">
            Who Wants to Be a Millionaire?
          </h1>
          <p className="text-white text-2xl mt-8">Waiting for game to start...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 p-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        <div className="lg:col-span-3">
          <h1 className="text-4xl font-bold text-yellow-400 text-center mb-8">
            Who Wants to Be a Millionaire?
          </h1>

          <QuestionDisplay
            question={currentQuestion}
            onAnswer={() => {}}
            selectedAnswer={gameState.selected_answer as any}
            showResult={gameState.show_correct}
            removedAnswers={new Set((gameState.removed_answers as any[]) || [])}
            disabled={true}
          />

          {gameState.active_lifeline === 'phone' && (
            <div className="mt-8 bg-green-900/50 border-2 border-green-500 p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-white mb-2">📞 Phone a Friend</h3>
              <p className="text-xl text-green-200">
                Calling {gameState.friend_name || 'a friend'}...
              </p>
            </div>
          )}

          {gameState.active_lifeline === 'audience' && audienceResults && (
            <div className="mt-8 bg-blue-900/50 border-2 border-blue-500 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-white text-center mb-4">
                👥 Ask the Audience
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {['A', 'B', 'C', 'D'].map(answer => (
                  <div key={answer} className="text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">
                      {audienceResults[answer]?.percentage || 0}%
                    </div>
                    <div className="bg-blue-700 h-32 relative rounded-lg overflow-hidden">
                      <div
                        className="absolute bottom-0 w-full bg-yellow-400 transition-all duration-500"
                        style={{ height: `${audienceResults[answer]?.percentage || 0}%` }}
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
    </div>
  );
}
