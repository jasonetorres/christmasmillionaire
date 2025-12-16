import { useState, useEffect } from 'react';
import { supabase, TriviaQuestion } from '../lib/supabase';
import { MoneyLadder } from './MoneyLadder';
import { QuestionDisplay } from './QuestionDisplay';
import { Lifelines } from './Lifelines';
import { Trophy, Play, Home } from 'lucide-react';

type GameState = 'start' | 'playing' | 'won' | 'lost';

export function Game() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [totalWinnings, setTotalWinnings] = useState('$0');

  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [phoneFriendUsed, setPhoneFriendUsed] = useState(false);
  const [askAudienceUsed, setAskAudienceUsed] = useState(false);
  const [removedAnswers, setRemovedAnswers] = useState<Set<'A' | 'B' | 'C' | 'D'>>(new Set());

  const [lifelineMessage, setLifelineMessage] = useState<string>('');

  const MONEY_VALUES = ['$0', '$100', '$200', '$300', '$500', '$1,000', '$2,000', '$4,000', '$8,000', '$16,000', '$32,000', '$64,000', '$125,000', '$250,000', '$500,000', '$1,000,000'];

  useEffect(() => {
    if (gameState === 'playing' && !currentQuestion) {
      loadQuestion();
    }
  }, [gameState, currentLevel]);

  const loadQuestion = async () => {
    const { data, error } = await supabase
      .from('trivia_questions')
      .select('*')
      .eq('difficulty_level', currentLevel)
      .eq('is_used', false)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error loading question:', error);
      return;
    }

    if (!data) {
      alert('No more questions available for this level! Please add more questions.');
      setGameState('start');
      return;
    }

    setCurrentQuestion(data);
    setSelectedAnswer(null);
    setShowResult(false);
    setRemovedAnswers(new Set());
    setLifelineMessage('');
  };

  const startGame = () => {
    setGameState('playing');
    setCurrentLevel(1);
    setCurrentQuestion(null);
    setFiftyFiftyUsed(false);
    setPhoneFriendUsed(false);
    setAskAudienceUsed(false);
    setTotalWinnings('$0');
  };

  const handleAnswer = async (answer: 'A' | 'B' | 'C' | 'D') => {
    if (selectedAnswer || !currentQuestion) return;

    setSelectedAnswer(answer);
    setShowResult(true);

    await supabase
      .from('trivia_questions')
      .update({ is_used: true })
      .eq('id', currentQuestion.id);

    setTimeout(() => {
      if (answer === currentQuestion.correct_answer) {
        const newWinnings = MONEY_VALUES[currentLevel];
        setTotalWinnings(newWinnings);

        if (currentLevel === 15) {
          setGameState('won');
        } else {
          setTimeout(() => {
            setCurrentLevel(currentLevel + 1);
            setCurrentQuestion(null);
          }, 1500);
        }
      } else {
        let safeWinnings = '$0';
        if (currentLevel > 10) safeWinnings = '$32,000';
        else if (currentLevel > 5) safeWinnings = '$1,000';
        setTotalWinnings(safeWinnings);
        setGameState('lost');
      }
    }, 2000);
  };

  const handleFiftyFifty = () => {
    if (!currentQuestion || fiftyFiftyUsed) return;

    setFiftyFiftyUsed(true);
    const correctAnswer = currentQuestion.correct_answer;
    const allAnswers: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    const wrongAnswers = allAnswers.filter(a => a !== correctAnswer);

    const toRemove = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 2);
    setRemovedAnswers(new Set(toRemove));
    setLifelineMessage('50:50 used! Two wrong answers removed.');
    setTimeout(() => setLifelineMessage(''), 3000);
  };

  const handlePhoneFriend = () => {
    if (!currentQuestion || phoneFriendUsed) return;

    setPhoneFriendUsed(true);
    const confidence = Math.random() > 0.3 ? currentQuestion.correct_answer :
      ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];

    setLifelineMessage(`Your friend thinks the answer is ${confidence}!`);
    setTimeout(() => setLifelineMessage(''), 5000);
  };

  const handleAskAudience = () => {
    if (!currentQuestion || askAudienceUsed) return;

    setAskAudienceUsed(true);
    const correct = currentQuestion.correct_answer;
    const votes: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };

    votes[correct] = 40 + Math.floor(Math.random() * 35);
    const remaining = 100 - votes[correct];

    const others = ['A', 'B', 'C', 'D'].filter(a => a !== correct);
    others.forEach((letter, idx) => {
      if (idx === others.length - 1) {
        votes[letter] = remaining - votes[others[0]] - votes[others[1]];
      } else {
        votes[letter] = Math.floor(Math.random() * (remaining / 2));
      }
    });

    setLifelineMessage(`Audience votes: A: ${votes.A}%, B: ${votes.B}%, C: ${votes.C}%, D: ${votes.D}%`);
    setTimeout(() => setLifelineMessage(''), 7000);
  };

  const resetGame = () => {
    setGameState('start');
    setCurrentLevel(1);
    setCurrentQuestion(null);
    setTotalWinnings('$0');
  };

  if (gameState === 'start') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-yellow-400 mb-4 drop-shadow-lg">
            Who Wants to Be a Millionaire?
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold text-red-400 mb-8">
            🎄 Christmas Edition 🎅
          </h2>
          <p className="text-xl text-white mb-8">
            Test your knowledge of Christmas movies and holiday traditions!
          </p>
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-green-500 to-green-700 text-white px-12 py-6 rounded-full text-2xl font-bold hover:scale-110 transition-transform duration-300 shadow-2xl hover:shadow-green-500/50 flex items-center gap-3 mx-auto"
          >
            <Play className="w-8 h-8" />
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'won') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-600 via-yellow-500 to-orange-500 flex items-center justify-center p-4">
        <div className="text-center">
          <Trophy className="w-32 h-32 text-white mx-auto mb-8 animate-bounce" />
          <h1 className="text-6xl font-bold text-white mb-4">CONGRATULATIONS!</h1>
          <h2 className="text-4xl font-bold text-yellow-900 mb-8">
            You won {totalWinnings}! 🎉
          </h2>
          <button
            onClick={resetGame}
            className="bg-white text-yellow-600 px-8 py-4 rounded-full text-xl font-bold hover:scale-110 transition-transform duration-300 shadow-2xl flex items-center gap-3 mx-auto"
          >
            <Home className="w-6 h-6" />
            Play Again
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'lost') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-gray-900 to-red-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-red-400 mb-4">Game Over!</h1>
          <h2 className="text-3xl font-bold text-white mb-8">
            You won {totalWinnings}
          </h2>
          <button
            onClick={resetGame}
            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-4 rounded-full text-xl font-bold hover:scale-110 transition-transform duration-300 shadow-2xl flex items-center gap-3 mx-auto"
          >
            <Home className="w-6 h-6" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold text-center text-yellow-400 mb-8 drop-shadow-lg">
          🎄 Christmas Millionaire 🎅
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 order-2 lg:order-1">
            <Lifelines
              onFiftyFifty={handleFiftyFifty}
              onPhoneFriend={handlePhoneFriend}
              onAskAudience={handleAskAudience}
              fiftyFiftyUsed={fiftyFiftyUsed}
              phoneFriendUsed={phoneFriendUsed}
              askAudienceUsed={askAudienceUsed}
              disabled={showResult || !currentQuestion}
            />

            {lifelineMessage && (
              <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-4 rounded-lg text-center text-lg font-semibold mb-6 shadow-lg animate-pulse">
                {lifelineMessage}
              </div>
            )}

            <QuestionDisplay
              question={currentQuestion}
              onAnswer={handleAnswer}
              selectedAnswer={selectedAnswer}
              showResult={showResult}
              fiftyFiftyUsed={fiftyFiftyUsed}
              removedAnswers={removedAnswers}
              disabled={showResult}
            />
          </div>

          <div className="lg:col-span-1 order-1 lg:order-2">
            <MoneyLadder currentLevel={currentLevel} isActive={!showResult} />
          </div>
        </div>
      </div>
    </div>
  );
}
