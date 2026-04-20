import { useEffect, useState } from 'react';
import { gamesApi } from '../features/games/gamesApi';
import PageFrame from '../components/ui/PageFrame';
import GameCard from '../components/ui/GameCard';

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
    <PageFrame title="Game Bay" subtitle="Choose your next mission.">
      <div className="grid">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            playable={game.slug === 'wubble-web'}
            to="/games/wubble-web"
          />
        ))}
      </div>
      {status && <p className="status-error">{status}</p>}
    </PageFrame>
  );
}
