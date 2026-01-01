import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface Preference {
  id: string;
  team_member_id: string;
  category: string;
  value: string;
  icon: string | null;
  display_order: number;
}

interface PreferenceType {
  id: string;
  name: string;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

interface PreferencesProps {
  teamMemberId: string;
}

export default function Preferences({ teamMemberId }: PreferencesProps) {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [preferenceTypes, setPreferenceTypes] = useState<PreferenceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    fetchData();
  }, [teamMemberId]);

  const fetchData = async () => {
    setLoading(true);
    const [preferencesResult, typesResult] = await Promise.all([
      supabase
        .from('team_member_preferences')
        .select('*')
        .eq('team_member_id', teamMemberId)
        .order('display_order', { ascending: true }),
      supabase
        .from('preference_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
    ]);

    if (preferencesResult.error) {
      console.error('Error fetching preferences:', preferencesResult.error);
    } else {
      setPreferences(preferencesResult.data || []);
    }

    if (typesResult.error) {
      console.error('Error fetching preference types:', typesResult.error);
    } else {
      setPreferenceTypes(typesResult.data || []);
    }
    setLoading(false);
  };

  const handleAdd = async (category: string, icon: string, color: string) => {
    const { error } = await supabase
      .from('team_member_preferences')
      .insert({
        team_member_id: teamMemberId,
        category,
        icon,
        value: '',
        display_order: preferences.length,
      });

    if (error) {
      console.error('Error adding preference:', error);
    } else {
      fetchData();
      setShowAddMenu(false);
    }
  };

  const handleEdit = (preference: Preference) => {
    setEditingId(preference.id);
    setEditValue(preference.value);
  };

  const handleSave = async (id: string) => {
    const { error } = await supabase
      .from('team_member_preferences')
      .update({ value: editValue, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating preference:', error);
    } else {
      setEditingId(null);
      setEditValue('');
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this preference?')) return;

    const { error } = await supabase
      .from('team_member_preferences')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting preference:', error);
    } else {
      fetchData();
    }
  };

  const getCategoryConfig = (category: string) => {
    return preferenceTypes.find(c => c.name === category) ||
      { name: category, icon: '📝', color: 'from-slate-50 to-gray-50 border-slate-200', display_order: 0, is_active: true, id: '' };
  };

  const availableCategories = preferenceTypes.filter(
    dc => !preferences.some(p => p.category === dc.name)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-900">Preferences</h3>
        {availableCategories.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Preference
            </button>

            {showAddMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowAddMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-20 max-h-96 overflow-y-auto">
                  {availableCategories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => handleAdd(category.name, category.icon, category.color)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 transition flex items-center gap-3 border-b border-slate-100 last:border-b-0"
                    >
                      <span className="text-2xl">{category.icon}</span>
                      <span className="text-slate-700 font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {preferences.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-slate-500 mb-4">No preferences added yet</p>
          <button
            onClick={() => setShowAddMenu(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Add your first preference
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {preferences.map((preference) => {
            const config = getCategoryConfig(preference.category);
            const isEditing = editingId === preference.id;

            return (
              <div
                key={preference.id}
                className={`bg-gradient-to-br ${config.color} rounded-xl border-2 p-5 shadow-sm hover:shadow-md transition-all`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{preference.icon || config.icon}</span>
                    <h4 className="font-semibold text-slate-900">{preference.category}</h4>
                  </div>
                  {!isEditing && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(preference)}
                        className="p-1.5 hover:bg-white/50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(preference.id)}
                        className="p-1.5 hover:bg-white/50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter value..."
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(preference.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditValue('');
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition text-sm"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-700 text-lg font-medium">
                    {preference.value || (
                      <span className="text-slate-400 italic">Not set</span>
                    )}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
