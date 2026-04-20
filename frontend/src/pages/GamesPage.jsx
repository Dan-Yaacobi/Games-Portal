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
    <PageFrame title="Game Selection" subtitle="Choose your arena and dive in.">
      <div className="grid grid--cards">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            playable={game.slug === 'wubble-web'}
            to="/games/wubble-web"
            description="Precision clicking challenge with fast category shifts."
          />
        ))}
      </div>
      {status && <p className="status-error">{status}</p>}
    </PageFrame>
  );
}
