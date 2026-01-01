import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CircleUser as UserCircle } from 'lucide-react';
import type { Database } from '../lib/supabase';
import TeamMemberDashboard from './TeamMemberDashboard';

type TeamMember = Database['public']['Tables']['team_members']['Row'];

export default function MyTeam() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);

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
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  };

  if (viewingMemberId) {
    return (
      <TeamMemberDashboard
        memberId={viewingMemberId}
        onClose={() => setViewingMemberId(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Team</h1>
        <p className="text-slate-600 mt-1">View your team members and their development</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div
            key={member.id}
            onClick={() => setViewingMemberId(member.id)}
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
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <UserCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No team members yet</h3>
          <p className="text-slate-600">Add team members from the Admin section to get started</p>
        </div>
      )}
    </div>
  );
}
