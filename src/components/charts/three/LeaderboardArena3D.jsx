import { useState } from 'react';
import { Html } from '@react-three/drei';

function ArenaBar({ row, rank, angle, radius, height, currentUserId, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const x = Math.sin(angle) * radius;
  const z = -Math.cos(angle) * radius + 4;
  const isCurrent = row.userId === currentUserId;

  return (
    <group position={[x, 0, z]}>
      <mesh
        position={[0, height / 2, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onSelect(row)}
      >
        <cylinderGeometry args={[0.5, 0.5, height, 16]} />
        <meshStandardMaterial color={isCurrent ? '#f7c948' : '#1f6f64'} opacity={0.85} transparent />
      </mesh>
      <Html center position={[0, height + 0.6, 0]} style={{ pointerEvents: 'none', fontSize: '0.68rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--color-text-muted)' }}>#{rank} {row.name}</div>
      </Html>
      {hovered && (
        <Html center position={[0, height + 1.4, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', padding: '0.4rem 0.6rem', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
            Lv {row.level} · {row.consistencyScore} consistency · {row.completionRatePercent}% complete
          </div>
        </Html>
      )}
    </group>
  );
}

export function LeaderboardArena3D({ rows, currentUserId, onSelect }) {
  if (!rows.length) return null;
  const maxSeconds = Math.max(1, ...rows.map((row) => row.activeStudySeconds));

  return (
    <group>
      {rows.map((row, index) => {
        const angle = (index / Math.max(1, rows.length - 1) - 0.5) * (Math.PI * 0.8);
        const height = 0.6 + (row.activeStudySeconds / maxSeconds) * 2.2;
        return (
          <ArenaBar
            key={row.userId}
            row={row}
            rank={index + 4}
            angle={angle}
            radius={5.5}
            height={height}
            currentUserId={currentUserId}
            onSelect={onSelect}
          />
        );
      })}
    </group>
  );
}
