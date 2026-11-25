import { Link } from 'react-router-dom';
import { schedule } from '../show/catalog';

const hostPath = (id: string) => id === 'millionaire' ? '/hostjt' : '/games/' + id;
const displayPath = (id: string) => id === 'millionaire' ? '/displayurl' : '/games/' + id + '?display=1';

export default function Welcome() {
  return (
    <main className="np-layout">
      <header className="np-hero np-panel">
        <p className="np-label">North Pole dispatch · Holiday broadcast</p>
        <h1>Christmas Game Night</h1>
        <p>Six games. One every hour. December 18, 2:00–8:00 PM ET.</p>
        <div className="np-actions"><Link className="np-button" to="/stream">Open show control room</Link><a className="np-button np-secondary" href="/stream/display" target="_blank" rel="noreferrer">Open main stream display</a></div>
      </header>
      <div className="np-lineup">
        {schedule.map((show) => (
          <article className={'np-panel np-card' + (show.id === 'millionaire' ? ' np-finale' : '')} key={show.id}>
            <span className="np-icon" aria-hidden="true">{show.icon}</span>
            <div>
              <p className="np-label">{show.time}{show.id === 'millionaire' ? ' · Finale' : ''}</p>
              <h2>{show.name}</h2>
              <p>{show.description}</p>
            </div>
            <div className="np-actions">
              <Link className="np-button" to={hostPath(show.id)}>Host</Link>
              <a className="np-button np-secondary" href={displayPath(show.id)} target="_blank" rel="noreferrer">Open stream view</a>
              {show.id === 'millionaire' && <Link className="np-button np-secondary" to="/vote">Vote</Link>}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
