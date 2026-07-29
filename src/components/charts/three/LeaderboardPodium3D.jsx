import { useState } from 'react';
import { Html } from '@react-three/drei';

const ROLE_COLORS = {
  Starter: '#6fb5a6', Explorer: '#1f6f64', Builder: '#185a51', Expert: '#d9a92a', Master: '#f7c948', Legend: '#fbe0a0',
};

function PodiumBlock({ row, rank, x, height, currentUserId, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const color = ROLE_COLORS[row.role] || ROLE_COLORS.Starter;
  const isCurrent = row.userId === currentUserId;

  return (
    <group position={[x, 0, 0]}>
      <mesh
        position={[0, height / 2, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onSelect(row)}
      >
        <boxGeometry args={[1.6, height, 1.6]} />
        <meshStandardMaterial color={isCurrent ? '#f7c948' : color} emissive={isCurrent ? '#f7c948' : '#000000'} emissiveIntensity={isCurrent ? 0.35 : 0} />
      </mesh>
      <Html center position={[0, height + 1.1, 0]} style={{ pointerEvents: 'none', textAlign: 'center' }}>
        <div style={{ color: 'var(--color-text-primary)' }}>
          <div style={{ fontWeight: 800 }}>#{rank}</div>
          <div style={{ fontSize: '0.85rem' }}>{row.name}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Lv {row.level} · {row.xp} XP</div>
        </div>
      </Html>
      {hovered && (
        <Html center position={[0, height + 2.2, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', padding: '0.5rem 0.7rem', fontSize: '0.72rem', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-card)' }}>
            {row.role} · {row.badgeCount} badges · {Math.round(row.activeStudySeconds / 60)} min studied
          </div>
        </Html>
      )}
    </group>
  );
}

export function LeaderboardPodium3D({ topThree, currentUserId, onSelect }) {
  if (!topThree.length) return null;
  const maxScore = Math.max(1, ...topThree.map((row) => row.rankScore));
  const order = [topThree[1], topThree[0], topThree[2]].filter(Boolean);
  const positions = [-2.4, 0, 2.4];

  return (
    <group>
      {order.map((row, index) => {
        const rank = topThree.indexOf(row) + 1;
        const height = 1.2 + (row.rankScore / maxScore) * 2.2;
        return (
          <PodiumBlock key={row.userId} row={row} rank={rank} x={positions[index]} height={height} currentUserId={currentUserId} onSelect={onSelect} />
        );
      })}
    </group>
  );
}
