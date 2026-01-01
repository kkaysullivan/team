import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, UserCircle, Calendar, MessageSquare, BarChart3, Camera, Target, TrendingUp } from 'lucide-react';
import type { Database } from '../lib/supabase';
import OneOnOnes from './OneOnOnes';
import CheckIns from './CheckIns';
import MaturityModel from './MaturityModel';
import PersonalityAssessment from './PersonalityAssessment';
import KRAManagement from './KRAManagement';
import Preferences from './Preferences';
import GrowthAreas from './GrowthAreas';

type TeamMember = Database['public']['Tables']['team_members']['Row'];

interface TeamMemberDetailProps {
  memberId: string;
  onBack: () => void;
}

export default function TeamMemberDetail({ memberId, onBack }: TeamMemberDetailProps) {
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'oneonones' | 'checkins' | 'maturity' | 'profile' | 'kras' | 'growth'>('oneonones');

  useEffect(() => {
    fetchMember();
  }, [memberId]);

  const fetchMember = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('team_members')
      .select('*, roles(name)')
      .eq('id', memberId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching member:', error);
    } else {
      setMember(data);
    }
    setLoading(false);
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
        <button
          onClick={onBack}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Go back
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'oneonones' as const, label: '1:1s', icon: MessageSquare },
    { id: 'checkins' as const, label: 'Check-Ins', icon: Calendar },
    { id: 'kras' as const, label: 'KRAs', icon: Target },
    { id: 'growth' as const, label: 'Growth Areas', icon: TrendingUp },
    { id: 'maturity' as const, label: 'Maturity Model', icon: BarChart3 },
    { id: 'profile' as const, label: 'Profile', icon: UserCircle },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
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
              <p className="text-sm text-slate-500 mt-2">
                {member.email} • Started {new Date(member.start_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-3 px-8 py-5 font-semibold text-base transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'oneonones' && <OneOnOnes teamMemberId={memberId} />}
          {activeTab === 'checkins' && <CheckIns teamMemberId={memberId} />}
          {activeTab === 'kras' && (
            <KRAManagement
              teamMemberId={memberId}
              teamMember={{
                id: member.id,
                full_name: member.full_name,
                position: member.position || '',
                department: member.department || '',
                role: (member.roles as any)?.name || undefined,
              }}
            />
          )}
          {activeTab === 'growth' && <GrowthAreas teamMemberId={memberId} />}
          {activeTab === 'maturity' && <MaturityModel teamMemberId={memberId} />}
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
              </div>

              <Preferences teamMemberId={memberId} />

              <div className="border-t border-slate-200 pt-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-6">Assessments</h3>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
