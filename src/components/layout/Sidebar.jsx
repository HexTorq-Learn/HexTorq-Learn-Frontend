import { useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  Activity, BarChart3, ChevronLeft, ChevronRight, Folder, ListVideo, LogOut, Play, Shield, Trophy,
} from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useVideos } from '../../hooks/useVideos.js';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';

export function Sidebar() {
  const { auth, logout } = useAuth();
  const { videos, playlists } = useVideos();
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('all');

  const groupedVideos = selectedPlaylistId === 'all'
    ? videos
    : selectedPlaylistId === 'none'
      ? videos.filter((video) => !video.playlistId)
      : videos.filter((video) => video.playlistId === selectedPlaylistId);

  function onLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className={sidebarOpen ? 'sidebar' : 'sidebar collapsed'}>
      <div className="brand">
        <Activity />
        <div>
          <strong>HexTorq Learn</strong>
          <span>{auth?.user?.name}</span>
        </div>
      </div>
      <button className="collapse-button" onClick={() => setSidebarOpen((value) => !value)} title="Toggle sidebar">
        {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
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
      {auth?.user?.role === 'ADMIN' && (
        <NavLink to="/admin" className="admin-link"><Shield size={16} /><span>Admin panel</span></NavLink>
      )}
      <div className="sidebar-section">
        <div className="list-heading"><Folder size={16} /><span>Playlists</span></div>
        <button className={selectedPlaylistId === 'all' ? 'playlist-button active' : 'playlist-button'} onClick={() => setSelectedPlaylistId('all')}><i /> <span>All videos</span><strong>{videos.length}</strong></button>
        {playlists.map((playlist) => (
          <button key={playlist.id} className={selectedPlaylistId === playlist.id ? 'playlist-button active' : 'playlist-button'} onClick={() => setSelectedPlaylistId(playlist.id)}>
            <i style={{ background: playlist.color }} /><span>{playlist.name}</span><strong>{playlist.videos.length}</strong>
          </button>
        ))}
        <button className={selectedPlaylistId === 'none' ? 'playlist-button active' : 'playlist-button'} onClick={() => setSelectedPlaylistId('none')}><i /> <span>No playlist</span><strong>{videos.filter((video) => !video.playlistId).length}</strong></button>
      </div>
      <div className="video-list">
        <div className="list-heading"><ListVideo size={16} /><span>Videos</span></div>
        {groupedVideos.map((video) => (
          <button
            key={video.id}
            className={videoId === video.id ? 'video-item active' : 'video-item'}
            onClick={() => navigate(`/learn/${video.id}`)}
          >
            <img src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} alt="" />
            <span>{video.title}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <ThemeToggle />
        <button className="logout" onClick={onLogout} style={{ flex: 1 }}><LogOut size={16} /><span>Logout</span></button>
      </div>
    </aside>
  );
}
