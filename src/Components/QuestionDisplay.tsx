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
    return <div className="text-center np-ink text-2xl">Loading question...</div>;
  }

  const answers: Array<{ letter: 'A' | 'B' | 'C' | 'D'; text: string }> = [
    { letter: 'A', text: question.answer_a },
    { letter: 'B', text: question.answer_b },
    { letter: 'C', text: question.answer_c },
    { letter: 'D', text: question.answer_d },
  ];

  const getAnswerStyle = (letter: 'A' | 'B' | 'C' | 'D') => {
    if (removedAnswers.has(letter)) {
      return 'opacity-40 cursor-not-allowed bg-[#edf6e7] text-[#6b8a81]';
    }

    if (showResult) {
      if (letter === question.correct_answer) {
        return 'bg-[#d9efc8] text-[#254f55] border-[#428267] shadow-lg';
      }
      if (letter === selectedAnswer && selectedAnswer !== question.correct_answer) {
        return 'bg-[#fde8e4] text-[#254f55] border-[#b53336] shadow-lg';
      }
    }

    if (selectedAnswer === letter) {
      return 'bg-[#fbd475] text-black border-yellow-400 scale-105 shadow-lg shadow-yellow-500/50';
    }

    return 'bg-[#e5f3df] np-ink border-[#a8c6b8] hover:bg-[#d9efc8] hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30';
  };

  return (
    <div className={`transition-opacity duration-500 ${displayQuestion ? 'opacity-100' : 'opacity-0'}`}>
      <div className="np-panel p-8 rounded-lg shadow-2xl border-2 border-[#a8c6b8] mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center np-ink mb-2">
          {question.question}
        </h2>
        <p className="text-center np-muted text-sm">{question.category}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {answers.map(({ letter, text }) => (
          <button
            key={letter}
            onClick={() => !disabled && !removedAnswers.has(letter) && onAnswer(letter)}
            disabled={disabled || removedAnswers.has(letter)}
            className={`${getAnswerStyle(letter)} p-6 rounded-lg border-2 transition-all duration-300 text-left text-lg font-semibold disabled:cursor-not-allowed`}
          >
            <span className="inline-block w-8 h-8 rounded-full bg-black/10 text-center leading-8 mr-3">
              {letter}
            </span>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
