import { useState, useEffect, useRef } from 'react';
import { Phone, Mic, MicOff } from 'lucide-react';
import { askSanta } from '../lib/api';

export default function Santa() {
  const [isListening, setIsListening] = useState(false);
  const [isSantaSpeaking, setIsSantaSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [callError, setCallError] = useState('');

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef<string>('');

  useEffect(() => {
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

    const initialGreeting = async () => {
      if (hasGreeted) return;
      setHasGreeted(true);

      try {
        const data = await askSanta({ message: '[Phone rings and Santa answers]' });
        if (data.response && data.audio) {
          playAudio(data.audio);
        }
      } catch (error) {
        setCallError(error instanceof Error ? error.message : 'Santa could not answer');
      }
    };

    initialGreeting();

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
      const data = await askSanta({ message: transcript });
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

      setTimeout(() => {
        if (recognitionRef.current && !isListening) {
          recognitionRef.current.start();
        }
      }, 500);
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
    <main className="np-layout" style={{ alignContent: 'center', justifyItems: 'center' }}>
      <section className="np-call-card">
        <p className="np-label">North Pole dispatch</p>
        <div className={'np-call-avatar' + (isSantaSpeaking ? ' is-speaking' : '')} aria-hidden="true">🎅</div>
        <h1>Santa Claus</h1>
        <p>North Pole · {formatDuration(callDuration)}</p>
        {callError && <p className="np-call-error" role="alert">{callError}</p>}
        <button type="button" className={'np-talk' + (isListening ? ' is-live' : '')} onClick={toggleListening} disabled={isSantaSpeaking}>
          {isListening ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
          {isListening ? 'Stop' : 'Talk'}
        </button>
        <a className="np-hangup" href="/" aria-label="Hang up">
          <Phone className="w-8 h-8" style={{ transform: 'rotate(135deg)' }} />
        </a>
      </section>
    </main>
  );
}
