import type { ReactNode } from 'react';
import './broadcast.css';

interface BroadcastFrameProps {
  game: string;
  title: string;
  detail: string;
  children: ReactNode;
  scores?: ReactNode;
}

export function BroadcastFrame({ game, title, detail, children, scores }: BroadcastFrameProps) {
  return (
    <main className={'broadcast broadcast--' + game}>
      <div className="broadcast-snow" aria-hidden="true" />
      <header className="broadcast-header">
        <div>
          <p className="broadcast-brand"><span aria-hidden="true">✦</span> North Pole Dispatch</p>
          <h1>{title}</h1>
        </div>
        {scores}
        <p className="broadcast-detail">{detail}</p>
      </header>
      <div className="broadcast-floor">{children}</div>
    </main>
  );
}
