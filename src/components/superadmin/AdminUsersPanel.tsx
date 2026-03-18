import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  UserCog,
  Plus,
  Pencil,
  Trash2,
  Shield,
  Mail,
  Calendar,
  Search,
  CircleUser as UserCircle,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react';

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface SuperAdmin {
  id: string;
  user_id: string;
  email?: string;
}

export default function AdminUsersPanel() {
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addEmail, setAddEmail] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let fetchedUsers: AuthUser[] = [];

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-auth-users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const json = await response.json();
        fetchedUsers = json.users || [];
      }

      setAuthUsers(fetchedUsers);

      const { data: admins } = await supabase
        .from('super_admins')
        .select('id, user_id');

      const adminsWithEmail = (admins || []).map(admin => ({
        ...admin,
        email: fetchedUsers.find(u => u.id === admin.user_id)?.email,
      }));

      setSuperAdmins(adminsWithEmail);
    } catch (err) {
      console.error('Error fetching admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!addEmail.trim()) return;
    setActionLoading(true);
    try {
      const user = authUsers.find(u => u.email.toLowerCase() === addEmail.trim().toLowerCase());
      if (!user) {
        showToast('error', `No account found with email: ${addEmail.trim()}`);
        return;
      }

      const existing = superAdmins.find(a => a.user_id === user.id);
      if (existing) {
        showToast('error', 'This user is already an admin.');
        return;
      }

      const { error } = await supabase
        .from('super_admins')
        .insert({ user_id: user.id });

      if (error) throw error;

      showToast('success', `${addEmail.trim()} added as admin.`);
      setShowAddModal(false);
      setAddEmail('');
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to add admin');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('super_admins')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      showToast('success', 'Admin account removed.');
      setConfirmDeleteId(null);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to remove admin');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAdmins = superAdmins.filter(admin => {
    const email = admin.email || '';
    return email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-4xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />
          }
          {toast.message}
        </div>
      )}

      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
            <UserCog className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Accounts</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage who has super admin access</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm border border-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => { setShowAddModal(true); setAddEmail(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Admin
          </button>
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search admin accounts..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-slate-200">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
        </div>
      ) : filteredAdmins.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No admin accounts found</p>
          <p className="text-slate-400 text-sm mt-1">Add an admin account to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {filteredAdmins.length} Admin{filteredAdmins.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredAdmins.map(admin => {
              const authUser = authUsers.find(u => u.id === admin.user_id);
              return (
                <div key={admin.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <UserCircle className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{admin.email || admin.user_id}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-900 text-white">
                          <Shield className="w-3 h-3" />
                          Super Admin
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        {admin.email && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {admin.email}
                          </span>
                        )}
                        {authUser?.created_at && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Joined {new Date(authUser.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmDeleteId(admin.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                  <UserCog className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add Admin Account</h3>
                  <p className="text-sm text-slate-500">Grant super admin access</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Enter the email address of an existing user account to grant them super admin access.
            </p>
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">User Email</label>
              <input
                type="email"
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddAdmin()}
                placeholder="admin@example.com"
                autoFocus
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddAdmin}
                disabled={!addEmail.trim() || actionLoading}
                className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {actionLoading ? 'Adding...' : 'Add Admin'}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Remove Admin</h3>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              Are you sure you want to remove this admin account? They will lose all super admin privileges.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleRemoveAdmin(confirmDeleteId)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm font-medium"
              >
                {actionLoading ? 'Removing...' : 'Remove Admin'}
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
