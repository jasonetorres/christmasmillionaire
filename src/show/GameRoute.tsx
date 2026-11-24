import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { passwords, prices, puzzles, shows, surveys } from './catalog';

type Game = typeof shows[number]['id'];
type Board = {
  round: number;
  scores: number[];
  team: number;
  strikes: number;
  clues?: string[];
  revealed: number[];
  guesses: number[];
  settled: boolean;
  letters: string[];
  spin: number | null;
  rotation: number;
  message: string;
  gifts: number[];
  held: number | null;
  offer: number | null;
  prize: number | null;
};
const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
const prizes = [100, 500, 1000, 2500, 5000, 7500, 10000, 20000, 30000, 50000, 75000, 100000];
const wedges = [100, 250, 500, 0, 300, 750, -1, 400];
const teams = ['Team Holly', 'Team Pine'];
const clean = (text: string) => text.toUpperCase().replace(/[^A-Z]/g, '');
const initial = (round = 0, scores = [0, 0]): Board => ({
  round, scores, clues: [], team: round % 2, strikes: 0, revealed: [], guesses: [], settled: false,
  letters: [], spin: null, rotation: 0, message: '', gifts: [], held: null, offer: null, prize: null,
});

export default function GameRoute() {
  const { id } = useParams();
  const show = shows.find(item => item.id === id);
  return show ? <GameBoard key={show.id} show={show} /> : <main className="np-layout"><Link to="/">Back to lineup</Link></main>;
}

function GameBoard({ show }: { show: typeof shows[number] }) {
  const [params] = useSearchParams();
  const display = params.has('display');
  const key = 'north-pole-board-v1:' + show.id;
  const [board, setBoard] = useState<Board>(() => {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? initial(); }
    catch { return initial(); }
  });
  const [entry, setEntry] = useState('');
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    const receive = (event: StorageEvent) => {
      if (event.key === key && event.newValue) setBoard(JSON.parse(event.newValue));
    };
    window.addEventListener('storage', receive);
    return () => window.removeEventListener('storage', receive);
  }, [key]);

  function update(changes: Partial<Board>) {
    const next = { ...board, ...changes };
    setBoard(next);
    try { localStorage.setItem(key, JSON.stringify(next)); }
    catch { setStorageError(true); }
  }

  function reset(advance = false) {
    setEntry('');
    update(advance ? initial(board.round + 1, board.scores) : initial());
  }

  function award(team: number, amount: number) {
    return board.scores.map((score, index) => index === team ? score + amount : score);
  }

  function nextTeam(note: string) {
    update({ team: 1 - board.team, spin: null, message: note });
  }

  function renderPrice() {
    const [item, answer] = prices[board.round % prices.length];
    function bid(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const value = Math.round(Number(entry) * 100);
      if (!entry.trim() || !Number.isSafeInteger(value) || value < 0) return;
      update({ guesses: [...board.guesses, value] });
      setEntry('');
    }
    function reveal() {
      const best = Math.max(-1, ...board.guesses.filter(value => value <= answer));
      const won = board.guesses.map(value => value === best ? 1 : 0);
      const winners = teams.filter((_, i) => won[i]).join(' and ');
      update({ settled: true, scores: board.scores.map((score, i) => score + won[i]), message: winners ? winners + (won.every(Boolean) ? ' tie!' : ' wins!') : 'Both teams went over.' });
    }
    return <>
      <h2>{item}</h2>
      <div className="np-tiles">
        {teams.map((team, i) => <div className="np-tile" key={team}><span>{team}</span><strong>{board.guesses[i] === undefined ? '—' : money(board.guesses[i])}</strong></div>)}
      </div>
      {board.settled && <p className="np-result">Round price · {money(answer)}</p>}
      {!display && !board.settled && (board.guesses.length < teams.length
        ? <form className="np-actions" onSubmit={bid}><label>{teams[board.guesses.length]} bid <input type="number" min="0" step=".01" required value={entry} onChange={e => setEntry(e.target.value)} /></label><button className="np-button">Lock bid</button></form>
        : <button className="np-button" onClick={reveal}>Reveal price</button>)}
    </>;
  }

  function renderFeud() {
    const [prompt, answers] = surveys[board.round % surveys.length];
    const total = board.revealed.reduce((sum, i) => sum + answers[i][1], 0);
    const stealing = board.strikes >= 3;
    function finish(team: number, points: number) {
      update({ settled: true, scores: award(team, points), message: teams[team] + ' takes ' + points + ' points.' });
    }
    function reveal(index: number) {
      const revealed = [...board.revealed, index];
      if (stealing || revealed.length === answers.length) {
        const team = stealing ? 1 - board.team : board.team;
        const points = total + answers[index][1];
        update({ revealed, settled: true, scores: award(team, points), message: teams[team] + ' takes ' + points + ' points.' });
      } else update({ revealed });
    }
    return <>
      <p className="np-label">{teams[stealing ? 1 - board.team : board.team]} {stealing ? 'can steal' : 'plays'} · {board.strikes}/3 strikes · {total} on the board</p>
      <h2>{prompt}</h2>
      <ol className="np-survey">
        {answers.map(([answer, points], i) => <li key={answer}><span>{i + 1}</span><strong>{board.revealed.includes(i) || board.settled ? answer : '• • •'}</strong><span>{board.revealed.includes(i) || board.settled ? points : '—'}</span></li>)}
      </ol>
      {!display && !board.settled && <div className="np-controls">
        <p className="np-label">Host answers</p><div className="np-actions">
        {answers.map(([answer], i) => <button className="np-button np-secondary" key={answer} disabled={board.revealed.includes(i)} onClick={() => reveal(i)}>{answer}</button>)}
        <button className="np-button" onClick={() => stealing ? finish(board.team, total) : update({ strikes: board.strikes + 1 })}>{stealing ? 'Steal missed' : 'Add strike'}</button>
        </div></div>}
    </>;
  }

  function renderWheel() {
    const [category, phrase] = puzzles[board.round % puzzles.length];
    const solved = board.settled;
    function spin() {
      const index = Math.floor(Math.random() * wedges.length);
      const value = wedges[index];
      const offset = (360 - index * 45 - 22.5 + 360) % 360;
      const rotation = Math.ceil(board.rotation / 360) * 360 + 720 + offset;
      if (value <= 0) {
        update({ rotation, team: 1 - board.team, scores: value < 0 ? board.scores.map((n, i) => i === board.team ? 0 : n) : board.scores, message: value < 0 ? 'Snowed out! Score cleared and the turn passes.' : 'Lose a turn.' });
      } else update({ rotation, spin: value, message: value + ' points per match. Call a consonant.' });
    }
    function letter(char: string) {
      const count = [...phrase].filter(item => item === char).length;
      const vowel = 'AEIOU'.includes(char);
      const value = vowel ? -250 : (board.spin ?? 0) * count;
      update({ letters: [...board.letters, char], scores: award(board.team, value), team: count ? board.team : 1 - board.team, spin: null, message: count ? char + ' appears ' + count + (count === 1 ? ' time.' : ' times.') : 'No ' + char + '. Turn passes.' });
    }
    function solve(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (!clean(entry)) return;
      if (clean(entry) === clean(phrase)) update({ settled: true, scores: award(board.team, 500), message: teams[board.team] + ' solved it! +500 points.' });
      else nextTeam('Incorrect solve. Turn passes.');
      setEntry('');
    }
    return <>
      <p className="np-label">{category} · {teams[board.team]}</p>
      <div className="np-wheel-wrap"><span aria-hidden="true">▼</span><div className="np-wheel" style={{ transform: 'rotate(' + board.rotation + 'deg)' }}>
        {wedges.map((value, i) => <span key={value} style={{ transform: 'translate(-50%, -50%) rotate(' + (i * 45 + 22.5) + 'deg) translateY(-86px)' }}>{value === 0 ? 'PASS' : value < 0 ? 'SNOW' : value}</span>)}
      </div></div>
      <div className="np-puzzle" aria-label="Puzzle board">
        {phrase.split(' ').map((word, i) => <div key={i}>{[...word].map((char, j) => <span className="np-letter" key={j}>{solved || board.letters.includes(char) ? char : '\u00a0'}</span>)}</div>)}
      </div>
      {!display && !solved && <div className="np-controls">
        <button className="np-button" onClick={spin} disabled={board.spin !== null}>Spin</button>
        <p>Pick a consonant after spinning. Vowels cost 250 points.</p>
        <div className="np-actions np-keyboard">{[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(char => <button key={char} className="np-button np-secondary" disabled={board.letters.includes(char) || ('AEIOU'.includes(char) ? board.scores[board.team] < 250 || board.spin !== null : board.spin === null)} onClick={() => letter(char)}>{char}</button>)}</div>
        <form className="np-actions" onSubmit={solve}><label>Solve the puzzle <input value={entry} required onChange={e => setEntry(e.target.value)} /></label><button className="np-button">Submit</button></form>
      </div>}
    </>;
  }

  function renderDeal() {
    function start() {
      const gifts = [...prizes];
      for (let i = gifts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gifts[i], gifts[j]] = [gifts[j], gifts[i]];
      }
      update({ gifts, message: 'Choose one gift to keep.' });
    }
    function open(index: number) {
      if (board.held === null) {
        update({ held: index, message: 'Open three other gifts to get an offer.' });
        return;
      }
      const revealed = [...board.revealed, index];
      const remaining = board.gifts.filter((_, i) => !revealed.includes(i));
      if (remaining.length === 1) {
        update({ revealed, settled: true, prize: remaining[0], message: 'Your gift was worth ' + money(remaining[0]) + '!' });
        return;
      }
      const offer = [3, 6, 8, 10].includes(revealed.length)
        ? Math.max(100, Math.round(remaining.reduce((a, b) => a + b, 0) / remaining.length * (0.5 + revealed.length / 24) / 100) * 100)
        : null;
      update({ revealed, offer, message: offer === null ? 'That gift held ' + money(board.gifts[index]) + '.' : 'The banker is calling.' });
    }
    const opened = board.revealed.map(i => board.gifts[i]);
    return <>
      {!board.gifts.length && !display && <button className="np-button" onClick={start}>Shuffle the gifts</button>}
      {!board.gifts.length && display && <p>Waiting for the host to shuffle the gifts.</p>}
      {board.gifts.length > 0 && <>
        <div className="np-tiles np-gifts">{board.gifts.map((amount, i) => {
          const openGift = board.revealed.includes(i) || board.settled;
          const label = openGift ? money(amount) : board.held === i ? 'Your gift' : '🎁 ' + (i + 1);
          return <button className={'np-button np-secondary' + (board.held === i ? ' np-held' : '')} key={i} disabled={display || openGift || board.offer !== null || board.held === i} onClick={() => open(i)}>{label}</button>;
        })}</div>
        <div className="np-actions np-values" aria-label="Gift values">{prizes.map(value => <span key={value} className={opened.includes(value) ? 'np-crossed' : ''}>{money(value)}</span>)}</div>
      </>}
      {board.offer !== null && <div className="np-controls"><p className="np-result">Banker offers {money(board.offer)}</p>
        {!display && <div className="np-actions"><button className="np-button" onClick={() => update({ settled: true, prize: board.offer, offer: null, message: 'Deal accepted.' })}>Take the deal</button><button className="np-button np-secondary" onClick={() => update({ offer: null, message: 'No deal. Open another gift.' })}>No deal</button></div>}
      </div>}
      {board.prize !== null && <p className="np-result">You take home {money(board.prize)}</p>}
    </>;
  }

  function renderPassword() {
    const password = passwords[board.round % passwords.length];
    const clues = board.clues ?? [];
    const points = Math.max(1, 5 - board.strikes);

    function giveClue(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const clue = entry.trim();
      if (!/^[a-z]+$/i.test(clue) || clean(clue) === clean(password) || clues.some(value => clean(value) === clean(clue))) {
        update({ message: 'Use one new word other than the password.' });
        return;
      }
      update({ clues: [...clues, clue], message: '' });
      setEntry('');
    }

    function pass() {
      setEntry('');
      update({ strikes: board.strikes + 1, team: 1 - board.team, message: 'Turn passes to ' + teams[1 - board.team] + '.' });
    }

    function correct() {
      setEntry('');
      update({ settled: true, scores: award(board.team, points), message: teams[board.team] + ' earns ' + points + (points === 1 ? ' point.' : ' points.') });
    }

    return <>
      <p className="np-label">{teams[board.team]} · {points} {points === 1 ? 'point' : 'points'} available</p>
      <h2>{board.settled ? password : 'Guess the password'}</h2>
      <div className="np-actions" aria-label="Clues">
        {clues.map(clue => <span className="np-tile" key={clue}>{clue}</span>)}
        {!clues.length && !board.settled && <p>Waiting for the first clue.</p>}
      </div>
      {!display && !board.settled && <div className="np-controls">
        <p><strong>Host and clue giver only:</strong> {password}</p>
        <p>Post one word as a clue, then let the team guess out loud. Pass after a miss.</p>
        <form className="np-actions" onSubmit={giveClue}>
          <label>One-word clue <input value={entry} required maxLength={32} onChange={event => setEntry(event.target.value)} /></label>
          <button className="np-button">Post clue</button>
        </form>
        <div className="np-actions">
          <button className="np-button" disabled={!clues.length} onClick={correct}>Correct guess</button>
          <button className="np-button np-secondary" onClick={pass}>Pass turn</button>
          <button className="np-button np-secondary" onClick={() => update({ settled: true, message: 'Password revealed. No points awarded.' })}>Reveal and end round</button>
        </div>
      </div>}
    </>;
  }

  const games: Record<Game, () => JSX.Element> = { price: renderPrice, feud: renderFeud, wheel: renderWheel, deal: renderDeal, password: renderPassword };
  return <main className={'np-layout' + (display ? ' np-broadcast' : '')}>
    {!display && <nav className="np-actions"><Link to="/">← Lineup</Link><a href={'/games/' + show.id + '?display=1'} target="_blank" rel="noreferrer">Open display ↗</a></nav>}
    <header className="np-panel np-hero"><p className="np-label">North Pole dispatch · {show.id === 'deal' ? 'Game ' : 'Round '}{board.round + 1}</p><h1>{show.icon} {show.title}</h1><p>{show.description}</p></header>
    {storageError && <p role="alert">This browser blocked saved state. Play from the host board.</p>}
    {show.id !== 'deal' && <div className="np-tiles np-score">{teams.map((team, i) => <div className="np-tile" key={team}><span>{team}</span><strong>{board.scores[i]}</strong></div>)}</div>}
    <section className="np-panel np-board">
      {games[show.id]()}
      <p role="status" className="np-status">{board.message}</p>
      {!display && <div className="np-actions np-round-actions">
        {board.settled && <button className="np-button" onClick={() => reset(true)}>{show.id === 'deal' ? 'Next game' : 'Next round'}</button>}
        <button className="np-button np-secondary" onClick={() => { if (window.confirm('Reset the board and scores?')) reset(); }}>Reset board</button>
      </div>}
    </section>
  </main>;
}
