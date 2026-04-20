import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      {isAuthenticated ? (
        <>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/games">Games</Link>
          <span>Coins: {user?.coins ?? 0}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}
