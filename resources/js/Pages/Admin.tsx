import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function Admin() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-white flex items-center gap-2 mb-8 hover:text-yellow-400">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-yellow-400 mb-8">Admin Panel</h1>

        <div className="bg-blue-900/50 p-8 rounded-xl text-white">
          <h2 className="text-2xl font-bold mb-4">Setup Instructions</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Questions are seeded from Laravel database seeder</li>
            <li>Use Host Panel to control the game</li>
            <li>Use Display Panel for streaming</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
