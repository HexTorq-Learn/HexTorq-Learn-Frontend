import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { Scene3DCanvas } from './Scene3DCanvas.jsx';

const CATEGORY_COLORS = {
  Time: '#1f6f64',
  Streak: '#f7c948',
  Consistency: '#6fb5a6',
  Completion: '#185a51',
  Playlist: '#d9a92a',
  Focus: '#124039',
  Revision: '#b42318',
  Behavior: '#93a1b5',
  Session: '#fbe0a0',
  'Time of Day': '#35a794',
};

function BadgeTile({ badge, index, total, radius, highlight, onSelect }) {
  const angle = (index / total) * Math.PI * 2;
  const position = [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];
  const color = CATEGORY_COLORS[badge.category] || '#1f6f64';
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position} rotation={[0, -angle + Math.PI / 2, 0]}>
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onSelect(badge)}
        scale={hovered ? 1.15 : 1}
      >
        <cylinderGeometry args={[0.55, 0.55, 0.3, 6]} />
        <meshStandardMaterial
          color={color}
          opacity={badge.unlocked ? 1 : 0.25}
          transparent={!badge.unlocked}
          wireframe={!badge.unlocked}
          emissive={highlight ? color : '#000000'}
          emissiveIntensity={highlight ? 0.6 : 0}
        />
      </mesh>
      {(hovered || highlight) && (
        <Html center position={[0, 0.9, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'var(--color-surface-0)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.5rem',
            padding: '0.4rem 0.6rem',
            fontSize: '0.72rem',
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-card)',
          }}
          >
            <strong>{badge.label}</strong>
            <div className="muted">{badge.progress}/{badge.target} · {badge.category}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function Ring({ badges, nextBestKeys, onSelect }) {
  const groupRef = useRef(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.08;
  });
  const radius = Math.max(3, badges.length * 0.35);

  return (
    <group ref={groupRef}>
      {badges.map((badge, index) => (
        <BadgeTile
          key={badge.key}
          badge={badge}
          index={index}
          total={badges.length}
          radius={radius}
          highlight={nextBestKeys.has(badge.key)}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

export function BadgeShowcase3D({ game }) {
  const [selected, setSelected] = useState(null);
  const badges = game?.allBadges || game?.badges || [];
  const nextBestKeys = useMemo(() => new Set((game?.strategy?.nextBestActions || []).map((badge) => badge.key)), [game]);

  if (!badges.length) return <p className="muted">No badges yet — start watching to unlock some.</p>;

  return (
    <div>
      <Scene3DCanvas cameraPosition={[0, 5, Math.max(6, badges.length * 0.4)]} tall>
        <Ring badges={badges} nextBestKeys={nextBestKeys} onSelect={setSelected} />
        <OrbitControls enableZoom autoRotate={false} maxPolarAngle={Math.PI / 2.1} minPolarAngle={Math.PI / 3} />
      </Scene3DCanvas>
      {selected && (
        <div className="panel" style={{ marginTop: '0.75rem' }}>
          <strong>{selected.label}</strong>
          <p className="muted" style={{ margin: '0.3rem 0 0' }}>{selected.description} — {selected.progress}/{selected.target} ({selected.percent}%)</p>
        </div>
      )}
    </div>
  );
}
