import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, Award, Target, MessageSquare, LogOut } from 'lucide-react';
import MaturityModel from './MaturityModel';
import GrowthAreas from './GrowthAreas';
import Preferences from './Preferences';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  start_date: string;
  status: string;
}

interface CheckIn {
  id: string;
  review_date: string;
  type: string;
  status: string;
  overall_rating: number | null;
  strengths: string | null;
  areas_for_improvement: string | null;
}

interface OneOnOne {
  id: string;
  meeting_date: string;
  topics: any;
  notes: string | null;
  action_items: string | null;
  status: string;
}

interface KRA {
  id: string;
  year: number;
  kra_data: any;
  created_at: string;
}

export default function TeamMemberPortal() {
  const { user, signOut } = useAuth();
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [oneOnOnes, setOneOnOnes] = useState<OneOnOne[]>([]);
  const [kras, setKras] = useState<KRA[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'overview' | 'maturity' | 'growth' | 'preferences'>('overview');

  useEffect(() => {
    if (user) {
      fetchTeamMemberData();
    }
  }, [user]);

  const fetchTeamMemberData = async () => {
    setLoading(true);

    // Fetch team member profile
    const { data: memberData, error: memberError } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (memberError) {
      console.error('Error fetching team member:', memberError);
      setLoading(false);
      return;
    }

    if (!memberData) {
      setLoading(false);
      return;
    }

    setTeamMember(memberData);

    // Fetch check-ins
    const { data: checkInsData } = await supabase
      .from('performance_reviews')
      .select('*')
      .eq('team_member_id', memberData.id)
      .order('review_date', { ascending: false })
      .limit(5);

    if (checkInsData) setCheckIns(checkInsData);

    // Fetch one-on-ones
    const { data: oneOnOnesData } = await supabase
      .from('one_on_ones')
      .select('*')
      .eq('team_member_id', memberData.id)
      .order('meeting_date', { ascending: false })
      .limit(5);

    if (oneOnOnesData) setOneOnOnes(oneOnOnesData);

    // Fetch KRAs
    const { data: krasData } = await supabase
      .from('kras')
      .select('*')
      .eq('team_member_id', memberData.id)
      .order('year', { ascending: false });

    if (krasData) setKras(krasData);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!teamMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <User className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Not Linked</h2>
          <p className="text-slate-600 mb-6">
            Your account is not linked to a team member profile. Please contact your manager to link your account.
          </p>
          <button
            onClick={() => signOut()}
            className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              {teamMember.avatar_url ? (
                <img
                  src={teamMember.avatar_url}
                  alt={teamMember.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-900">{teamMember.full_name}</h1>
                <p className="text-sm text-slate-600">{teamMember.role}</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="border-b border-slate-200">
            <nav className="flex gap-4 px-6">
              <button
                onClick={() => setCurrentTab('overview')}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  currentTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setCurrentTab('maturity')}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  currentTab === 'maturity'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Maturity Model
                </div>
              </button>
              <button
                onClick={() => setCurrentTab('growth')}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  currentTab === 'growth'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Growth Areas
                </div>
              </button>
              <button
                onClick={() => setCurrentTab('preferences')}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  currentTab === 'preferences'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Preferences
              </button>
            </nav>
          </div>

          <div className="p-6">
            {currentTab === 'overview' && (
              <div className="space-y-6">
                <section>
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Check-Ins</h2>
                  {checkIns.length === 0 ? (
                    <p className="text-slate-500">No check-ins yet</p>
                  ) : (
                    <div className="space-y-3">
                      {checkIns.map((checkIn) => (
                        <div key={checkIn.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-medium text-slate-900">{checkIn.type}</span>
                              <span className="ml-2 text-sm text-slate-600">
                                {new Date(checkIn.review_date).toLocaleDateString()}
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              checkIn.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {checkIn.status}
                            </span>
                          </div>
                          {checkIn.strengths && (
                            <p className="text-sm text-slate-600 mb-1">
                              <strong>Strengths:</strong> {checkIn.strengths}
                            </p>
                          )}
                          {checkIn.areas_for_improvement && (
                            <p className="text-sm text-slate-600">
                              <strong>Areas for Improvement:</strong> {checkIn.areas_for_improvement}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Recent One-on-Ones
                  </h2>
                  {oneOnOnes.length === 0 ? (
                    <p className="text-slate-500">No one-on-ones yet</p>
                  ) : (
                    <div className="space-y-3">
                      {oneOnOnes.map((oneOnOne) => (
                        <div key={oneOnOne.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-slate-900">
                              {new Date(oneOnOne.meeting_date).toLocaleDateString()}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              oneOnOne.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {oneOnOne.status}
                            </span>
                          </div>
                          {oneOnOne.notes && (
                            <p className="text-sm text-slate-600">{oneOnOne.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Key Result Areas (KRAs)
                  </h2>
                  {kras.length === 0 ? (
                    <p className="text-slate-500">No KRAs yet</p>
                  ) : (
                    <div className="space-y-3">
                      {kras.map((kra) => (
                        <div key={kra.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="font-medium text-slate-900 mb-2">
                            Year {kra.year}
                          </div>
                          <p className="text-sm text-slate-600">
                            Created {new Date(kra.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {currentTab === 'maturity' && (
              <MaturityModel teamMemberId={teamMember.id} readOnly={true} />
            )}

            {currentTab === 'growth' && (
              <GrowthAreas teamMemberId={teamMember.id} readOnly={true} />
            )}

            {currentTab === 'preferences' && (
              <Preferences teamMemberId={teamMember.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
