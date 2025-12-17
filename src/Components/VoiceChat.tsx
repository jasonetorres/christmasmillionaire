import { Phone, Mic, MicOff } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface VoiceChatProps {
  friendName: string;
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

export function VoiceChat({ friendName, questionData, onEnd }: VoiceChatProps) {
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'talking'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  useEffect(() => {
    const initVoiceChat = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        const source = audioContextRef.current.createMediaStreamSource(stream);
        processorRef.current = audioContextRef.current.createScriptProcessor(2048, 1, 1);

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const wsUrl = `${supabaseUrl.replace('https://', 'wss://')}/functions/v1/voice-chat?apikey=${supabaseAnonKey}`;
        console.log('Connecting to WebSocket:', wsUrl);

        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('WebSocket connected successfully');
          setCallStatus('connected');

          if (wsRef.current) {
            console.log('Sending session config with question data');
            wsRef.current.send(JSON.stringify({
              type: 'session.config',
              questionData: questionData
            }));
          }
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'session.ready') {
              setCallStatus('talking');
            } else if (data.type === 'audio.delta' && data.audio) {
              const audioData = atob(data.audio);
              const audioArray = new Uint8Array(audioData.length);
              for (let i = 0; i < audioData.length; i++) {
                audioArray[i] = audioData.charCodeAt(i);
              }
              playAudio(audioArray);
            } else if (data.type === 'transcript') {
              setTranscript(data.text);
            }
          } catch (error) {
            console.error('Error processing message:', error);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setCallStatus('connecting');
        };

        wsRef.current.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          if (event.code !== 1000) {
            console.error('WebSocket closed unexpectedly. Code:', event.code, 'Reason:', event.reason);
          }
        };

        processorRef.current.onaudioprocess = (e) => {
          if (wsRef.current?.readyState === WebSocket.OPEN && !isMuted) {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcm16 = convertToPCM16(inputData);
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));

            wsRef.current.send(JSON.stringify({
              type: 'audio.input',
              audio: base64Audio
            }));
          }
        };

        source.connect(processorRef.current);
        processorRef.current.connect(audioContextRef.current.destination);
      } catch (error) {
        console.error('Error initializing voice chat:', error);
        alert('Failed to access microphone. Please check permissions.');
      }
    };

    initVoiceChat();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (processorRef.current) {
        processorRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [questionData]);

  const convertToPCM16 = (float32Array: Float32Array): Int16Array => {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16;
  };

  const playAudio = async (audioData: Uint8Array) => {
    if (!audioContextRef.current) return;

    try {
      const arrayBuffer = audioData.buffer.slice(0) as ArrayBuffer;
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleEnd = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    onEnd();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4">
        <div className="text-center mb-4">
          <p className="text-white/70 text-sm font-medium">Phone a Friend</p>
          <p className="text-white/50 text-xs">powered by OpenAI Realtime</p>
        </div>

        <div className="bg-gradient-to-b from-gray-900 to-black rounded-[3rem] p-8 shadow-2xl border-8 border-gray-800">
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

          <div className="text-center mb-8">
            <p className="text-white/60 text-sm mb-2">
              {callStatus === 'connecting' && 'connecting...'}
              {callStatus === 'connected' && 'connected'}
              {callStatus === 'talking' && 'speaking with Santa'}
            </p>

            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-600 to-green-600 flex items-center justify-center text-6xl">
              🎅
            </div>

            <h2 className="text-white text-3xl font-semibold mb-2">{friendName}</h2>
            <p className="text-white/60 text-sm">North Pole</p>
          </div>

          {callStatus === 'talking' && transcript && (
            <div className="bg-black/40 rounded-2xl p-4 mb-8 min-h-[100px] backdrop-blur-sm">
              <p className="text-white text-sm leading-relaxed">{transcript}</p>
            </div>
          )}

          <div className="flex justify-center gap-8 mb-8">
            <button
              onClick={toggleMute}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isMuted ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
            </button>

            <button
              onClick={handleEnd}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
            >
              <Phone className="w-8 h-8 text-white transform rotate-[135deg]" />
            </button>
          </div>

          <div className="flex justify-around opacity-50">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-700 mx-auto mb-2"></div>
              <p className="text-white text-xs">speaker</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-700 mx-auto mb-2"></div>
              <p className="text-white text-xs">keypad</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
