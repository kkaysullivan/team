import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, UserCircle, Mail, Calendar, Upload, Camera } from 'lucide-react';
import type { Database } from '../lib/supabase';
import PersonalityAssessment from './PersonalityAssessment';

type TeamMember = Database['public']['Tables']['team_members']['Row'];

interface Role {
  id: string;
  name: string;
}

export default function TeamMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [viewingPersonality, setViewingPersonality] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
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
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [membersResult, rolesResult] = await Promise.all([
      supabase.from('team_members').select('*').order('created_at', { ascending: false }),
      supabase.from('roles').select('id, name').order('name'),
    ]);

    if (membersResult.error) {
      console.error('Error fetching members:', membersResult.error);
    } else {
      setMembers(membersResult.data || []);
    }

    if (rolesResult.data) {
      setRoles(rolesResult.data);
    }

    setLoading(false);
  };

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching members:', error);
    } else {
      setMembers(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const memberData = {
      ...formData,
      manager_id: user.id,
    };

    if (editingMember) {
      const { error } = await supabase
        .from('team_members')
        .update(memberData)
        .eq('id', editingMember.id);

      if (error) {
        console.error('Error updating member:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('team_members')
        .insert([memberData]);

      if (error) {
        console.error('Error adding member:', error);
        return;
      }
    }

    resetForm();
    fetchMembers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting member:', error);
      return;
    }

    fetchMembers();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      setFormData({ ...formData, photo_url: publicUrl });
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleEdit = (member: TeamMember) => {
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

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      role: '',
      role_id: null,
      current_level: 'Associate',
      start_date: '',
      status: 'active',
      photo_url: '',
      disc_d: null,
      disc_i: null,
      disc_s: null,
      disc_c: null,
      enneagram_primary: null,
      enneagram_wing: null,
      working_genius: null,
    });
    setEditingMember(null);
    setShowForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-700';
      case 'inactive':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Team Members</h1>
          <p className="text-slate-600 mt-1">Manage your design team</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Add Member
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 my-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {editingMember ? 'Edit Team Member' : 'Add Team Member'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                    {formData.photo_url ? (
                      <img
                        src={formData.photo_url}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircle className="w-12 h-12 text-slate-400" />
                    )}
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Senior Product Designer"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Role (Maturity Model)
                </label>
                <select
                  value={formData.role_id || ''}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value || null })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">None</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-slate-500 mt-1">
                  Select a role to use the associated maturity model for assessments
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Current Maturity Level
                </label>
                <select
                  value={formData.current_level}
                  onChange={(e) => setFormData({ ...formData, current_level: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Associate">Associate (0.0 – 0.7)</option>
                  <option value="Level 1">Level 1 (0.8 – 1.7)</option>
                  <option value="Level 2">Level 2 (1.8 – 2.7)</option>
                  <option value="Senior Level">Senior Level (2.8 – 3.7)</option>
                  <option value="Lead">Lead (3.8 – 4.0)</option>
                </select>
                <p className="text-sm text-slate-500 mt-1">
                  Select the team member's current official maturity level
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <PersonalityAssessment
                  data={{
                    disc_d: formData.disc_d,
                    disc_i: formData.disc_i,
                    disc_s: formData.disc_s,
                    disc_c: formData.disc_c,
                    enneagram_primary: formData.enneagram_primary,
                    enneagram_wing: formData.enneagram_wing,
                    working_genius: formData.working_genius,
                  }}
                  onChange={(personalityData) => {
                    setFormData({ ...formData, ...personalityData });
                  }}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingMember ? 'Update' : 'Add'} Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingPersonality && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {viewingPersonality.full_name}
                </h2>
                <p className="text-slate-600">{viewingPersonality.role}</p>
              </div>
              <button
                onClick={() => setViewingPersonality(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 transition"
              >
                Close
              </button>
            </div>

            <PersonalityAssessment
              data={{
                disc_d: viewingPersonality.disc_d,
                disc_i: viewingPersonality.disc_i,
                disc_s: viewingPersonality.disc_s,
                disc_c: viewingPersonality.disc_c,
                enneagram_primary: viewingPersonality.enneagram_primary,
                enneagram_wing: viewingPersonality.enneagram_wing,
                working_genius: viewingPersonality.working_genius,
              }}
              onChange={() => {}}
              readOnly={true}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{member.full_name}</h3>
                  <p className="text-sm text-slate-600">{member.role}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                {member.status.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-4 h-4" />
                {member.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4" />
                Started {new Date(member.start_date).toLocaleDateString()}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-200">
              <button
                onClick={() => setViewingPersonality(member)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition"
              >
                <Camera className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => handleEdit(member)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(member.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center py-12">
          <UserCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No team members yet</h3>
          <p className="text-slate-600 mb-6">Get started by adding your first team member</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Add Member
          </button>
        </div>
      )}
    </div>
  );
}
