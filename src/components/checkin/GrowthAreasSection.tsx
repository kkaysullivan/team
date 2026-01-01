import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, AlertCircle } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface GrowthAreaEntry {
  skill_name: string;
  skill_id: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  leader_comments: string;
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

interface Skill {
  id: string;
  name: string;
  level_name: string;
  category_name: string;
}

export default function GrowthAreasSection({ data, onChange, teamMemberId }: GrowthAreasSectionProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrowthAreasAndSkills();
  }, [teamMemberId]);

  const fetchGrowthAreasAndSkills = async () => {
    setLoading(true);

    const { data: growthAreasData } = await supabase
      .from('growth_areas')
      .select(`
        skill_id,
        quarter,
        rating,
        leader_comments
      `)
      .eq('team_member_id', teamMemberId)
      .eq('is_active', true)
      .order('quarter');

    const { data: skillLevelsData } = await supabase
      .from('skill_levels')
      .select(`
        id,
        skill_id,
        level_id,
        maturity_skills (
          id,
          name
        ),
        levels (
          name
        )
      `);

    const skillLevelMap = new Map();
    if (skillLevelsData) {
      for (const sl of skillLevelsData) {
        skillLevelMap.set(sl.id, {
          skill_id: sl.skill_id,
          skill_name: (sl.maturity_skills as any)?.name || '',
          level_name: (sl.levels as any)?.name || ''
        });
      }
    }

    const { data: categorySkillsData } = await supabase
      .from('category_skills')
      .select(`
        skill_id,
        maturity_categories (
          name
        )
      `);

    const skillToCategoryMap = new Map();
    if (categorySkillsData) {
      for (const cs of categorySkillsData) {
        skillToCategoryMap.set(cs.skill_id, (cs.maturity_categories as any)?.name || '');
      }
    }

    const allSkills: Skill[] = skillLevelsData?.map((sl: any) => ({
      id: sl.id,
      name: (sl.maturity_skills as any)?.name || '',
      level_name: (sl.levels as any)?.name || '',
      category_name: skillToCategoryMap.get(sl.skill_id) || ''
    })) || [];

    setSkills(allSkills);

    if (data.length === 0 && growthAreasData && growthAreasData.length > 0) {
      const skillGroups = new Map<string, any>();

      for (const ga of growthAreasData) {
        const skillInfo = skillLevelMap.get(ga.skill_id);
        if (!skillInfo) continue;

        if (!skillGroups.has(ga.skill_id)) {
          skillGroups.set(ga.skill_id, {
            skill_id: ga.skill_id,
            skill_name: `${skillInfo.skill_name} (${skillInfo.level_name})`,
            q1: 3,
            q2: 3,
            q3: 3,
            q4: 3,
            leader_comments: ''
          });
        }

        const group = skillGroups.get(ga.skill_id);
        const quarterMatch = ga.quarter.match(/Q(\d)/);
        if (quarterMatch) {
          const q = `q${quarterMatch[1]}` as 'q1' | 'q2' | 'q3' | 'q4';
          group[q] = ga.rating || 3;
          if (ga.leader_comments && !group.leader_comments) {
            group.leader_comments = ga.leader_comments;
          }
        }
      }

      const growthAreasArray = Array.from(skillGroups.values());

      while (growthAreasArray.length < 3) {
        growthAreasArray.push({
          skill_name: '',
          skill_id: '',
          q1: 3,
          q2: 3,
          q3: 3,
          q4: 3,
          leader_comments: ''
        });
      }

      onChange(growthAreasArray);
    } else if (data.length === 0) {
      onChange([
        { skill_name: '', skill_id: '', q1: 3, q2: 3, q3: 3, q4: 3, leader_comments: '' },
        { skill_name: '', skill_id: '', q1: 3, q2: 3, q3: 3, q4: 3, leader_comments: '' },
        { skill_name: '', skill_id: '', q1: 3, q2: 3, q3: 3, q4: 3, leader_comments: '' }
      ]);
    }

    setLoading(false);
  };

  const updateGrowthArea = (index: number, field: keyof GrowthAreaEntry, value: string | number) => {
    const updated = [...data];

    if (field === 'skill_id') {
      const selectedSkill = skills.find(s => s.id === value);
      if (selectedSkill) {
        updated[index] = {
          ...updated[index],
          skill_id: value as string,
          skill_name: `${selectedSkill.name} (${selectedSkill.level_name})`
        };
      }
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value
      };
    }

    onChange(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Growth Areas</h3>
          <p className="text-sm text-slate-600">Track quarterly progress on key development areas</p>
        </div>
      </div>

      {skills.length === 0 ? (
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500">No skills available. Please ensure the team member has a role assigned with associated skills.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map((area, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-6 bg-white">
              <h4 className="text-lg font-semibold text-slate-900 mb-4">Growth Area {index + 1}</h4>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Skill Name
                  </label>
                  <select
                    value={area.skill_id}
                    onChange={(e) => updateGrowthArea(index, 'skill_id', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select a skill</option>
                    {skills.map((skill) => (
                      <option key={skill.id} value={skill.id}>
                        {skill.name} ({skill.level_name}) - {skill.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Quarterly Ranking
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['q1', 'q2', 'q3', 'q4'].map((quarter) => (
                      <div key={quarter} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <div className="text-xs font-semibold text-slate-600 uppercase mb-3">
                          {quarter.toUpperCase()}
                        </div>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => updateGrowthArea(index, quarter as keyof GrowthAreaEntry, rating)}
                              className={`flex-1 h-10 rounded text-sm font-semibold transition ${
                                area[quarter as keyof GrowthAreaEntry] === rating
                                  ? 'bg-orange-600 text-white shadow-md'
                                  : 'bg-white text-slate-600 hover:bg-orange-50 border border-slate-300'
                              }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 min-h-[32px]">
                          {ratingLabels[area[quarter as keyof GrowthAreaEntry] as number]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Leader Comments
                  </label>
                  <div className="bg-white rounded-lg border border-slate-300">
                    <ReactQuill
                      theme="snow"
                      value={area.leader_comments}
                      onChange={(value) => updateGrowthArea(index, 'leader_comments', value)}
                      modules={quillModules}
                      formats={quillFormats}
                      className="min-h-[120px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
