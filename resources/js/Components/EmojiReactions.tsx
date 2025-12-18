import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface EmojiReaction {
  id: string;
  emoji: string;
  x: number;
  createdAt: number;
}

interface EmojiReactionsProps {
  gameStateId: string | null;
}

export function EmojiReactions({ gameStateId }: EmojiReactionsProps) {
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);

  useEffect(() => {
    if (!gameStateId) return;

    const channel = supabase
      .channel('emoji-reactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emoji_reactions',
          filter: `game_state_id=eq.${gameStateId}`,
        },
        (payload: any) => {
          const newReaction: EmojiReaction = {
            id: payload.new.id,
            emoji: payload.new.emoji,
            x: Math.random() * 80 + 10,
            createdAt: Date.now(),
          };
          setReactions((prev) => [...prev, newReaction]);

          setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
          }, 4000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameStateId]);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute animate-float-up"
          style={{
            left: `${reaction.x}%`,
            bottom: '-10%',
            fontSize: '3rem',
            animationDuration: '4s',
          }}
        >
          {reaction.emoji}
        </div>
      ))}
    </div>
  );
}
