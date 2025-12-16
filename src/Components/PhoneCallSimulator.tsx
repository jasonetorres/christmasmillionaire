import { Phone } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface PhoneCallSimulatorProps {
  friendName: string;
  aiResponse: string;
  onEnd: () => void;
}

export function PhoneCallSimulator({ friendName, aiResponse, onEnd }: PhoneCallSimulatorProps) {
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'talking'>('ringing');
  const [displayedText, setDisplayedText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const hasSpokenRef = useRef(false);

  useEffect(() => {
    const ringTimer = setTimeout(() => {
      setCallStatus('connected');
    }, 2000);

    return () => clearTimeout(ringTimer);
  }, []);

  useEffect(() => {
    if (callStatus === 'connected') {
      const connectedTimer = setTimeout(() => {
        setCallStatus('talking');
      }, 1000);
      return () => clearTimeout(connectedTimer);
    }
  }, [callStatus]);

  useEffect(() => {
    if (callStatus === 'talking' && !hasSpokenRef.current && aiResponse) {
      hasSpokenRef.current = true;

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(aiResponse);
        utterance.rate = 0.75;
        utterance.pitch = 0.7;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice =>
          voice.name.includes('Microsoft David') ||
          voice.name.includes('Google UK English Male') ||
          voice.name.includes('Daniel') ||
          voice.lang.startsWith('en')
        ) || voices[0];

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [callStatus, aiResponse]);

  useEffect(() => {
    if (callStatus === 'talking' && textIndex < aiResponse.length) {
      const timer = setTimeout(() => {
        setDisplayedText(aiResponse.slice(0, textIndex + 1));
        setTextIndex(textIndex + 1);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [callStatus, textIndex, aiResponse]);

  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4">
        {/* Twilio Branding */}
        <div className="text-center mb-4">
          <p className="text-white/70 text-sm font-medium">Phone a Friend</p>
          <p className="text-white/50 text-xs">brought to you by Twilio</p>
        </div>

        {/* iPhone-style call interface */}
        <div className="bg-gradient-to-b from-gray-900 to-black rounded-[3rem] p-8 shadow-2xl border-8 border-gray-800">
          {/* Status bar */}
          <div className="flex justify-between items-center mb-12 text-white text-xs">
            <span>9:41</span>
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

          {/* Call info */}
          <div className="text-center mb-8">
            <p className="text-white/60 text-sm mb-2">
              {callStatus === 'ringing' && 'calling...'}
              {callStatus === 'connected' && 'connected'}
              {callStatus === 'talking' && '00:00:' + Math.floor(textIndex / 20).toString().padStart(2, '0')}
            </p>

            {/* Avatar */}
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-600 to-green-600 flex items-center justify-center text-6xl">
              🎅
            </div>

            <h2 className="text-white text-3xl font-semibold mb-2">{friendName}</h2>
            <p className="text-white/60 text-sm">North Pole</p>
          </div>

          {/* AI Response Display */}
          {callStatus === 'talking' && (
            <div className="bg-black/40 rounded-2xl p-4 mb-8 min-h-[120px] backdrop-blur-sm">
              <p className="text-white text-sm leading-relaxed">{displayedText}</p>
            </div>
          )}

          {/* End call button */}
          <div className="flex justify-center">
            <button
              onClick={onEnd}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
            >
              <Phone className="w-8 h-8 text-white transform rotate-[135deg]" />
            </button>
          </div>

          {/* Additional controls (visual only) */}
          <div className="flex justify-around mt-12 opacity-50">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-700 mx-auto mb-2"></div>
              <p className="text-white text-xs">mute</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-700 mx-auto mb-2"></div>
              <p className="text-white text-xs">keypad</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-700 mx-auto mb-2"></div>
              <p className="text-white text-xs">speaker</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
