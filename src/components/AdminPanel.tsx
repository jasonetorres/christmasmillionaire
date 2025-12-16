import { useState, useEffect } from 'react';
import { supabase, TriviaQuestion } from '../lib/supabase';
import { X, Plus, Trash2, RotateCcw } from 'lucide-react';
import { DatabaseSeeder } from './DatabaseSeeder';

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    answer_a: '',
    answer_b: '',
    answer_c: '',
    answer_d: '',
    correct_answer: 'A' as 'A' | 'B' | 'C' | 'D',
    difficulty_level: 1,
    category: 'Christmas Movies',
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const { data, error } = await supabase
      .from('trivia_questions')
      .select('*')
      .order('difficulty_level', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading questions:', error);
    } else {
      setQuestions(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('trivia_questions')
      .insert([formData]);

    if (error) {
      console.error('Error adding question:', error);
      alert('Error adding question: ' + error.message);
    } else {
      setFormData({
        question: '',
        answer_a: '',
        answer_b: '',
        answer_c: '',
        answer_d: '',
        correct_answer: 'A',
        difficulty_level: 1,
        category: 'Christmas Movies',
      });
      setShowAddForm(false);
      loadQuestions();
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    const { error } = await supabase
      .from('trivia_questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting question:', error);
      alert('Error deleting question: ' + error.message);
    } else {
      loadQuestions();
    }
  };

  const resetAllQuestions = async () => {
    if (!confirm('Reset all questions to unused? This will allow them to be used in games again.')) return;

    const { error } = await supabase
      .from('trivia_questions')
      .update({ is_used: false })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Error resetting questions:', error);
      alert('Error resetting questions: ' + error.message);
    } else {
      alert('All questions have been reset!');
      loadQuestions();
    }
  };

  const getQuestionsByLevel = (level: number) => {
    return questions.filter(q => q.difficulty_level === level);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Admin Panel</h1>
          <button
            onClick={onClose}
            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="text-white">
              <p className="text-2xl font-bold">{questions.length} Total Questions</p>
              <p className="text-gray-400">
                Used: {questions.filter(q => q.is_used).length} |
                Available: {questions.filter(q => !q.is_used).length}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Add Question
              </button>
              <button
                onClick={resetAllQuestions}
                className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2 font-semibold"
              >
                <RotateCcw className="w-5 h-5" />
                Reset All
              </button>
            </div>
          </div>
        </div>

        <DatabaseSeeder />

        {showAddForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 mt-6">
            <h2 className="text-2xl font-bold text-white mb-4">Add New Question</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white mb-2">Question</label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full p-3 rounded bg-gray-700 text-white"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2">Answer A</label>
                  <input
                    type="text"
                    value={formData.answer_a}
                    onChange={(e) => setFormData({ ...formData, answer_a: e.target.value })}
                    className="w-full p-3 rounded bg-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Answer B</label>
                  <input
                    type="text"
                    value={formData.answer_b}
                    onChange={(e) => setFormData({ ...formData, answer_b: e.target.value })}
                    className="w-full p-3 rounded bg-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Answer C</label>
                  <input
                    type="text"
                    value={formData.answer_c}
                    onChange={(e) => setFormData({ ...formData, answer_c: e.target.value })}
                    className="w-full p-3 rounded bg-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Answer D</label>
                  <input
                    type="text"
                    value={formData.answer_d}
                    onChange={(e) => setFormData({ ...formData, answer_d: e.target.value })}
                    className="w-full p-3 rounded bg-gray-700 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white mb-2">Correct Answer</label>
                  <select
                    value={formData.correct_answer}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                    className="w-full p-3 rounded bg-gray-700 text-white"
                    required
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white mb-2">Difficulty (1-15)</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={formData.difficulty_level}
                    onChange={(e) => setFormData({ ...formData, difficulty_level: parseInt(e.target.value) })}
                    className="w-full p-3 rounded bg-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 rounded bg-gray-700 text-white"
                  >
                    <option value="Christmas Movies">Christmas Movies</option>
                    <option value="Holiday Traditions">Holiday Traditions</option>
                    <option value="Christmas Songs">Christmas Songs</option>
                    <option value="Santa & Reindeer">Santa & Reindeer</option>
                    <option value="Winter Holidays">Winter Holidays</option>
                    <option value="Christmas History">Christmas History</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Add Question
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-6">
          {[...Array(15)].map((_, idx) => {
            const level = 15 - idx;
            const levelQuestions = getQuestionsByLevel(level);

            return (
              <div key={level} className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  Level {level} - {levelQuestions.length} questions
                  {levelQuestions.filter(q => !q.is_used).length > 0 && (
                    <span className="text-green-400 ml-2">
                      ({levelQuestions.filter(q => !q.is_used).length} available)
                    </span>
                  )}
                </h3>
                {levelQuestions.length === 0 ? (
                  <p className="text-gray-400 italic">No questions for this level yet</p>
                ) : (
                  <div className="space-y-3">
                    {levelQuestions.map((q) => (
                      <div
                        key={q.id}
                        className={`p-4 rounded-lg ${
                          q.is_used ? 'bg-gray-700 opacity-60' : 'bg-gray-900'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-white font-semibold mb-2">{q.question}</p>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-300 mb-2">
                              <p>A: {q.answer_a}</p>
                              <p>B: {q.answer_b}</p>
                              <p>C: {q.answer_c}</p>
                              <p>D: {q.answer_d}</p>
                            </div>
                            <div className="flex gap-4 text-sm">
                              <span className="text-green-400">Correct: {q.correct_answer}</span>
                              <span className="text-blue-400">{q.category}</span>
                              {q.is_used && <span className="text-red-400">USED</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteQuestion(q.id)}
                            className="ml-4 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
