import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';

interface MaturityModel {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface ModelCategory {
  id: string;
  maturity_model_id: string;
  category_id: string;
  display_order: number;
  category_name?: string;
  category_description?: string;
  skill_count?: number;
}

interface CategorySkill {
  category_id: string;
  skill_id: string;
  skill_name: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  maturity_model_id: string;
}

export default function AdminMaturityModels() {
  const [models, setModels] = useState<MaturityModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modelCategories, setModelCategories] = useState<ModelCategory[]>([]);
  const [categorySkills, setCategorySkills] = useState<CategorySkill[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ role_id: '', description: '' });
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [addingRoleForModel, setAddingRoleForModel] = useState<string | null>(null);
  const [roleFormData, setRoleFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [modelsResult, categoriesResult, modelCategoriesResult, categorySkillsResult, skillsResult, rolesResult] = await Promise.all([
      supabase.from('maturity_models').select('*').order('name'),
      supabase.from('maturity_categories').select('*').order('name'),
      supabase.from('maturity_model_categories').select('*').order('display_order'),
      supabase.from('category_skills').select('category_id, skill_id'),
      supabase.from('maturity_skills').select('id, name'),
      supabase.from('roles').select('*').order('name'),
    ]);

    if (modelsResult.data) setModels(modelsResult.data);
    if (categoriesResult.data) setCategories(categoriesResult.data);
    if (rolesResult.data) setRoles(rolesResult.data);

    if (modelCategoriesResult.data && categoriesResult.data && categorySkillsResult.data) {
      const enriched = modelCategoriesResult.data.map((mc) => {
        const category = categoriesResult.data.find((c) => c.id === mc.category_id);
        const skillCount = categorySkillsResult.data.filter((cs) => cs.category_id === mc.category_id).length;
        return {
          ...mc,
          category_name: category?.name,
          category_description: category?.description,
          skill_count: skillCount,
        };
      });
      setModelCategories(enriched);
    }

    if (categorySkillsResult.data && skillsResult.data) {
      const enriched = categorySkillsResult.data.map((cs) => ({
        ...cs,
        skill_name: skillsResult.data.find((s) => s.id === cs.skill_id)?.name || '',
      }));
      setCategorySkills(enriched);
    }

    setLoading(false);
  };

  const handleAdd = async () => {
    if (!formData.role_id) return;

    const role = roles.find((r) => r.id === formData.role_id);
    if (!role) return;

    const { data: newModel, error: modelError } = await supabase
      .from('maturity_models')
      .insert({
        name: `${role.name} Maturity Model`,
        description: formData.description,
      })
      .select()
      .single();

    if (modelError) {
      alert(`Failed to create maturity model: ${modelError.message}`);
      return;
    }

    const { error: roleError } = await supabase
      .from('roles')
      .update({ maturity_model_id: newModel.id })
      .eq('id', formData.role_id);

    if (roleError) {
      alert(`Failed to assign model to role: ${roleError.message}`);
      return;
    }

    setFormData({ role_id: '', description: '' });
    setIsAdding(false);
    await fetchData();
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('maturity_models')
      .update({
        description: formData.description,
      })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      setFormData({ role_id: '', description: '' });
      await fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maturity model?')) return;

    const { error } = await supabase.from('maturity_models').delete().eq('id', id);

    if (error) {
      alert(`Failed to delete maturity model: ${error.message}`);
    } else {
      await fetchData();
    }
  };

  const handleAddCategory = async (modelId: string) => {
    if (!selectedCategoryId) return;

    const existingCount = modelCategories.filter((mc) => mc.maturity_model_id === modelId).length;

    const { error } = await supabase.from('maturity_model_categories').insert({
      maturity_model_id: modelId,
      category_id: selectedCategoryId,
      display_order: existingCount + 1,
    });

    if (!error) {
      setSelectedCategoryId('');
      await fetchData();
    }
  };

  const handleRemoveCategory = async (id: string) => {
    if (!confirm('Remove this category from the model?')) return;

    const { error } = await supabase.from('maturity_model_categories').delete().eq('id', id);

    if (!error) {
      await fetchData();
    }
  };

  const handleMoveCategory = async (
    modelId: string,
    currentOrder: number,
    direction: 'up' | 'down'
  ) => {
    const modelCategoriesForModel = modelCategories
      .filter((mc) => mc.maturity_model_id === modelId)
      .sort((a, b) => a.display_order - b.display_order);

    const currentIndex = modelCategoriesForModel.findIndex(
      (mc) => mc.display_order === currentOrder
    );
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= modelCategoriesForModel.length) return;

    const current = modelCategoriesForModel[currentIndex];
    const target = modelCategoriesForModel[targetIndex];

    await Promise.all([
      supabase
        .from('maturity_model_categories')
        .update({ display_order: target.display_order })
        .eq('id', current.id),
      supabase
        .from('maturity_model_categories')
        .update({ display_order: current.display_order })
        .eq('id', target.id),
    ]);

    await fetchData();
  };

  const startEdit = (model: MaturityModel) => {
    setEditingId(model.id);
    setFormData({ role_id: '', description: model.description });
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ role_id: '', description: '' });
  };

  const getModelCategories = (modelId: string) => {
    return modelCategories
      .filter((mc) => mc.maturity_model_id === modelId)
      .sort((a, b) => a.display_order - b.display_order);
  };

  const getAvailableCategories = (modelId: string) => {
    const usedCategoryIds = modelCategories
      .filter((mc) => mc.maturity_model_id === modelId)
      .map((mc) => mc.category_id);
    return categories.filter((c) => !usedCategoryIds.includes(c.id));
  };

  const getCategorySkills = (categoryId: string) => {
    return categorySkills.filter((cs) => cs.category_id === categoryId);
  };

  const getModelRoles = (modelId: string) => {
    return roles.filter((r) => r.maturity_model_id === modelId);
  };

  const getAvailableRoles = () => {
    return roles.filter((r) => !r.maturity_model_id);
  };

  const handleAddRole = async (modelId: string) => {
    if (!roleFormData.name.trim()) return;

    const { error } = await supabase.from('roles').insert({
      name: roleFormData.name,
      description: roleFormData.description,
      maturity_model_id: modelId,
    });

    if (!error) {
      setRoleFormData({ name: '', description: '' });
      setAddingRoleForModel(null);
      await fetchData();
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    const { error } = await supabase.from('roles').delete().eq('id', roleId);

    if (error) {
      alert(`Failed to delete role: ${error.message}`);
    } else {
      await fetchData();
    }
  };

  if (loading) {
    return <div className="text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Maturity Models</h3>
          <p className="text-sm text-slate-600">
            Manage maturity models and assign categories
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Model
        </button>
      </div>

      {isAdding && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a role</option>
                {getAvailableRoles().map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-slate-500 mt-1">
                Select a role to create a maturity model for
              </p>
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
                disabled={!formData.role_id}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Create Model
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
        {models.map((model) => {
          const isExpanded = expandedModel === model.id;
          const modelCategoriesForModel = getModelCategories(model.id);
          const availableCategories = getAvailableCategories(model.id);

          return (
            <div key={model.id} className="border border-slate-200 rounded-lg">
              {editingId === model.id ? (
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Model Name</label>
                    <input
                      type="text"
                      value={model.name}
                      disabled
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Model name is derived from the assigned role
                    </p>
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
                      onClick={() => handleUpdate(model.id)}
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
                <>
                  <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <button
                      onClick={() => setExpandedModel(isExpanded ? null : model.id)}
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 transition-transform ${
                          isExpanded ? 'transform rotate-180' : ''
                        }`}
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{model.name}</h4>
                        {model.description && (
                          <p className="text-sm text-slate-600 mt-1">{model.description}</p>
                        )}
                        <p className="text-sm text-slate-600 mt-1">
                          {modelCategoriesForModel.length} categor
                          {modelCategoriesForModel.length !== 1 ? 'ies' : 'y'}
                        </p>
                      </div>
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(model)}
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(model.id)}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-6">
                      <div>
                        <h5 className="font-medium text-slate-900 mb-3">Roles</h5>
                        {getModelRoles(model.id).length > 0 ? (
                          <div className="space-y-2">
                            {getModelRoles(model.id).map((role) => (
                              <div
                                key={role.id}
                                className="p-3 bg-white rounded-lg border border-slate-200 flex items-start justify-between"
                              >
                                <div>
                                  <div className="font-medium text-slate-900">{role.name}</div>
                                  {role.description && (
                                    <div className="text-sm text-slate-600 mt-1">
                                      {role.description}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDeleteRole(role.id)}
                                  className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600">No roles assigned to this model yet</p>
                        )}

                        {addingRoleForModel === model.id ? (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Role Name
                              </label>
                              <input
                                type="text"
                                value={roleFormData.name}
                                onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Product Designer"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Description
                              </label>
                              <textarea
                                value={roleFormData.description}
                                onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Optional description"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAddRole(model.id)}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                              >
                                <Plus className="w-4 h-4" />
                                Add Role
                              </button>
                              <button
                                onClick={() => {
                                  setAddingRoleForModel(null);
                                  setRoleFormData({ name: '', description: '' });
                                }}
                                className="flex items-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingRoleForModel(model.id)}
                            className="mt-3 flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Role
                          </button>
                        )}
                      </div>

                      <div className="border-t border-slate-200 pt-3">
                        <h5 className="font-medium text-slate-900 mb-3">Categories</h5>

                      {modelCategoriesForModel.map((mc, index) => {
                        const skills = getCategorySkills(mc.category_id);
                        return (
                          <div
                            key={mc.id}
                            className="p-4 bg-white rounded-lg border border-slate-200"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() =>
                                    handleMoveCategory(model.id, mc.display_order, 'up')
                                  }
                                  disabled={index === 0}
                                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleMoveCategory(model.id, mc.display_order, 'down')
                                  }
                                  disabled={index === modelCategoriesForModel.length - 1}
                                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-slate-900">
                                  {mc.category_name}
                                </div>
                                {mc.category_description && (
                                  <div className="text-sm text-slate-600 mt-1">
                                    {mc.category_description}
                                  </div>
                                )}
                                <div className="text-sm text-slate-500 mt-2">
                                  {skills.length} skill{skills.length !== 1 ? 's' : ''}
                                  {skills.length > 0 && (
                                    <span className="ml-2">
                                      ({skills.map((s) => s.skill_name).join(', ')})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveCategory(mc.id)}
                                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {availableCategories.length > 0 && (
                        <div className="border-t border-slate-200 pt-3 space-y-2">
                          <h6 className="text-sm font-medium text-slate-700">Add Category</h6>
                          <div className="flex gap-2">
                            <select
                              value={selectedCategoryId}
                              onChange={(e) => setSelectedCategoryId(e.target.value)}
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select a category to add</option>
                              {availableCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAddCategory(model.id)}
                              disabled={!selectedCategoryId}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
