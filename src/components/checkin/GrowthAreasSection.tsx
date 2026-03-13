import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';

interface GrowthAreaEntry {
  growth_area_id: string;
  skill_name: string;
  skill_id: string;
  category_name: string;
  level_name: string;
  is_active: boolean;
  quarter: string;
  current_rating: number;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  leader_comments: string;
  existing_comments: string;
}

interface GrowthAreasSectionProps {
  data: GrowthAreaEntry[];
  onChange: (data: GrowthAreaEntry[]) => void;
  teamMemberId: string;
}

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

const ratingLabels: { [key: number]: string } = {
  1: 'Needs guidance & substantial improvement',
  2: 'Self-sufficient, but needs overall improvement',
  3: 'Meeting expectations',
  4: 'Exceeding expectations',
  5: 'Greatly exceeding expectations',
};

export default function GrowthAreasSection({ data, onChange, teamMemberId }: GrowthAreasSectionProps) {
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      fetchGrowthAreas();
    }
  }, [teamMemberId]);

  const fetchGrowthAreas = async () => {
    setLoading(true);

    const { data: growthAreasData } = await supabase
      .from('growth_areas')
      .select(`
        id,
        skill_id,
        quarter,
        rating,
        leader_comments,
        is_active,
        skill_levels!growth_areas_skill_level_id_fkey(
          id,
          description,
          maturity_skills(name),
          levels(name)
        )
      `)
      .eq('team_member_id', teamMemberId)
      .order('is_active', { ascending: false })
      .order('start_date', { ascending: false });

    if (!growthAreasData || growthAreasData.length === 0) {
      setLoading(false);
      setLoaded(true);
      if (data.length === 0) onChange([]);
      return;
    }

    const skillIds = growthAreasData
      .map(ga => (ga.skill_levels as any)?.maturity_skills?.id)
      .filter(Boolean) as string[];

    const { data: categoryData } = await supabase
      .from('category_skills')
      .select('skill_id, maturity_categories(name)')
      .in('skill_id', skillIds);

    const categoryMap = new Map(
      (categoryData || []).map(cs => [cs.skill_id, (cs.maturity_categories as any)?.name || ''])
    );

    const grouped = new Map<string, GrowthAreaEntry>();

    for (const ga of growthAreasData) {
      const sl = ga.skill_levels as any;
      const skillName = sl?.maturity_skills?.name || '';
      const levelName = sl?.levels?.name || '';
      const skillMsId = sl?.maturity_skills?.id || '';
      const categoryName = categoryMap.get(skillMsId) || '';

      if (!grouped.has(ga.skill_id)) {
        grouped.set(ga.skill_id, {
          growth_area_id: ga.id,
          skill_name: skillName,
          skill_id: ga.skill_id,
          category_name: categoryName,
          level_name: levelName,
          is_active: ga.is_active,
          quarter: ga.quarter || '',
          current_rating: ga.rating || 3,
          q1: 3,
          q2: 3,
          q3: 3,
          q4: 3,
          leader_comments: '',
          existing_comments: ga.leader_comments || '',
        });
      }

      const entry = grouped.get(ga.skill_id)!;
      const quarterMatch = (ga.quarter || '').match(/Q(\d)/);
      if (quarterMatch) {
        const q = `q${quarterMatch[1]}` as 'q1' | 'q2' | 'q3' | 'q4';
        entry[q] = ga.rating || 3;
      }
    }

    const growthAreasArray = Array.from(grouped.values());

    if (data.length === 0) {
      onChange(growthAreasArray);
    }

    setLoading(false);
    setLoaded(true);
  };

  const updateEntry = (index: number, field: keyof GrowthAreaEntry, value: string | number) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">No growth areas found</p>
        <p className="text-sm text-slate-500 mt-1">Add growth areas to this team member's profile first, then they will appear here for reference.</p>
      </div>
    );
  }

  const activeAreas = data.filter(a => a.is_active);
  const inactiveAreas = data.filter(a => !a.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Growth Areas</h3>
          <p className="text-sm text-slate-600">Review and rate quarterly progress on existing growth areas</p>
        </div>
      </div>

      {activeAreas.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Active Growth Areas</h4>
          </div>

          {activeAreas.map((area) => {
            const index = data.indexOf(area);
            return (
              <GrowthAreaCard
                key={area.growth_area_id}
                area={area}
                index={index}
                onUpdate={updateEntry}
              />
            );
          })}
        </div>
      )}

      {inactiveAreas.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pt-2">
            <div className="w-4 h-4 rounded-full border-2 border-slate-400 flex-shrink-0" />
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Inactive Growth Areas (Reference Only)</h4>
          </div>

          {inactiveAreas.map((area) => {
            const index = data.indexOf(area);
            return (
              <GrowthAreaCard
                key={area.growth_area_id}
                area={area}
                index={index}
                onUpdate={updateEntry}
                inactive
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface GrowthAreaCardProps {
  area: GrowthAreaEntry;
  index: number;
  onUpdate: (index: number, field: keyof GrowthAreaEntry, value: string | number) => void;
  inactive?: boolean;
}

function GrowthAreaCard({ area, index, onUpdate, inactive = false }: GrowthAreaCardProps) {
  return (
    <div className={`border rounded-lg p-6 ${inactive ? 'border-slate-200 bg-slate-50 opacity-75' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-lg font-semibold text-slate-900">{area.skill_name}</h4>
            {area.level_name && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                {area.level_name}
              </span>
            )}
            {inactive ? (
              <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-medium rounded">Inactive</span>
            ) : (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">Active</span>
            )}
          </div>
          {area.category_name && (
            <p className="text-sm text-slate-500 mt-0.5">{area.category_name}</p>
          )}
          {area.quarter && (
            <p className="text-xs text-slate-400 mt-0.5">Quarter: {area.quarter}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-slate-500">Current Rating</p>
          <p className="text-2xl font-bold text-orange-600">{area.current_rating}</p>
          <p className="text-xs text-slate-500">/5</p>
        </div>
      </div>

      {area.existing_comments && !inactive && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-medium text-amber-700 mb-1">Existing Leader Comments</p>
          <div
            className="text-sm text-amber-900 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(area.existing_comments) }}
          />
        </div>
      )}

      {!inactive && (
        <>
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Quarterly Ratings
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(['q1', 'q2', 'q3', 'q4'] as const).map((quarter) => (
                <div key={quarter} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <div className="text-xs font-semibold text-slate-600 uppercase mb-2">
                    {quarter.toUpperCase()}
                  </div>
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => onUpdate(index, quarter, rating)}
                        className={`flex-1 h-8 rounded text-sm font-semibold transition ${
                          area[quarter] === rating
                            ? 'bg-orange-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-orange-50 border border-slate-300'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 leading-tight min-h-[28px]">
                    {ratingLabels[area[quarter]]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Leader Comments for Check-In
            </label>
            <div className="bg-white rounded-lg border border-slate-300">
              <ReactQuill
                theme="snow"
                value={area.leader_comments}
                onChange={(value) => onUpdate(index, 'leader_comments', value)}
                modules={quillModules}
                formats={quillFormats}
                className="min-h-[100px]"
              />
            </div>
          </div>
        </>
      )}

      {inactive && area.existing_comments && (
        <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg">
          <p className="text-xs font-medium text-slate-500 mb-1">Leader Comments</p>
          <div
            className="text-sm text-slate-600 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(area.existing_comments) }}
          />
        </div>
      )}
    </div>
  );
}
