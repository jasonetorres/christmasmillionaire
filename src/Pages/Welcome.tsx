import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';

export default function Welcome() {
    const navigate = useNavigate();
    const [displayUrl, setDisplayUrl] = useState('');
    const [voteUrl, setVoteUrl] = useState('');

    useEffect(() => {
        const baseUrl = window.location.origin;
        setDisplayUrl(`${baseUrl}/display`);
        setVoteUrl(`${baseUrl}/vote`);
    }, []);

    const handleStartGame = async () => {
        const { error: deleteError } = await supabase
            .from('game_state')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (deleteError) {
            console.error("Error clearing old games:", deleteError);
        }

        await supabase.from('trivia_questions').update({ is_used: false }).eq('is_used', true);

        const { data: questions } = await supabase
            .from('trivia_questions')
            .select('*')
            .eq('difficulty_level', 1)
            .eq('is_used', false);

        if (questions && questions.length > 0) {
            const question = questions[Math.floor(Math.random() * questions.length)];
            await supabase.from('trivia_questions').update({ is_used: true }).eq('id', question.id);

            const { error: insertError } = await supabase
                .from('game_state')
                .insert({
                    current_question_id: question.id,
                    current_level: 1,
                    game_status: 'question_shown',
                    total_winnings: '$0',
                })
                .select()
                .single();

            if (insertError) {
                console.error("Error starting new game session:", insertError);
                alert("Failed to start game. Check browser console for details.");
                return;
            }

            navigate('/host');
        } else {
            alert("No Level 1 questions found in the database. Please check your trivia_questions table.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-6xl font-bold text-yellow-400 mb-4">
                        Who Wants to Be a Millionaire?
                    </h1>
                    <p className="text-xl text-blue-200">Host Control Panel</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-blue-400/30">
                        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Display Screen</h2>
                        <p className="text-blue-200 mb-6">Scan or visit this URL on the main display:</p>
                        <div className="bg-white p-6 rounded-xl mb-4 flex justify-center">
                            <QRCodeSVG value={displayUrl} size={200} />
                        </div>
                        <div className="bg-blue-900/50 rounded-lg p-4">
                            <p className="text-blue-100 text-sm break-all">{displayUrl}</p>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-green-400/30">
                        <h2 className="text-2xl font-bold text-green-400 mb-4">Audience Voting</h2>
                        <p className="text-blue-200 mb-6">Audience members scan to vote:</p>
                        <div className="bg-white p-6 rounded-xl mb-4 flex justify-center">
                            <QRCodeSVG value={voteUrl} size={200} />
                        </div>
                        <div className="bg-green-900/50 rounded-lg p-4">
                            <p className="text-green-100 text-sm break-all">{voteUrl}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={handleStartGame}
                        className="bg-green-600 text-white px-16 py-8 rounded-2xl text-3xl font-bold hover:bg-green-700 transition-all shadow-2xl flex items-center gap-6 hover:scale-105"
                    >
                        <Play className="w-12 h-12" />
                        Start New Game
                    </button>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-blue-300 text-sm">
                        After starting the game, you'll be taken to the host control panel
                    </p>
                </div>
            </div>
        </div>
    );
}
