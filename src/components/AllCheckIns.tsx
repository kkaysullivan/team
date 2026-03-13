import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardCheck, Plus, Pencil, Trash2, ArrowUpDown, ArrowLeft, TrendingUp } from 'lucide-react';
import type { Database } from '../lib/supabase';
import CheckInForm from './CheckInForm';

type CheckIn = Database['public']['Tables']['performance_reviews']['Row'];

interface CheckInWithMember extends CheckIn {
  team_member: {
    id: string;
    full_name: string;
  };
}

interface AllCheckInsProps {
  onBack: () => void;
}

interface ActiveGrowthArea {
  id: string;
  team_member_id: string;
  rating: number;
  skill_levels: {
    description?: string;
    maturity_skills?: { id: string; name: string };
    levels?: { name: string };
  } | null;
  category_name?: string;
}

export default function AllCheckIns({ onBack }: AllCheckInsProps) {
  const { user } = useAuth();
  const [checkIns, setCheckIns] = useState<CheckInWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [editingCheckIn, setEditingCheckIn] = useState<CheckIn | null>(null);
  const [sortField, setSortField] = useState<'date' | 'title' | 'type'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeGrowthAreas, setActiveGrowthAreas] = useState<Map<string, ActiveGrowthArea[]>>(new Map());

  useEffect(() => {
    if (user) {
      fetchCheckIns();
    }
  }, [user]);

  const fetchCheckIns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('performance_reviews')
      .select(`
        *,
        team_member:team_members(id, full_name)
      `)
      .order('review_date', { ascending: true });

    if (error) {
      console.error('Error fetching check-ins:', error);
    } else {
      const checkInsData = data as CheckInWithMember[] || [];
      setCheckIns(checkInsData);

      const memberIds = [...new Set(checkInsData.map(c => c.team_member_id))];
      if (memberIds.length > 0) {
        await fetchActiveGrowthAreas(memberIds);
      }
    }
    setLoading(false);
  };

  const fetchActiveGrowthAreas = async (memberIds: string[]) => {
    const { data: gaData } = await supabase
      .from('growth_areas')
      .select(`
        id,
        team_member_id,
        rating,
        skill_levels!growth_areas_skill_level_id_fkey(
          id,
          description,
          maturity_skills(id, name),
          levels(name)
        )
      `)
      .in('team_member_id', memberIds)
      .eq('is_active', true);

    if (!gaData || gaData.length === 0) return;

    const skillIds = gaData
      .map(ga => (ga.skill_levels as any)?.maturity_skills?.id)
      .filter(Boolean) as string[];

    let categoryMap = new Map<string, string>();
    if (skillIds.length > 0) {
      const { data: catData } = await supabase
        .from('category_skills')
        .select('skill_id, maturity_categories(name)')
        .in('skill_id', skillIds);

      categoryMap = new Map(
        (catData || []).map(cs => [cs.skill_id, (cs.maturity_categories as any)?.name || ''])
      );
    }

    const map = new Map<string, ActiveGrowthArea[]>();
    for (const ga of gaData) {
      const sl = ga.skill_levels as any;
      const skillId = sl?.maturity_skills?.id || '';
      const enriched: ActiveGrowthArea = {
        id: ga.id,
        team_member_id: ga.team_member_id,
        rating: ga.rating || 0,
        skill_levels: ga.skill_levels as any,
        category_name: categoryMap.get(skillId) || '',
      };
      const existing = map.get(ga.team_member_id) || [];
      existing.push(enriched);
      map.set(ga.team_member_id, existing);
    }

    setActiveGrowthAreas(map);
  };

  const handleDeleteCheckIn = async (id: string) => {
    if (!confirm('Are you sure you want to delete this check-in?')) return;

    await supabase.from('performance_reviews').delete().eq('id', id);
    fetchCheckIns();
  };

  const handleEditCheckIn = (checkIn: CheckIn) => {
    setEditingCheckIn(checkIn);
    setShowCheckInForm(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
    const [year, month, day] = datePart.split('-');
    if (!year || !month || !day) return dateString;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(month) - 1;
    const dayNum = parseInt(day);

    return `${monthNames[monthIndex]} ${dayNum}, ${year}`;
  };

  const formatTitle = (checkIn: CheckInWithMember) => {
    const name = checkIn.team_member.full_name;
    if (checkIn.type === 'quarterly' && checkIn.quarter && checkIn.year) {
      return `${name} ${checkIn.quarter} ${checkIn.year} Check-In`;
    } else if (checkIn.type === 'annual' && checkIn.year) {
      return `${name} Annual ${checkIn.year} Check-In`;
    } else if (checkIn.review_date) {
      const year = new Date(checkIn.review_date).getFullYear();
      return `${name} ${checkIn.type === 'annual' ? 'Annual' : 'Quarterly'} ${year} Check-In`;
    }
    return `${name} Check-In`;
  };

  const formatType = (checkIn: CheckIn) => {
    if (checkIn.type === 'quarterly') {
      return 'Quarterly';
    } else if (checkIn.type === 'annual') {
      return 'Annual';
    }
    return '-';
  };

  const handleSort = (field: 'date' | 'title' | 'type') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCheckIns = [...checkIns].sort((a, b) => {
    let compareA: string | number = '';
    let compareB: string | number = '';

    switch (sortField) {
      case 'date':
        compareA = a.review_date || '';
        compareB = b.review_date || '';
        break;
      case 'title':
        compareA = formatTitle(a);
        compareB = formatTitle(b);
        break;
      case 'type':
        compareA = formatType(a);
        compareB = formatType(b);
        break;
    }

    if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (showCheckInForm) {
    return (
      <CheckInForm
        existingData={editingCheckIn}
        onSave={() => {
          fetchCheckIns();
          setShowCheckInForm(false);
          setEditingCheckIn(null);
        }}
        onCancel={() => {
          setShowCheckInForm(false);
          setEditingCheckIn(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-slate-900">All Check-Ins</h1>
        <p className="text-slate-600 mt-1">Complete history of team check-ins</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Check-Ins</h2>
                <p className="text-sm text-slate-600">
                  {checkIns.length} {checkIns.length === 1 ? 'check-in' : 'check-ins'} total
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingCheckIn(null);
                setShowCheckInForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              New Check-In
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-2">
                      Date
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-2">
                      Title
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-2">
                      Type
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedCheckIns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No check-ins yet
                    </td>
                  </tr>
                ) : (
                  sortedCheckIns.map((checkIn) => {
                    const areas = activeGrowthAreas.get(checkIn.team_member_id) || [];
                    return (
                    <tr key={checkIn.id} className="hover:bg-slate-50 transition align-top">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-slate-900">
                          {formatDate(checkIn.review_date)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <span className="text-slate-900">
                            {formatTitle(checkIn)}
                          </span>
                          {areas.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {areas.map((area) => {
                                const sl = area.skill_levels as any;
                                const skillName = sl?.maturity_skills?.name || '';
                                const levelName = sl?.levels?.name || '';
                                const description = sl?.description || '';
                                return (
                                  <div
                                    key={area.id}
                                    className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 max-w-xs"
                                  >
                                    <TrendingUp className="w-3.5 h-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {area.category_name && (
                                          <span className="text-xs font-semibold text-orange-700">{area.category_name}</span>
                                        )}
                                        {levelName && (
                                          <span className="text-xs text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded font-medium">{levelName}</span>
                                        )}
                                        <span className="text-xs font-bold text-orange-800 ml-auto">{area.rating}/5</span>
                                      </div>
                                      {skillName && (
                                        <p className="text-xs text-slate-700 font-medium mt-0.5">{skillName}</p>
                                      )}
                                      {description && (
                                        <p className="text-xs text-slate-500 mt-0.5 leading-tight line-clamp-2">{description}</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {formatType(checkIn)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEditCheckIn(checkIn)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCheckIn(checkIn.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
