import { Link } from 'react-router-dom';
import { Tv, Smartphone } from 'lucide-react';

export default function Welcome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 flex items-center justify-center p-8">
      <div className="text-center max-w-4xl">
        <h1 className="text-6xl md:text-8xl font-bold text-yellow-400 mb-4 drop-shadow-lg">
          Who Wants to Be a Christmasaire?
        </h1>
        <h2 className="text-3xl md:text-4xl font-semibold text-red-400 mb-12">
          🎄 The Festive Quiz Show 🎅
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/host"
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-12 rounded-2xl hover:scale-105 transition-all shadow-2xl hover:shadow-blue-500/50"
          >
            <Smartphone className="w-24 h-24 mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-2">Host Panel</h3>
            <p className="text-xl text-blue-200">Control the game from your phone</p>
          </Link>

          <Link
            to="/display"
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-12 rounded-2xl hover:scale-105 transition-all shadow-2xl hover:shadow-purple-500/50"
          >
            <Tv className="w-24 h-24 mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-2">Display Panel</h3>
            <p className="text-xl text-purple-200">Stream visual for your audience</p>
          </Link>
        </div>

        <Link
          to="/vote"
          className="bg-gray-700 text-white px-8 py-4 rounded-xl hover:bg-gray-600 transition-all shadow-lg flex items-center gap-3 mx-auto w-fit"
        >
          <span className="text-xl">Audience Voting</span>
        </Link>
      </div>
    </div>
  );
}
