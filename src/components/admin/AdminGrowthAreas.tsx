import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Search, Filter, X, Pencil, Trash2, Plus, Save, ChevronUp, ChevronDown } from 'lucide-react';
import SearchableDropdown from '../SearchableDropdown';

interface GrowthArea {
  id: string;
  team_member_id: string;
  skill_id: string;
  quarter: string;
  rating: number;
  leader_comments: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: string;
  full_name: string;
  role: string;
}

interface SkillLevel {
  id: string;
  skill_id: string;
  level_id: string;
  description: string;
}

interface Skill {
  id: string;
  name: string;
}

interface Level {
  id: string;
  name: string;
}

interface EnrichedGrowthArea extends GrowthArea {
  team_member_name: string;
  skill_name: string;
  level_name: string;
}

export default function AdminGrowthAreas() {
  const [growthAreas, setGrowthAreas] = useState<EnrichedGrowthArea[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterQuarter, setFilterQuarter] = useState<string>('all');
  const [filterTeamMember, setFilterTeamMember] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof EnrichedGrowthArea>('start_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<GrowthArea>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<Partial<GrowthArea>>({
    is_active: true,
    rating: 3,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const [
      growthAreasResult,
      teamMembersResult,
      skillsResult,
      levelsResult,
      skillLevelsResult,
    ] = await Promise.all([
      supabase.from('growth_areas').select('*').order('start_date', { ascending: false }),
      supabase.from('team_members').select('id, full_name, role'),
      supabase.from('maturity_skills').select('id, name'),
      supabase.from('levels').select('id, name'),
      supabase.from('skill_levels').select('id, skill_id, level_id, description'),
    ]);

    if (teamMembersResult.data) setTeamMembers(teamMembersResult.data);
    if (skillsResult.data) setSkills(skillsResult.data);
    if (levelsResult.data) setLevels(levelsResult.data);
    if (skillLevelsResult.data) setSkillLevels(skillLevelsResult.data);

    if (growthAreasResult.data) {
      const enriched = growthAreasResult.data.map((ga) => {
        const member = teamMembersResult.data?.find((m) => m.id === ga.team_member_id);
        const skillLevel = skillLevelsResult.data?.find((sl) => sl.id === ga.skill_id);
        const skill = skillsResult.data?.find((s) => s.id === skillLevel?.skill_id);
        const level = levelsResult.data?.find((l) => l.id === skillLevel?.level_id);

        return {
          ...ga,
          team_member_name: member?.full_name || 'Unknown',
          skill_name: skill?.name || 'Unknown Skill',
          level_name: level?.name || 'Unknown Level',
        };
      });
      setGrowthAreas(enriched);
    }

    setLoading(false);
  };

  const handleEdit = (growthArea: EnrichedGrowthArea) => {
    setEditingId(growthArea.id);
    setEditForm(growthArea);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from('growth_areas')
      .update({
        team_member_id: editForm.team_member_id,
        skill_id: editForm.skill_id,
        quarter: editForm.quarter,
        rating: editForm.rating,
        leader_comments: editForm.leader_comments,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        is_active: editForm.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingId);

    if (!error) {
      await loadData();
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this growth area?')) return;

    const { error } = await supabase.from('growth_areas').delete().eq('id', id);

    if (!error) {
      await loadData();
    }
  };

  const handleAdd = async () => {
    if (!addForm.team_member_id || !addForm.skill_id || !addForm.quarter || !addForm.start_date || !addForm.end_date) {
      alert('Please fill in all required fields');
      return;
    }

    const { error } = await supabase.from('growth_areas').insert({
      team_member_id: addForm.team_member_id,
      skill_id: addForm.skill_id,
      quarter: addForm.quarter,
      rating: addForm.rating || 3,
      leader_comments: addForm.leader_comments || '',
      start_date: addForm.start_date,
      end_date: addForm.end_date,
      is_active: addForm.is_active ?? true,
    });

    if (!error) {
      await loadData();
      setShowAddForm(false);
      setAddForm({ is_active: true, rating: 3 });
    }
  };

  const getAvailableSkillLevels = (teamMemberId?: string) => {
    if (!teamMemberId) return [];

    return skillLevels.map((sl) => {
      const skill = skills.find((s) => s.id === sl.skill_id);
      const level = levels.find((l) => l.id === sl.level_id);
      return {
        id: sl.id,
        label: `${skill?.name || 'Unknown'} - ${level?.name || 'Unknown'}`,
        subtitle: level?.name,
      };
    });
  };

  const quarters = Array.from(new Set(growthAreas.map((ga) => ga.quarter))).sort();

  const handleSort = (field: keyof EnrichedGrowthArea) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: keyof EnrichedGrowthArea }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline-block ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline-block ml-1" />
    );
  };

  const filteredGrowthAreas = growthAreas
    .filter((ga) => {
      const matchesSearch =
        ga.team_member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ga.skill_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && ga.is_active) ||
        (filterStatus === 'inactive' && !ga.is_active);

      const matchesQuarter = filterQuarter === 'all' || ga.quarter === filterQuarter;

      const matchesTeamMember =
        filterTeamMember === 'all' || ga.team_member_id === filterTeamMember;

      return matchesSearch && matchesStatus && matchesQuarter && matchesTeamMember;
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Growth Areas Management</h3>
          <p className="text-sm text-slate-600 mt-1">
            Track development focus areas across all team members
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Growth Area
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by team member or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterTeamMember}
            onChange={(e) => setFilterTeamMember(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Team Members</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={filterQuarter}
            onChange={(e) => setFilterQuarter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Quarters</option>
            {quarters.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Add Growth Area</h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setAddForm({ is_active: true, rating: 3 });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Team Member *
                </label>
                <select
                  value={addForm.team_member_id || ''}
                  onChange={(e) => setAddForm({ ...addForm, team_member_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select team member</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name} - {member.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Skill & Level *
                </label>
                <SearchableDropdown
                  options={getAvailableSkillLevels(addForm.team_member_id)}
                  value={addForm.skill_id}
                  onChange={(value) => setAddForm({ ...addForm, skill_id: value })}
                  placeholder="Search skills..."
                  emptyMessage={addForm.team_member_id ? 'No skills found' : 'Please select a team member first'}
                  disabled={!addForm.team_member_id}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quarter *</label>
                <input
                  type="text"
                  placeholder="e.g., Q1 2024"
                  value={addForm.quarter || ''}
                  onChange={(e) => setAddForm({ ...addForm, quarter: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rating (1-5) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={addForm.rating || 3}
                  onChange={(e) => setAddForm({ ...addForm, rating: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={addForm.start_date || ''}
                    onChange={(e) => setAddForm({ ...addForm, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={addForm.end_date || ''}
                    onChange={(e) => setAddForm({ ...addForm, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Leader Comments
                </label>
                <textarea
                  value={addForm.leader_comments || ''}
                  onChange={(e) => setAddForm({ ...addForm, leader_comments: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add comments about this growth area..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="add-is-active"
                  checked={addForm.is_active ?? true}
                  onChange={(e) => setAddForm({ ...addForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="add-is-active" className="text-sm font-medium text-slate-700">
                  Active
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAdd}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add Growth Area
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setAddForm({ is_active: true, rating: 3 });
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th
                  className="px-4 py-3 text-left text-sm font-semibold text-slate-900 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('team_member_name')}
                >
                  Team Member
                  <SortIcon field="team_member_name" />
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-semibold text-slate-900 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('skill_name')}
                >
                  Skill & Level
                  <SortIcon field="skill_name" />
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-semibold text-slate-900 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('quarter')}
                >
                  Quarter
                  <SortIcon field="quarter" />
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-semibold text-slate-900 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('rating')}
                >
                  Rating
                  <SortIcon field="rating" />
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-semibold text-slate-900 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('is_active')}
                >
                  Status
                  <SortIcon field="is_active" />
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredGrowthAreas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No growth areas found
                  </td>
                </tr>
              ) : (
                filteredGrowthAreas.map((ga) => (
                  <tr key={ga.id} className="hover:bg-slate-50">
                    {editingId === ga.id ? (
                      <>
                        <td colSpan={6} className="px-4 py-6">
                          <div className="bg-slate-50 rounded-lg p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Team Member *
                                </label>
                                <select
                                  value={editForm.team_member_id || ''}
                                  onChange={(e) => setEditForm({ ...editForm, team_member_id: e.target.value, skill_id: undefined })}
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  {teamMembers.map((member) => (
                                    <option key={member.id} value={member.id}>
                                      {member.full_name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Skill & Level *
                                </label>
                                <SearchableDropdown
                                  options={getAvailableSkillLevels(editForm.team_member_id)}
                                  value={editForm.skill_id}
                                  onChange={(value) => setEditForm({ ...editForm, skill_id: value })}
                                  placeholder="Search skills..."
                                  emptyMessage="No skills found"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Quarter *
                                </label>
                                <input
                                  type="text"
                                  value={editForm.quarter || ''}
                                  onChange={(e) => setEditForm({ ...editForm, quarter: e.target.value })}
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Rating (1-5) *
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="5"
                                  value={editForm.rating || ''}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, rating: parseInt(e.target.value) })
                                  }
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div className="flex items-end">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={editForm.is_active ?? true}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, is_active: e.target.checked })
                                    }
                                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                  />
                                  <span className="text-sm font-medium text-slate-700">Active</span>
                                </label>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Start Date *
                                </label>
                                <input
                                  type="date"
                                  value={editForm.start_date || ''}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, start_date: e.target.value })
                                  }
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  End Date *
                                </label>
                                <input
                                  type="date"
                                  value={editForm.end_date || ''}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, end_date: e.target.value })
                                  }
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Leader Comments
                              </label>
                              <textarea
                                value={editForm.leader_comments || ''}
                                onChange={(e) => setEditForm({ ...editForm, leader_comments: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Add comments about this growth area..."
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                onClick={handleCancelEdit}
                                className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:bg-white border border-slate-300 rounded-lg text-sm transition"
                              >
                                <X className="w-4 h-4" />
                                <span>Cancel</span>
                              </button>
                              <button
                                onClick={handleSaveEdit}
                                className="flex items-center gap-1 px-3 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition"
                              >
                                <Save className="w-4 h-4" />
                                <span>Save Changes</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {ga.team_member_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          <div>
                            <div className="font-medium">{ga.skill_name}</div>
                            <div className="text-xs text-slate-500">{ga.level_name}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{ga.quarter}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <TrendingUp
                              className={`w-4 h-4 ${
                                ga.rating >= 4
                                  ? 'text-green-600'
                                  : ga.rating >= 3
                                  ? 'text-blue-600'
                                  : 'text-amber-600'
                              }`}
                            />
                            <span className="text-sm font-medium text-slate-900">{ga.rating}/5</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              ga.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {ga.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(ga)}
                              className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                            >
                              <Pencil className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(ga.id)}
                              className="flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <div>
          Showing {filteredGrowthAreas.length} of {growthAreas.length} growth areas
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 rounded-full"></div>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-100 rounded-full"></div>
            <span>Inactive</span>
          </div>
        </div>
      </div>
    </div>
  );
}
