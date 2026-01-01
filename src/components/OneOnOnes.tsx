import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, MessageSquare, Search, ChevronLeft, ChevronRight, ArrowUpDown, Download, ChevronDown } from 'lucide-react';
import type { Database } from '../lib/supabase';
import OneOnOneForm from './OneOnOneForm';
import * as XLSX from 'xlsx';

type OneOnOne = Database['public']['Tables']['one_on_ones']['Row'];
type TeamMember = Database['public']['Tables']['team_members']['Row'];

interface OneOnOneWithMember extends OneOnOne {
  team_member: TeamMember;
}

interface OneOnOnesProps {
  teamMemberId?: string;
  openFormInitially?: boolean;
}

type SortField = 'meeting_date' | 'team_member' | 'title';
type SortDirection = 'asc' | 'desc';

export default function OneOnOnes({ teamMemberId, openFormInitially = false }: OneOnOnesProps) {
  const { user } = useAuth();
  const [oneOnOnes, setOneOnOnes] = useState<OneOnOneWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(openFormInitially);
  const [editingOneOnOne, setEditingOneOnOne] = useState<OneOnOne | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('meeting_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  };

  const getMeetingTitle = (meeting: OneOnOneWithMember): string => {
    const weekNum = getWeekNumber(new Date(meeting.meeting_date));
    return `Week ${weekNum.toString().padStart(2, '0')}: ${meeting.team_member.full_name} 1-on-1`;
  };

  useEffect(() => {
    if (user) {
      fetchOneOnOnes();
    }
  }, [user, teamMemberId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showExportMenu && !target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  const fetchOneOnOnes = async () => {
    setLoading(true);
    let query = supabase
      .from('one_on_ones')
      .select(`
        *,
        team_member:team_members(*)
      `);

    if (teamMemberId) {
      query = query.eq('team_member_id', teamMemberId);
    }

    const { data, error } = await query.order('meeting_date', { ascending: false });

    if (!error && data) {
      setOneOnOnes(data as OneOnOneWithMember[]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this 1-on-1 note?')) return;

    await supabase
      .from('one_on_ones')
      .delete()
      .eq('id', id);

    fetchOneOnOnes();
  };

  const handleEdit = (oneOnOne: OneOnOne) => {
    setEditingOneOnOne(oneOnOne);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setEditingOneOnOne(null);
    setShowForm(false);
  };

  const handleFormSave = () => {
    handleFormClose();
    fetchOneOnOnes();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const exportToExcel = (data: OneOnOneWithMember[], filename: string) => {
    const formatDateForExport = (dateString: string) => {
      const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
      const [year, month, day] = datePart.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
    };

    const exportData = data.map((meeting) => ({
      'Title': getMeetingTitle(meeting),
      'Date': formatDateForExport(meeting.meeting_date),
      'Team Member': meeting.team_member.full_name,
      'Notes': meeting.notes || '',
      'Summary': meeting.summary || '',
      'Action Items': meeting.action_items || '',
      'Transcript': meeting.transcript || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '1-on-1 Meetings');

    const colWidths = [
      { wch: 30 }, // Title
      { wch: 15 }, // Date
      { wch: 20 }, // Team Member
      { wch: 50 }, // Notes
      { wch: 50 }, // Summary
      { wch: 50 }, // Action Items
      { wch: 50 }  // Transcript
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, filename);
    setShowExportMenu(false);
  };

  const handleExportAll = () => {
    exportToExcel(oneOnOnes, '1-on-1-meetings-all.xlsx');
  };

  const handleExportFiltered = () => {
    exportToExcel(filteredAndSortedData, '1-on-1-meetings-filtered.xlsx');
  };

  const handleExportQuarter = (quarter: number) => {
    const year = new Date().getFullYear();
    const quarterMonths: { [key: number]: [number, number] } = {
      1: [0, 2], // Jan-Mar
      2: [3, 5], // Apr-Jun
      3: [6, 8], // Jul-Sep
      4: [9, 11] // Oct-Dec
    };

    const [startMonth, endMonth] = quarterMonths[quarter];
    const filtered = oneOnOnes.filter((meeting) => {
      const date = new Date(meeting.meeting_date);
      return date.getFullYear() === year &&
             date.getMonth() >= startMonth &&
             date.getMonth() <= endMonth;
    });

    exportToExcel(filtered, `1-on-1-meetings-Q${quarter}-${year}.xlsx`);
  };

  const handleExportYear = (year: number) => {
    const filtered = oneOnOnes.filter((meeting) => {
      const date = new Date(meeting.meeting_date);
      return date.getFullYear() === year;
    });

    exportToExcel(filtered, `1-on-1-meetings-${year}.xlsx`);
  };

  const handleExportCustomRange = () => {
    if (!customStartDate || !customEndDate) {
      alert('Please select both start and end dates');
      return;
    }

    const start = new Date(customStartDate);
    const end = new Date(customEndDate);

    const filtered = oneOnOnes.filter((meeting) => {
      const date = new Date(meeting.meeting_date);
      return date >= start && date <= end;
    });

    const startStr = start.toLocaleDateString('en-US').replace(/\//g, '-');
    const endStr = end.toLocaleDateString('en-US').replace(/\//g, '-');
    exportToExcel(filtered, `1-on-1-meetings-${startStr}-to-${endStr}.xlsx`);
    setShowCustomDateRange(false);
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const getCurrentYear = () => new Date().getFullYear();
  const getAvailableYears = () => {
    const years = new Set<number>();
    oneOnOnes.forEach((meeting) => {
      years.add(new Date(meeting.meeting_date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = oneOnOnes;

    if (searchQuery) {
      filtered = oneOnOnes.filter((meeting) => {
        const searchLower = searchQuery.toLowerCase();
        const title = getMeetingTitle(meeting).toLowerCase();
        return (
          title.includes(searchLower) ||
          meeting.team_member.full_name.toLowerCase().includes(searchLower) ||
          meeting.notes?.toLowerCase().includes(searchLower) ||
          meeting.summary?.toLowerCase().includes(searchLower) ||
          meeting.mood?.toLowerCase().includes(searchLower)
        );
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'meeting_date':
          aValue = new Date(a.meeting_date).getTime();
          bValue = new Date(b.meeting_date).getTime();
          break;
        case 'team_member':
          aValue = a.team_member.full_name;
          bValue = b.team_member.full_name;
          break;
        case 'title':
          aValue = getMeetingTitle(a);
          bValue = getMeetingTitle(b);
          break;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [oneOnOnes, searchQuery, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showForm) {
    return (
      <OneOnOneForm
        teamMemberId={teamMemberId}
        existingData={editingOneOnOne}
        onSave={handleFormSave}
        onCancel={handleFormClose}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">1:1 Meetings</h1>
          <p className="text-slate-600 mt-1">Track meeting notes and conversations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative export-menu-container">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-5 h-5" />
              Export to Excel
              <ChevronDown className="w-4 h-4" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                <div className="p-2">
                  <button
                    onClick={handleExportAll}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-lg transition text-sm text-slate-700"
                  >
                    Export All Meetings
                  </button>
                  {searchQuery && (
                    <button
                      onClick={handleExportFiltered}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-lg transition text-sm text-slate-700"
                    >
                      Export Filtered Results ({filteredAndSortedData.length})
                    </button>
                  )}

                  <div className="border-t border-slate-200 my-2"></div>
                  <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase">By Quarter</div>
                  {[1, 2, 3, 4].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleExportQuarter(q)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-lg transition text-sm text-slate-700"
                    >
                      Q{q} {getCurrentYear()}
                    </button>
                  ))}

                  <div className="border-t border-slate-200 my-2"></div>
                  <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase">By Year</div>
                  {getAvailableYears().map((year) => (
                    <button
                      key={year}
                      onClick={() => handleExportYear(year)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-lg transition text-sm text-slate-700"
                    >
                      {year}
                    </button>
                  ))}

                  <div className="border-t border-slate-200 my-2"></div>
                  <button
                    onClick={() => {
                      setShowCustomDateRange(!showCustomDateRange);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-lg transition text-sm text-slate-700 font-medium"
                  >
                    Custom Date Range...
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            New 1-on-1
          </button>
        </div>
      </div>

      {showCustomDateRange && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Export Custom Date Range</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleExportCustomRange}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition whitespace-nowrap"
              >
                Export
              </button>
              <button
                onClick={() => {
                  setShowCustomDateRange(false);
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search meetings by title, name, or notes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {filteredAndSortedData.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchQuery ? 'No matching meetings found' : 'No 1-on-1 meetings yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery ? 'Try adjusting your search' : 'Start tracking your team conversations'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5" />
                New 1-on-1
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition"
                      onClick={() => handleSort('meeting_date')}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center gap-2">
                        Title
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedData.map((meeting) => (
                    <tr key={meeting.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">
                          {(() => {
                            const datePart = meeting.meeting_date.includes('T')
                              ? meeting.meeting_date.split('T')[0]
                              : meeting.meeting_date;
                            const [year, month, day] = datePart.split('-');
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleEdit(meeting)}
                          className="flex items-center gap-3 w-full text-left hover:opacity-70 transition"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="text-sm font-medium text-slate-900 hover:text-blue-600">
                            {getMeetingTitle(meeting)}
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(meeting)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(meeting.id)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of{' '}
                  {filteredAndSortedData.length} meetings
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg transition ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
