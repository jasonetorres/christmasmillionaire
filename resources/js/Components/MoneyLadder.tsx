interface MoneyLadderProps {
  currentLevel: number;
  isActive: boolean;
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

export function MoneyLadder({ currentLevel, isActive }: MoneyLadderProps) {
  return (
    <div className="bg-gradient-to-b from-blue-950 to-blue-900 p-6 rounded-lg shadow-2xl border-2 border-yellow-600">
      <div className="space-y-1">
        {MONEY_LADDER.map(({ level, amount, milestone }) => {
          const isCurrent = level === currentLevel;
          const isPassed = level < currentLevel;

          return (
            <div
              key={level}
              className={`
                px-4 py-2 rounded-lg text-center font-bold transition-all duration-300
                ${isCurrent && isActive
                  ? 'bg-yellow-500 text-black scale-105 shadow-lg shadow-yellow-500/50'
                  : isPassed
                  ? 'bg-gray-700 text-gray-400'
                  : milestone
                  ? 'bg-orange-600 text-white'
                  : 'bg-blue-800 text-blue-200'
                }
                ${milestone && !isPassed && !isCurrent ? 'border-2 border-orange-400' : ''}
              `}
            >
              <span className="text-sm">{level}.</span> {amount}
            </div>
          );
        })}
      </div>
    </div>
  );
}
