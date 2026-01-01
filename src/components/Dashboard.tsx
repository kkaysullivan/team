import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CircleUser as UserCircle, Users, MessageSquare, ClipboardCheck, Plus } from 'lucide-react';
import type { Database } from '../lib/supabase';
import CadenceComplianceTracker from './CadenceComplianceTracker';
import CheckInForm from './CheckInForm';

type TeamMember = Database['public']['Tables']['team_members']['Row'];

interface DashboardProps {
  onSelectMember: (memberId: string) => void;
  onNavigate?: (view: string) => void;
}

export default function Dashboard({ onSelectMember, onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckInForm, setShowCheckInForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user]);

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

    setMembers(data || []);
    setLoading(false);
  };

  if (showCheckInForm) {
    return (
      <CheckInForm
        onSave={() => setShowCheckInForm(false)}
        onCancel={() => setShowCheckInForm(false)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Team Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of your team compliance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => onNavigate?.('one-on-ones')}
          className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-6 hover:shadow-md hover:border-blue-400 transition group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">New 1:1</h3>
              <p className="text-sm text-slate-600">Schedule or record a one-on-one meeting</p>
            </div>
            <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition" />
          </div>
        </button>

        <button
          onClick={() => setShowCheckInForm(true)}
          className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-6 hover:shadow-md hover:border-green-400 transition group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition">
              <ClipboardCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">New Check-in</h3>
              <p className="text-sm text-slate-600">Create a weekly check-in entry</p>
            </div>
            <Plus className="w-6 h-6 text-slate-400 group-hover:text-green-600 transition" />
          </div>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
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
                  <div className="flex flex-col items-center text-center">
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

      <CadenceComplianceTracker />
    </div>
  );
}
