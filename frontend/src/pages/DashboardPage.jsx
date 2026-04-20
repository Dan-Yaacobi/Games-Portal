import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { dashboardApi } from '../features/dashboard/dashboardApi';
import PageFrame from '../components/ui/PageFrame';
import Panel from '../components/ui/Panel';
import PixelButton from '../components/ui/PixelButton';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [games, setGames] = useState([]);

  useEffect(() => {
    refreshUser().catch(() => null);
    dashboardApi
      .games()
      .then((data) => setGames(data.games))
      .catch(() => setGames([]));
  }, [refreshUser]);

  return (
    <PageFrame title="Pilot Dashboard" subtitle={`Welcome, ${user?.username || user?.email}`}>
      <div className="grid dashboard-grid">
        <Panel>
          <h2>Available Missions</h2>
          <div className="grid">
            {games.map((game) => (
              <div key={game.id} className="hud-item">
                <strong>{game.slug}</strong>
                {game.name}
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2>Wallet</h2>
          <p>Your coins: <strong>{user?.coins ?? 0}</strong></p>
          <Link to="/games">
            <PixelButton>Enter Games</PixelButton>
          </Link>
        </Panel>
      </div>
    </PageFrame>
  );
}
