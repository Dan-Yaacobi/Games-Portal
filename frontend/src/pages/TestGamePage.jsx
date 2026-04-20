import { useEffect, useState } from 'react';
import { gamesApi } from '../features/games/gamesApi';
import { useAuth } from '../hooks/useAuth';
import PageFrame from '../components/ui/PageFrame';
import Panel from '../components/ui/Panel';
import PixelButton from '../components/ui/PixelButton';

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
      setStatus('Session started.');
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
      const data = await gamesApi.complete(selectedGameId, { sessionId, score: randomScore });
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
    <PageFrame title="Game Session Sandbox" subtitle="Quickly validate start/finish game flow.">
      <Panel>
        <div className="form-grid">
          <select id="game-select" value={selectedGameId} onChange={(event) => setSelectedGameId(event.target.value)}>
            <option value="">Select a game</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>{game.name}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <PixelButton onClick={startGame}>Start</PixelButton>
            <PixelButton variant="secondary" onClick={finishGame}>Finish</PixelButton>
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="hud-item"><strong>sessionId</strong>{sessionId || '-'}</div>
            <div className="hud-item"><strong>score</strong>{score ?? '-'}</div>
            <div className="hud-item"><strong>coins earned</strong>{coinsEarned ?? '-'}</div>
            <div className="hud-item"><strong>total coins</strong>{totalCoins ?? '-'}</div>
          </div>
        </div>
      </Panel>
      {status && <p className="status-error">{status}</p>}
    </PageFrame>
  );
}
