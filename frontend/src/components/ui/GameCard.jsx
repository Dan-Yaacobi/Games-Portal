import { Link } from 'react-router-dom';
import PixelButton from './PixelButton';
import Panel from './Panel';

export default function GameCard({ game, playable, to, description }) {
  return (
    <Panel className="game-card">
      <div className="game-card__badge">LEVEL {game.id}</div>
      <h3>{game.name}</h3>
      <p>{description || `Mode: ${game.slug.replaceAll('-', ' ')}`}</p>
      {playable ? (
        <Link to={to} className="game-card__action-link">
          <PixelButton>Launch</PixelButton>
        </Link>
      ) : (
        <PixelButton variant="ghost" disabled>
          Coming Soon
        </PixelButton>
      )}
    </Panel>
  );
}
