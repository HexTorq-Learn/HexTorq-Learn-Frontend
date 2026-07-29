import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, MeshDistortMaterial, OrbitControls, Torus } from '@react-three/drei';
import { Scene3DCanvas } from './Scene3DCanvas.jsx';

const ROLE_COLORS = {
  Starter: '#6fb5a6',
  Explorer: '#1f6f64',
  Builder: '#185a51',
  Expert: '#d9a92a',
  Master: '#f7c948',
  Legend: '#fbe0a0',
};

function Orb({ level, role, levelProgressPercent, xp }) {
  const meshRef = useRef(null);
  const prevXpRef = useRef(xp);
  const pulseRef = useRef(0);

  useEffect(() => {
    if (xp > prevXpRef.current) pulseRef.current = 1;
    prevXpRef.current = xp;
  }, [xp]);

  useFrame((_, delta) => {
    if (pulseRef.current > 0) {
      pulseRef.current = Math.max(0, pulseRef.current - delta * 1.5);
    }
    if (meshRef.current) {
      const scale = 1 + pulseRef.current * 0.15;
      meshRef.current.scale.setScalar(scale);
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  const color = ROLE_COLORS[role] || ROLE_COLORS.Starter;
  const progressAngle = (levelProgressPercent / 100) * Math.PI * 2;

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.4, 4]} />
        <MeshDistortMaterial color={color} distort={0.28} speed={2} roughness={0.25} metalness={0.4} />
      </mesh>
      <Torus args={[2, 0.08, 16, 64, progressAngle]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#f7c948" emissive="#f7c948" emissiveIntensity={0.4} />
      </Torus>
      <Html center position={[0, 0, 1.5]} style={{ pointerEvents: 'none', textAlign: 'center' }}>
        <div style={{ color: 'var(--color-text-primary)' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>Lv {level}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{role}</div>
        </div>
      </Html>
    </group>
  );
}

export function LevelOrb3D({ game }) {
  if (!game) return null;
  return (
    <Scene3DCanvas cameraPosition={[0, 1, 6]}>
      <Orb level={game.level || 1} role={game.role || 'Starter'} levelProgressPercent={game.levelProgressPercent || 0} xp={game.xp || 0} />
      <OrbitControls enableZoom={false} autoRotate={false} enablePan={false} />
    </Scene3DCanvas>
  );
}
