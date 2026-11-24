import { Link } from 'react-router-dom';
import { shows } from '../show/catalog';

export default function Welcome() {
  return (
    <main className="np-layout">
      <header className="np-hero np-panel">
        <p className="np-label">North Pole dispatch · Holiday broadcast</p>
        <h1>Christmas Game Night</h1>
        <p>Six games. One every hour.</p>
      </header>
      <div className="np-lineup">
        {shows.map((show, index) => (
          <article className="np-panel np-card" key={show.id}>
            <span className="np-icon" aria-hidden="true">{show.icon}</span>
            <div><p className="np-label">Hour {index + 1}</p><h2>{show.title}</h2><p>{show.description}</p></div>
            <div className="np-actions">
              <Link className="np-button" to={'/games/' + show.id}>Host</Link>
              <a className="np-button np-secondary" href={'/games/' + show.id + '?display=1'} target="_blank" rel="noreferrer">Open stream display ↗</a>
            </div>
          </article>
        ))}
        <article className="np-panel np-card np-finale">
          <span className="np-icon" aria-hidden="true">⭐</span>
          <div><p className="np-label">Hour {shows.length + 1} · Finale</p><h2>Who Wants to Be a Christmas Millionaire?</h2><p>Climb the money ladder with three lifelines.</p></div>
          <div className="np-actions"><Link className="np-button" to="/hostjt">Host</Link><a className="np-button np-secondary" href="/displayurl" target="_blank" rel="noreferrer">Open stream display ↗</a><Link className="np-button np-secondary" to="/vote">Vote</Link></div>
        </article>
      </div>
    </main>
  );
}
