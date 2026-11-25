import { useState, useEffect, useRef } from 'react';
import { Phone, Mic, MicOff } from 'lucide-react';
import { askSanta } from '../lib/api';

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
  const [isListening, setIsListening] = useState(false);
  const [isSantaSpeaking, setIsSantaSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [callError, setCallError] = useState('');

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef<string>('');

  // If this is the host view, just show a simple status indicator
  if (isHost) {
    return (
      <aside className="np-call-host">
        <div className="np-call-avatar" aria-hidden="true">🎅</div>
        <div>
          <p className="np-label">Phone a Friend</p>
          <strong>Santa is on the display</strong>
        </div>
        <button type="button" className="np-button" onClick={onEnd}>
          <Phone className="w-5 h-5" style={{ transform: 'rotate(135deg)' }} />
          End call
        </button>
      </aside>
    );
  }

  // Display view - handles both microphone input and audio output
  useEffect(() => {
    // Setup speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        transcriptRef.current = '';
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        transcriptRef.current = transcript;
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Send initial greeting
    const initialGreeting = async () => {
      if (hasGreeted) return;
      setHasGreeted(true);

      try {
        const data = await askSanta({
          message: '[Phone rings and Santa answers]',
          question: questionData.question,
          answerA: questionData.answerA,
          answerB: questionData.answerB,
          answerC: questionData.answerC,
          answerD: questionData.answerD,
        });
        if (data.response && data.audio) {
          playAudio(data.audio);
        }
      } catch (error) {
        setCallError(error instanceof Error ? error.message : 'Santa could not answer');
      }
    };

    initialGreeting();

    // Setup call duration timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleSpeechToSanta = async (transcript: string) => {
    setIsListening(false);

    try {
      const data = await askSanta({
        message: transcript,
        question: questionData.question,
        answerA: questionData.answerA,
        answerB: questionData.answerB,
        answerC: questionData.answerC,
        answerD: questionData.answerD,
      });
      if (data.response && data.audio) {
        playAudio(data.audio);
      }
    } catch (error) {
      setCallError(error instanceof Error ? error.message : 'Santa could not answer');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      const finalTranscript = transcriptRef.current.trim();
      if (finalTranscript) {
        handleSpeechToSanta(finalTranscript);
      }
      transcriptRef.current = '';
    } else {
      recognitionRef.current?.start();
    }
  };

  const playAudio = (audioArray: number[]) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audioBlob = new Blob([new Uint8Array(audioArray)], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.onplay = () => {
      setIsSantaSpeaking(true);
    };

    audio.onended = () => {
      setIsSantaSpeaking(false);
      URL.revokeObjectURL(audioUrl);
    };

    audio.onerror = () => {
      console.error('Audio playback error');
      setIsSantaSpeaking(false);
    };

    audioRef.current = audio;
    audio.play().catch(err => {
      console.error('Failed to play audio:', err);
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="np-call-scrim">
      <section className="np-call-card" role="dialog" aria-label="Phone a Friend">
        <p className="np-label">Phone a Friend</p>
        <div className={'np-call-avatar' + (isSantaSpeaking ? ' is-speaking' : '')} aria-hidden="true">🎅</div>
        <h3>Santa Claus</h3>
        <p>North Pole · {formatDuration(callDuration)}</p>
        {callError && <p className="np-call-error" role="alert">{callError}</p>}
        <button type="button" className={'np-talk' + (isListening ? ' is-live' : '')} onClick={toggleListening} disabled={isSantaSpeaking}>
          {isListening ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
          {isListening ? 'Stop' : 'Talk'}
        </button>
        <button type="button" className="np-hangup" onClick={onEnd} aria-label="End call">
          <Phone className="w-8 h-8" style={{ transform: 'rotate(135deg)' }} />
        </button>
      </section>
    </div>
  );
}
