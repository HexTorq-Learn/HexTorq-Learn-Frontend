import { MetricCard } from '../ui/MetricCard.jsx';
import { MiniBar } from '../ui/MiniBar.jsx';
import { LevelOrb3D } from '../charts/three/LevelOrb3D.jsx';
import { BadgeShowcase3D } from '../charts/three/BadgeShowcase3D.jsx';
import { AchievementTrack } from './AchievementTrack.jsx';
import { BadgeWall } from './BadgeWall.jsx';

export function GameDashboard({ game }) {
  if (!game) return null;
  const badges = game.allBadges || game.badges || [];
  const unlocked = badges.filter((badge) => badge.unlocked);
  const locked = badges.filter((badge) => !badge.unlocked);

  return (
    <section className="game-dashboard">
      <div className="game-hero" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 380px) 1fr', gap: '1rem', alignItems: 'center' }}>
        <LevelOrb3D game={game} />
        <div>
          <span className="eyebrow">{game.publicLearnerId}</span>
          <h2 style={{ margin: '0.2rem 0' }}>Level {game.level || 1} · {game.role || 'Starter'}</h2>
          <p className="muted">{game.xp || 0} XP · {game.coins || 0} coins</p>
        </div>
      </div>

      <div className="game-kpi-grid metric-grid" style={{ marginTop: '1rem' }}>
        <MetricCard title="Unlocked badges" value={`${game.badgeCount || unlocked.length}/${game.totalBadgeCount || badges.length}`} detail="Achievement collection" />
        <MetricCard title="Current role" value={game.role || 'Starter'} detail="Based on level and XP" />
        <MetricCard title="Coins" value={game.coins || 0} detail="Earned from study and badges" />
        <MetricCard title="Next targets" value={game.strategy?.nextBestActions?.length || locked.length} detail="Badges close to unlock" />
      </div>

      <div className="game-section" style={{ marginTop: '1rem' }}>
        <div className="chart-title">Badge showcase</div>
        <BadgeShowcase3D game={game} />
      </div>

      <AchievementTrack achievements={game.achievements} />

      <div className="game-section">
        <div className="chart-title">Next best badge targets</div>
        <div className="achievement-grid">
          {(game.strategy?.nextBestActions || []).map((badge) => (
            <MiniBar key={badge.key} label={badge.label} value={badge.percent || 0} max={100} detail={`${badge.progress}/${badge.target} · ${badge.category}`} />
          ))}
        </div>
      </div>

      <BadgeWall badges={badges} />
    </section>
  );
}
