import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { gamesApi } from '../features/games/gamesApi';

export default function GamesPage() {
  const [games, setGames] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    gamesApi
      .list()
      .then((data) => setGames(data.games))
      .catch((error) => setStatus(error.message));
  }, []);

  return (
    <div>
      <h1>Games</h1>
      <p>Choose a game.</p>

      <ul>
        {games.map((game) => (
          <li key={game.id} style={{ marginBottom: 8 }}>
            <strong>{game.name}</strong> ({game.slug}){' '}
            {game.slug === 'wubble-web' ? (
              <Link to="/games/wubble-web">Play</Link>
            ) : (
              <span>Coming soon</span>
            )}
          </li>
        ))}
      </ul>

      {status && <p>{status}</p>}
    </div>
  );
}
