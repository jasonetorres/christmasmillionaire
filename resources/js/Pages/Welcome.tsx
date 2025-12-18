import { Link } from '@inertiajs/react';
import { Tv, MonitorPlay } from 'lucide-react';

export default function Welcome() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 p-8 flex items-center justify-center">
            <div className="max-w-4xl w-full text-center">
                <h1 className="text-6xl font-bold text-yellow-400 mb-4">
                    Who Wants to Be a Millionaire?
                </h1>
                <p className="text-xl text-blue-200 mb-16">Choose your view</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Link
                        href="/host"
                        className="bg-yellow-600 text-white p-12 rounded-2xl text-3xl font-bold hover:bg-yellow-700 transition-all shadow-2xl flex flex-col items-center gap-6 hover:scale-105"
                    >
                        <Tv className="w-20 h-20" />
                        Host Panel
                    </Link>

                    <Link
                        href="/display"
                        className="bg-blue-600 text-white p-12 rounded-2xl text-3xl font-bold hover:bg-blue-700 transition-all shadow-2xl flex flex-col items-center gap-6 hover:scale-105"
                    >
                        <MonitorPlay className="w-20 h-20" />
                        Display Screen
                    </Link>
                </div>
            </div>
        </div>
    );
}
