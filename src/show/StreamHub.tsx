import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link } from 'react-router-dom';

type GameId = 'price' | 'feud' | 'wheel' | 'deal' | 'password' | 'millionaire';
type RoomState = {
  gameId: GameId;
  live: boolean;
  liveStartedAt: number | null;
  standby: boolean;
  raised: number;
  goal: number;
  sponsors: string[];
  tickerVisible: boolean;
  goalVisible: boolean;
  tiltifyOverlayUrl: string;
};
const STORAGE_KEY = 'north-pole-stream-room-v1';
const DEFAULT_SPONSORS = ['Laravel', 'Unkey', 'Mux', 'CoderHQ', 'WeMakeDevs', 'Tighten', 'CodeRabbit', 'Resend', 'RenderATL', 'Torc'];
const DEFAULT_STATE: RoomState = {
  gameId: 'price',
  live: false,
  liveStartedAt: null,
  standby: true,
  raised: 0,
  goal: 10000,
  sponsors: DEFAULT_SPONSORS,
  tickerVisible: true,
  goalVisible: true,
  tiltifyOverlayUrl: '',
};
const lineup = [
  { id: 'price', time: '2:00–3:00 PM', name: 'The Price Is Merry', icon: '🏷️' },
  { id: 'feud', time: '3:00–4:00 PM', name: 'Holiday Family Feud', icon: '☃️' },
  { id: 'wheel', time: '4:00–5:00 PM', name: 'Wheel of Winter', icon: '❄️' },
  { id: 'deal', time: '5:00–6:00 PM', name: 'Deal or No Sleigh', icon: '🎁' },
  { id: 'password', time: '6:00–7:00 PM', name: 'North Pole Password', icon: '🔑' },
  { id: 'millionaire', time: '7:00–8:00 PM', name: 'Christmas Millionaire', icon: '⭐' },
] as const;
const asGameId = (value: string): GameId => lineup.find(item => item.id === value)?.id ?? 'price';
const hostPath = (id: GameId) => id === 'millionaire' ? '/hostjt' : '/games/' + id;
const displayPath = (id: GameId) => id === 'millionaire' ? '/displayurl' : '/games/' + id + '?display=1';
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const scheduleStart = new Date('2026-12-18T14:00:00-05:00').getTime();
const scheduleEnd = new Date('2026-12-18T20:00:00-05:00').getTime();

function readRoom(): RoomState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return saved ? { ...DEFAULT_STATE, ...saved, gameId: asGameId(saved.gameId) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function useRoom() {
  const [room, setRoom] = useState<RoomState>(readRoom);
  useEffect(() => {
    const receive = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try { setRoom({ ...DEFAULT_STATE, ...JSON.parse(event.newValue) }); } catch { /* ignore malformed storage */ }
      }
    };
    const receiveLocal = (event: Event) => {
      const value = (event as CustomEvent<RoomState>).detail;
      if (value) setRoom(value);
    };
    window.addEventListener('storage', receive);
    window.addEventListener('north-pole-room-update', receiveLocal);
    return () => {
      window.removeEventListener('storage', receive);
      window.removeEventListener('north-pole-room-update', receiveLocal);
    };
  }, []);
  function update(changes: Partial<RoomState>) {
    setRoom(current => {
      const next = { ...current, ...changes };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('north-pole-room-update', { detail: next }));
      } catch { /* the live screen still updates in this tab */ }
      return next;
    });
  }
  return { room, update };
}

function useClock(liveStartedAt: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const remaining = Math.max(0, scheduleStart - now);
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor(remaining / 3600000) % 24;
  const minutes = Math.floor(remaining / 60000) % 60;
  const seconds = Math.floor(remaining / 1000) % 60;
  const clock = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }).format(now);
  const liveDuration = Math.max(0, now - (liveStartedAt ?? scheduleStart));
  const elapsed = Math.floor(liveDuration / 1000);
  const liveClock = [Math.floor(elapsed / 3600), Math.floor(elapsed / 60) % 60, elapsed % 60].map(part => String(part).padStart(2, '0')).join(':');
  return { now, days, hours, minutes, seconds, clock, liveClock, started: now >= scheduleStart && now < scheduleEnd };
}

export default function StreamHub() {
  const display = window.location.pathname.endsWith('/display');
  const { room, update } = useRoom();
  return display ? <StreamDisplay room={room} /> : <ProducerRoom room={room} update={update} />;
}

function ProducerRoom({ room, update }: { room: RoomState; update: (changes: Partial<RoomState>) => void }) {
  const clock = useClock(room.liveStartedAt);
  const active = lineup.find(item => item.id === room.gameId) ?? lineup[0];
  const percent = Math.max(0, Math.min(100, room.goal ? room.raised / room.goal * 100 : 0));
  const overlayChanged = (event: ChangeEvent<HTMLInputElement>) => update({ tiltifyOverlayUrl: event.target.value.trim() });

  return <main className="studio-shell">
    <header className="studio-topbar">
      <Link to="/" className="studio-brand"><span className="studio-mark">✦</span><span>Christmas Game Night<small>SHOW CONTROL</small></span></Link>
      <div className="studio-topmeta"><span className="studio-clock">{clock.clock}</span><span className={room.live ? 'studio-live is-live' : 'studio-live'}><i />{room.live ? 'LIVE' : 'STANDBY'}</span></div>
      <a className="studio-open-display" href="/stream/display" target="_blank" rel="noreferrer">Open stream display</a>
    </header>

    <div className="studio-body">
      <section className="studio-main">
        <div className="studio-welcome">
          <div><p className="studio-kicker">DECEMBER 18 · 2:00–8:00 PM ET</p><h1>Show control</h1><p className="studio-subtitle">Run the six-hour broadcast from one desk. This control room stays private; the display page is what goes on stream.</p></div>
          <div className="studio-countdown"><span>{room.live ? 'ON AIR FOR' : clock.started ? 'SCHEDULED NOW' : 'COUNTDOWN'}</span><strong>{room.live ? clock.liveClock : clock.days + 'd ' + String(clock.hours).padStart(2, '0') + ':' + String(clock.minutes).padStart(2, '0') + ':' + String(clock.seconds).padStart(2, '0')}</strong><small>{room.live ? 'show clock · scheduled close 8 PM ET' : clock.started ? 'scheduled window · select Go live' : 'until December 18 at 2 PM ET'}</small></div>
        </div>

        <div className="studio-stage-card">
          <div className="studio-card-head">
            <div><p className="studio-kicker">CURRENT SEGMENT · {active.time}</p><h2>{active.icon} {active.name}</h2></div>
            <label className="studio-select-label">Now playing
              <select value={room.gameId} onChange={event => update({ gameId: asGameId(event.target.value), standby: false })}>
                {lineup.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          </div>
          <div className="studio-buttons">
            <button className="studio-button studio-button-live" onClick={() => update({ live: true, liveStartedAt: room.liveStartedAt ?? Date.now(), standby: false })}>Go live</button>
            <button className="studio-button" onClick={() => update({ live: false, liveStartedAt: null, standby: true })}>Standby screen</button>
            <button className="studio-button studio-button-quiet" onClick={() => {
              const index = lineup.findIndex(item => item.id === room.gameId);
              update({ gameId: lineup[(index + 1) % lineup.length].id, standby: false });
            }}>Next hour</button>
            <a className="studio-button studio-button-quiet" href={displayPath(room.gameId)} target="_blank" rel="noreferrer">Preview game</a>
          </div>
          <div className="studio-game-frame"><iframe key={room.gameId} src={hostPath(room.gameId)} title={active.name + ' host controls'} /></div>
          <p className="studio-helper">Game controls are embedded here. Updates sync to the game view inside the stream display.</p>
        </div>

        <div className="studio-lineup-card">
          <div className="studio-card-title"><div><p className="studio-kicker">THE SIX-HOUR RUN OF SHOW</p><h2>Tonight’s lineup</h2></div><span>Eastern Time</span></div>
          <div className="studio-lineup">
            {lineup.map((item, index) => <button key={item.id} className={'studio-lineup-item' + (item.id === room.gameId ? ' is-selected' : '')} onClick={() => update({ gameId: item.id, standby: false })}>
              <span className="studio-lineup-index">{String(index + 1).padStart(2, '0')}</span><span className="studio-lineup-icon">{item.icon}</span><span className="studio-lineup-copy"><strong>{item.name}</strong><small>{item.time}</small></span><span className="studio-lineup-status">{item.id === room.gameId ? 'SELECTED' : 'READY'}</span>
            </button>)}
          </div>
        </div>
      </section>

      <aside className="studio-sidebar">
        <section className="studio-side-card studio-fundraiser">
          <div className="studio-card-title"><div><p className="studio-kicker">TILTIFY · FREECODECAMP</p><h2>Fundraising</h2></div><span className="studio-heart">♥</span></div>
          <div className="studio-raised"><strong>{money(room.raised)}</strong><span>raised of {money(room.goal)}</span></div>
          <div className="studio-progress"><span style={{ width: percent + '%' }} /></div>
          <div className="studio-progress-caption"><span>{percent.toFixed(1)}% of goal</span><span>{money(Math.max(0, room.goal - room.raised))} to go</span></div>
          <label className="studio-input-label">Raised so far ($)
            <input type="number" min="0" step="1" value={room.raised} onChange={event => update({ raised: Number(event.target.value) || 0 })} />
          </label>
          <label className="studio-input-label">Fundraising goal ($)
            <input type="number" min="1" step="1" value={room.goal} onChange={event => update({ goal: Number(event.target.value) || 1 })} />
          </label>
          <a className="studio-text-link" href="https://tiltify.com/@tasonjorres/livestream-fundraiser-for-freecodecamporg" target="_blank" rel="noreferrer">Open public fundraiser</a>
          <div className="studio-connect-box">
            <strong>Tiltify overlay URL</strong>
            <input type="url" placeholder="Paste a Tiltify overlay URL to show live totals" value={room.tiltifyOverlayUrl} onChange={overlayChanged} />
            <small>Get the live overlay URL in your campaign’s Branding section. Leave blank to use the editable tracker above.</small>
          </div>
          <label className="studio-toggle studio-goal-toggle"><input type="checkbox" checked={room.goalVisible} onChange={event => update({ goalVisible: event.target.checked })} /><span>Show fundraiser tracker on stream</span></label>
        </section>

        <section className="studio-side-card">
          <div className="studio-card-title"><div><p className="studio-kicker">ON-SCREEN SPONSORS</p><h2>Partner ticker</h2></div><label className="studio-toggle"><input type="checkbox" checked={room.tickerVisible} onChange={event => update({ tickerVisible: event.target.checked })} /><span>Show</span></label></div>
          <textarea aria-label="Sponsor names, one per line" value={room.sponsors.join('\n')} onChange={event => update({ sponsors: event.target.value.split('\n').map(value => value.trim()).filter(Boolean) })} rows={5} />
          <small className="studio-muted">One partner per line. They scroll along the bottom of the display.</small>
        </section>

        

        <div className="studio-note"><span>↗</span><p><strong>One browser, two pages.</strong> Keep this control room open. Put <a href="/stream/display" target="_blank" rel="noreferrer">the stream display</a> into VideoRC as the full-screen source.</p></div>
      </aside>
    </div>
  </main>;
}

function StreamDisplay({ room }: { room: RoomState }) {
  const clock = useClock(room.liveStartedAt);
  const active = lineup.find(item => item.id === room.gameId) ?? lineup[0];
  const percent = Math.max(0, Math.min(100, room.goal ? room.raised / room.goal * 100 : 0));

  return <main className={"stream-display stream-display-" + room.gameId}>
    <header className="stream-display-header">
      <div className="stream-display-brand"><span>✦</span><strong>CHRISTMAS GAME NIGHT</strong></div>
      <div className="stream-display-segment"><small>NOW PLAYING</small><strong>{active.name}</strong></div>
      <div className="stream-display-clock"><small>{room.live ? 'LIVE · ' + clock.liveClock : 'DEC 18 · 2–8 PM ET'}</small><strong>{clock.clock}</strong></div>
    </header>

    <div className="stream-display-game">
      {room.standby
        ? <div className="stream-standby"><span>✦</span><p>JASON TORRES PRESENTS</p><h1>Christmas Game Night</h1><div className="stream-standby-rule" /><strong>DECEMBER 18 · 2–8 PM EASTERN</strong><small>Six games. One very merry fundraiser.</small></div>
        : <iframe key={room.gameId} src={displayPath(room.gameId)} title={active.name + ' broadcast view'} />}
    </div>

    <aside className="stream-chat-rail" aria-label="Chat background" />ide>

    <div className="stream-bottom-dock">
      {room.goalVisible && <section className="stream-display-goal" aria-label="Fundraising progress">
        <div className="stream-goal-copy"><small>RAISING FOR FREECODECAMP</small><strong>{money(room.raised)} <span>of {money(room.goal)}</span></strong></div>
        <div className="stream-goal-bar"><span style={{ width: percent + '%' }} /></div>
        <div className="stream-goal-percent">{percent.toFixed(0)}%<small>GOAL</small></div>
      </section>}

      {room.tickerVisible && room.sponsors.length > 0 && <section className="stream-sponsor-ticker">
        <strong>THANK YOU TO OUR PARTNERS</strong>
        <div className="stream-ticker-track"><div>{[...room.sponsors, ...room.sponsors].map((sponsor, index) => <span key={index}>{sponsor}<i>✦</i></span>)}</div></div>
      </section>}
    </div>

    {room.tiltifyOverlayUrl && <iframe className="stream-tiltify-overlay" src={room.tiltifyOverlayUrl} title="Live Tiltify overlay" />}
  </main>;
}
