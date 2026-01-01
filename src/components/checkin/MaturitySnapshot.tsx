import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface MaturitySnapshotEntry {
  category_id: string;
  category_name: string;
  category_description: string;
  average_rating: number;
  max_rating: number;
  level_name: string;
  leader_comments: string;
}

interface MaturitySnapshotProps {
  data: MaturitySnapshotEntry[];
  onChange: (data: MaturitySnapshotEntry[]) => void;
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

export default function MaturitySnapshot({ data, onChange, teamMemberId }: MaturitySnapshotProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaturityData();
  }, [teamMemberId]);

  const fetchMaturityData = async () => {
    setLoading(true);

    const { data: assessments, error } = await supabase
      .from('maturity_assessments')
      .select(`
        skill_id,
        leader_rating,
        maturity_skills (
          id,
          name
        )
      `)
      .eq('team_member_id', teamMemberId);

    if (error) {
      console.error('Error fetching maturity assessments:', error);
      setLoading(false);
      return;
    }

    if (!assessments || assessments.length === 0) {
      setLoading(false);
      return;
    }

    const skillIds = assessments.map(a => a.skill_id);

    const { data: categorySkills } = await supabase
      .from('category_skills')
      .select(`
        skill_id,
        category_id,
        maturity_categories (
          id,
          name,
          description,
          display_order
        )
      `)
      .in('skill_id', skillIds);

    if (!categorySkills) {
      setLoading(false);
      return;
    }

    const { data: allLevels } = await supabase
      .from('levels')
      .select('*');

    const levelOrderMap: Record<string, number> = {
      'Associate': 1,
      'Level 1': 2,
      'Level 2': 3,
      'Senior': 4,
      'Lead': 5
    };

    const levelIdToOrderMap = new Map(
      (allLevels || []).map(level => [level.id, levelOrderMap[level.name] || 0])
    );

    const levelIdToNameMap = new Map(
      (allLevels || []).map(level => [level.id, level.name])
    );

    const maxLevelOrder = 5;

    const skillToCategoryMap = new Map<string, any>();
    for (const cs of categorySkills) {
      skillToCategoryMap.set(cs.skill_id, cs.maturity_categories);
    }

    const categoryData = new Map<string, {
      id: string;
      name: string;
      description: string;
      ratings: number[];
      display_order: number;
    }>();

    for (const assessment of assessments) {
      if (!assessment.leader_rating) continue;

      const category = skillToCategoryMap.get(assessment.skill_id);
      if (!category) continue;

      if (!categoryData.has(category.id)) {
        categoryData.set(category.id, {
          id: category.id,
          name: category.name,
          description: category.description || '',
          ratings: [],
          display_order: category.display_order || 0
        });
      }

      const ratingOrder = levelIdToOrderMap.get(assessment.leader_rating);
      if (ratingOrder !== undefined) {
        categoryData.get(category.id)!.ratings.push(ratingOrder);
      }
    }

    const categoriesArray = Array.from(categoryData.values())
      .sort((a, b) => a.display_order - b.display_order);

    const snapshotData: MaturitySnapshotEntry[] = categoriesArray.map(cat => {
      const sum = cat.ratings.reduce((acc, val) => acc + val, 0);
      const average = cat.ratings.length > 0 ? sum / cat.ratings.length : 0;

      let levelName = '';
      if (allLevels) {
        const roundedAverage = Math.round(average);
        const levelEntry = Object.entries(levelOrderMap).find(([_, order]) => order === roundedAverage);
        if (levelEntry) {
          levelName = levelEntry[0];
        } else {
          const closestLevel = allLevels.reduce((prev, curr) => {
            const prevOrder = levelOrderMap[prev.name] || 0;
            const currOrder = levelOrderMap[curr.name] || 0;
            return Math.abs(currOrder - average) < Math.abs(prevOrder - average) ? curr : prev;
          });
          levelName = closestLevel.name;
        }
      }

      const existingEntry = data.find(d => d.category_id === cat.id);

      return {
        category_id: cat.id,
        category_name: cat.name,
        category_description: cat.description,
        average_rating: Math.round(average * 10) / 10,
        max_rating: maxLevelOrder,
        level_name: levelName,
        leader_comments: existingEntry?.leader_comments || ''
      };
    });

    if (data.length === 0 || JSON.stringify(data.map(d => d.category_id).sort()) !== JSON.stringify(snapshotData.map(d => d.category_id).sort())) {
      onChange(snapshotData);
    }

    setLoading(false);
  };

  const updateSnapshot = (index: number, value: string) => {
    const updated = [...data];
    updated[index] = {
      ...updated[index],
      leader_comments: value
    };
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
        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
          <span className="text-xl">📊</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Maturity Model Snapshot</h3>
          <p className="text-sm text-slate-600">Current maturity assessment by category</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
          <p className="text-slate-500">No maturity assessment data available for this team member</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map((entry, index) => (
            <div key={entry.category_id} className="border border-slate-200 rounded-lg p-6 bg-white">
              <div className="mb-4">
                <h4 className="text-xl font-bold text-slate-900 mb-2">
                  {entry.category_name}
                </h4>
                <p className="text-slate-600 leading-relaxed mb-3">
                  {entry.category_description}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <span className="text-2xl font-bold text-indigo-900">
                    {entry.average_rating.toFixed(1)}
                  </span>
                  <span className="text-slate-600">/</span>
                  <span className="text-lg font-semibold text-slate-700">
                    {entry.max_rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-slate-600 ml-2">
                    ({entry.level_name})
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Leader Comments
                </label>
                <div className="bg-white rounded-lg border border-slate-300">
                  <ReactQuill
                    theme="snow"
                    value={entry.leader_comments}
                    onChange={(value) => updateSnapshot(index, value)}
                    modules={quillModules}
                    formats={quillFormats}
                    className="min-h-[120px]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
