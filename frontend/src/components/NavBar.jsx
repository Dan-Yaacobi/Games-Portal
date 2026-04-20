import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PixelButton from './ui/PixelButton';

export default function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="navbar fade-in">
      <div className="navbar__brand">
        <span className="brand-chip" />
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="pixel-title">
          Pixel Arena
        </Link>
      </div>

      <div className="navbar__links">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/games" className="nav-link">Games</Link>
            <Link to="/test-game" className="nav-link">Sandbox</Link>
            <span className="coin-chip">Coins: {user?.coins ?? 0}</span>
            <PixelButton variant="ghost" onClick={logout}>Logout</PixelButton>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
