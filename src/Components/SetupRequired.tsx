export default function SetupRequired() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-950 p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-black/40 border-4 border-yellow-400 rounded-2xl p-10 text-center shadow-2xl">
        <div className="text-6xl mb-4">🎄</div>
        <h1 className="text-4xl font-bold text-yellow-300 mb-4">
          Who Wants to Be a Christmasaire?
        </h1>
        <p className="text-xl text-white mb-6">
          This build is running. The game database is not configured yet.
        </p>
        <p className="text-green-100 text-left leading-relaxed">
          Set <code className="text-yellow-200">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-yellow-200">VITE_SUPABASE_ANON_KEY</code> in{' '}
          <code className="text-yellow-200">.env</code> for local builds, or in the
          Vercel project environment for a deploy. Vite reads them when it builds,
          so change them and build again. The anon key is public in the browser.
          Keep the Supabase service role key out of any <code className="text-yellow-200">VITE_</code> variable.
        </p>
      </div>
    </div>
  );
}
