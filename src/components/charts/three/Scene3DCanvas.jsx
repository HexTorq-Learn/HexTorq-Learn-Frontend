import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';

export function Scene3DCanvas({ children, cameraPosition = [0, 3, 9], tall = false, fallback = null }) {
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className={`scene-3d-canvas${tall ? ' tall' : ''}`}>
      <Canvas dpr={[1, 2]} shadows>
        <PerspectiveCamera makeDefault position={cameraPosition} fov={45} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.1} castShadow />
        <Suspense fallback={fallback}>
          {typeof children === 'function' ? children({ reducedMotion }) : children}
        </Suspense>
      </Canvas>
    </div>
  );
}
