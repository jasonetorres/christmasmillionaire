import { useEffect, useRef, useState } from 'react';

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

interface EmojiReactionsProps {
  reactions: { id: string; emoji: string }[];
}

export function EmojiReactions({ reactions }: EmojiReactionsProps) {
  const [floating, setFloating] = useState<FloatingReaction[]>([]);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    const fresh = reactions.filter((reaction) => !seen.current.has(reaction.id));
    if (fresh.length === 0) return;

    fresh.forEach((reaction) => seen.current.add(reaction.id));
    setFloating((current) => [
      ...current,
      ...fresh.map((reaction) => ({
        id: reaction.id,
        emoji: reaction.emoji,
        x: Math.random() * 80 + 10,
      })),
    ]);

    fresh.forEach((reaction) => {
      window.setTimeout(() => {
        setFloating((current) => current.filter((item) => item.id !== reaction.id));
      }, 4000);
    });
  }, [reactions]);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {floating.map((reaction) => (
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
