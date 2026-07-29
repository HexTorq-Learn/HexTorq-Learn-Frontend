import { useOutletContext } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { AdminUserForm } from '../../components/admin/AdminUserForm.jsx';
import { AdminUserRow } from '../../components/admin/AdminUserRow.jsx';
import { useAuth } from '../../providers/AuthProvider.jsx';

export default function AdminUsersPage() {
  const { users, reload } = useOutletContext();
  const { auth } = useAuth();

  return (
    <div className="admin-grid">
      <div className="panel"><div className="panel-title"><Plus size={18} /><h3>Create user</h3></div><AdminUserForm onCreated={reload} /></div>
      <div className="panel">
        <div className="panel-title"><Users size={18} /><h3>Manage users</h3></div>
        <div className="admin-list">
          {users.map((user) => (
            <AdminUserRow key={user.id} user={user} selected={false} onChanged={reload} currentUserId={auth?.user?.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
