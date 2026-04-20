import { Navigate, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GamesPage from './pages/GamesPage';
import TestGamePage from './pages/TestGamePage';
import WubbleWebPage from './pages/WubbleWebPage';

export default function App() {
  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games"
          element={
            <ProtectedRoute>
              <GamesPage />
            </ProtectedRoute>
          }
        />


        <Route
          path="/games/wubble-web"
          element={
            <ProtectedRoute>
              <WubbleWebPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/test-game"
          element={
            <ProtectedRoute>
              <TestGamePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
