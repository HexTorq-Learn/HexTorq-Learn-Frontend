import { useOutletContext } from 'react-router-dom';
import { useEffect } from 'react';
import { Folder, Plus } from 'lucide-react';
import { PlaylistForm } from '../../components/videos/PlaylistForm.jsx';

export default function AdminPlaylistsPage() {
  const { playlists, ensurePlaylistsPage, reloadPlaylistsPage } = useOutletContext();

  useEffect(() => {
    ensurePlaylistsPage();
  }, [ensurePlaylistsPage]);

  return (
    <div className="admin-grid">
      <div className="panel"><div className="panel-title"><Plus size={18} /><h3>Create playlist</h3></div><PlaylistForm onCreated={reloadPlaylistsPage} /></div>
      <div className="panel">
        <div className="panel-title"><Folder size={18} /><h3>Folders</h3></div>
        <div className="admin-list">
          {playlists.map((playlist) => (
            <div className="playlist-admin-row" key={playlist.id}>
              <i style={{ background: playlist.color }} />
              <div><strong>{playlist.name}</strong><span>{playlist._count?.videos ?? playlist.videos?.length ?? 0} videos</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
