import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getHostCode, setHostCode } from '../lib/api';

type EventType = 'emoji' | 'message' | 'sound';
type StreamEvent = { id: string; event_type: EventType; value: string; created_at: string };
const EMOJI = ['👏', '😮', '🤔', '😱', '🎉', '❤️', '🔥', '👍', '🎄', '🎅', '⛄', '🎁', '⭐', '🎊', '🤶', '🦌'];
const SOUNDS = [
  { id: 'bell', label: 'Jingle bell' },
  { id: 'applause', label: 'Applause' },
  { id: 'drumroll', label: 'Drumroll' },
  { id: 'cheer', label: 'Cheer' },
] as const;

function getActorKey() {
  const key = 'north-pole-stream-actor-v1';
  let value = localStorage.getItem(key);
  if (!value) {
    value = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : 'guest-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, value);
  }
  return value;
}

async function publishEvent(type: EventType, value: string, actorKey: string, hostCode?: string) {
  const response = await fetch('/api/stream-events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(hostCode ? { 'x-host-code': hostCode } : {}),
    },
    body: JSON.stringify({ type, value, actorKey }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Could not send this to the stream');
  return body.event as StreamEvent;
}

export function StreamAudienceQr() {
  const url = typeof window === 'undefined' ? '' : window.location.origin + '/react';
  return <div className="stream-audience-qr">
    <div className="stream-qr-code"><QRCodeSVG value={url || '/react'} size={104} bgColor="#fffbed" fgColor="#254f55" level="M" /></div>
    <div className="stream-qr-copy"><strong>JOIN THE CROWD</strong><span>Scan to send a reaction</span></div>
  </div>;
}

export function StreamInteractivePanel() {
  const [hostCode, setCode] = useState(() => getHostCode());
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);
  const actorKey = useRef(getActorKey());

  async function send(type: EventType, value: string) {
    setSending(true);
    setNotice('');
    try {
      await publishEvent(type, value, actorKey.current, hostCode);
      setNotice(type === 'message' ? 'Message is on its way to the display.' : 'Sent to the stream display.');
      if (type === 'message') setMessage('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not reach the stream display.');
    } finally {
      setSending(false);
    }
  }

  return <section className="studio-side-card studio-interactive-card">
    <div className="studio-card-title"><div><p className="studio-kicker">LIVE AUDIENCE TOOLS</p><h2>Stream interactions</h2></div><span className="studio-interactive-live">DISPLAY LINKED</span></div>
    <div className="studio-interactive-grid">
      <div className="studio-interactive-section">
        <strong className="studio-interactive-label">ON-SCREEN MESSAGE</strong>
        <form className="studio-message-form" onSubmit={event => { event.preventDefault(); if (message.trim()) void send('message', message.trim()); }}>
          <input maxLength={120} value={message} onChange={event => setMessage(event.target.value)} placeholder="Type a message for the stream…" aria-label="On-screen message" />
          <button type="submit" disabled={sending || !message.trim()}>Put on screen</button>
        </form>
        <small>Shows as a lower-third for a few seconds. Keep it under 120 characters.</small>
      </div>
      <div className="studio-interactive-section">
        <strong className="studio-interactive-label">SOUND CUES</strong>
        <div className="studio-sound-buttons">{SOUNDS.map(sound => <button key={sound.id} type="button" disabled={sending} onClick={() => void send('sound', sound.id)}>{sound.label}</button>)}</div>
        <small>Sound plays in the display tab after you enable display audio there.</small>
      </div>
    </div>
    <label className="studio-host-code">Stream host code
      <input type="password" autoComplete="current-password" value={hostCode} onChange={event => { setCode(event.target.value); setHostCode(event.target.value); }} placeholder="Use the same code as the Millionaire host panel" />
    </label>
    <div className="studio-interactive-status" aria-live="polite">{notice || 'Messages and sound cues are sent to the open stream display.'}</div>
  </section>;
}

function playSound(context: AudioContext, cue: string) {
  const now = context.currentTime;
  const tone = (frequency: number, start: number, duration: number, gain = 0.12, wave: OscillatorType = 'sine') => {
    const osc = context.createOscillator();
    const amp = context.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(frequency, now + start);
    amp.gain.setValueAtTime(0.0001, now + start);
    amp.gain.exponentialRampToValueAtTime(gain, now + start + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
    osc.connect(amp).connect(context.destination);
    osc.start(now + start);
    osc.stop(now + start + duration + 0.03);
  };

  if (cue === 'bell') {
    tone(880, 0, .45, .16); tone(1174.66, .16, .62, .12); tone(1567.98, .37, .8, .09);
  } else if (cue === 'drumroll') {
    for (let index = 0; index < 18; index++) tone(95 + Math.random() * 24, index * .075, .11, .045, 'triangle');
    tone(392, 1.34, .35, .15, 'triangle');
  } else if (cue === 'cheer') {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => tone(freq, index * .11, .95, .07));
  } else {
    [392, 493.88, 587.33, 783.99, 587.33, 783.99].forEach((freq, index) => tone(freq, index * .13, .36, .06));
  }
}

export function StreamBroadcastEffects() {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [message, setMessage] = useState<StreamEvent | null>(null);
  const [soundReady, setSoundReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const seen = useRef(new Set<string>());
  const initialized = useRef(false);
  const context = useRef<AudioContext | null>(null);

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const response = await fetch('/api/stream-events', { cache: 'no-store' });
        if (!response.ok) throw new Error('not ready');
        const body = await response.json() as { events: StreamEvent[] };
        if (!mounted) return;
        setLoadError(false);
        if (!initialized.current) {
          for (const event of body.events || []) seen.current.add(event.id);
          initialized.current = true;
          return;
        }
        const fresh = (body.events || []).filter(event => !seen.current.has(event.id));
        for (const event of fresh) {
          seen.current.add(event.id);
          if (event.event_type === 'emoji') {
            setEvents(current => [...current, event].slice(-24));
            window.setTimeout(() => setEvents(current => current.filter(item => item.id !== event.id)), 4200);
          }
          if (event.event_type === 'message') {
            setMessage(event);
            window.setTimeout(() => setMessage(current => current?.id === event.id ? null : current), 7000);
          }
          if (event.event_type === 'sound' && context.current) playSound(context.current, event.value);
        }
        if (seen.current.size > 300) seen.current = new Set(fresh.map(event => event.id));
      } catch {
        if (mounted) setLoadError(true);
      }
    };
    void poll();
    const timer = window.setInterval(poll, 1100);
    return () => { mounted = false; window.clearInterval(timer); };
  }, []);

  async function enableSound() {
    const AudioContextType = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextType) return;
    const audio = new AudioContextType();
    await audio.resume();
    context.current = audio;
    setSoundReady(true);
  }

  return <>
    {events.map((event, index) => <span key={event.id} className="stream-reaction-float" style={{ left: (10 + ((index * 37 + event.id.charCodeAt(0) * 11) % 76)) + '%', animationDelay: (index % 4) * 80 + 'ms' }} aria-hidden="true">{event.value}</span>)}
    {message && <div className="stream-live-message" role="status"><span>LIVE MESSAGE</span><strong>{message.value}</strong></div>}
    {!soundReady && <button className="stream-enable-sound" type="button" onClick={() => void enableSound()}>Enable stream audio</button>}
    {loadError && <span className="stream-overlay-connection" aria-label="Stream interaction connection unavailable" />}
  </>;
}

export function StreamAudiencePage() {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('Tap a reaction to send it to the stream.');
  const [selected, setSelected] = useState('');
  const actorKey = useRef(getActorKey());

  async function react(emoji: string) {
    if (busy) return;
    setBusy(true);
    setSelected(emoji);
    setNotice('Sending your reaction…');
    try {
      await publishEvent('emoji', emoji, actorKey.current);
      setNotice('Your reaction made it to the stream. Send another in a moment.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not send that reaction.');
    } finally {
      window.setTimeout(() => setBusy(false), 1200);
    }
  }

  return <main className="stream-audience-page">
    <div className="stream-audience-card">
      <div className="stream-audience-brand"><span>✦</span><small>CHRISTMAS GAME NIGHT</small></div>
      <p className="studio-kicker">THE CROWD IS PART OF THE SHOW</p>
      <h1>Send a little joy<br />to the stream.</h1>
      <p className="stream-audience-intro">Choose a reaction. It’ll fly across the live display for everyone to see.</p>
      <div className="stream-audience-grid">{EMOJI.map(emoji => <button key={emoji} type="button" className={selected === emoji ? 'is-selected' : ''} disabled={busy} onClick={() => void react(emoji)} aria-label={'Send ' + emoji}>{emoji}</button>)}</div>
      <p className="stream-audience-notice" aria-live="polite">{notice}</p>
      <small className="stream-audience-footer">One reaction every second keeps the snow falling for everybody.</small>
    </div>
  </main>;
}
