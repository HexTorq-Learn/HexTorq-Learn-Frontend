import { OrbitControls } from '@react-three/drei';
import { Scene3DCanvas } from './Scene3DCanvas.jsx';
import { LeaderboardPodium3D } from './LeaderboardPodium3D.jsx';
import { LeaderboardArena3D } from './LeaderboardArena3D.jsx';

export function LeaderboardScene3D({ topThree, arenaRows, currentUserId, onSelect }) {
  return (
    <Scene3DCanvas cameraPosition={[0, 7, 13]} tall>
      <LeaderboardPodium3D topThree={topThree} currentUserId={currentUserId} onSelect={onSelect} />
      <LeaderboardArena3D rows={arenaRows} currentUserId={currentUserId} onSelect={onSelect} />
      <OrbitControls enableZoom autoRotate autoRotateSpeed={0.6} maxPolarAngle={Math.PI / 2.05} minDistance={6} maxDistance={22} />
    </Scene3DCanvas>
  );
}
