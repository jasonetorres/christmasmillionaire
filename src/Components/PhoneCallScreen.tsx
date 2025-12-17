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
}

export function PhoneCallScreen({ questionData, onEnd }: PhoneCallScreenProps) {
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

  return (
    <div className="fixed top-8 right-8 z-50">
      <div className="w-[380px] bg-gradient-to-b from-gray-900 to-black rounded-[40px] shadow-2xl border-8 border-gray-800 overflow-hidden">
        <div className="bg-black h-6 flex items-center justify-center">
          <div className="w-20 h-5 bg-gray-900 rounded-full"></div>
        </div>

        <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-8 min-h-[600px] flex flex-col">
          <div className="text-center mb-8">
            <div className={`w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-6xl shadow-lg transition-transform ${
              isSantaSpeaking ? 'scale-110 animate-pulse' : ''
            }`}>
              🎅
            </div>
            <h3 className="text-white text-3xl font-semibold mb-2">Santa Claus</h3>
            <p className="text-green-400 text-lg font-medium">{formatDuration(callDuration)}</p>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {speakerLabel && (
              <div className="text-center mb-4">
                <p className="text-gray-400 text-sm font-medium mb-2">{speakerLabel}</p>
                <div className="bg-gray-950/50 rounded-2xl px-6 py-4 min-h-[100px] flex items-center justify-center">
                  <p className="text-white text-lg leading-relaxed">{currentCaption}</p>
                </div>
              </div>
            )}

            {isListening && (
              <div className="flex justify-center gap-1 mb-4">
                <div className="w-1 h-8 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-1 h-12 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-10 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-14 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                <div className="w-1 h-10 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <button
              onClick={toggleListening}
              disabled={isSantaSpeaking}
              className={`w-20 h-20 mx-auto flex items-center justify-center rounded-full transition-all shadow-lg ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>

            <p className="text-center text-gray-400 text-sm">
              {isListening ? 'Tap to stop' : isSantaSpeaking ? 'Santa is speaking...' : 'Tap to speak'}
            </p>

            <button
              onClick={onEnd}
              className="w-full bg-red-600 text-white rounded-full py-3 flex items-center justify-center gap-2 hover:bg-red-700 transition-all font-semibold"
            >
              <Phone className="w-5 h-5" />
              End Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
