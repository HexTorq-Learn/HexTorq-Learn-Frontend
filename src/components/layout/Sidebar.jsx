import { NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  Activity, BarChart3, Folder, ListVideo, LogOut, Play, Shield, Trophy,
} from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useVideos } from '../../hooks/useVideos.js';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { NotificationBell } from '../ui/NotificationBell.jsx';

export function Sidebar() {
  const { auth, logout } = useAuth();
  const { videos, playlists } = useVideos();
  const { videoId } = useParams();
  const navigate = useNavigate();
  const currentVideo = videos.find((video) => video.id === videoId);
  const currentPlaylistId = currentVideo?.playlistId || 'all';

  function onLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function onPlaylistChange(event) {
    const nextPlaylistId = event.target.value;
    const nextVideo = nextPlaylistId === 'all'
      ? videos[0]
      : nextPlaylistId === 'none'
        ? videos.find((video) => !video.playlistId)
        : videos.find((video) => video.playlistId === nextPlaylistId);
    if (nextVideo) navigate(`/learn/${nextVideo.id}`);
  }

  function onVideoChange(event) {
    if (event.target.value) navigate(`/learn/${event.target.value}`);
  }

  return (
    <header className="learner-header">
      <div className="brand learner-brand">
        <Activity />
        <div>
          <strong>HexTorq Learn</strong>
          <span>{auth?.user?.name}</span>
        </div>
      </div>

      <nav className="learner-nav">
        <NavLink to="/learn" className={({ isActive }) => `nav-button${isActive ? ' active' : ''}`}>
          <Play size={16} /><span>Learning</span>
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `nav-button${isActive ? ' active' : ''}`}>
          <BarChart3 size={16} /><span>Analytics</span>
        </NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => `nav-button${isActive ? ' active' : ''}`}>
          <Trophy size={16} /><span>Leaderboard</span>
        </NavLink>
      </nav>

      <div className="learner-switchers">
        <label>
          <Folder size={15} />
          <select value={currentPlaylistId} onChange={onPlaylistChange}>
            <option value="all">All videos</option>
            {playlists.map((playlist) => (
              <option key={playlist.id} value={playlist.id}>{playlist.name}</option>
            ))}
            <option value="none">No playlist</option>
          </select>
        </label>
        <label>
          <ListVideo size={15} />
          <select value={currentVideo?.id || ''} onChange={onVideoChange}>
            <option value="" disabled>Select video</option>
            {videos.map((video) => (
              <option key={video.id} value={video.id}>{video.title}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="learner-actions">
        {auth?.user?.role === 'ADMIN' && (
          <button className="small-button" onClick={() => navigate('/admin')}>
            <Shield size={16} />Admin
          </button>
        )}
        <NotificationBell />
        <ThemeToggle />
        <button className="logout" onClick={onLogout}><LogOut size={16} /><span>Logout</span></button>
      </div>
    </header>
  );
}
