import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface Level {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export default function AdminLevels() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    setLoading(true);
    const { data } = await supabase.from('levels').select('*').order('created_at');
    if (data) setLevels(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) return;

    const { error } = await supabase.from('levels').insert({
      name: formData.name,
      description: formData.description,
    });

    if (!error) {
      setFormData({ name: '', description: '' });
      setIsAdding(false);
      await fetchLevels();
    }
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('levels')
      .update({
        name: formData.name,
        description: formData.description,
      })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      setFormData({ name: '', description: '' });
      await fetchLevels();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this level?')) return;

    const { error } = await supabase.from('levels').delete().eq('id', id);

    if (error) {
      alert(`Failed to delete level: ${error.message}`);
    } else {
      await fetchLevels();
    }
  };

  const startEdit = (level: Level) => {
    setEditingId(level.id);
    setFormData({ name: level.name, description: level.description });
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: '', description: '' });
  };

  if (loading) {
    return <div className="text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Levels</h3>
          <p className="text-sm text-slate-600">Manage global level definitions</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Level
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
                placeholder="e.g., Senior"
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

      <div className="space-y-2">
        {levels.map((level) => (
          <div
            key={level.id}
            className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
          >
            {editingId === level.id ? (
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
                    onClick={() => handleUpdate(level.id)}
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
                  <h4 className="font-semibold text-slate-900">{level.name}</h4>
                  {level.description && (
                    <p className="text-sm text-slate-600 mt-1">{level.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(level)}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(level.id)}
                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
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
