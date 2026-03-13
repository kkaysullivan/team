import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CircleUser as UserCircle, Users, MessageSquare, ClipboardCheck, Plus, Pencil, Trash2, ArrowUpDown, ExternalLink, LayoutDashboard, Target, Layers, User, ChevronRight, TrendingUp, Activity, Clock, Calendar, BarChart3, FileText, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';
import type { Database } from '../lib/supabase';
import CheckInForm from './CheckInForm';
import MyTeam from './MyTeam';
import CheckIns from './CheckIns';
import AdminLevels from './admin/AdminLevels';
import AdminCategories from './admin/AdminCategories';
import AdminSkills from './admin/AdminSkills';
import AdminRoles from './admin/AdminRoles';
import AdminMaturityModels from './admin/AdminMaturityModels';
import AdminTeamMembers from './admin/AdminTeamMembers';
import AdminProfile from './admin/AdminProfile';
import AdminCheckIns from './admin/AdminCheckIns';
import AdminCheckInPrep from './admin/AdminCheckInPrep';
import AdminGrowthAreas from './admin/AdminGrowthAreas';
import TeamPerformanceChart from './TeamPerformanceChart';

type TeamMember = Database['public']['Tables']['team_members']['Row'];
type CheckIn = Database['public']['Tables']['performance_reviews']['Row'];

interface TeamMemberWithTrend extends TeamMember {
  performanceTrend: Array<{ month: string; average: number }>;
}

interface TeamMemberTrendData {
  id: string;
  name: string;
  color: string;
  data: Array<{ month: string; average: number }>;
}

interface CheckInWithMember extends CheckIn {
  team_member: {
    id: string;
    full_name: string;
  };
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface DashboardProps {
  onSelectMember: (memberId: string) => void;
  onNavigate?: (view: string) => void;
}

export default function Dashboard({ onSelectMember, onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [members, setMembers] = useState<TeamMemberWithTrend[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInsLoading, setCheckInsLoading] = useState(true);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [editingCheckIn, setEditingCheckIn] = useState<CheckIn | null>(null);
  const [sortField, setSortField] = useState<'date' | 'title' | 'type'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [teamStats, setTeamStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [teamPerformanceTrends, setTeamPerformanceTrends] = useState<TeamMemberTrendData[]>([]);

  const navSections: NavSection[] = [
    {
      label: 'Dashboard',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'team', label: 'My Team', icon: Users },
        { id: 'check-ins', label: 'Check-Ins', icon: ClipboardCheck },
      ],
    },
    {
      label: 'Team Management',
      items: [
        { id: 'members', label: 'Team Members', icon: Users },
        { id: 'roles', label: 'Roles', icon: Target },
        { id: 'profile', label: 'Profile', icon: User },
      ],
    },
    {
      label: 'Maturity Model',
      items: [
        { id: 'models', label: 'Models', icon: Layers },
        { id: 'categories', label: 'Categories', icon: Layers },
        { id: 'skills', label: 'Skills', icon: Target },
        { id: 'levels', label: 'Levels', icon: ChevronRight },
      ],
    },
    {
      label: 'Development',
      items: [
        { id: 'checkins-admin', label: 'Manage Check-Ins', icon: ClipboardCheck },
        { id: 'checkin-prep', label: 'Check-In Prep', icon: ClipboardCheck },
        { id: 'growth-areas', label: 'Growth Areas', icon: Target },
      ],
    },
  ];

  useEffect(() => {
    if (user) {
      fetchMembers();
      fetchCheckIns();
      fetchTeamStats();
      fetchTeamPerformanceData();
    }
  }, [user]);

  const fetchTeamPerformanceData = async () => {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [teamMembersResult, levelsResult] = await Promise.all([
      supabase
        .from('team_members')
        .select('id, full_name')
        .eq('status', 'active')
        .order('full_name'),
      supabase
        .from('levels')
        .select('id, name')
    ]);

    if (!teamMembersResult.data || !levelsResult.data) {
      setTeamPerformanceTrends([]);
      return;
    }

    const teamMembers = teamMembersResult.data;
    const levels = levelsResult.data;

    const LEVEL_ORDER: Record<string, number> = {
      'Associate': 1,
      'Level 1': 2,
      'Level 2': 3,
      'Senior': 4,
      'Lead': 5,
    };

    const levelScoreMap = new Map<string, number>();
    levels.forEach(level => {
      const score = LEVEL_ORDER[level.name] ?? null;
      if (score !== null) levelScoreMap.set(level.id, score);
    });

    const COLORS = [
      'rgb(59, 130, 246)',
      'rgb(16, 185, 129)',
      'rgb(249, 115, 22)',
      'rgb(236, 72, 153)',
      'rgb(14, 165, 233)',
      'rgb(234, 179, 8)',
      'rgb(239, 68, 68)',
    ];

    const memberTrends = await Promise.all(
      teamMembers.map(async (member, idx) => {
        const { data: assessments } = await supabase
          .from('maturity_assessments')
          .select('assessed_at, leader_rating')
          .eq('team_member_id', member.id)
          .gte('assessed_at', twelveMonthsAgo.toISOString())
          .not('leader_rating', 'is', null)
          .order('assessed_at', { ascending: true });

        const monthlyData = new Map<string, { total: number; count: number }>();

        if (assessments && assessments.length > 0) {
          assessments.forEach((assessment) => {
            const score = levelScoreMap.get(assessment.leader_rating!);
            if (score !== undefined) {
              const date = new Date(assessment.assessed_at);
              const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              if (!monthlyData.has(monthKey)) {
                monthlyData.set(monthKey, { total: 0, count: 0 });
              }
              const monthStats = monthlyData.get(monthKey)!;
              monthStats.total += score;
              monthStats.count += 1;
            }
          });
        }

        const data = Array.from(monthlyData.entries())
          .map(([month, stats]) => ({
            month,
            average: stats.total / stats.count
          }))
          .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

        return {
          id: member.id,
          name: member.full_name,
          color: COLORS[idx % COLORS.length],
          data
        };
      })
    );

    setTeamPerformanceTrends(memberTrends.filter(m => m.data.length > 0));
  };

  const fetchTeamStats = async () => {
    setStatsLoading(true);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      recentCheckInsData,
      allCheckInsData,
      recentGrowthAreasData,
      allGrowthAreasData,
      growthAreasData,
      krasData,
    ] = await Promise.all([
      supabase
        .from('performance_reviews')
        .select('id, review_date')
        .gte('review_date', thirtyDaysAgo.toISOString().split('T')[0])
        .lte('review_date', now.toISOString().split('T')[0]),

      supabase
        .from('performance_reviews')
        .select('id, review_date')
        .lte('review_date', now.toISOString().split('T')[0])
        .order('review_date', { ascending: false }),

      supabase
        .from('growth_areas')
        .select('id, start_date')
        .gte('start_date', thirtyDaysAgo.toISOString().split('T')[0]),

      supabase
        .from('growth_areas')
        .select('id, start_date, rating')
        .order('start_date', { ascending: true }),

      supabase
        .from('growth_areas')
        .select('id, is_active')
        .eq('is_active', true),

      supabase
        .from('kras')
        .select('id, end_date')
        .eq('is_active', true),
    ]);

    const performanceTrend = [];
    if (allGrowthAreasData.data && allGrowthAreasData.data.length > 0) {
      const historyByMonth = allGrowthAreasData.data.reduce((acc: any, area: any) => {
        const month = new Date(area.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!acc[month]) {
          acc[month] = { total: 0, count: 0 };
        }
        acc[month].total += area.rating;
        acc[month].count += 1;
        return acc;
      }, {});

      const history = Object.entries(historyByMonth)
        .map(([month, data]: [string, any]) => ({
          month,
          average: data.count > 0 ? data.total / data.count : 0
        }))
        .slice(-6);

      performanceTrend.push(...history);
    }

    const lastCheckInDate = allCheckInsData.data && allCheckInsData.data.length > 0
      ? new Date(allCheckInsData.data[0].review_date)
      : null;
    const daysSinceLastCheckIn = lastCheckInDate
      ? Math.floor((now.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const upcomingCheckIns = await supabase
      .from('performance_reviews')
      .select('id')
      .gte('review_date', now.toISOString().split('T')[0])
      .lte('review_date', new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    const expiredKRAs = krasData.data?.filter(kra => {
      if (!kra.end_date) return false;
      return new Date(kra.end_date) < now;
    }).length || 0;

    const expiringKRAs = krasData.data?.filter(kra => {
      if (!kra.end_date) return false;
      const endDate = new Date(kra.end_date);
      const daysUntilExpiry = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry >= 0 && daysUntilExpiry < 30;
    }).length || 0;

    setTeamStats({
      totalMembers: members.length,
      recentCheckIns: recentCheckInsData.data?.length || 0,
      totalCheckIns: allCheckInsData.data?.length || 0,
      recentGrowthAreas: recentGrowthAreasData.data?.length || 0,
      totalGrowthAreas: allGrowthAreasData.data?.length || 0,
      activeGrowthAreas: growthAreasData.data?.length || 0,
      activeKRAs: krasData.data?.length || 0,
      expiredKRAs,
      expiringKRAs,
      upcomingCheckIns: upcomingCheckIns.data?.length || 0,
      daysSinceLastCheckIn,
      performanceTrend,
    });

    setStatsLoading(false);
  };

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('status', 'active')
      .order('full_name');

    if (error) {
      console.error('Error fetching members:', error);
      setLoading(false);
      return;
    }

    if (!data) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const levelScoreMap: Record<string, number> = {
      '10000000-0000-0000-0000-000000000001': 0,
      '10000000-0000-0000-0000-000000000002': 1,
      '10000000-0000-0000-0000-000000000003': 2,
      '10000000-0000-0000-0000-000000000004': 3,
      '10000000-0000-0000-0000-000000000005': 4,
    };

    const membersWithTrends = await Promise.all(
      data.map(async (member) => {
        const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

        const { data: growthAreas } = await supabase
          .from('growth_areas')
          .select('start_date, rating')
          .eq('team_member_id', member.id)
          .gte('start_date', yearStart)
          .order('start_date', { ascending: true });

        const performanceTrend: Array<{ month: string; average: number }> = [];

        if (growthAreas && growthAreas.length > 0) {
          const historyByMonth = growthAreas.reduce((acc: any, area: any) => {
            const date = new Date(area.start_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric'
            });

            if (!acc[monthKey]) {
              acc[monthKey] = {
                label: monthLabel,
                total: 0,
                count: 0
              };
            }
            acc[monthKey].total += area.rating;
            acc[monthKey].count += 1;
            return acc;
          }, {});

          const sortedEntries = Object.entries(historyByMonth)
            .sort(([a], [b]) => a.localeCompare(b));

          sortedEntries.forEach(([_, data]: [string, any]) => {
            performanceTrend.push({
              month: data.label,
              average: data.count > 0 ? data.total / data.count : 0
            });
          });
        }

        return {
          ...member,
          performanceTrend
        };
      })
    );

    setMembers(membersWithTrends);
    setLoading(false);
  };

  const fetchCheckIns = async () => {
    setCheckInsLoading(true);
    const { data, error } = await supabase
      .from('performance_reviews')
      .select(`
        *,
        team_member:team_members(id, full_name)
      `)
      .order('review_date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching check-ins:', error);
    } else {
      setCheckIns(data as CheckInWithMember[] || []);
    }
    setCheckInsLoading(false);
  };

  const handleDeleteCheckIn = async (id: string) => {
    if (!confirm('Are you sure you want to delete this check-in?')) return;

    try {
      const { error } = await supabase.from('performance_reviews').delete().eq('id', id);
      if (error) throw error;
      fetchCheckIns();
    } catch (error) {
      console.error('Error deleting check-in:', error);
      alert('Failed to delete check-in. Please try again.');
    }
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

  const renderOverviewContent = () => {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Team Health</h3>
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
            {statsLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : teamStats ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-700">Upcoming Check-Ins</span>
                  </div>
                  <span className={`text-sm font-semibold ${
                    teamStats.upcomingCheckIns === 0 ? 'text-red-600' :
                    teamStats.upcomingCheckIns < 3 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {teamStats.upcomingCheckIns}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-700">Expiring KRAs</span>
                  </div>
                  <span className={`text-sm font-semibold ${
                    teamStats.expiredKRAs > 0 ? 'text-red-600' :
                    teamStats.expiringKRAs > 0 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {teamStats.expiredKRAs > 0 ? `${teamStats.expiredKRAs} expired` :
                     teamStats.expiringKRAs > 0 ? `${teamStats.expiringKRAs} soon` : 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-700">Active Growth Areas</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {teamStats.activeGrowthAreas}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Loading metrics...</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Team Performance</h3>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            {statsLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <TeamPerformanceChart memberTrends={teamPerformanceTrends} />
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">My Team</h2>
                <p className="text-sm text-slate-600">View your team members and their development</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {members.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => onSelectMember(member.id)}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-blue-300 transition cursor-pointer group"
                  >
                    <div className="flex flex-col items-center text-center mb-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0 mb-4 group-hover:ring-4 group-hover:ring-blue-50 transition">
                        {member.photo_url ? (
                          <img
                            src={member.photo_url}
                            alt={member.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserCircle className="w-12 h-12 text-slate-400" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {member.full_name}
                      </h3>
                      <p className="text-sm text-slate-600">{member.role}</p>
                    </div>

                    {member.performanceTrend && member.performanceTrend.length > 0 ? (
                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-slate-600">Performance Trend (YTD)</span>
                          <div className="flex items-center gap-1">
                            {member.performanceTrend.length > 1 && (
                              member.performanceTrend[member.performanceTrend.length - 1].average >
                              member.performanceTrend[member.performanceTrend.length - 2].average ? (
                                <TrendingUp className="w-3 h-3 text-green-600" />
                              ) : member.performanceTrend[member.performanceTrend.length - 1].average <
                                    member.performanceTrend[member.performanceTrend.length - 2].average ? (
                                <TrendingDown className="w-3 h-3 text-red-600" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                              )
                            )}
                            <span className="text-xs font-semibold text-blue-600">
                              {member.performanceTrend[member.performanceTrend.length - 1].average.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <div className="h-20 relative bg-slate-50 rounded-lg p-2">
                          <svg
                            className="w-full h-full"
                            viewBox="0 0 300 80"
                            preserveAspectRatio="xMidYMid meet"
                          >
                            <defs>
                              <linearGradient id={`gradient-${member.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
                              </linearGradient>
                            </defs>

                            {(() => {
                              const maxValue = 5;
                              const minValue = 1;
                              const padding = 10;
                              const width = 300;
                              const height = 80;
                              const chartWidth = width - 2 * padding;
                              const chartHeight = height - 2 * padding;

                              const getX = (idx: number) => {
                                if (member.performanceTrend.length === 1) {
                                  return width / 2;
                                }
                                return padding + (idx / (member.performanceTrend.length - 1)) * chartWidth;
                              };

                              const getY = (value: number) => {
                                const normalized = (value - minValue) / (maxValue - minValue);
                                return height - padding - normalized * chartHeight;
                              };

                              const linePoints = member.performanceTrend
                                .map((point, idx) => `${getX(idx)},${getY(point.average)}`)
                                .join(' ');

                              const areaPoints = `${padding},${height - padding} ${linePoints} ${width - padding},${height - padding}`;

                              return (
                                <>
                                  <line
                                    x1={padding}
                                    y1={height - padding}
                                    x2={width - padding}
                                    y2={height - padding}
                                    stroke="rgb(203, 213, 225)"
                                    strokeWidth="1"
                                  />

                                  <polygon
                                    fill={`url(#gradient-${member.id})`}
                                    points={areaPoints}
                                  />

                                  <polyline
                                    fill="none"
                                    stroke="rgb(59, 130, 246)"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    points={linePoints}
                                  />

                                  {member.performanceTrend.map((point, idx) => (
                                    <circle
                                      key={idx}
                                      cx={getX(idx)}
                                      cy={getY(point.average)}
                                      r="4"
                                      fill="white"
                                      stroke="rgb(59, 130, 246)"
                                      strokeWidth="2.5"
                                    />
                                  ))}
                                </>
                              );
                            })()}
                          </svg>
                        </div>
                        <div className="flex justify-between mt-2 px-1">
                          <span className="text-xs text-slate-500">
                            {member.performanceTrend[0].month}
                          </span>
                          {member.performanceTrend.length > 1 && (
                            <span className="text-xs text-slate-500">
                              {member.performanceTrend[member.performanceTrend.length - 1].month}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-400 text-center">No performance data yet</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {members.length === 0 && (
                <div className="text-center py-12">
                  <UserCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No team members yet</h3>
                  <p className="text-slate-600">Add team members from the Admin section to get started</p>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    );
  };

  const renderContent = () => {
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

    switch (activeTab) {
      case 'overview':
        return renderOverviewContent();
      case 'team':
        return <MyTeam />;
      case 'check-ins':
        return <CheckIns />;
      case 'members':
        return <AdminTeamMembers />;
      case 'checkins-admin':
        return <AdminCheckIns />;
      case 'checkin-prep':
        return <AdminCheckInPrep />;
      case 'growth-areas':
        return <AdminGrowthAreas />;
      case 'levels':
        return <AdminLevels />;
      case 'categories':
        return <AdminCategories />;
      case 'skills':
        return <AdminSkills />;
      case 'roles':
        return <AdminRoles />;
      case 'models':
        return <AdminMaturityModels />;
      case 'profile':
        return <AdminProfile />;
      default:
        return renderOverviewContent();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="w-8 h-8 text-slate-700" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Team Management Hub</h2>
          <p className="text-slate-600 mt-1">Manage your team, track progress, and configure development tools</p>
        </div>
      </div>

      <div className="flex gap-6">
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <nav className="p-2">
              {navSections.map((section, sectionIdx) => (
                <div key={section.label} className={sectionIdx > 0 ? 'mt-6' : ''}>
                  <h3 className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {section.label}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === item.id
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
