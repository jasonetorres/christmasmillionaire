import { useState, useEffect, useRef } from 'react';
import { Phone, Send } from 'lucide-react';

interface Message {
  role: 'host' | 'santa';
  content: string;
  timestamp: number;
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    const initialGreeting = async () => {
      setIsLoading(true);
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
              correctAnswer: questionData.correctAnswer,
            }),
          }
        );

        const data = await response.json();
        if (data.response) {
          setMessages([
            { role: 'host', content: 'Hi Santa! Thanks for taking my call!', timestamp: Date.now() },
            { role: 'santa', content: data.response, timestamp: Date.now() + 1 }
          ]);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialGreeting();

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'host', content: userMessage, timestamp: Date.now() }]);
    setIsLoading(true);

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
            message: userMessage,
            question: questionData.question,
            answerA: questionData.answerA,
            answerB: questionData.answerB,
            answerC: questionData.answerC,
            answerD: questionData.answerD,
            correctAnswer: questionData.correctAnswer,
          }),
        }
      );

      const data = await response.json();
      if (data.response) {
        setMessages(prev => [...prev, { role: 'santa', content: data.response, timestamp: Date.now() }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'santa',
        content: 'Ho ho ho! Sorry, I seem to have lost connection from the North Pole. Can you repeat that?',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
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

        <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6">
          <div className="text-center mb-4">
            <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-4xl shadow-lg">
              🎅
            </div>
            <h3 className="text-white text-2xl font-semibold mb-1">Santa Claus</h3>
            <p className="text-green-400 text-sm font-medium">{formatDuration(callDuration)}</p>
          </div>

          <div className="bg-gray-950 rounded-2xl p-4 h-[400px] flex flex-col">
            <div className="flex-1 overflow-y-auto mb-3 space-y-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'host' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === 'host'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-700 text-white rounded-bl-sm'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 text-white rounded-2xl rounded-bl-sm px-4 py-2">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask Santa..."
                disabled={isLoading}
                className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            onClick={onEnd}
            className="w-full mt-4 bg-red-600 text-white rounded-full py-3 flex items-center justify-center gap-2 hover:bg-red-700 transition-all font-semibold"
          >
            <Phone className="w-5 h-5" />
            End Call
          </button>
        </div>
      </div>
    </div>
  );
}
