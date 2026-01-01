import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import type { Database } from '../lib/supabase';
import CheckInForm from './CheckInForm';

type CheckIn = Database['public']['Tables']['performance_reviews']['Row'];

interface TeamMember {
  id: string;
  full_name: string;
}

interface CheckInWithMember extends CheckIn {
  team_member: TeamMember;
}

interface CheckInsTableProps {
  teamMemberId?: string;
  showHeader?: boolean;
}

type SortField = 'review_date' | 'type' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function CheckInsTable({ teamMemberId, showHeader = true }: CheckInsTableProps) {
  const [checkIns, setCheckIns] = useState<CheckInWithMember[]>([]);
  const [filteredCheckIns, setFilteredCheckIns] = useState<CheckInWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('review_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showForm, setShowForm] = useState(false);
  const [editingCheckIn, setEditingCheckIn] = useState<CheckIn | null>(null);

  useEffect(() => {
    fetchCheckIns();
  }, [teamMemberId]);

  useEffect(() => {
    filterAndSort();
  }, [checkIns, searchQuery, sortField, sortDirection]);

  const fetchCheckIns = async () => {
    setLoading(true);
    let query = supabase
      .from('performance_reviews')
      .select(`
        *,
        team_member:team_members(id, full_name)
      `);

    if (teamMemberId) {
      query = query.eq('team_member_id', teamMemberId);
    }

    const { data, error } = await query.order('review_date', { ascending: false });

    if (error) {
      console.error('Error fetching check-ins:', error);
    } else {
      setCheckIns(data as CheckInWithMember[] || []);
    }
    setLoading(false);
  };

  const filterAndSort = () => {
    let filtered = [...checkIns];

    if (searchQuery) {
      filtered = filtered.filter(
        (checkIn) =>
          checkIn.team_member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          checkIn.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          checkIn.quarter?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'review_date') {
        aValue = new Date(a.review_date || '').getTime();
        bValue = new Date(b.review_date || '').getTime();
      } else if (sortField === 'type') {
        aValue = a.type || '';
        bValue = b.type || '';
      } else if (sortField === 'created_at') {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCheckIns(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this check-in?')) return;

    await supabase.from('performance_reviews').delete().eq('id', id);
    fetchCheckIns();
  };

  const handleEdit = (checkIn: CheckIn) => {
    setEditingCheckIn(checkIn);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingCheckIn(null);
    setShowForm(true);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCheckIn(null);
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

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showForm) {
    return (
      <CheckInForm
        teamMemberId={teamMemberId}
        existingData={editingCheckIn}
        onSave={() => {
          fetchCheckIns();
          setShowForm(false);
          setEditingCheckIn(null);
        }}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {showHeader && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Check-ins</h1>
              <p className="text-slate-600 mt-1">Track team performance and growth</p>
            </div>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              New Check-in
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search check-ins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('review_date')}
                    className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider hover:text-slate-900 transition"
                  >
                    Date
                    {getSortIcon('review_date')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('type')}
                    className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider hover:text-slate-900 transition"
                  >
                    Type
                    {getSortIcon('type')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCheckIns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    {searchQuery ? 'No check-ins found matching your search' : 'No check-ins yet'}
                  </td>
                </tr>
              ) : (
                filteredCheckIns.map((checkIn) => (
                  <tr key={checkIn.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-slate-900">
                        {formatDate(checkIn.review_date)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-900">
                        {formatTitle(checkIn)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        {formatType(checkIn)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(checkIn)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(checkIn.id)}
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

        {filteredCheckIns.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Showing {filteredCheckIns.length} of {checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
