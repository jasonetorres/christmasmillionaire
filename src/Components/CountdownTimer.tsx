import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { soundSystem } from './SoundSystem';

interface CountdownTimerProps {
  startTime: number | null;
  timeLimit: number;
  isPaused?: boolean;
}

export function CountdownTimer({ startTime, timeLimit, isPaused = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  const [lastTickSound, setLastTickSound] = useState<number>(0);

  useEffect(() => {
    if (!startTime || isPaused) {
      setTimeLeft(timeLimit);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, timeLimit - elapsed);

      setTimeLeft(remaining);

      if (remaining <= 10 && remaining > 0) {
        const currentSecond = Math.floor(now / 1000);
        if (currentSecond !== lastTickSound) {
          soundSystem.playTimerWarning();
          setLastTickSound(currentSecond);
        }
      }

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, timeLimit, isPaused, lastTickSound]);

  const percentage = (timeLeft / timeLimit) * 100;
  const isWarning = timeLeft <= 10;
  const isCritical = timeLeft <= 5;

  return (
    <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className={`w-6 h-6 ${isCritical ? 'text-red-500 animate-pulse' : isWarning ? 'text-yellow-500' : 'text-white'}`} />
          <span className="text-white font-semibold">Time Remaining</span>
        </div>
        <span className={`text-3xl font-bold ${isCritical ? 'text-red-500 animate-pulse' : isWarning ? 'text-yellow-400' : 'text-white'}`}>
          {timeLeft}s
        </span>
      </div>

      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
