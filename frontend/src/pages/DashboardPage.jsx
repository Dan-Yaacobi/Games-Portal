import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { dashboardApi } from '../features/dashboard/dashboardApi';

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
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.username || user?.email}</p>
      <p>Your coins: {user?.coins ?? 0}</p>

      <h2>Available games</h2>
      <ul>
        {games.map((game) => (
          <li key={game.id}>
            {game.name} ({game.slug})
          </li>
        ))}
      </ul>

      <Link to="/games">Go to Games</Link>
    </div>
  );
}
