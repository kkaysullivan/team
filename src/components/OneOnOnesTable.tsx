import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { Database } from '../lib/supabase';
import OneOnOneForm from './OneOnOneForm';

type OneOnOne = Database['public']['Tables']['one_on_ones']['Row'];

interface OneOnOnesTableProps {
  memberId: string;
  memberName: string;
  onBack: () => void;
}

type SortField = 'meeting_date' | 'morale' | 'stress' | 'workload' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function OneOnOnesTable({ memberId, memberName, onBack }: OneOnOnesTableProps) {
  const [oneOnOnes, setOneOnOnes] = useState<OneOnOne[]>([]);
  const [filteredOneOnOnes, setFilteredOneOnOnes] = useState<OneOnOne[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('meeting_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showForm, setShowForm] = useState(false);
  const [editingOneOnOne, setEditingOneOnOne] = useState<OneOnOne | null>(null);

  useEffect(() => {
    fetchOneOnOnes();
  }, [memberId]);

  useEffect(() => {
    filterAndSort();
  }, [oneOnOnes, searchQuery, sortField, sortDirection]);

  const fetchOneOnOnes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('one_on_ones')
      .select('*')
      .eq('team_member_id', memberId)
      .order('meeting_date', { ascending: false });

    if (error) {
      console.error('Error fetching 1:1s:', error);
    } else {
      setOneOnOnes(data || []);
    }
    setLoading(false);
  };

  const filterAndSort = () => {
    let filtered = [...oneOnOnes];

    if (searchQuery) {
      filtered = filtered.filter(
        (oneOnOne) =>
          oneOnOne.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'meeting_date') {
        aValue = new Date(a.meeting_date).getTime();
        bValue = new Date(b.meeting_date).getTime();
      } else if (sortField === 'morale') {
        aValue = a.morale || 0;
        bValue = b.morale || 0;
      } else if (sortField === 'stress') {
        aValue = a.stress || 0;
        bValue = b.stress || 0;
      } else if (sortField === 'workload') {
        aValue = a.workload || 0;
        bValue = b.workload || 0;
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

    setFilteredOneOnOnes(filtered);
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
    if (!confirm('Are you sure you want to delete this 1:1?')) return;

    await supabase.from('one_on_ones').delete().eq('id', id);
    fetchOneOnOnes();
  };

  const handleEdit = (oneOnOne: OneOnOne) => {
    setEditingOneOnOne(oneOnOne);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingOneOnOne(null);
    setShowForm(true);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingOneOnOne(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
    const [year, month, day] = datePart.split('-');
    if (!year || !month || !day) return dateString;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(month) - 1;
    const dayNum = parseInt(day);

    return `${monthNames[monthIndex]} ${dayNum}, ${year}`;
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center text-sm text-slate-600 mb-4">
            <button onClick={onBack} className="hover:text-slate-900 transition">
              {memberName}
            </button>
            <ChevronRight className="w-4 h-4 mx-2" />
            <button onClick={handleFormCancel} className="hover:text-slate-900 transition">
              All 1:1s
            </button>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-slate-900 font-medium">
              {editingOneOnOne ? 'Edit 1:1' : 'New 1:1'}
            </span>
          </div>
        </div>
        <OneOnOneForm
          teamMemberId={memberId}
          existingData={editingOneOnOne}
          onSave={() => {
            fetchOneOnOnes();
            setShowForm(false);
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
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">1:1 Meetings</h1>
            <p className="text-slate-600 mt-1">{memberName}</p>
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            New 1:1
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search notes..."
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
                    onClick={() => handleSort('meeting_date')}
                    className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider hover:text-slate-900 transition"
                  >
                    Meeting Date
                    {getSortIcon('meeting_date')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('morale')}
                    className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider hover:text-slate-900 transition"
                  >
                    Morale
                    {getSortIcon('morale')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('stress')}
                    className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider hover:text-slate-900 transition"
                  >
                    Stress
                    {getSortIcon('stress')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('workload')}
                    className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider hover:text-slate-900 transition"
                  >
                    Workload
                    {getSortIcon('workload')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Agenda
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Preview
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOneOnOnes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    {searchQuery ? 'No 1:1s found matching your search' : 'No 1:1s yet'}
                  </td>
                </tr>
              ) : (
                filteredOneOnOnes.map((oneOnOne) => (
                  <tr key={oneOnOne.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-slate-900">
                        {formatDate(oneOnOne.meeting_date)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {oneOnOne.morale ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {oneOnOne.morale}/5
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {oneOnOne.stress ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700">
                          {oneOnOne.stress}/5
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {oneOnOne.workload ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                          {oneOnOne.workload}/5
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {oneOnOne.agenda && Array.isArray(oneOnOne.agenda) && oneOnOne.agenda.length > 0 ? (
                        <ul className="text-sm text-slate-600 space-y-1 max-w-md">
                          {oneOnOne.agenda.slice(0, 3).map((item: any, index: number) => {
                            const text = typeof item === 'string' ? item : item.text;
                            const completed = typeof item === 'object' && item.completed;
                            return (
                              <li key={index} className="truncate flex items-center gap-2">
                                {completed && <span className="text-green-600">✓</span>}
                                <span className={completed ? 'line-through text-slate-400' : ''}>
                                  {text}
                                </span>
                              </li>
                            );
                          })}
                          {oneOnOne.agenda.length > 3 && (
                            <li className="text-slate-500 italic">+{oneOnOne.agenda.length - 3} more</li>
                          )}
                        </ul>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 line-clamp-2 max-w-md">
                        {oneOnOne.notes ? oneOnOne.notes.substring(0, 100) + '...' : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(oneOnOne)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(oneOnOne.id)}
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

        {filteredOneOnOnes.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Showing {filteredOneOnOnes.length} of {oneOnOnes.length} 1:1{oneOnOnes.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
