import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  maturity_model_id: string | null;
  maturity_model_name?: string;
  created_at: string;
}

interface MaturityModel {
  id: string;
  name: string;
}

export default function AdminRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [models, setModels] = useState<MaturityModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', maturityModelId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [rolesResult, modelsResult] = await Promise.all([
      supabase.from('roles').select('*').order('name'),
      supabase.from('maturity_models').select('*').order('name'),
    ]);

    if (rolesResult.data && modelsResult.data) {
      const enriched = rolesResult.data.map((role) => ({
        ...role,
        maturity_model_name: modelsResult.data.find((m) => m.id === role.maturity_model_id)?.name,
      }));
      setRoles(enriched);
    }
    if (modelsResult.data) setModels(modelsResult.data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) return;

    const { error } = await supabase.from('roles').insert({
      name: formData.name,
      description: formData.description,
      maturity_model_id: formData.maturityModelId || null,
    });

    if (!error) {
      setFormData({ name: '', description: '', maturityModelId: '' });
      setIsAdding(false);
      await fetchData();
    }
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('roles')
      .update({
        name: formData.name,
        description: formData.description,
        maturity_model_id: formData.maturityModelId || null,
      })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      setFormData({ name: '', description: '', maturityModelId: '' });
      await fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    const { error } = await supabase.from('roles').delete().eq('id', id);

    if (error) {
      alert(`Failed to delete role: ${error.message}`);
    } else {
      await fetchData();
    }
  };

  const startEdit = (role: Role) => {
    setEditingId(role.id);
    setFormData({
      name: role.name,
      description: role.description,
      maturityModelId: role.maturity_model_id || '',
    });
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: '', description: '', maturityModelId: '' });
  };

  if (loading) {
    return <div className="text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Roles</h3>
          <p className="text-sm text-slate-600">
            Manage roles and assign maturity models
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Role
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
                placeholder="e.g., Product Designer"
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Maturity Model
              </label>
              <select
                value={formData.maturityModelId}
                onChange={(e) => setFormData({ ...formData, maturityModelId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">None</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
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
        {roles.map((role) => (
          <div
            key={role.id}
            className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
          >
            {editingId === role.id ? (
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Maturity Model
                  </label>
                  <select
                    value={formData.maturityModelId}
                    onChange={(e) => setFormData({ ...formData, maturityModelId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">None</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(role.id)}
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
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">{role.name}</h4>
                  {role.description && (
                    <p className="text-sm text-slate-600 mt-1">{role.description}</p>
                  )}
                  {role.maturity_model_name && (
                    <p className="text-sm text-blue-600 mt-1">
                      Model: {role.maturity_model_name}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(role)}
                    className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
