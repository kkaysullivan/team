import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, TrendingUp, Calendar, Star } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  skill_levels?: {
    maturity_skills?: {
      name: string;
    };
    levels?: {
      name: string;
    };
  };
  category_name?: string;
}

interface Skill {
  id: string;
  name: string;
  level_name: string;
  display_order: number;
  category_name: string;
}

interface GrowthAreasProps {
  teamMemberId: string;
}

const ratingLabels = {
  1: 'Needs guidance and substantial improvement',
  2: 'Self-sufficient, but needs overall improvement',
  3: 'Meeting expectations',
  4: 'Exceeding expectations',
  5: 'Greatly exceeding expectations',
};

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline',
  'list', 'bullet'
];

export default function GrowthAreas({ teamMemberId }: GrowthAreasProps) {
  const [growthAreas, setGrowthAreas] = useState<GrowthArea[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsByCategory, setSkillsByCategory] = useState<{ [key: string]: Skill[] }>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const [formData, setFormData] = useState({
    skill_id: '',
    quarter: getCurrentQuarter(),
    rating: 3,
    leader_comments: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: getQuarterEndDate(),
    is_active: true,
  });

  function getCurrentQuarter() {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return `Q${quarter} ${now.getFullYear()}`;
  }

  function getQuarterEndDate() {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const endMonth = (quarter + 1) * 3;
    const endDate = new Date(now.getFullYear(), endMonth, 0);
    return endDate.toISOString().split('T')[0];
  }

  useEffect(() => {
    fetchGrowthAreas();
    fetchSkills();
  }, [teamMemberId]);

  const fetchGrowthAreas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('growth_areas')
      .select(`
        *,
        skill_levels!inner (
          maturity_skills!inner (
            id,
            name
          ),
          levels!inner (
            name
          )
        )
      `)
      .eq('team_member_id', teamMemberId)
      .order('is_active', { ascending: false })
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching growth areas:', error);
    } else {
      const areasWithCategories = await Promise.all(
        (data || []).map(async (area) => {
          const skillId = (area.skill_levels as any)?.maturity_skills?.id;
          if (skillId) {
            const { data: categoryData } = await supabase
              .from('category_skills')
              .select('maturity_categories(name)')
              .eq('skill_id', skillId)
              .maybeSingle();

            return {
              ...area,
              category_name: (categoryData?.maturity_categories as any)?.name || 'Uncategorized'
            };
          }
          return { ...area, category_name: 'Uncategorized' };
        })
      );
      setGrowthAreas(areasWithCategories);
    }
    setLoading(false);
  };

  const fetchSkills = async () => {
    const { data: teamMember, error: tmError } = await supabase
      .from('team_members')
      .select('current_level')
      .eq('id', teamMemberId)
      .maybeSingle();

    if (tmError) {
      console.error('Error fetching team member:', tmError);
      return;
    }

    if (!teamMember?.current_level) {
      console.warn('Team member has no current level set');
      setSkills([]);
      return;
    }

    const levelOrder: { [key: string]: number } = {
      'Associate': 1,
      'Level 1': 2,
      'Level 2': 3,
      'Senior': 4,
      'Lead': 5
    };

    const currentLevelOrder = levelOrder[teamMember.current_level] || 0;

    const { data: skillsData, error: skillsError } = await supabase
      .from('skill_levels')
      .select(`
        id,
        display_order,
        maturity_skills!inner (
          id,
          name
        ),
        levels!inner (
          name
        )
      `)
      .order('display_order');

    if (skillsError) {
      console.error('Error fetching skills:', skillsError);
      return;
    }

    const filteredSkillsData = (skillsData || []).filter((sl: any) => {
      const skillLevelOrder = levelOrder[sl.levels.name] || 0;
      return skillLevelOrder <= currentLevelOrder;
    });

    const skillsWithCategories = await Promise.all(
      filteredSkillsData.map(async (sl: any) => {
        const { data: categoryData } = await supabase
          .from('category_skills')
          .select('maturity_categories(name)')
          .eq('skill_id', sl.maturity_skills.id)
          .maybeSingle();

        return {
          id: sl.id,
          name: sl.maturity_skills.name,
          level_name: sl.levels.name,
          display_order: sl.display_order,
          category_name: (categoryData?.maturity_categories as any)?.name || 'Uncategorized'
        };
      })
    );

    setSkills(skillsWithCategories);

    const grouped = skillsWithCategories.reduce((acc: { [key: string]: Skill[] }, skill) => {
      const category = skill.category_name;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    }, {});

    setSkillsByCategory(grouped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const activeCount = growthAreas.filter(ga => ga.is_active).length;
    if (formData.is_active && !editingId && activeCount >= 3) {
      alert('A team member can have a maximum of 3 active growth areas. Please mark an existing one as inactive first.');
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from('growth_areas')
        .update(formData)
        .eq('id', editingId);

      if (error) {
        console.error('Error updating growth area:', error);
        alert('Failed to update growth area');
      } else {
        setShowForm(false);
        setEditingId(null);
        resetForm();
        fetchGrowthAreas();
      }
    } else {
      const { error } = await supabase
        .from('growth_areas')
        .insert([{ ...formData, team_member_id: teamMemberId }]);

      if (error) {
        console.error('Error creating growth area:', error);
        alert('Failed to create growth area');
      } else {
        setShowForm(false);
        resetForm();
        fetchGrowthAreas();
      }
    }
  };

  const handleEdit = (growthArea: GrowthArea) => {
    setEditingId(growthArea.id);
    setFormData({
      skill_id: growthArea.skill_id,
      quarter: growthArea.quarter,
      rating: growthArea.rating,
      leader_comments: growthArea.leader_comments,
      start_date: growthArea.start_date,
      end_date: growthArea.end_date,
      is_active: growthArea.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this growth area?')) return;

    const { error } = await supabase
      .from('growth_areas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting growth area:', error);
      alert('Failed to delete growth area');
    } else {
      fetchGrowthAreas();
    }
  };

  const resetForm = () => {
    setFormData({
      skill_id: '',
      quarter: getCurrentQuarter(),
      rating: 3,
      leader_comments: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: getQuarterEndDate(),
      is_active: true,
    });
  };

  const activeGrowthAreas = growthAreas.filter(ga => ga.is_active);
  const inactiveGrowthAreas = growthAreas.filter(ga => !ga.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-blue-600" />
            Growth Areas
          </h2>
          <p className="text-slate-600 mt-1">
            Track up to 3 active skills at or below the team member's current level
          </p>
        </div>
        {activeGrowthAreas.length < 3 && !showForm && (
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              resetForm();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Add Growth Area
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border-2 border-blue-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingId ? 'Edit Growth Area' : 'New Growth Area'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Skill to Improve *
                </label>
                <select
                  required
                  value={formData.skill_id}
                  onChange={(e) => setFormData({ ...formData, skill_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a skill</option>
                  {Object.keys(skillsByCategory).sort().map((categoryName) => (
                    <optgroup key={categoryName} label={categoryName}>
                      {skillsByCategory[categoryName].map((skill) => (
                        <option key={skill.id} value={skill.id}>
                          {skill.name} ({skill.level_name})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Quarter *
                </label>
                <input
                  type="text"
                  required
                  value={formData.quarter}
                  onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
                  placeholder="Q1 2024"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rating *
              </label>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      value={rating}
                      checked={formData.rating === rating}
                      onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">
                      <strong>{rating}</strong> - {ratingLabels[rating as keyof typeof ratingLabels]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Leader Comments
              </label>
              <ReactQuill
                theme="snow"
                value={formData.leader_comments}
                onChange={(value) => setFormData({ ...formData, leader_comments: value })}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Add notes about progress, challenges, or action items..."
                className="bg-white rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                Active Growth Area
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingId ? 'Update' : 'Create'} Growth Area
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Active Growth Areas ({activeGrowthAreas.length}/3)
        </h3>

        {activeGrowthAreas.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
            <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">No active growth areas yet</p>
            <p className="text-sm text-slate-500 mt-1">Add up to 3 growth areas to help focus development</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeGrowthAreas.map((area) => (
              <div
                key={area.id}
                className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900 text-lg">
                        {(area.skill_levels as any)?.maturity_skills?.name}
                      </h4>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {(area.skill_levels as any)?.levels?.name}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {area.category_name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(area)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(area.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Quarter</p>
                    <p className="text-sm font-medium text-slate-900">{area.quarter}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Rating</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-slate-900">{area.rating}/5</span>
                      <span className="text-xs text-slate-500 ml-1">
                        - {ratingLabels[area.rating as keyof typeof ratingLabels].split(' - ')[0]}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Timeline</p>
                    <p className="text-sm text-slate-700">
                      {new Date(area.start_date).toLocaleDateString()} - {new Date(area.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {area.leader_comments && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs text-slate-500 mb-2">Leader Comments</p>
                    <div
                      className="text-sm text-slate-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: area.leader_comments }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {inactiveGrowthAreas.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
          >
            <Calendar className="w-5 h-5" />
            {showHistory ? 'Hide' : 'Show'} History ({inactiveGrowthAreas.length})
          </button>

          {showHistory && (
            <div className="grid gap-3">
              {inactiveGrowthAreas.map((area) => (
                <div
                  key={area.id}
                  className="bg-slate-50 rounded-lg border border-slate-200 p-4 opacity-75"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-slate-900">
                          {(area.skill_levels as any)?.maturity_skills?.name}
                        </h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {(area.skill_levels as any)?.levels?.name}
                        </span>
                        <span className="px-2 py-1 bg-slate-200 text-slate-600 text-xs font-medium rounded">
                          Inactive
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        {area.category_name}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(area.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Quarter:</span> <span className="text-slate-700">{area.quarter}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Rating:</span> <span className="text-slate-700">{area.rating}/5</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Period:</span> <span className="text-slate-700">
                        {new Date(area.start_date).toLocaleDateString()} - {new Date(area.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {area.leader_comments && (
                    <div className="mt-2 pt-2 border-t border-slate-300">
                      <p className="text-xs text-slate-500 mb-2">Leader Comments</p>
                      <div
                        className="text-sm text-slate-600 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: area.leader_comments }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
