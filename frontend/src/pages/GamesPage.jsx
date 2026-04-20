import { useEffect, useState } from 'react';
import { gamesApi } from '../features/games/gamesApi';
import { useAuth } from '../hooks/useAuth';

export default function GamesPage() {
  const { refreshUser } = useAuth();
  const [games, setGames] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    gamesApi
      .list()
      .then((data) => setGames(data.games))
      .catch((error) => setStatus(error.message));
  }, []);

  const playPlaceholderGame = async (gameId) => {
    try {
      setStatus('Starting game session...');
      const startData = await gamesApi.start(gameId);

      const simulatedScore = Math.floor(Math.random() * 1000);

      const completeData = await gamesApi.complete(gameId, {
        sessionId: startData.sessionId,
        score: simulatedScore
      });

      await refreshUser();
      setStatus(
        `Finished game. Score: ${simulatedScore}, coins awarded: ${completeData.coinsEarned}, balance: ${completeData.totalCoins}`
      );
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <div>
      <h1>Games</h1>
      <p>Choose a game and run the placeholder play flow.</p>

      <ul>
        {games.map((game) => (
          <li key={game.id}>
            <strong>{game.name}</strong> ({game.slug}){' '}
            <button onClick={() => playPlaceholderGame(game.id)}>Play</button>
          </li>
        ))}
      </ul>

      {status && <p>{status}</p>}
    </div>
  );
}
