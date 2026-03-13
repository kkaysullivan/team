import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CircleUser as UserCircle, TrendingUp, FileText, Calendar, BarChart3, Gift, ExternalLink, ChevronRight, AlertTriangle, CheckCircle2, TrendingDown, Pencil, Trash2, Plus, Clock, Activity, Target } from 'lucide-react';
import DOMPurify from 'dompurify';
import type { Database } from '../lib/supabase';

type TeamMember = Database['public']['Tables']['team_members']['Row'];
type GrowthArea = Database['public']['Tables']['growth_areas']['Row'] & {
  skill_levels: {
    id: string;
    description: string;
    maturity_skills: {
      name: string;
    } | null;
  } | null;
};
type KRA = Database['public']['Tables']['kras']['Row'];
type CheckIn = Database['public']['Tables']['performance_reviews']['Row'];
type Preference = Database['public']['Tables']['team_member_preferences']['Row'];

interface TeamMemberDashboardProps {
  memberId: string;
  onClose: () => void;
  onViewSection?: (section: 'growth' | 'kras' | 'checkins' | 'maturity' | 'profile') => void;
  onEditCheckIn?: (checkInId: string) => void;
  onDeleteCheckIn?: (checkInId: string) => void;
}

export default function TeamMemberDashboard({ memberId, onClose, onViewSection, onEditCheckIn, onDeleteCheckIn }: TeamMemberDashboardProps) {
  const [member, setMember] = useState<TeamMember | null>(null);
  const [growthAreas, setGrowthAreas] = useState<GrowthArea[]>([]);
  const [currentKRA, setCurrentKRA] = useState<KRA | null>(null);
  const [upcomingCheckIn, setUpcomingCheckIn] = useState<CheckIn | null>(null);
  const [maturityData, setMaturityData] = useState<any>(null);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [maturityHistory, setMaturityHistory] = useState<any[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [memberId]);

  const fetchDashboardData = async () => {
    setLoading(true);

    const [memberData, growthData, kraData, checkInData, maturityModelData, preferencesData, recentCheckInsData, allMaturityData] = await Promise.all([
      supabase
        .from('team_members')
        .select('*, roles(name)')
        .eq('id', memberId)
        .maybeSingle(),

      supabase
        .from('growth_areas')
        .select(`
          *,
          skill_levels!growth_areas_skill_level_id_fkey(
            id,
            description,
            maturity_skills(name)
          )
        `)
        .eq('team_member_id', memberId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3),

      supabase
        .from('kras')
        .select('*')
        .eq('team_member_id', memberId)
        .eq('is_active', true)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle(),

      supabase
        .from('performance_reviews')
        .select('*')
        .eq('team_member_id', memberId)
        .gte('review_date', new Date().toISOString().split('T')[0])
        .order('review_date', { ascending: true })
        .limit(1)
        .maybeSingle(),

      supabase
        .from('maturity_assessments')
        .select(`
          *,
          maturity_skills!maturity_assessments_skill_id_fkey(name)
        `)
        .eq('team_member_id', memberId)
        .not('leader_rating', 'is', null)
        .order('assessed_at', { ascending: false }),

      supabase
        .from('team_member_preferences')
        .select('*')
        .eq('team_member_id', memberId)
        .in('category', ['Birthday', 'Ramseyversary'])
        .order('display_order', { ascending: true }),

      supabase
        .from('performance_reviews')
        .select('*')
        .eq('team_member_id', memberId)
        .lte('review_date', new Date().toISOString().split('T')[0])
        .order('review_date', { ascending: false })
        .limit(5),

      supabase
        .from('maturity_assessments')
        .select('assessed_at, leader_rating')
        .eq('team_member_id', memberId)
        .not('leader_rating', 'is', null)
        .order('assessed_at', { ascending: true })
    ]);

    if (memberData.data) setMember(memberData.data);
    if (growthData.data) setGrowthAreas(growthData.data);
    if (kraData.data) setCurrentKRA(kraData.data);
    if (checkInData.data) setUpcomingCheckIn(checkInData.data);
    if (preferencesData.data) setPreferences(preferencesData.data);
    if (recentCheckInsData.data) setRecentCheckIns(recentCheckInsData.data);

    if (allMaturityData.data && allMaturityData.data.length > 0) {
      const levelScoreMap: Record<string, number> = {
        '10000000-0000-0000-0000-000000000001': 0,
        '10000000-0000-0000-0000-000000000002': 1,
        '10000000-0000-0000-0000-000000000003': 2,
        '10000000-0000-0000-0000-000000000004': 3,
        '10000000-0000-0000-0000-000000000005': 4,
      };

      const historyByMonth = allMaturityData.data.reduce((acc: any, assessment: any) => {
        const month = new Date(assessment.assessed_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!acc[month]) {
          acc[month] = { total: 0, count: 0 };
        }
        const score = levelScoreMap[assessment.leader_rating] ?? 0;
        acc[month].total += score;
        acc[month].count += 1;
        return acc;
      }, {});

      const history = Object.entries(historyByMonth)
        .map(([month, data]: [string, any]) => ({
          month,
          average: data.count > 0 ? data.total / data.count : 0
        }))
        .slice(-6);

      setMaturityHistory(history);
    }

    const now = new Date();
    const lastCheckInDate = recentCheckInsData.data && recentCheckInsData.data.length > 0
      ? new Date(recentCheckInsData.data[0].review_date + 'T00:00:00')
      : null;
    const daysSinceLastCheckIn = lastCheckInDate
      ? Math.floor((now.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const lastAssessmentDate = maturityModelData.data && maturityModelData.data.length > 0
      ? new Date(maturityModelData.data[0].assessed_at)
      : null;
    const daysSinceLastAssessment = lastAssessmentDate
      ? Math.floor((now.getTime() - lastAssessmentDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const kraEndDate = kraData.data?.end_date ? new Date(kraData.data.end_date + 'T00:00:00') : null;
    const daysUntilKRAExpires = kraEndDate
      ? Math.floor((kraEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const activeGrowthCount = growthData.data?.length || 0;

    setHealthMetrics({
      daysSinceLastCheckIn,
      daysSinceLastAssessment,
      daysUntilKRAExpires,
      activeGrowthCount,
      hasUpcomingCheckIn: !!checkInData.data,
      totalCheckIns: recentCheckInsData.data?.length || 0,
      lastCheckInDate: lastCheckInDate ? lastCheckInDate.toLocaleDateString() : null,
      kraEndDate: kraEndDate ? kraEndDate.toLocaleDateString() : null
    });

    if (maturityModelData.data && maturityModelData.data.length > 0) {
      const assessments = maturityModelData.data;

      const levelIds = assessments
        .map(a => a.leader_rating)
        .filter(Boolean) as string[];

      if (levelIds.length > 0) {
        // Get level information - leader_rating stores level_id (from levels table)
        const levelScoreMap: Record<string, number> = {
          '10000000-0000-0000-0000-000000000001': 0, // Associate
          '10000000-0000-0000-0000-000000000002': 1, // Level 1
          '10000000-0000-0000-0000-000000000003': 2, // Level 2
          '10000000-0000-0000-0000-000000000004': 3, // Senior
          '10000000-0000-0000-0000-000000000005': 4, // Lead
        };

        const skillIds = assessments.map(a => a.skill_id).filter(Boolean) as string[];

        // Get categories for each skill through category_skills junction table
        const { data: skillCategoryData } = await supabase
          .from('category_skills')
          .select(`
            skill_id,
            maturity_categories(id, name)
          `)
          .in('skill_id', skillIds);

        const categoryNames = new Map(
          skillCategoryData?.map(sc => [
            sc.skill_id,
            (sc.maturity_categories as any)?.name || 'Uncategorized'
          ]) || []
        );

        const categoryAverages: Record<string, { total: number; count: number; name: string }> = {};

        assessments.forEach((assessment) => {
          const levelScore = assessment.leader_rating ? levelScoreMap[assessment.leader_rating] : null;
          const categoryName = categoryNames.get(assessment.skill_id) || 'Uncategorized';

          if (levelScore !== null && levelScore !== undefined && categoryName) {
            if (!categoryAverages[categoryName]) {
              categoryAverages[categoryName] = {
                total: 0,
                count: 0,
                name: categoryName
              };
            }
            categoryAverages[categoryName].total += levelScore;
            categoryAverages[categoryName].count += 1;
          }
        });

        const avgsByCategory = Object.values(categoryAverages).map(cat => ({
          category: cat.name,
          average: cat.count > 0 ? (cat.total / cat.count) : 0,
          averageDisplay: cat.count > 0 ? (cat.total / cat.count).toFixed(1) : '0'
        }));

        const totalAvgScore = avgsByCategory.length > 0
          ? avgsByCategory.reduce((sum, cat) => sum + cat.average, 0) / avgsByCategory.length
          : 0;

        setMaturityData({
          assessmentCount: assessments.length,
          categoryAverages: avgsByCategory,
          overallAverage: totalAvgScore,
          categoriesRated: avgsByCategory.length
        });
      }
    }

    setLoading(false);
  };

  const handleViewSection = (section: 'growth' | 'kras' | 'checkins' | 'maturity' | 'profile') => {
    if (onViewSection) {
      onViewSection(section);
    }
  };

  const getOverallLevelName = (avgScore: number): string => {
    if (avgScore >= 3.8) return 'Lead';
    if (avgScore >= 2.8) return 'Senior Level';
    if (avgScore >= 1.8) return 'Level 2';
    if (avgScore >= 0.8) return 'Level 1';
    return 'Associate';
  };

  const getCheckInTitle = (checkIn: CheckIn): string => {
    if (checkIn.type === 'annual') {
      return `Annual Check-In ${checkIn.year || ''}`.trim();
    } else if (checkIn.type === 'quarterly' && checkIn.quarter) {
      return `${checkIn.quarter} ${checkIn.year || ''} Check-In`.trim();
    }
    return 'Check-In';
  };

  const getGrowthIndicator = (): { status: 'needs-coaching' | 'on-track' | 'promotion-ready'; label: string; description: string } | null => {
    if (!member?.current_level || !maturityData?.overallAverage) return null;

    const memberLevel = member.current_level;
    const avgScore = maturityData.overallAverage;

    const levelRanges: Record<string, { min: number; max: number }> = {
      'Associate': { min: 0.0, max: 0.7 },
      'Level 1': { min: 0.8, max: 1.7 },
      'Level 2': { min: 1.8, max: 2.7 },
      'Senior Level': { min: 2.8, max: 3.7 },
      'Lead': { min: 3.8, max: 4.0 },
    };

    const range = levelRanges[memberLevel];
    if (!range) return null;

    const roundedScore = Math.round(avgScore * 10) / 10;

    // Promotion Ready: score is 2.8+ (Senior Level or above)
    if (roundedScore >= 2.8) {
      return {
        status: 'promotion-ready',
        label: 'Promotion Ready',
        description: 'Performing at Senior Level or above (2.8+)',
      };
    }

    // Needs Coaching: lower than the current level range
    if (roundedScore < range.min) {
      return {
        status: 'needs-coaching',
        label: 'Needs Coaching',
        description: 'Below expected level range',
      };
    }

    // On Track: within the current level range
    return {
      status: 'on-track',
      label: 'On Track',
      description: 'Meeting level expectations',
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Team member not found</p>
        <button onClick={onClose} className="mt-4 text-blue-600 hover:text-blue-700">
          Go back
        </button>
      </div>
    );
  }

  const birthday = preferences.find(p => p.category === 'Birthday')?.value;
  const ramseyversary = preferences.find(p => p.category === 'Ramseyversary')?.value;
  const growthIndicator = getGrowthIndicator();

  return (
    <div className="max-w-7xl mx-auto">
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-sky-50 border-b border-slate-200">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white shadow-md flex items-center justify-center">
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt={member.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircle className="w-16 h-16 text-slate-400" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{member.full_name}</h1>
              <p className="text-lg text-slate-600 mt-1">{member.role}</p>
              <p className="text-sm text-slate-500 mt-2">{member.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-2">
            <button
              onClick={() => handleViewSection('checkins')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition font-medium"
            >
              <Calendar className="w-5 h-5" />
              Schedule Check-In
            </button>
            <button
              onClick={() => handleViewSection('maturity')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition font-medium"
            >
              <Target className="w-5 h-5" />
              View Maturity Model
            </button>
            <button
              onClick={() => handleViewSection('growth')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition font-medium"
            >
              <TrendingUp className="w-5 h-5" />
              View Growth Areas
            </button>
            <button
              onClick={() => handleViewSection('kras')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition font-medium"
            >
              <Target className="w-5 h-5" />
              View KRA
            </button>
            <button
              onClick={() => handleViewSection('maturity')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition font-medium"
            >
              <BarChart3 className="w-5 h-5" />
              View Assessments
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Health Indicators</h3>
            <Clock className="w-5 h-5 text-slate-600" />
          </div>
          {healthMetrics ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-700">Last Check-In</span>
                </div>
                <span className={`text-sm font-semibold ${
                  healthMetrics.daysSinceLastCheckIn === null ? 'text-red-600' :
                  healthMetrics.daysSinceLastCheckIn > 90 ? 'text-red-600' :
                  healthMetrics.daysSinceLastCheckIn > 60 ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {healthMetrics.daysSinceLastCheckIn === null ? 'Never' : `${healthMetrics.daysSinceLastCheckIn}d ago`}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-700">Last Assessment</span>
                </div>
                <span className={`text-sm font-semibold ${
                  healthMetrics.daysSinceLastAssessment === null ? 'text-red-600' :
                  healthMetrics.daysSinceLastAssessment > 180 ? 'text-red-600' :
                  healthMetrics.daysSinceLastAssessment > 90 ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {healthMetrics.daysSinceLastAssessment === null ? 'Never' : `${healthMetrics.daysSinceLastAssessment}d ago`}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-700">KRA Status</span>
                </div>
                <span className={`text-sm font-semibold ${
                  healthMetrics.daysUntilKRAExpires === null ? 'text-red-600' :
                  healthMetrics.daysUntilKRAExpires < 0 ? 'text-red-600' :
                  healthMetrics.daysUntilKRAExpires < 30 ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {healthMetrics.daysUntilKRAExpires === null ? 'None' :
                   healthMetrics.daysUntilKRAExpires < 0 ? 'Expired' : `${healthMetrics.daysUntilKRAExpires}d left`}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-700">Growth Areas</span>
                </div>
                <span className={`text-sm font-semibold ${
                  healthMetrics.activeGrowthCount === 0 ? 'text-red-600' :
                  healthMetrics.activeGrowthCount < 2 ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {healthMetrics.activeGrowthCount} active
                </span>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Loading metrics...</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Important Dates</h3>
            <Gift className="w-5 h-5 text-rose-600" />
          </div>
          <div className="space-y-4">
            {birthday && (
              <div className="flex items-center justify-between p-4 bg-rose-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                    <span className="text-xl">🎂</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Birthday</p>
                    <p className="text-sm text-slate-600">{birthday}</p>
                  </div>
                </div>
              </div>
            )}
            {ramseyversary && (
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                    <span className="text-xl">🎉</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Ramseyversary</p>
                    <p className="text-sm text-slate-600">{ramseyversary}</p>
                  </div>
                </div>
              </div>
            )}
            {!birthday && !ramseyversary && (
              <p className="text-slate-500 text-center py-4">No dates available</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Next Check-In</h2>
            </div>
            <button
              onClick={() => handleViewSection('checkins')}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              See all
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {upcomingCheckIn ? (
                  <tr className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-slate-900">
                        {new Date(upcomingCheckIn.review_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-900">
                        {getCheckInTitle(upcomingCheckIn)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {upcomingCheckIn.type && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {upcomingCheckIn.type.replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => onEditCheckIn?.(upcomingCheckIn.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteCheckIn?.(upcomingCheckIn.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No upcoming check-ins scheduled
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-zinc-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Performance Trend</h2>
            </div>
          </div>
          <div className="p-6">
            {maturityHistory.length > 0 ? (
              <div className="space-y-4">
                <div className="h-32 flex items-end justify-between gap-2">
                  {maturityHistory.map((point, idx) => {
                    const maxHeight = 4;
                    const heightPercent = (point.average / maxHeight) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-slate-100 rounded-t-lg relative" style={{ height: '100%' }}>
                          <div
                            className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all"
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 text-center">{point.month.split(' ')[0]}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Current Avg</span>
                    <span className="text-lg font-bold text-blue-600">
                      {maturityHistory[maturityHistory.length - 1].average.toFixed(1)}
                    </span>
                  </div>
                  {maturityHistory.length > 1 && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-slate-600">Trend</span>
                      <div className="flex items-center gap-1">
                        {maturityHistory[maturityHistory.length - 1].average > maturityHistory[maturityHistory.length - 2].average ? (
                          <>
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-600">Improving</span>
                          </>
                        ) : maturityHistory[maturityHistory.length - 1].average < maturityHistory[maturityHistory.length - 2].average ? (
                          <>
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-semibold text-red-600">Declining</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-600">Stable</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-slate-500 text-sm text-center">Not enough data for trend analysis</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-semibold text-slate-900">Current Growth Areas</h2>
            </div>
            <button
              onClick={() => handleViewSection('growth')}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              See all
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6">
            {growthAreas.length > 0 ? (
              <div className="space-y-3">
                {growthAreas.map((area) => (
                  <div key={area.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {area.skill_levels?.maturity_skills?.name || 'Unknown Skill'}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        {area.skill_levels?.description || 'No description'}
                      </p>
                      {area.leader_comments && (
                        <p className="text-sm text-slate-500 mt-2 italic" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(area.leader_comments.replace(/<\/?p>/g, '')) }} />
                      )}
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1 bg-white rounded-full border border-slate-200">
                      <span className="text-sm font-semibold text-slate-700">{area.rating}</span>
                      <span className="text-xs text-slate-500">/5</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No active growth areas</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-amber-600" />
              <h2 className="text-lg font-semibold text-slate-900">Current KRA</h2>
            </div>
            <button
              onClick={() => handleViewSection('kras')}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              See all
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6">
            {currentKRA ? (
              <div className="space-y-4">
                {currentKRA.title && (
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Title</p>
                    <p className="text-base font-medium text-slate-900">{currentKRA.title}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-600 mb-1">Period</p>
                  <p className="text-base font-medium text-slate-900">
                    {currentKRA.start_date ? new Date(currentKRA.start_date).toLocaleDateString() : 'N/A'} - {currentKRA.end_date ? new Date(currentKRA.end_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                {currentKRA.key_responsibilities && Array.isArray(currentKRA.key_responsibilities) && (
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600 mb-2">Key Responsibilities:</p>
                    <div className="space-y-2">
                      {(currentKRA.key_responsibilities as any[]).slice(0, 3).map((kra: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-700">{kra.responsibility || 'Untitled'}</span>
                        </div>
                      ))}
                      {(currentKRA.key_responsibilities as any[]).length > 3 && (
                        <p className="text-sm text-slate-500 italic">
                          +{(currentKRA.key_responsibilities as any[]).length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No current KRA</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-zinc-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Maturity Model Snapshot</h2>
            </div>
            <button
              onClick={() => handleViewSection('maturity')}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              See all
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6">
            {maturityData && maturityData.assessmentCount > 0 ? (
              <div className="space-y-4">
                <div className="flex gap-4 mb-6">
                  {growthIndicator && (
                    <div
                      className={`border-2 rounded-lg p-4 flex-1 ${
                        growthIndicator.status === 'needs-coaching'
                          ? 'bg-red-50 border-red-300'
                          : growthIndicator.status === 'promotion-ready'
                          ? 'bg-green-50 border-green-300'
                          : 'bg-blue-50 border-blue-300'
                      }`}
                    >
                      <p className="text-sm text-slate-600 mb-2 text-center">Growth Status</p>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {growthIndicator.status === 'needs-coaching' && (
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        )}
                        {growthIndicator.status === 'on-track' && (
                          <CheckCircle2 className="w-6 h-6 text-blue-600" />
                        )}
                        {growthIndicator.status === 'promotion-ready' && (
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        )}
                        <span
                          className={`text-lg font-bold ${
                            growthIndicator.status === 'needs-coaching'
                              ? 'text-red-700'
                              : growthIndicator.status === 'promotion-ready'
                              ? 'text-green-700'
                              : 'text-blue-700'
                          }`}
                        >
                          {growthIndicator.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 text-center">
                        {growthIndicator.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-2 text-center">
                        Current Level: {member.current_level}
                      </p>
                    </div>
                  )}
                  {maturityData.overallAverage !== undefined && (
                    <div className="bg-white border-2 border-blue-200 rounded-lg p-4 flex-1">
                      <p className="text-sm text-slate-600 mb-2 text-center">Category Average</p>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-4xl font-bold text-blue-600">
                          {maturityData.overallAverage.toFixed(1)}
                        </span>
                        <span className="text-lg text-slate-600">/ 4.0</span>
                      </div>
                      <p className="text-base font-semibold text-blue-700 mt-2 text-center">
                        {getOverallLevelName(maturityData.overallAverage)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 text-center">
                        {maturityData.categoriesRated} categor{maturityData.categoriesRated !== 1 ? 'ies' : 'y'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <span className="text-sm text-slate-600">Skills Assessed</span>
                  <span className="text-2xl font-bold text-slate-900">{maturityData.assessmentCount}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">Category Averages</p>
                  <div className="space-y-2">
                    {maturityData.categoryAverages.slice(0, 5).map((cat: any) => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">{cat.category}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${(parseFloat(cat.averageDisplay) / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-700 w-8 text-right">
                            {cat.averageDisplay}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No maturity assessments yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
