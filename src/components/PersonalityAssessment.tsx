import { useState } from 'react';
import { Brain, TrendingUp, ExternalLink } from 'lucide-react';

interface PersonalityData {
  disc_d: number | null;
  disc_i: number | null;
  disc_s: number | null;
  disc_c: number | null;
  enneagram_primary: number | null;
  enneagram_wing: number | null;
  working_genius: WorkingGeniusData | null;
}

interface WorkingGeniusData {
  genius: string[];
  competency: string[];
  frustration: string[];
}

interface PersonalityAssessmentProps {
  data: PersonalityData;
  onChange: (data: PersonalityData) => void;
  readOnly?: boolean;
}

const WORKING_GENIUS_TYPES = [
  { value: 'W', label: 'Wonder', description: 'Pondering and questioning' },
  { value: 'I', label: 'Invention', description: 'Creating and innovating' },
  { value: 'D', label: 'Discernment', description: 'Intuiting and evaluating' },
  { value: 'G', label: 'Galvanizing', description: 'Rallying and inspiring' },
  { value: 'E', label: 'Enablement', description: 'Supporting and assisting' },
  { value: 'T', label: 'Tenacity', description: 'Finishing and completing' },
];

export default function PersonalityAssessment({ data, onChange, readOnly = false }: PersonalityAssessmentProps) {
  const [activeTab, setActiveTab] = useState<'disc' | 'enneagram' | 'working-genius'>('disc');

  const updateDISC = (dimension: 'disc_d' | 'disc_i' | 'disc_s' | 'disc_c', value: number) => {
    onChange({ ...data, [dimension]: value });
  };

  const updateEnneagram = (field: 'enneagram_primary' | 'enneagram_wing', value: number | null) => {
    onChange({ ...data, [field]: value });
  };

  const updateWorkingGenius = (category: 'genius' | 'competency' | 'frustration', types: string[]) => {
    const currentWG = data.working_genius || { genius: [], competency: [], frustration: [] };
    onChange({
      ...data,
      working_genius: { ...currentWG, [category]: types },
    });
  };

  const toggleWorkingGeniusType = (category: 'genius' | 'competency' | 'frustration', type: string) => {
    const currentWG = data.working_genius || { genius: [], competency: [], frustration: [] };
    const currentTypes = currentWG[category] || [];

    const maxItems = category === 'genius' || category === 'frustration' ? 2 : 2;

    if (currentTypes.includes(type)) {
      updateWorkingGenius(category, currentTypes.filter(t => t !== type));
    } else if (currentTypes.length < maxItems) {
      updateWorkingGenius(category, [...currentTypes, type]);
    }
  };

  const getBarHeight = (value: number | null) => {
    if (value === null) return 0;
    return value;
  };

  const getBarColor = (dimension: string) => {
    switch (dimension) {
      case 'D': return 'bg-red-500';
      case 'I': return 'bg-yellow-500';
      case 'S': return 'bg-green-500';
      case 'C': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('disc')}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === 'disc'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          DISC Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('enneagram')}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === 'enneagram'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Enneagram
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('working-genius')}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === 'working-genius'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Working Genius
        </button>
      </div>

      {activeTab === 'disc' && (
        <div className="space-y-6 mt-8">
          <div className="flex items-end justify-around gap-4 h-64 bg-slate-50 rounded-lg p-6">
            {[
              { key: 'disc_d', label: 'D', fullLabel: 'Dominance', color: 'bg-red-500' },
              { key: 'disc_i', label: 'I', fullLabel: 'Influence', color: 'bg-yellow-500' },
              { key: 'disc_s', label: 'S', fullLabel: 'Steadiness', color: 'bg-green-500' },
              { key: 'disc_c', label: 'C', fullLabel: 'Conscientiousness', color: 'bg-blue-500' },
            ].map(({ key, label, fullLabel, color }) => {
              const value = data[key as keyof PersonalityData] as number | null;
              const height = getBarHeight(value);
              return (
                <div key={key} className="flex flex-col items-center gap-2 flex-1">
                  <div className="text-sm font-medium text-slate-600">{value ?? 0}</div>
                  <div className="w-full flex items-end justify-center" style={{ height: '180px' }}>
                    <div
                      className={`w-full ${color} rounded-t transition-all duration-300`}
                      style={{ height: `${height}%` }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">{label}</div>
                    <div className="text-xs text-slate-600">{fullLabel}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {!readOnly && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'disc_d', label: 'Dominance (D)' },
                { key: 'disc_i', label: 'Influence (I)' },
                { key: 'disc_s', label: 'Steadiness (S)' },
                { key: 'disc_c', label: 'Conscientiousness (C)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={data[key as keyof PersonalityData] as number || 0}
                    onChange={(e) => updateDISC(key as any, parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'enneagram' && (
        <div className="space-y-4 mt-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Primary Type
              </label>
              {readOnly ? (
                <div className="px-4 py-2 bg-slate-50 rounded-lg text-slate-900">
                  {data.enneagram_primary ? `Type ${data.enneagram_primary}` : 'Not set'}
                </div>
              ) : (
                <select
                  value={data.enneagram_primary || ''}
                  onChange={(e) => updateEnneagram('enneagram_primary', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <option key={num} value={num}>
                      Type {num}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Wing Type (Optional)
              </label>
              {readOnly ? (
                <div className="px-4 py-2 bg-slate-50 rounded-lg text-slate-900">
                  {data.enneagram_wing ? `Wing ${data.enneagram_wing}` : 'Not set'}
                </div>
              ) : (
                <select
                  value={data.enneagram_wing || ''}
                  onChange={(e) => updateEnneagram('enneagram_wing', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No wing</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <option key={num} value={num}>
                      Wing {num}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {data.enneagram_primary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">
                    Type {data.enneagram_primary}
                    {data.enneagram_wing && ` with Wing ${data.enneagram_wing}`}
                  </h4>
                  <p className="text-sm text-blue-800 mb-2">
                    Enneagram Type {data.enneagram_primary} personality profile
                  </p>
                  <a
                    href={`https://www.enneagraminstitute.com/type-${data.enneagram_primary}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition"
                  >
                    Learn more about Type {data.enneagram_primary}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'working-genius' && (
        <div className="space-y-6 mt-8">
          <div className="text-sm text-slate-600 mb-4">
            Select 2 items for each category. Working Genius helps identify your natural gifts and frustrations.
          </div>

          {(['genius', 'competency', 'frustration'] as const).map((category) => {
            const currentWG = data.working_genius || { genius: [], competency: [], frustration: [] };
            const selectedTypes = currentWG[category] || [];
            const maxReached = selectedTypes.length >= 2;

            return (
              <div key={category}>
                <h4 className="text-sm font-semibold text-slate-900 mb-3 capitalize">
                  {category === 'genius' && 'Genius (Your Natural Strengths)'}
                  {category === 'competency' && 'Competency (You Can Do It)'}
                  {category === 'frustration' && 'Frustration (Drains Your Energy)'}
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    ({selectedTypes.length}/2 selected)
                  </span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {WORKING_GENIUS_TYPES.map((type) => {
                    const isSelected = selectedTypes.includes(type.value);
                    const isDisabled = !isSelected && maxReached;

                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          if (!readOnly) {
                            toggleWorkingGeniusType(category, type.value);
                          }
                        }}
                        disabled={readOnly || isDisabled}
                        className={`p-3 rounded-lg border-2 text-left transition ${
                          isSelected
                            ? category === 'genius'
                              ? 'border-green-500 bg-green-50'
                              : category === 'competency'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-red-500 bg-red-50'
                            : isDisabled
                            ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <div className="font-semibold text-slate-900">
                          {type.value} - {type.label}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">{type.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
