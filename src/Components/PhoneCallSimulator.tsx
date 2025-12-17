import { Phone } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PhoneCallSimulatorProps {
  friendName: string;
  onEnd: () => void;
}

export function PhoneCallSimulator({ friendName, onEnd }: PhoneCallSimulatorProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4">
        <div className="text-center mb-4">
          <p className="text-white/70 text-sm font-medium">Phone a Friend</p>
          <p className="text-white/50 text-xs">Call Duration: {formatDuration(callDuration)}</p>
        </div>

        <div className="bg-gradient-to-b from-gray-900 to-black rounded-[3rem] p-8 shadow-2xl border-8 border-gray-800">
          <div className="flex justify-between items-center mb-12 text-white text-xs">
            <span>{currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 border border-white rounded-sm"></div>
              <div className="flex gap-0.5">
                <div className="w-1 h-3 bg-white rounded-full"></div>
                <div className="w-1 h-3 bg-white rounded-full"></div>
                <div className="w-1 h-3 bg-white rounded-full"></div>
                <div className="w-1 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <p className="text-green-400 text-sm mb-2">Connected</p>

            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-600 to-green-600 flex items-center justify-center text-6xl">
              🎅
            </div>

            <h2 className="text-white text-3xl font-semibold mb-2">{friendName}</h2>
            <p className="text-white/60 text-sm">North Pole</p>
            <p className="text-white/40 text-xs mt-4">Call in progress</p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={onEnd}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
            >
              <Phone className="w-8 h-8 text-white transform rotate-[135deg]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
