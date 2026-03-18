import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield,
  Users,
  UserCheck,
  UserX,
  Link,
  Link2Off,
  ChevronDown,
  ChevronUp,
  LogOut,
  Mail,
  Calendar,
  Search,
  CircleUser as UserCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  photo_url: string | null;
  manager_id: string | null;
  user_id: string | null;
  start_date: string;
}

interface UserWithTeamMembers extends AuthUser {
  teamMembers: TeamMember[];
  expanded: boolean;
}

export default function SuperAdminDashboard() {
  const { signOut, user } = useAuth();
  const [users, setUsers] = useState<UserWithTeamMembers[]>([]);
  const [allTeamMembers, setAllTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'members'>('users');
  const [linkingMember, setLinkingMember] = useState<TeamMember | null>(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [assigningMember, setAssigningMember] = useState<TeamMember | null>(null);
  const [assignManagerId, setAssignManagerId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
      const [membersResult] = await Promise.all([
        supabase.from('team_members').select('*').order('full_name'),
      ]);

      const members: TeamMember[] = membersResult.data || [];
      setAllTeamMembers(members);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-auth-users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let authUsers: AuthUser[] = [];
      if (response.ok) {
        const json = await response.json();
        authUsers = json.users || [];
      } else {
        const allManagerIds = [...new Set(members.map(m => m.manager_id).filter(Boolean) as string[])];
        const allUserIds = [...new Set(members.map(m => m.user_id).filter(Boolean) as string[])];
        const allIds = [...new Set([...allManagerIds, ...allUserIds])];

        const { data: adminList } = await supabase.from('super_admins').select('user_id');
        const superAdminIds = adminList?.map(a => a.user_id) || [];

        authUsers = allIds.map(id => ({
          id,
          email: members.find(m => m.manager_id === id || m.user_id === id)?.email || id,
          created_at: '',
          last_sign_in_at: null,
        }));

        superAdminIds.forEach(id => {
          if (!authUsers.find(u => u.id === id)) {
            authUsers.push({ id, email: 'kristy.sullivan@ramseysolutions.com', created_at: '', last_sign_in_at: null });
          }
        });
      }

      const usersWithMembers: UserWithTeamMembers[] = authUsers.map(authUser => ({
        ...authUser,
        teamMembers: members.filter(m => m.manager_id === authUser.id),
        expanded: false,
      }));

      setUsers(usersWithMembers);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (userId: string) => {
    setUsers(prev =>
      prev.map(u => u.id === userId ? { ...u, expanded: !u.expanded } : u)
    );
  };

  const handleLinkAccount = async () => {
    if (!linkingMember || !linkEmail.trim()) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('link_team_member_to_user', {
        p_team_member_id: linkingMember.id,
        p_user_email: linkEmail.trim(),
      });
      if (error) throw error;
      if (data && typeof data === 'object' && 'error' in data) {
        showToast('error', String(data.error));
        return;
      }
      showToast('success', `${linkingMember.full_name} linked to ${linkEmail}`);
      setLinkingMember(null);
      setLinkEmail('');
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to link account');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlinkAccount = async (member: TeamMember) => {
    if (!confirm(`Remove the linked account from ${member.full_name}?`)) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('unlink_team_member_from_user', {
        p_team_member_id: member.id,
      });
      if (error) throw error;
      if (data && typeof data === 'object' && 'error' in data) {
        showToast('error', String(data.error));
        return;
      }
      showToast('success', `Account unlinked from ${member.full_name}`);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to unlink account');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassignManager = async () => {
    if (!assigningMember || !assignManagerId) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('reassign_team_member_manager', {
        p_team_member_id: assigningMember.id,
        p_new_manager_id: assignManagerId,
      });
      if (error) throw error;
      if (data && typeof data === 'object' && 'error' in data) {
        showToast('error', String(data.error));
        return;
      }
      showToast('success', `${assigningMember.full_name} reassigned successfully`);
      setAssigningMember(null);
      setAssignManagerId('');
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to reassign');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMembers = allTeamMembers.filter(m =>
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getManagerEmail = (managerId: string | null) => {
    if (!managerId) return 'Unassigned';
    const manager = users.find(u => u.id === managerId);
    return manager?.email || managerId;
  };

  const getUserEmail = (userId: string | null) => {
    if (!userId) return null;
    const u = users.find(u => u.id === userId);
    return u?.email || userId;
  };

  return (
    <div className="min-h-screen bg-slate-50">
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

      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Super Admin</h1>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Users & Assignments
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'members'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              All Team Members
            </button>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
          </div>
        ) : activeTab === 'users' ? (
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No users found</p>
              </div>
            ) : (
              filteredUsers.map(u => (
                <div key={u.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div
                    className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleExpand(u.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <UserCircle className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{u.email}</span>
                          {u.email === 'kristy.sullivan@ramseysolutions.com' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-900 text-white">
                              <Shield className="w-3 h-3" />
                              Super Admin
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-0.5">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {u.teamMembers.length} team member{u.teamMembers.length !== 1 ? 's' : ''}
                          </span>
                          {u.created_at && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Joined {new Date(u.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {u.expanded
                      ? <ChevronUp className="w-4 h-4 text-slate-400" />
                      : <ChevronDown className="w-4 h-4 text-slate-400" />
                    }
                  </div>

                  {u.expanded && (
                    <div className="border-t border-slate-100 px-6 py-4">
                      {u.teamMembers.length === 0 ? (
                        <p className="text-sm text-slate-400 py-2">No team members assigned to this user.</p>
                      ) : (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Managed Team Members
                          </h4>
                          {u.teamMembers.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center flex-shrink-0">
                                  {member.photo_url
                                    ? <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                                    : <UserCircle className="w-5 h-5 text-slate-400" />
                                  }
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-slate-900">{member.full_name}</div>
                                  <div className="text-xs text-slate-500">{member.role}</div>
                                </div>
                                {member.user_id && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
                                    <Link className="w-3 h-3" />
                                    Linked: {getUserEmail(member.user_id)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {member.user_id ? (
                                  <button
                                    onClick={() => handleUnlinkAccount(member)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Link2Off className="w-3.5 h-3.5" />
                                    Unlink
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => { setLinkingMember(member); setLinkEmail(''); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Link className="w-3.5 h-3.5" />
                                    Link Account
                                  </button>
                                )}
                                <button
                                  onClick={() => { setAssigningMember(member); setAssignManagerId(''); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  Reassign
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                All Team Members ({filteredMembers.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-16">
                  <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No team members found</p>
                </div>
              ) : (
                filteredMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                        {member.photo_url
                          ? <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                          : <UserCircle className="w-6 h-6 text-slate-400" />
                        }
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{member.full_name}</div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </span>
                          <span className="text-xs text-slate-400">{member.role}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Manager</div>
                        <div className="text-xs font-medium text-slate-700 max-w-[180px] truncate">
                          {getManagerEmail(member.manager_id)}
                        </div>
                      </div>
                      {member.user_id ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
                            <Link className="w-3 h-3" />
                            Linked
                          </span>
                          <button
                            onClick={() => handleUnlinkAccount(member)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Link2Off className="w-3.5 h-3.5" />
                            Unlink
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setLinkingMember(member); setLinkEmail(''); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 rounded-lg"
                        >
                          <Link className="w-3.5 h-3.5" />
                          Link Account
                        </button>
                      )}
                      <button
                        onClick={() => { setAssigningMember(member); setAssignManagerId(''); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        Reassign
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {linkingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Link className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Link User Account</h3>
                <p className="text-sm text-slate-500">for {linkingMember.full_name}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Enter the email address of the existing user account to link to this team member.
            </p>
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">User Account Email</label>
              <input
                type="email"
                value={linkEmail}
                onChange={e => setLinkEmail(e.target.value)}
                placeholder="user@example.com"
                autoFocus
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLinkAccount}
                disabled={!linkEmail.trim() || actionLoading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {actionLoading ? 'Linking...' : 'Link Account'}
              </button>
              <button
                onClick={() => { setLinkingMember(null); setLinkEmail(''); }}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {assigningMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <UserX className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reassign Manager</h3>
                <p className="text-sm text-slate-500">for {assigningMember.full_name}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Select a user to become the new manager for this team member.
            </p>
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">New Manager</label>
              <select
                value={assignManagerId}
                onChange={e => setAssignManagerId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              >
                <option value="">Select a manager...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                    {u.id === assigningMember.manager_id ? ' (current)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReassignManager}
                disabled={!assignManagerId || actionLoading || assignManagerId === assigningMember.manager_id}
                className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {actionLoading ? 'Reassigning...' : 'Reassign'}
              </button>
              <button
                onClick={() => { setAssigningMember(null); setAssignManagerId(''); }}
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
