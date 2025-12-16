import { useState, useEffect } from 'react';
import { TriviaQuestion } from '../types';

interface QuestionDisplayProps {
  question: TriviaQuestion | null;
  onAnswer: (answer: 'A' | 'B' | 'C' | 'D') => void;
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
  showResult: boolean;
  removedAnswers: Set<'A' | 'B' | 'C' | 'D'>;
  disabled: boolean;
}

export function QuestionDisplay({
  question,
  onAnswer,
  selectedAnswer,
  showResult,
  removedAnswers,
  disabled
}: QuestionDisplayProps) {
  const [displayQuestion, setDisplayQuestion] = useState(false);

  useEffect(() => {
    setDisplayQuestion(false);
    const timer = setTimeout(() => setDisplayQuestion(true), 100);
    return () => clearTimeout(timer);
  }, [question?.id]);

  if (!question) {
    return <div className="text-center text-white text-2xl">Loading question...</div>;
  }

  const answers: Array<{ letter: 'A' | 'B' | 'C' | 'D'; text: string }> = [
    { letter: 'A', text: question.answer_a },
    { letter: 'B', text: question.answer_b },
    { letter: 'C', text: question.answer_c },
    { letter: 'D', text: question.answer_d },
  ];

  const getAnswerStyle = (letter: 'A' | 'B' | 'C' | 'D') => {
    if (removedAnswers.has(letter)) {
      return 'opacity-30 cursor-not-allowed bg-gray-800 text-gray-600';
    }

    if (showResult) {
      if (letter === question.correct_answer) {
        return 'bg-green-600 text-white border-green-400 shadow-lg shadow-green-500/50';
      }
      if (letter === selectedAnswer && selectedAnswer !== question.correct_answer) {
        return 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-500/50';
      }
    }

    if (selectedAnswer === letter) {
      return 'bg-yellow-500 text-black border-yellow-400 scale-105 shadow-lg shadow-yellow-500/50';
    }

    return 'bg-blue-900 text-white border-blue-600 hover:bg-blue-800 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30';
  };

  return (
    <div className={`transition-opacity duration-500 ${displayQuestion ? 'opacity-100' : 'opacity-0'}`}>
      <div className="bg-gradient-to-b from-blue-950 to-blue-900 p-8 rounded-lg shadow-2xl border-2 border-blue-600 mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-2">
          {question.question}
        </h2>
        <p className="text-center text-blue-300 text-sm">{question.category}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {answers.map(({ letter, text }) => (
          <button
            key={letter}
            onClick={() => !disabled && !removedAnswers.has(letter) && onAnswer(letter)}
            disabled={disabled || removedAnswers.has(letter)}
            className={`${getAnswerStyle(letter)} p-6 rounded-lg border-2 transition-all duration-300 text-left text-lg font-semibold disabled:cursor-not-allowed`}
          >
            <span className="inline-block w-8 h-8 rounded-full bg-white/20 text-center leading-8 mr-3">
              {letter}
            </span>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
