import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  X,
  TrendingUp,
  Camera,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import type { Database } from '../lib/supabase';
import MaturityModel from './MaturityModel';
import PersonalityAssessment from './PersonalityAssessment';
import OneOnOnesTable from './OneOnOnesTable';
import OneOnOneForm from './OneOnOneForm';

type TeamMember = Database['public']['Tables']['team_members']['Row'];
type OneOnOne = Database['public']['Tables']['one_on_ones']['Row'];
type PerformanceReview = Database['public']['Tables']['performance_reviews']['Row'];
type GrowthOpportunity = Database['public']['Tables']['growth_opportunities']['Row'];

interface TeamMemberDashboardProps {
  memberId: string;
  onClose: () => void;
}

export default function TeamMemberDashboard({ memberId, onClose }: TeamMemberDashboardProps) {
  const [member, setMember] = useState<TeamMember | null>(null);
  const [oneOnOnes, setOneOnOnes] = useState<OneOnOne[]>([]);
  const [upcomingQuarterly, setUpcomingQuarterly] = useState<PerformanceReview | null>(null);
  const [upcomingAnnual, setUpcomingAnnual] = useState<PerformanceReview | null>(null);
  const [growthOpportunities, setGrowthOpportunities] = useState<GrowthOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showingOneOnOneForm, setShowingOneOnOneForm] = useState(false);
  const [editingOneOnOne, setEditingOneOnOne] = useState<OneOnOne | null>(null);
  const [showingAllOneOnOnes, setShowingAllOneOnOnes] = useState(false);

  useEffect(() => {
    fetchData();
  }, [memberId]);

  const fetchData = async () => {
    setLoading(true);

    const [memberResult, oneOnOnesResult, quarterlyResult, annualResult, growthResult] = await Promise.all([
      supabase.from('team_members').select('*').eq('id', memberId).maybeSingle(),
      supabase.from('one_on_ones').select('*').eq('team_member_id', memberId).order('meeting_date', { ascending: false }).limit(4),
      supabase.from('performance_reviews').select('*').eq('team_member_id', memberId).eq('type', 'quarterly').order('review_date', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('performance_reviews').select('*').eq('team_member_id', memberId).eq('type', 'annual').order('review_date', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('growth_opportunities').select('*').eq('team_member_id', memberId).order('priority').limit(3)
    ]);

    setMember(memberResult.data);
    setOneOnOnes(oneOnOnesResult.data || []);
    setUpcomingQuarterly(quarterlyResult.data);
    setUpcomingAnnual(annualResult.data);
    setGrowthOpportunities(growthResult.data || []);
    setLoading(false);
  };

  const handleDeleteOneOnOne = async (id: string) => {
    if (!confirm('Are you sure you want to delete this 1:1?')) return;

    await supabase.from('one_on_ones').delete().eq('id', id);
    fetchData();
  };

  const handleEditOneOnOne = (oneOnOne: OneOnOne) => {
    setEditingOneOnOne(oneOnOne);
    setShowingOneOnOneForm(true);
  };

  const handleNewOneOnOne = () => {
    setEditingOneOnOne(null);
    setShowingOneOnOneForm(true);
  };

  const handleFormCancel = () => {
    setShowingOneOnOneForm(false);
    setEditingOneOnOne(null);
  };

  const formatDate = (dateString: string) => {
    const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
    const [year, month, day] = datePart.split('-');
    if (!year || !month || !day) return dateString;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthIndex = parseInt(month) - 1;
    const dayNum = parseInt(day);
    const yearNum = parseInt(year);

    const date = new Date(yearNum, monthIndex, dayNum);
    const dayOfWeek = dayNames[date.getDay()];

    return `${dayOfWeek}, ${monthNames[monthIndex]} ${dayNum}, ${yearNum}`;
  };

  const getUpcomingDate = (lastDate: string | null, intervalDays: number) => {
    if (!lastDate) return 'Not scheduled';

    const last = new Date(lastDate + 'T00:00:00');
    const next = new Date(last);
    next.setDate(next.getDate() + intervalDays);

    return formatDate(next.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!member) {
    return <div>Member not found</div>;
  }

  if (showingAllOneOnOnes) {
    return (
      <OneOnOnesTable
        memberId={memberId}
        memberName={member.full_name}
        onBack={() => setShowingAllOneOnOnes(false)}
      />
    );
  }

  if (showingOneOnOneForm) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center text-sm text-slate-600 mb-4">
            <button
              onClick={onClose}
              className="hover:text-slate-900 transition"
            >
              My Team
            </button>
            <ChevronRight className="w-4 h-4 mx-2" />
            <button
              onClick={handleFormCancel}
              className="hover:text-slate-900 transition"
            >
              {member.full_name}
            </button>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-slate-900 font-medium">
              {editingOneOnOne ? 'Edit 1:1' : 'New 1:1'}
            </span>
          </div>
        </div>
        <OneOnOneForm
          memberId={memberId}
          memberName={member.full_name}
          existingData={editingOneOnOne}
          onSave={() => {
            fetchData();
            setShowingOneOnOneForm(false);
            setEditingOneOnOne(null);
          }}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center text-sm text-slate-600 mb-4">
          <button
            onClick={onClose}
            className="hover:text-slate-900 transition"
          >
            My Team
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-slate-900 font-medium">{member.full_name}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{member.full_name}</h1>
            <p className="text-slate-600 mt-1">{member.role}</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent 1:1s
            </h2>
            <button
              onClick={handleNewOneOnOne}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>

          <div className="space-y-3">
            {oneOnOnes.length === 0 ? (
              <p className="text-slate-500 text-sm">No 1:1s scheduled yet</p>
            ) : (
              <>
                {oneOnOnes.map((oneOnOne) => (
                  <div key={oneOnOne.id} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900 text-sm">
                        {formatDate(oneOnOne.meeting_date)}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditOneOnOne(oneOnOne)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOneOnOne(oneOnOne.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {(oneOnOne.morale || oneOnOne.stress || oneOnOne.workload) && (
                      <div className="flex gap-2 mt-2">
                        {oneOnOne.morale && (
                          <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                            Morale: {oneOnOne.morale}/5
                          </span>
                        )}
                        {oneOnOne.stress && (
                          <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700">
                            Stress: {oneOnOne.stress}/5
                          </span>
                        )}
                        {oneOnOne.workload && (
                          <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                            Workload: {oneOnOne.workload}/5
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setShowingAllOneOnOnes(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition text-sm font-medium"
                >
                  View All 1:1s
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Upcoming Quarterly Check-in
            </h2>
            <p className="text-slate-600">
              {upcomingQuarterly ? getUpcomingDate(upcomingQuarterly.review_date, 90) : 'Not scheduled'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              Upcoming Annual Check-in
            </h2>
            <p className="text-slate-600">
              {upcomingAnnual ? getUpcomingDate(upcomingAnnual.review_date, 365) : 'Not scheduled'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Profile
          </h2>
          <PersonalityAssessment
            data={{
              disc_d: member.disc_d,
              disc_i: member.disc_i,
              disc_s: member.disc_s,
              disc_c: member.disc_c,
              enneagram_primary: member.enneagram_primary,
              enneagram_wing: member.enneagram_wing,
              working_genius: member.working_genius,
            }}
            onChange={() => {}}
            readOnly={true}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top 3 Growth Opportunities
          </h2>
          <div className="space-y-3">
            {growthOpportunities.length === 0 ? (
              <p className="text-slate-500 text-sm">No growth opportunities defined yet</p>
            ) : (
              growthOpportunities.map((opportunity) => (
                <div key={opportunity.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium flex-shrink-0">
                      #{opportunity.priority}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{opportunity.opportunity}</p>
                      {opportunity.action_plan && (
                        <p className="text-xs text-slate-600 mt-1">{opportunity.action_plan}</p>
                      )}
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${
                        opportunity.status === 'active' ? 'bg-yellow-100 text-yellow-700' :
                        opportunity.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {opportunity.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Maturity Model Rankings
        </h2>
        <MaturityModel teamMemberId={memberId} />
      </div>
    </div>
  );
}
