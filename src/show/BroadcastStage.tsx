import { useEffect, useState } from 'react';
import './broadcast-stage.css';

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;

export function needsStageShell() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has('stage')) return false;
  try {
    return window.self === window.top;
  } catch {
    return false;
  }
}

export function BroadcastStageShell() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const params = new URLSearchParams(window.location.search);
  params.set('stage', '1');
  const src = `${window.location.pathname}?${params.toString()}${window.location.hash}`;

  return (
    <div className="broadcast-viewport">
      <iframe
        className="broadcast-stage-frame"
        title="1280 by 720 broadcast"
        src={src}
        width={STAGE_WIDTH}
        height={STAGE_HEIGHT}
        style={{ transform: `scale(${scale})` }}
      />
    </div>
  );
}
