import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CircleUser as UserCircle, Users, MessageSquare, ClipboardCheck, Plus, Edit, Trash2, ArrowUpDown, ExternalLink } from 'lucide-react';
import type { Database } from '../lib/supabase';
import CadenceComplianceTracker from './CadenceComplianceTracker';
import CheckInForm from './CheckInForm';

type TeamMember = Database['public']['Tables']['team_members']['Row'];
type CheckIn = Database['public']['Tables']['performance_reviews']['Row'];

interface CheckInWithMember extends CheckIn {
  team_member: {
    id: string;
    full_name: string;
  };
}

interface DashboardProps {
  onSelectMember: (memberId: string) => void;
  onNavigate?: (view: string) => void;
}

export default function Dashboard({ onSelectMember, onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInsLoading, setCheckInsLoading] = useState(true);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [editingCheckIn, setEditingCheckIn] = useState<CheckIn | null>(null);
  const [sortField, setSortField] = useState<'date' | 'title' | 'type'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (user) {
      fetchMembers();
      fetchCheckIns();
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Team Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of your team compliance</p>
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

      <div className="mt-8 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Recent Check-Ins</h2>
                  <p className="text-sm text-slate-600">Quick access to the latest check-ins across your team</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate?.('check-ins')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                >
                  View All
                  <ExternalLink className="w-4 h-4" />
                </button>
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
          </div>

          <div className="overflow-hidden">
          {checkInsLoading ? (
            <div className="flex items-center justify-center h-48">
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
                    sortedCheckIns.map((checkIn) => (
                      <tr key={checkIn.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-slate-900">
                            {formatDate(checkIn.review_date)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900">
                              {formatTitle(checkIn)}
                            </span>
                            {(checkIn as any).one_on_one_notes && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700" title="Includes 1-on-1 notes">
                                <MessageSquare className="w-3 h-3" />
                                1-on-1
                              </span>
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
                              <Edit className="w-4 h-4" />
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
