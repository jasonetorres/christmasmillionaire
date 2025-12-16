import { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, SkipForward, RotateCcw } from 'lucide-react';
import { GameState, TriviaQuestion } from '../types';
import { Lifelines } from '../Components/Lifelines';
import { QuestionDisplay } from '../Components/QuestionDisplay';

export default function Host() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [friendName, setFriendName] = useState('');

  useEffect(() => {
    loadGameState();
  }, []);

  const loadGameState = async () => {
    try {
      const { data } = await axios.get('/api/game-state');
      setGameState(data);
      if (data?.current_question) {
        setCurrentQuestion(data.current_question);
      }
    } catch (error) {
      console.error('Failed to load game state', error);
    }
  };

  const startNewGame = async () => {
    try {
      const { data } = await axios.post('/api/game-state/start');
      setGameState(data);
      setCurrentQuestion(data.current_question);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to start game');
    }
  };

  const handleAnswerSelect = async (answer: 'A' | 'B' | 'C' | 'D') => {
    if (!gameState) return;
    const { data } = await axios.post('/api/game-state', {
      ...gameState,
      selected_answer: answer,
    });
    setGameState(data);
  };

  const showCorrectAnswer = async () => {
    if (!gameState) return;
    const { data } = await axios.post('/api/game-state', {
      ...gameState,
      show_correct: true,
    });
    setGameState(data);
  };

  const nextQuestion = async () => {
    try {
      const { data } = await axios.post('/api/game-state/next');
      setGameState(data);
      setCurrentQuestion(data.current_question);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to load next question');
    }
  };

  const resetGame = async () => {
    if (confirm('Reset the game?')) {
      await axios.post('/api/game-state/reset');
      setGameState(null);
      setCurrentQuestion(null);
    }
  };

  const handleFiftyFifty = async () => {
    if (!gameState || !currentQuestion) return;
    const correct = currentQuestion.correct_answer;
    const others = ['A', 'B', 'C', 'D'].filter(a => a !== correct);
    const toRemove = others.sort(() => 0.5 - Math.random()).slice(0, 2);
    const { data } = await axios.post('/api/game-state', {
      ...gameState,
      lifeline_fifty_fifty_used: true,
      removed_answers: toRemove,
    });
    setGameState(data);
  };

  const handlePhoneFriend = async () => {
    const name = prompt('Enter friend name:');
    if (!name || !gameState) return;
    setFriendName(name);
    const { data } = await axios.post('/api/game-state', {
      ...gameState,
      lifeline_phone_used: true,
      active_lifeline: 'phone',
      friend_name: name,
    });
    setGameState(data);
  };

  const handleAskAudience = async () => {
    if (!gameState) return;
    const { data } = await axios.post('/api/game-state', {
      ...gameState,
      lifeline_audience_used: true,
      active_lifeline: 'audience',
    });
    setGameState(data);
  };

  if (!gameState || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 p-8 flex items-center justify-center">
        <button
          onClick={startNewGame}
          className="bg-green-600 text-white px-12 py-6 rounded-xl text-2xl font-bold hover:bg-green-700 transition-all shadow-2xl flex items-center gap-4"
        >
          <Play className="w-10 h-10" />
          Start New Game
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">Host Panel</h1>
          <button
            onClick={resetGame}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>

        <Lifelines
          onFiftyFifty={handleFiftyFifty}
          onPhoneFriend={handlePhoneFriend}
          onAskAudience={handleAskAudience}
          fiftyFiftyUsed={gameState.lifeline_fifty_fifty_used}
          phoneFriendUsed={gameState.lifeline_phone_used}
          askAudienceUsed={gameState.lifeline_audience_used}
          disabled={false}
        />

        <QuestionDisplay
          question={currentQuestion}
          onAnswer={handleAnswerSelect}
          selectedAnswer={gameState.selected_answer as any}
          showResult={gameState.show_correct}
          removedAnswers={new Set(gameState.removed_answers as any[])}
          disabled={false}
        />

        <div className="flex gap-4 mt-8">
          <button
            onClick={showCorrectAnswer}
            disabled={gameState.show_correct}
            className="flex-1 bg-yellow-600 text-white px-6 py-4 rounded-lg font-bold hover:bg-yellow-700 transition-all disabled:opacity-50"
          >
            Show Correct Answer
          </button>
          <button
            onClick={nextQuestion}
            className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <SkipForward className="w-6 h-6" />
            Next Question
          </button>
        </div>
      </div>
    </div>
  );
}
