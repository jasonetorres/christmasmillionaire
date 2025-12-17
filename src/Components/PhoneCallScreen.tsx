import { useState, useEffect, useRef } from 'react';
import { Phone, Mic, MicOff } from 'lucide-react';

interface PhoneCallScreenProps {
  questionData: {
    question: string;
    answerA: string;
    answerB: string;
    answerC: string;
    answerD: string;
    correctAnswer: string;
  };
  onEnd: () => void;
  isHost?: boolean;
}

export function PhoneCallScreen({ questionData, onEnd, isHost = false }: PhoneCallScreenProps) {
  // If this is the host view, just show simple controls
  if (isHost) {
    return (
      <div className="fixed bottom-8 right-8 z-50">
        <div className="bg-gradient-to-br from-red-900 to-red-950 border-2 border-red-500 rounded-xl p-6 shadow-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-2xl">
              🎅
            </div>
            <div>
              <p className="text-white font-bold text-lg">Phone a Friend</p>
              <p className="text-green-400 text-sm">Active on Display</p>
            </div>
          </div>
          <button
            onClick={onEnd}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
          >
            <Phone className="w-5 h-5 transform rotate-[135deg]" />
            End Call
          </button>
        </div>
      </div>
    );
  }

  const [isListening, setIsListening] = useState(false);
  const [isSantaSpeaking, setIsSantaSpeaking] = useState(false);
  const [currentCaption, setCurrentCaption] = useState('');
  const [speakerLabel, setSpeakerLabel] = useState<'You' | 'Santa' | ''>('');
  const [callDuration, setCallDuration] = useState(0);
  const [hasGreeted, setHasGreeted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setSpeakerLabel('You');
        setCurrentCaption('Listening...');
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');

        setCurrentCaption(transcript);

        if (event.results[event.results.length - 1].isFinal) {
          handleSpeechToSanta(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          setCurrentCaption('No speech detected. Try again.');
          setTimeout(() => setCurrentCaption(''), 2000);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    const initialGreeting = async () => {
      if (hasGreeted) return;
      setHasGreeted(true);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/santa-chat`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: 'Hi Santa! Thanks for taking my call!',
              question: questionData.question,
              answerA: questionData.answerA,
              answerB: questionData.answerB,
              answerC: questionData.answerC,
              answerD: questionData.answerD,
            }),
          }
        );

        const data = await response.json();
        if (data.response && data.audio) {
          playAudio(data.response, data.audio);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    initialGreeting();

    return () => {
      clearInterval(timer);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeechToSanta = async (transcript: string) => {
    setIsListening(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/santa-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: transcript,
            question: questionData.question,
            answerA: questionData.answerA,
            answerB: questionData.answerB,
            answerC: questionData.answerC,
            answerD: questionData.answerD,
          }),
        }
      );

      const data = await response.json();
      if (data.response && data.audio) {
        playAudio(data.response, data.audio);
      }
    } catch (error) {
      console.error('Error:', error);
      const fallbackText = 'Ho ho ho! Sorry, I seem to have lost connection from the North Pole. Can you repeat that?';
      speakTextFallback(fallbackText);
    }
  };

  const playAudio = (text: string, audioArray: number[]) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audioBlob = new Blob([new Uint8Array(audioArray)], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.onplay = () => {
      setIsSantaSpeaking(true);
      setSpeakerLabel('Santa');
      setCurrentCaption(text);
    };

    audio.onended = () => {
      setIsSantaSpeaking(false);
      setTimeout(() => {
        setSpeakerLabel('');
        setCurrentCaption('');
      }, 2000);
      URL.revokeObjectURL(audioUrl);
    };

    audio.onerror = () => {
      console.error('Audio playback error');
      setIsSantaSpeaking(false);
      speakTextFallback(text);
    };

    audioRef.current = audio;
    audio.play().catch(err => {
      console.error('Failed to play audio:', err);
      speakTextFallback(text);
    });
  };

  const speakTextFallback = (text: string) => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice =>
      voice.name.includes('Male') || voice.name.includes('Fred') || voice.name.includes('Alex')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSantaSpeaking(true);
      setSpeakerLabel('Santa');
      setCurrentCaption(text);
    };

    utterance.onend = () => {
      setIsSantaSpeaking(false);
      setTimeout(() => {
        setSpeakerLabel('');
        setCurrentCaption('');
      }, 2000);
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (isSantaSpeaking) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        window.speechSynthesis.cancel();
        setIsSantaSpeaking(false);
      }
      recognitionRef.current?.start();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[390px] bg-black rounded-[55px] shadow-2xl overflow-hidden relative">
        {/* iPhone Notch and Status Bar */}
        <div className="bg-black px-8 pt-3 pb-2 relative">
          <div className="flex items-center justify-between text-white text-sm font-semibold">
            <span>{currentTime}</span>
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[120px] h-7 bg-black rounded-b-3xl"></div>
            <div className="flex items-center gap-1">
              <div className="flex gap-[2px]">
                <div className="w-[3px] h-3 bg-white rounded-full"></div>
                <div className="w-[3px] h-3 bg-white rounded-full"></div>
                <div className="w-[3px] h-3 bg-white rounded-full"></div>
                <div className="w-[3px] h-3 bg-white/60 rounded-full"></div>
              </div>
              <svg className="w-6 h-4 ml-1" viewBox="0 0 24 24" fill="white">
                <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48 1.3-.75-.85-1.48H7v-1.5H5.3l.85-1.47L4.85 7 4 8.47 3.15 7l-1.3.75.85 1.47H1v1.5h1.7l-.85 1.48 1.3.75zm9.85-.75l.85 1.48 1.3-.75-.85-1.48H16v-1.5h-1.7l.85-1.47-1.3-.75L13 8.47 12.15 7l-1.3.75.85 1.47H10v1.5h1.7l-.85 1.48 1.3.75zm-6 0l.85 1.48 1.3-.75-.85-1.48H10v-1.5H8.3l.85-1.47-1.3-.75L7 8.47 6.15 7l-1.3.75.85 1.47H4v1.5h1.7l-.85 1.48 1.3.75z"/>
              </svg>
              <div className="w-6 h-3 border-2 border-white rounded-sm relative">
                <div className="absolute right-[-2px] top-1/2 -translate-y-1/2 w-[2px] h-2 bg-white"></div>
                <div className="absolute inset-[2px] bg-white"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Call Screen Content */}
        <div className="bg-gradient-to-b from-gray-900 to-black px-8 pb-12 pt-16 min-h-[750px] flex flex-col">
          {/* Contact Info */}
          <div className="text-center mb-12">
            <div className={`w-40 h-40 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-8xl shadow-2xl transition-transform ${
              isSantaSpeaking ? 'scale-105 animate-pulse' : ''
            }`}>
              🎅
            </div>
            <h3 className="text-white text-4xl font-light mb-3 tracking-wide">Santa Claus</h3>
            <p className="text-gray-400 text-xl font-light mb-1">North Pole</p>
            <p className="text-white text-2xl font-light">{formatDuration(callDuration)}</p>
          </div>

          {/* Captions Area */}
          <div className="flex-1 flex flex-col justify-start min-h-[180px]">
            {speakerLabel && (
              <div className="text-center mb-6">
                <p className="text-gray-400 text-base font-medium mb-3">{speakerLabel}</p>
                <div className="bg-gray-800/60 backdrop-blur rounded-2xl px-6 py-5 min-h-[120px] flex items-center justify-center">
                  <p className="text-white text-lg leading-relaxed">{currentCaption}</p>
                </div>
              </div>
            )}

            {isListening && (
              <div className="flex justify-center gap-2 mt-4">
                <div className="w-1.5 h-8 bg-green-500 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-12 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1.5 h-10 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-14 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                <div className="w-1.5 h-10 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
          </div>

          {/* Call Controls - Display Only */}
          <div className="mt-auto space-y-8">
            <div className="grid grid-cols-3 gap-8 mb-8">
              <button className="flex flex-col items-center opacity-50">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                </div>
                <span className="text-white text-xs">mute</span>
              </button>

              <button className="flex flex-col items-center opacity-50">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                  </svg>
                </div>
                <span className="text-white text-xs">keypad</span>
              </button>

              <button className="flex flex-col items-center opacity-50">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                </div>
                <span className="text-white text-xs">speaker</span>
              </button>
            </div>

            <div className="flex justify-center mb-4">
              <button
                onClick={toggleListening}
                disabled={isSantaSpeaking}
                className={`px-8 py-4 rounded-full font-medium transition-all shadow-lg ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-5 h-5 inline mr-2" />
                    Stop Speaking
                  </>
                ) : isSantaSpeaking ? (
                  'Santa is speaking...'
                ) : (
                  <>
                    <Mic className="w-5 h-5 inline mr-2" />
                    Tap to Speak
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
