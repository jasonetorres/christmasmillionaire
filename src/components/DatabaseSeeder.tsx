import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { seedQuestions } from '../data/seedQuestions';
import { additionalQuestions } from '../data/additionalQuestions';
import { bulkQuestions } from '../data/bulkQuestions';
import { megaQuestions } from '../data/megaQuestions';
import { userQuestions } from '../data/userQuestions';
import { Database, Check } from 'lucide-react';

export function DatabaseSeeder() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const allQuestions = [...seedQuestions, ...additionalQuestions, ...bulkQuestions, ...megaQuestions, ...userQuestions];

  const seedDatabase = async () => {
    setLoading(true);
    setMessage('Seeding database...');

    try {
      // Insert in batches to avoid payload size limits
      const batchSize = 100;
      let totalInserted = 0;

      for (let i = 0; i < allQuestions.length; i += batchSize) {
        const batch = allQuestions.slice(i, i + batchSize);
        const { error } = await supabase
          .from('trivia_questions')
          .insert(batch);

        if (error) {
          setMessage(`Error at batch ${Math.floor(i / batchSize) + 1}: ` + error.message);
          setLoading(false);
          return;
        }
        totalInserted += batch.length;
        setMessage(`Inserting... ${totalInserted}/${allQuestions.length}`);
      }

      setMessage(`Successfully added ${allQuestions.length} questions!`);
    } catch (err) {
      setMessage('Error: ' + String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-900 p-6 rounded-lg">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Database className="w-6 h-6" />
        Database Seeder
      </h3>
      <p className="text-blue-200 mb-4">
        This will add {allQuestions.length} Christmas trivia questions to your database across all 15 difficulty levels.
        Questions cover Christmas Movies, Holiday Traditions, Christmas Songs, Santa & Reindeer, Winter Holidays, and Christmas History.
      </p>
      <button
        onClick={seedDatabase}
        disabled={loading}
        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-600 transition-colors flex items-center gap-2"
      >
        {loading ? (
          <>Loading...</>
        ) : (
          <>
            <Check className="w-5 h-5" />
            Seed Database
          </>
        )}
      </button>
      {message && (
        <div className={`mt-4 p-4 rounded ${message.includes('Error') ? 'bg-red-600' : 'bg-green-600'} text-white`}>
          {message}
        </div>
      )}
    </div>
  );
}
