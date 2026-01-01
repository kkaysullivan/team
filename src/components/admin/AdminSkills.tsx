import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Save, X, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  description: string;
  display_order: number;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

interface SkillWithDetails extends Skill {
  categories: string[];
}

type SortField = 'name' | 'categories';
type SortDirection = 'asc' | 'desc' | null;

export default function AdminSkills() {
  const [skills, setSkills] = useState<SkillWithDetails[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [
      { data: skillsData },
      { data: categoriesData },
      { data: categorySkillsData }
    ] = await Promise.all([
      supabase.from('maturity_skills').select('*').order('name'),
      supabase.from('maturity_categories').select('id, name').order('name'),
      supabase.from('category_skills').select('skill_id, category_id, category:maturity_categories(name)')
    ]);

    if (categoriesData) setAllCategories(categoriesData);

    if (skillsData) {
      const skillsWithDetails = skillsData.map(skill => {
        const skillCategories = categorySkillsData
          ?.filter(cs => cs.skill_id === skill.id)
          .map(cs => (cs.category as any)?.name)
          .filter(Boolean) || [];

        return {
          ...skill,
          categories: skillCategories
        };
      });
      setSkills(skillsWithDetails);
    }

    setLoading(false);
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) return;

    const maxOrder = skills.length > 0
      ? Math.max(...skills.map((s) => s.display_order), 0)
      : 0;

    const { error } = await supabase.from('maturity_skills').insert({
      name: formData.name,
      description: formData.description,
      display_order: maxOrder + 1,
    });

    if (!error) {
      setFormData({ name: '', description: '' });
      setIsAdding(false);
      await fetchData();
    }
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('maturity_skills')
      .update({
        name: formData.name,
        description: formData.description,
      })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      setFormData({ name: '', description: '' });
      await fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    const { error } = await supabase.from('maturity_skills').delete().eq('id', id);

    if (error) {
      alert(`Failed to delete skill: ${error.message}`);
    } else {
      await fetchData();
    }
  };

  const startEdit = (skill: SkillWithDetails) => {
    setEditingId(skill.id);
    setFormData({ name: skill.name, description: skill.description });
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: '', description: '' });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4" />;
    }
    return <ArrowDown className="w-4 h-4" />;
  };

  const filteredAndSortedSkills = skills
    .filter(skill => {
      const matchesSearch = !searchTerm ||
        skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !filterCategory ||
        skill.categories.includes(filterCategory);

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (!sortField || !sortDirection) return 0;

      let compareValue = 0;

      if (sortField === 'name') {
        compareValue = a.name.localeCompare(b.name);
      } else if (sortField === 'categories') {
        const aCategories = a.categories.join(', ');
        const bCategories = b.categories.join(', ');
        compareValue = aCategories.localeCompare(bCategories);
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

  if (loading) {
    return <div className="text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Skills</h3>
          <p className="text-sm text-slate-600">
            Manage skills and view their category assignments
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Skill
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search skills..."
            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          {allCategories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
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
                placeholder="e.g., Working efficiently"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

      {editingId && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
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
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdate(editingId)}
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

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  Skill Name
                  {getSortIcon('name')}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('categories')}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  Categories
                  {getSortIcon('categories')}
                </button>
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredAndSortedSkills.map((skill) => (
              <tr key={skill.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{skill.name}</div>
                  {skill.description && (
                    <div className="text-sm text-slate-600 mt-1">{skill.description}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {skill.categories.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skill.categories.map((category, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400 italic">None</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => startEdit(skill)}
                      className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(skill.id)}
                      className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAndSortedSkills.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  {skills.length === 0
                    ? "No skills found. Add your first skill to get started."
                    : "No skills match your search criteria."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
