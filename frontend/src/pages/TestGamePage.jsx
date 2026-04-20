import { useEffect, useState } from 'react';
import { gamesApi } from '../features/games/gamesApi';
import { useAuth } from '../hooks/useAuth';

export default function TestGamePage() {
  const { refreshUser } = useAuth();
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [score, setScore] = useState(null);
  const [coinsEarned, setCoinsEarned] = useState(null);
  const [totalCoins, setTotalCoins] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    gamesApi
      .list()
      .then((data) => {
        setGames(data.games);
        if (data.games[0]) {
          setSelectedGameId(data.games[0].id);
        }
      })
      .catch((error) => setStatus(error.message));
  }, []);

  const startGame = async () => {
    if (!selectedGameId) {
      setStatus('No game selected');
      return;
    }

    try {
      const data = await gamesApi.start(selectedGameId);
      setSessionId(data.sessionId);
      setStatus('Session started (or existing session returned).');
    } catch (error) {
      setStatus(error.message);
    }
  };

  const finishGame = async () => {
    if (!selectedGameId || !sessionId) {
      setStatus('Start a game session first.');
      return;
    }

    try {
      const randomScore = Math.floor(Math.random() * 5001);
      const data = await gamesApi.complete(selectedGameId, {
        sessionId,
        score: randomScore
      });
      await refreshUser();

      setScore(data.score);
      setCoinsEarned(data.coinsEarned);
      setTotalCoins(data.totalCoins);
      setStatus('Session completed successfully.');
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <div>
      <h1>Test Game Session Flow</h1>
      <p>Minimal integrity test page (no gameplay).</p>

      <label htmlFor="game-select">Game: </label>
      <select
        id="game-select"
        value={selectedGameId}
        onChange={(event) => setSelectedGameId(event.target.value)}
      >
        <option value="">Select a game</option>
        {games.map((game) => (
          <option key={game.id} value={game.id}>
            {game.name}
          </option>
        ))}
      </select>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button onClick={startGame}>Start Game</button>
        <button onClick={finishGame}>Finish Game</button>
      </div>

      <div style={{ marginTop: 16 }}>
        <p>sessionId: {sessionId || '-'}</p>
        <p>score: {score ?? '-'}</p>
        <p>coins earned: {coinsEarned ?? '-'}</p>
        <p>total user coins: {totalCoins ?? '-'}</p>
      </div>

      {status && <p>{status}</p>}
    </div>
  );
}
