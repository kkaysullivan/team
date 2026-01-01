import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Save, X, Palette } from 'lucide-react';

interface PreferenceType {
  id: string;
  name: string;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

interface AssessmentType {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

const colorOptions = [
  { label: 'Amber/Orange', value: 'from-amber-50 to-orange-50 border-amber-200' },
  { label: 'Pink/Rose', value: 'from-pink-50 to-rose-50 border-pink-200' },
  { label: 'Red/Orange', value: 'from-red-50 to-orange-50 border-red-200' },
  { label: 'Blue/Sky', value: 'from-blue-50 to-sky-50 border-blue-200' },
  { label: 'Cyan/Sky', value: 'from-cyan-50 to-sky-50 border-cyan-200' },
  { label: 'Green/Emerald', value: 'from-green-50 to-emerald-50 border-green-200' },
  { label: 'Fuchsia/Pink', value: 'from-fuchsia-50 to-pink-50 border-fuchsia-200' },
  { label: 'Teal/Cyan', value: 'from-teal-50 to-cyan-50 border-teal-200' },
  { label: 'Slate/Gray', value: 'from-slate-50 to-gray-50 border-slate-200' },
  { label: 'Yellow/Amber', value: 'from-yellow-50 to-amber-50 border-yellow-200' },
  { label: 'Rose/Pink', value: 'from-rose-50 to-pink-50 border-rose-200' },
  { label: 'Orange/Amber', value: 'from-orange-50 to-amber-50 border-orange-200' },
  { label: 'Blue/Cyan', value: 'from-blue-50 to-cyan-50 border-blue-200' },
];

export default function AdminProfile() {
  const [activeSection, setActiveSection] = useState<'preferences' | 'assessments'>('preferences');
  const [preferenceTypes, setPreferenceTypes] = useState<PreferenceType[]>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPreferenceForm, setShowPreferenceForm] = useState(false);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [editingPreference, setEditingPreference] = useState<PreferenceType | null>(null);
  const [editingAssessment, setEditingAssessment] = useState<AssessmentType | null>(null);

  const [preferenceFormData, setPreferenceFormData] = useState({
    name: '',
    icon: '📝',
    color: 'from-slate-50 to-gray-50 border-slate-200',
    display_order: 0,
    is_active: true,
  });

  const [assessmentFormData, setAssessmentFormData] = useState({
    name: '',
    description: '',
    icon: '📊',
    color: 'from-slate-50 to-gray-50 border-slate-200',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [preferencesResult, assessmentsResult] = await Promise.all([
      supabase.from('preference_types').select('*').order('display_order'),
      supabase.from('assessment_types').select('*').order('display_order'),
    ]);

    if (preferencesResult.data) setPreferenceTypes(preferencesResult.data);
    if (assessmentsResult.data) setAssessmentTypes(assessmentsResult.data);
    setLoading(false);
  };

  const handlePreferenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPreference) {
      const { error } = await supabase
        .from('preference_types')
        .update({ ...preferenceFormData, updated_at: new Date().toISOString() })
        .eq('id', editingPreference.id);

      if (error) {
        console.error('Error updating preference type:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('preference_types')
        .insert([preferenceFormData]);

      if (error) {
        console.error('Error adding preference type:', error);
        return;
      }
    }

    resetPreferenceForm();
    fetchData();
  };

  const handleAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAssessment) {
      const { error } = await supabase
        .from('assessment_types')
        .update({ ...assessmentFormData, updated_at: new Date().toISOString() })
        .eq('id', editingAssessment.id);

      if (error) {
        console.error('Error updating assessment type:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('assessment_types')
        .insert([assessmentFormData]);

      if (error) {
        console.error('Error adding assessment type:', error);
        return;
      }
    }

    resetAssessmentForm();
    fetchData();
  };

  const handleDeletePreference = async (id: string) => {
    if (!confirm('Are you sure you want to delete this preference type?')) return;

    const { error } = await supabase
      .from('preference_types')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting preference type:', error);
      return;
    }

    fetchData();
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment type?')) return;

    const { error } = await supabase
      .from('assessment_types')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting assessment type:', error);
      return;
    }

    fetchData();
  };

  const handleEditPreference = (preference: PreferenceType) => {
    setEditingPreference(preference);
    setPreferenceFormData({
      name: preference.name,
      icon: preference.icon,
      color: preference.color,
      display_order: preference.display_order,
      is_active: preference.is_active,
    });
    setShowPreferenceForm(true);
  };

  const handleEditAssessment = (assessment: AssessmentType) => {
    setEditingAssessment(assessment);
    setAssessmentFormData({
      name: assessment.name,
      description: assessment.description || '',
      icon: assessment.icon,
      color: assessment.color,
      display_order: assessment.display_order,
      is_active: assessment.is_active,
    });
    setShowAssessmentForm(true);
  };

  const resetPreferenceForm = () => {
    setPreferenceFormData({
      name: '',
      icon: '📝',
      color: 'from-slate-50 to-gray-50 border-slate-200',
      display_order: preferenceTypes.length,
      is_active: true,
    });
    setEditingPreference(null);
    setShowPreferenceForm(false);
  };

  const resetAssessmentForm = () => {
    setAssessmentFormData({
      name: '',
      description: '',
      icon: '📊',
      color: 'from-slate-50 to-gray-50 border-slate-200',
      display_order: assessmentTypes.length,
      is_active: true,
    });
    setEditingAssessment(null);
    setShowAssessmentForm(false);
  };

  if (loading) {
    return <div className="text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Profile Settings</h3>
        <p className="text-sm text-slate-600">Manage preference types and assessment types</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSection('preferences')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeSection === 'preferences'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Preference Types
        </button>
        <button
          onClick={() => setActiveSection('assessments')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeSection === 'assessments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Assessment Types
        </button>
      </div>

      {activeSection === 'preferences' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowPreferenceForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Preference Type
            </button>
          </div>

          {showPreferenceForm && (
            <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
              <h4 className="text-lg font-semibold text-slate-900 mb-4">
                {editingPreference ? 'Edit Preference Type' : 'Add Preference Type'}
              </h4>
              <form onSubmit={handlePreferenceSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={preferenceFormData.name}
                      onChange={(e) => setPreferenceFormData({ ...preferenceFormData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Icon (Emoji)
                    </label>
                    <input
                      type="text"
                      required
                      value={preferenceFormData.icon}
                      onChange={(e) => setPreferenceFormData({ ...preferenceFormData, icon: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., ☕"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Color Theme
                    </div>
                  </label>
                  <select
                    value={preferenceFormData.color}
                    onChange={(e) => setPreferenceFormData({ ...preferenceFormData, color: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {colorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className={`mt-2 p-4 rounded-lg bg-gradient-to-br ${preferenceFormData.color} border-2`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{preferenceFormData.icon}</span>
                      <span className="font-semibold text-slate-900">{preferenceFormData.name || 'Preview'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      required
                      value={preferenceFormData.display_order}
                      onChange={(e) => setPreferenceFormData({ ...preferenceFormData, display_order: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Status
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferenceFormData.is_active}
                        onChange={(e) => setPreferenceFormData({ ...preferenceFormData, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Active</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={resetPreferenceForm}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Save className="w-4 h-4" />
                    {editingPreference ? 'Update' : 'Add'} Preference Type
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {preferenceTypes.map((preference) => (
              <div
                key={preference.id}
                className={`bg-gradient-to-br ${preference.color} rounded-lg border-2 p-4 ${
                  !preference.is_active ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{preference.icon}</span>
                    <div>
                      <h4 className="font-semibold text-slate-900">{preference.name}</h4>
                      <p className="text-xs text-slate-600">Order: {preference.display_order}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditPreference(preference)}
                      className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-medium text-slate-600">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeletePreference(preference.id)}
                      className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span className="text-xs font-medium text-red-600">Delete</span>
                    </button>
                  </div>
                </div>
                {!preference.is_active && (
                  <span className="text-xs text-slate-500 italic">Inactive</span>
                )}
              </div>
            ))}
          </div>

          {preferenceTypes.length === 0 && (
            <div className="text-center py-12 border border-slate-200 rounded-lg bg-slate-50">
              <p className="text-slate-500 mb-4">No preference types yet</p>
              <button
                onClick={() => setShowPreferenceForm(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Add your first preference type
              </button>
            </div>
          )}
        </div>
      )}

      {activeSection === 'assessments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAssessmentForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Assessment Type
            </button>
          </div>

          {showAssessmentForm && (
            <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
              <h4 className="text-lg font-semibold text-slate-900 mb-4">
                {editingAssessment ? 'Edit Assessment Type' : 'Add Assessment Type'}
              </h4>
              <form onSubmit={handleAssessmentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={assessmentFormData.name}
                    onChange={(e) => setAssessmentFormData({ ...assessmentFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={assessmentFormData.description}
                    onChange={(e) => setAssessmentFormData({ ...assessmentFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Icon (Emoji)
                    </label>
                    <input
                      type="text"
                      required
                      value={assessmentFormData.icon}
                      onChange={(e) => setAssessmentFormData({ ...assessmentFormData, icon: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 📊"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Color Theme
                      </div>
                    </label>
                    <select
                      value={assessmentFormData.color}
                      onChange={(e) => setAssessmentFormData({ ...assessmentFormData, color: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {colorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={`p-4 rounded-lg bg-gradient-to-br ${assessmentFormData.color} border-2`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{assessmentFormData.icon}</span>
                    <span className="font-semibold text-slate-900">{assessmentFormData.name || 'Preview'}</span>
                  </div>
                  {assessmentFormData.description && (
                    <p className="text-sm text-slate-600">{assessmentFormData.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      required
                      value={assessmentFormData.display_order}
                      onChange={(e) => setAssessmentFormData({ ...assessmentFormData, display_order: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Status
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assessmentFormData.is_active}
                        onChange={(e) => setAssessmentFormData({ ...assessmentFormData, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Active</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={resetAssessmentForm}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Save className="w-4 h-4" />
                    {editingAssessment ? 'Update' : 'Add'} Assessment Type
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assessmentTypes.map((assessment) => (
              <div
                key={assessment.id}
                className={`bg-gradient-to-br ${assessment.color} rounded-lg border-2 p-4 ${
                  !assessment.is_active ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{assessment.icon}</span>
                    <div>
                      <h4 className="font-semibold text-slate-900">{assessment.name}</h4>
                      <p className="text-xs text-slate-600">Order: {assessment.display_order}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditAssessment(assessment)}
                      className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-medium text-slate-600">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteAssessment(assessment.id)}
                      className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span className="text-xs font-medium text-red-600">Delete</span>
                    </button>
                  </div>
                </div>
                {assessment.description && (
                  <p className="text-sm text-slate-600 mb-2">{assessment.description}</p>
                )}
                {!assessment.is_active && (
                  <span className="text-xs text-slate-500 italic">Inactive</span>
                )}
              </div>
            ))}
          </div>

          {assessmentTypes.length === 0 && (
            <div className="text-center py-12 border border-slate-200 rounded-lg bg-slate-50">
              <p className="text-slate-500 mb-4">No assessment types yet</p>
              <button
                onClick={() => setShowAssessmentForm(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Add your first assessment type
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
