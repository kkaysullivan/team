import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface Skill {
  id: string;
  name: string;
  description: string;
}

interface CategorySkill {
  skill_id: string;
  display_order: number;
  skill: Skill;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [categorySkills, setCategorySkills] = useState<Record<string, CategorySkill[]>>({});
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [addingSkillTo, setAddingSkillTo] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchAllSkills();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase.from('maturity_categories').select('*').order('name');
    if (data) setCategories(data);
    setLoading(false);
  };

  const fetchAllSkills = async () => {
    const { data } = await supabase
      .from('maturity_skills')
      .select('*')
      .order('name');
    if (data) setAllSkills(data);
  };

  const fetchCategorySkills = async (categoryId: string) => {
    const { data } = await supabase
      .from('category_skills')
      .select(`
        skill_id,
        display_order,
        skill:maturity_skills(id, name, description)
      `)
      .eq('category_id', categoryId)
      .order('display_order');

    if (data) {
      setCategorySkills(prev => ({
        ...prev,
        [categoryId]: data as any
      }));
    }
  };

  const toggleCategory = async (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
      if (!categorySkills[categoryId]) {
        await fetchCategorySkills(categoryId);
      }
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) return;

    const { error } = await supabase.from('maturity_categories').insert({
      name: formData.name,
      description: formData.description,
    });

    if (!error) {
      setFormData({ name: '', description: '' });
      setIsAdding(false);
      await fetchCategories();
    }
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('maturity_categories')
      .update({
        name: formData.name,
        description: formData.description,
      })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      setFormData({ name: '', description: '' });
      await fetchCategories();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    const { error } = await supabase.from('maturity_categories').delete().eq('id', id);

    if (error) {
      alert(`Failed to delete category: ${error.message}`);
    } else {
      await fetchCategories();
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({ name: category.name, description: category.description });
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: '', description: '' });
  };

  const handleAddSkill = async (categoryId: string, skillId: string) => {
    const skills = categorySkills[categoryId] || [];
    const maxOrder = skills.length > 0
      ? Math.max(...skills.map(s => s.display_order))
      : 0;

    const { error } = await supabase
      .from('category_skills')
      .insert({
        category_id: categoryId,
        skill_id: skillId,
        display_order: maxOrder + 1
      });

    if (!error) {
      setAddingSkillTo(null);
      await fetchCategorySkills(categoryId);
    }
  };

  const handleRemoveSkill = async (categoryId: string, skillId: string) => {
    if (!confirm('Remove this skill from the category?')) return;

    const { error } = await supabase
      .from('category_skills')
      .delete()
      .eq('category_id', categoryId)
      .eq('skill_id', skillId);

    if (!error) {
      await fetchCategorySkills(categoryId);
    }
  };

  const handleMoveSkill = async (categoryId: string, skillId: string, direction: 'up' | 'down') => {
    const skills = [...(categorySkills[categoryId] || [])];
    const index = skills.findIndex(s => s.skill_id === skillId);

    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === skills.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [skills[index], skills[targetIndex]] = [skills[targetIndex], skills[index]];

    const updates = skills.map((skill, idx) =>
      supabase
        .from('category_skills')
        .update({ display_order: idx + 1 })
        .eq('category_id', categoryId)
        .eq('skill_id', skill.skill_id)
    );

    await Promise.all(updates);
    await fetchCategorySkills(categoryId);
  };

  const getAvailableSkills = (categoryId: string) => {
    const usedSkillIds = (categorySkills[categoryId] || []).map(cs => cs.skill_id);
    return allSkills.filter(skill => !usedSkillIds.includes(skill.id));
  };

  if (loading) {
    return <div className="text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Categories</h3>
          <p className="text-sm text-slate-600">
            Manage categories that group related skills
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {isAdding && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Technical Skills"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional description"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {categories.map((category) => (
          <div
            key={category.id}
            className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
          >
            {editingId === category.id ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(category.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                      >
                        {expandedCategory === category.id ? (
                          <ChevronUp className="w-4 h-4 text-slate-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                      <div>
                        <h4 className="font-semibold text-slate-900">{category.name}</h4>
                        {category.description && (
                          <p className="text-sm text-slate-600 mt-1">{category.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(category)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedCategory === category.id && (
                  <div className="mt-4 pl-8 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-slate-700">Skills</h5>
                      <button
                        onClick={() => setAddingSkillTo(category.id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add Skill
                      </button>
                    </div>

                    {addingSkillTo === category.id && (
                      <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Select a skill to add
                        </label>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddSkill(category.id, e.target.value);
                            }
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          defaultValue=""
                        >
                          <option value="">-- Select a skill --</option>
                          {getAvailableSkills(category.id).map(skill => (
                            <option key={skill.id} value={skill.id}>
                              {skill.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setAddingSkillTo(null)}
                          className="mt-2 text-sm text-slate-600 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {(categorySkills[category.id] || []).map((cs, index) => (
                        <div
                          key={cs.skill_id}
                          className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg"
                        >
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleMoveSkill(category.id, cs.skill_id, 'up')}
                              disabled={index === 0}
                              className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleMoveSkill(category.id, cs.skill_id, 'down')}
                              disabled={index === (categorySkills[category.id] || []).length - 1}
                              className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{cs.skill.name}</div>
                            {cs.skill.description && (
                              <div className="text-sm text-slate-600 mt-1">{cs.skill.description}</div>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveSkill(category.id, cs.skill_id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(!categorySkills[category.id] || categorySkills[category.id].length === 0) && (
                        <p className="text-sm text-slate-500 italic">No skills added yet</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
