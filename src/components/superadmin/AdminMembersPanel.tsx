import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  CircleUser as UserCircle,
  Mail,
  Link,
  Link2Off,
  UserX,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Upload,
} from 'lucide-react';
import PersonalityAssessment from '../PersonalityAssessment';

interface AuthUser {
  id: string;
  email: string;
}

interface Role {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  role_id: string | null;
  status: string;
  photo_url: string | null;
  manager_id: string | null;
  user_id: string | null;
  start_date: string;
  current_level: string | null;
  disc_d: number | null;
  disc_i: number | null;
  disc_s: number | null;
  disc_c: number | null;
  enneagram_primary: number | null;
  enneagram_wing: number | null;
  working_genius: any;
}

const emptyForm = {
  full_name: '',
  email: '',
  role: '',
  role_id: null as string | null,
  current_level: 'Associate',
  start_date: '',
  status: 'active',
  photo_url: '',
  disc_d: null as number | null,
  disc_i: null as number | null,
  disc_s: null as number | null,
  disc_c: null as number | null,
  enneagram_primary: null as number | null,
  enneagram_wing: null as number | null,
  working_genius: null as any,
};

export default function AdminMembersPanel() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });

  const [linkingMember, setLinkingMember] = useState<TeamMember | null>(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [assigningMember, setAssigningMember] = useState<TeamMember | null>(null);
  const [assignManagerId, setAssignManagerId] = useState('');
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
      const [membersResult, rolesResult] = await Promise.all([
        supabase.from('team_members').select('*').order('full_name'),
        supabase.from('roles').select('id, name').order('name'),
      ]);

      setMembers(membersResult.data || []);
      setRoles(rolesResult.data || []);

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

      if (response.ok) {
        const json = await response.json();
        setAuthUsers(json.users || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getManagerEmail = (managerId: string | null) => {
    if (!managerId) return 'Unassigned';
    const u = authUsers.find(u => u.id === managerId);
    return u?.email || managerId;
  };

  const getUserEmail = (userId: string | null) => {
    if (!userId) return null;
    const u = authUsers.find(u => u.id === userId);
    return u?.email;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `superadmin/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, photo_url: publicUrl }));
    } catch (err) {
      showToast('error', 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({ ...emptyForm });
    setShowForm(true);
  };

  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      full_name: member.full_name,
      email: member.email,
      role: member.role,
      role_id: member.role_id,
      current_level: member.current_level || 'Associate',
      start_date: member.start_date,
      status: member.status,
      photo_url: member.photo_url || '',
      disc_d: member.disc_d,
      disc_i: member.disc_i,
      disc_s: member.disc_s,
      disc_c: member.disc_c,
      enneagram_primary: member.enneagram_primary,
      enneagram_wing: member.enneagram_wing,
      working_genius: member.working_genius,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload: any = {
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
        role_id: formData.role_id,
        current_level: formData.current_level,
        start_date: formData.start_date,
        status: formData.status,
        photo_url: formData.photo_url || null,
        disc_d: formData.disc_d,
        disc_i: formData.disc_i,
        disc_s: formData.disc_s,
        disc_c: formData.disc_c,
        enneagram_primary: formData.enneagram_primary,
        enneagram_wing: formData.enneagram_wing,
        working_genius: formData.working_genius,
      };

      if (editingMember) {
        const { error } = await supabase
          .from('team_members')
          .update(payload)
          .eq('id', editingMember.id);
        if (error) throw error;
        showToast('success', `${formData.full_name} updated successfully.`);
      } else {
        const { error } = await supabase
          .from('team_members')
          .insert([payload]);
        if (error) throw error;
        showToast('success', `${formData.full_name} added successfully.`);
      }

      setShowForm(false);
      setEditingMember(null);
      setFormData({ ...emptyForm });
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save team member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.from('team_members').delete().eq('id', id);
      if (error) throw error;
      showToast('success', 'Team member removed.');
      setConfirmDeleteId(null);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to remove team member');
    } finally {
      setActionLoading(false);
    }
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

  const filteredMembers = members.filter(m =>
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'on_leave': return 'bg-yellow-100 text-yellow-700';
      case 'inactive': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
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
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">All Team Members</h1>
            <p className="text-sm text-slate-500 mt-0.5">View and manage all team members across all managers</p>
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
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search team members..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-slate-200">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No team members found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {filteredMembers.length} Member{filteredMembers.length !== 1 ? 's' : ''}
            </span>
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:grid" style={{ width: '60%' }}>
              <span>Name</span>
              <span>Manager</span>
              <span>Account</span>
              <span>Actions</span>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {member.photo_url
                      ? <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                      : <UserCircle className="w-6 h-6 text-slate-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 truncate">{member.full_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(member.status)}`}>
                        {member.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-500 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        {member.email}
                      </span>
                      {member.role && (
                        <span className="text-xs text-slate-400 hidden sm:block truncate">{member.role}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex flex-col flex-shrink-0 min-w-[120px]">
                  <span className="text-xs text-slate-400">Manager</span>
                  <span className="text-xs font-medium text-slate-700 truncate max-w-[140px]">
                    {getManagerEmail(member.manager_id)}
                  </span>
                </div>

                <div className="hidden md:flex flex-shrink-0">
                  {member.user_id ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
                      <Link className="w-3 h-3" />
                      {getUserEmail(member.user_id) ? getUserEmail(member.user_id) : 'Linked'}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">No account</span>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {member.user_id ? (
                    <button
                      onClick={() => handleUnlinkAccount(member)}
                      title="Unlink account"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Link2Off className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => { setLinkingMember(member); setLinkEmail(''); }}
                      title="Link account"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Link className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => { setAssigningMember(member); setAssignManagerId(''); }}
                    title="Reassign manager"
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(member)}
                    title="Edit member"
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(member.id)}
                    title="Remove member"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingMember ? 'Edit Team Member' : 'Add Team Member'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingMember(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Profile Photo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {formData.photo_url
                      ? <img src={formData.photo_url} alt="Preview" className="w-full h-full object-cover" />
                      : <UserCircle className="w-10 h-10 text-slate-400" />
                    }
                  </div>
                  <label className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition cursor-pointer text-sm text-slate-700">
                    <Upload className="w-4 h-4" />
                    {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text" required value={formData.full_name}
                    onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email" required value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Title</label>
                  <input
                    type="text" required value={formData.role}
                    onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                    placeholder="e.g., Senior Designer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Role (Maturity Model)</label>
                  <select
                    value={formData.role_id || ''}
                    onChange={e => setFormData(prev => ({ ...prev, role_id: e.target.value || null }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                  >
                    <option value="">None</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Level</label>
                  <select
                    value={formData.current_level}
                    onChange={e => setFormData(prev => ({ ...prev, current_level: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                  >
                    <option value="Associate">Associate</option>
                    <option value="Level 1">Level 1</option>
                    <option value="Level 2">Level 2</option>
                    <option value="Senior Level">Senior Level</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label>
                  <input
                    type="date" required value={formData.start_date}
                    onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <PersonalityAssessment
                  data={{
                    disc_d: formData.disc_d, disc_i: formData.disc_i,
                    disc_s: formData.disc_s, disc_c: formData.disc_c,
                    enneagram_primary: formData.enneagram_primary,
                    enneagram_wing: formData.enneagram_wing,
                    working_genius: formData.working_genius,
                  }}
                  onChange={personalityData => setFormData(prev => ({ ...prev, ...personalityData }))}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingMember(null); }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 text-sm font-medium"
                >
                  {actionLoading ? 'Saving...' : editingMember ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
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
                <h3 className="text-lg font-bold text-slate-900">Remove Team Member</h3>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              Are you sure you want to permanently remove this team member and all associated data?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm font-medium"
              >
                {actionLoading ? 'Removing...' : 'Remove'}
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

      {linkingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Link className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Link User Account</h3>
                  <p className="text-sm text-slate-500">for {linkingMember.full_name}</p>
                </div>
              </div>
              <button onClick={() => setLinkingMember(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">User Account Email</label>
              <input
                type="email" value={linkEmail}
                onChange={e => setLinkEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLinkAccount()}
                placeholder="user@example.com" autoFocus
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLinkAccount}
                disabled={!linkEmail.trim() || actionLoading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium"
              >
                {actionLoading ? 'Linking...' : 'Link Account'}
              </button>
              <button onClick={() => setLinkingMember(null)} className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {assigningMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <UserX className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Reassign Manager</h3>
                  <p className="text-sm text-slate-500">for {assigningMember.full_name}</p>
                </div>
              </div>
              <button onClick={() => setAssigningMember(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">New Manager</label>
              <select
                value={assignManagerId}
                onChange={e => setAssignManagerId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              >
                <option value="">Select a manager...</option>
                {authUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.email}{u.id === assigningMember.manager_id ? ' (current)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReassignManager}
                disabled={!assignManagerId || actionLoading || assignManagerId === assigningMember.manager_id}
                className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-50 text-sm font-medium"
              >
                {actionLoading ? 'Reassigning...' : 'Reassign'}
              </button>
              <button onClick={() => setAssigningMember(null)} className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
