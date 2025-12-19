import { useNavigate } from 'react-router-dom';
import { Tv, MonitorPlay } from 'lucide-react';

export default function Welcome() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-950 p-8 flex items-center justify-center relative overflow-hidden">
            <div className="max-w-4xl w-full text-center relative z-10">
                <div className="mb-6">
                    <span className="text-7xl animate-twinkle inline-block" style={{ animationDuration: '2s' }}>⭐</span>
                </div>
                <h1 className="text-6xl font-bold text-yellow-300 mb-4 drop-shadow-lg">
                    Who Wants to Be a Christmasaire? 🎄
                </h1>
                <p className="text-xl text-green-200 mb-16">Choose your view</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button
                        onClick={() => navigate('/hostjt')}
                        className="bg-gradient-to-br from-red-600 to-red-700 text-white p-12 rounded-2xl text-3xl font-bold hover:from-red-700 hover:to-red-800 transition-all shadow-2xl flex flex-col items-center gap-6 hover:scale-105 border-4 border-yellow-400"
                    >
                        <Tv className="w-20 h-20" />
                        Host Panel
                    </button>

                    <button
                        onClick={() => navigate('/displayurl')}
                        className="bg-gradient-to-br from-green-700 to-green-800 text-white p-12 rounded-2xl text-3xl font-bold hover:from-green-800 hover:to-green-900 transition-all shadow-2xl flex flex-col items-center gap-6 hover:scale-105 border-4 border-yellow-400"
                    >
                        <MonitorPlay className="w-20 h-20" />
                        Display Screen
                    </button>
                </div>
            </div>
        </div>
    );
}
