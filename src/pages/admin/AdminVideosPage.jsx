import { useOutletContext } from 'react-router-dom';
import { useEffect } from 'react';
import { ListVideo, Plus } from 'lucide-react';
import { VideoForm } from '../../components/videos/VideoForm.jsx';
import { AdminVideoRow } from '../../components/admin/AdminVideoRow.jsx';

export default function AdminVideosPage() {
  const { videos, playlists, ensureVideosPage, reloadVideosPage } = useOutletContext();

  useEffect(() => {
    ensureVideosPage();
  }, [ensureVideosPage]);

  return (
    <div className="admin-grid">
      <div className="panel"><div className="panel-title"><Plus size={18} /><h3>Add video</h3></div><VideoForm playlists={playlists} onCreated={reloadVideosPage} /></div>
      <div className="panel">
        <div className="panel-title"><ListVideo size={18} /><h3>Manage videos</h3></div>
        <div className="admin-list">
          {videos.map((video) => <AdminVideoRow key={video.id} video={video} playlists={playlists} onChanged={reloadVideosPage} />)}
        </div>
      </div>
    </div>
  );
}
