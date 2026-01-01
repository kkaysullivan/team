import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import type { Database } from '../lib/supabase';
import OneOnOneForm from './OneOnOneForm';
import CheckInForm from './CheckInForm';

type TeamMember = Database['public']['Tables']['team_members']['Row'];
type OneOnOne = Database['public']['Tables']['one_on_ones']['Row'];
type PerformanceReview = Database['public']['Tables']['performance_reviews']['Row'];

interface CadenceStatus {
  memberId: string;
  memberName: string;
  startDate: string | null;
  oneOnOneStatus: 'overdue' | 'due-soon' | 'current';
  oneOnOneLastDate: string | null;
  quarterlyStatus: 'overdue' | 'due-soon' | 'current';
  quarterlyLastDate: string | null;
  annualStatus: 'overdue' | 'due-soon' | 'current';
  annualLastDate: string | null;
  annualExpectedDate: string | null;
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  type: 'oneOnOne' | 'quarterly' | 'annual';
  existingDate: string | null;
  onSchedule: (date: string) => void;
}

function ScheduleModal({ isOpen, onClose, memberId, memberName, type, existingDate, onSchedule }: ScheduleModalProps) {
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDate(existingDate || '');
    }
  }, [isOpen, existingDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    setLoading(true);
    try {
      await onSchedule(date);
      setDate('');
      onClose();
    } catch (error) {
      console.error('Error scheduling:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const typeLabel = type === 'oneOnOne' ? '1:1' : type === 'quarterly' ? 'Quarterly Check-in' : 'Annual Check-in';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Schedule {typeLabel}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Team Member
            </label>
            <div className="text-slate-900">{memberName}</div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CadenceComplianceTracker() {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<CadenceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOneOnOneForm, setShowOneOnOneForm] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedOneOnOne, setSelectedOneOnOne] = useState<OneOnOne | null>(null);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [selectedCheckIn, setSelectedCheckIn] = useState<PerformanceReview | null>(null);
  const [checkInType, setCheckInType] = useState<'quarterly' | 'annual'>('quarterly');
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    memberId: string;
    memberName: string;
    type: 'oneOnOne' | 'quarterly' | 'annual';
    existingDate: string | null;
  }>({
    isOpen: false,
    memberId: '',
    memberName: '',
    type: 'oneOnOne',
    existingDate: null,
  });

  useEffect(() => {
    if (user) {
      fetchCadenceStatuses();
    }
  }, [user]);

  const fetchCadenceStatuses = async () => {
    setLoading(true);

    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('*')
      .eq('status', 'active')
      .order('full_name');

    if (membersError) {
      console.error('Error fetching members:', membersError);
      setLoading(false);
      return;
    }

    const { data: oneOnOnes, error: oneOnOnesError } = await supabase
      .from('one_on_ones')
      .select('*')
      .order('meeting_date', { ascending: false });

    if (oneOnOnesError) {
      console.error('Error fetching one on ones:', oneOnOnesError);
    }

    const { data: reviews, error: reviewsError } = await supabase
      .from('performance_reviews')
      .select('*')
      .order('review_date', { ascending: false });

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

    const cadenceStatuses: CadenceStatus[] = (members || []).map((member) => {
      const memberOneOnOnes = (oneOnOnes || []).filter(
        (o) => o.team_member_id === member.id
      );
      const lastOneOnOne = memberOneOnOnes[0];

      const memberQuarterlies = (reviews || []).filter(
        (r) => r.team_member_id === member.id && r.type === 'quarterly'
      );
      const lastQuarterly = memberQuarterlies[0];

      const memberAnnuals = (reviews || []).filter(
        (r) => r.team_member_id === member.id && r.type === 'annual'
      );
      const lastAnnual = memberAnnuals[0];

      const annualExpectedDate = calculateAnnualExpectedDate(member.start_date, currentYear);

      const oneOnOneStatus = calculateOneOnOneStatus(lastOneOnOne?.meeting_date);
      const quarterlyStatus = calculateQuarterlyStatus(lastQuarterly?.review_date, lastQuarterly?.quarter, lastQuarterly?.year, currentQuarter, currentYear);
      const annualStatus = calculateAnnualStatus(lastAnnual?.review_date, annualExpectedDate, currentYear);

      return {
        memberId: member.id,
        memberName: member.full_name,
        startDate: member.start_date,
        oneOnOneStatus,
        oneOnOneLastDate: lastOneOnOne?.meeting_date || null,
        quarterlyStatus,
        quarterlyLastDate: lastQuarterly?.review_date || null,
        annualStatus,
        annualLastDate: lastAnnual?.review_date || null,
        annualExpectedDate,
      };
    });

    setStatuses(cadenceStatuses);
    setLoading(false);
  };

  const calculateOneOnOneStatus = (lastDate: string | null): 'overdue' | 'due-soon' | 'current' => {
    if (!lastDate) return 'overdue';

    const meetingDate = new Date(lastDate);
    const now = new Date();
    const daysUntilMeeting = Math.floor((meetingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilMeeting >= 0) {
      if (daysUntilMeeting <= 2) return 'due-soon';
      return 'current';
    }

    const daysSinceMeeting = Math.abs(daysUntilMeeting);
    const nextExpectedDate = new Date(meetingDate);
    nextExpectedDate.setDate(nextExpectedDate.getDate() + 21);
    const daysUntilNextExpected = Math.floor((nextExpectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilNextExpected < 0) return 'overdue';
    if (daysUntilNextExpected <= 2) return 'due-soon';
    return 'current';
  };

  const calculateQuarterlyStatus = (
    lastDate: string | null,
    lastQuarter: string | null,
    lastYear: number | null,
    currentQuarter: number,
    currentYear: number
  ): 'overdue' | 'due-soon' | 'current' => {
    const now = new Date();

    const getQuarterEndDate = (quarter: number, year: number) => {
      const endMonth = quarter * 3 - 1;
      const lastDay = new Date(year, endMonth + 1, 0).getDate();
      return new Date(year, endMonth, lastDay);
    };

    const currentQuarterEnd = getQuarterEndDate(currentQuarter, currentYear);
    const daysUntilQuarterEnd = Math.floor((currentQuarterEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (!lastDate || !lastQuarter || !lastYear) {
      if (daysUntilQuarterEnd < 0) return 'overdue';
      if (daysUntilQuarterEnd <= 14) return 'due-soon';
      return 'overdue';
    }

    const lastQ = parseInt(lastQuarter.replace('Q', ''));

    if (lastYear < currentYear - 1) return 'overdue';
    if (lastYear === currentYear - 1 && currentQuarter > 1) return 'overdue';
    if (lastYear === currentYear && lastQ < currentQuarter - 1) return 'overdue';
    if (lastYear === currentYear && lastQ === currentQuarter - 1) {
      if (daysUntilQuarterEnd <= 14) return 'due-soon';
      return 'overdue';
    }
    if (lastYear === currentYear && lastQ === currentQuarter) {
      if (daysUntilQuarterEnd <= 14) return 'due-soon';
      return 'current';
    }
    return 'current';
  };

  const calculateAnnualExpectedDate = (startDate: string | null, currentYear: number): string | null => {
    if (!startDate) return null;

    const start = new Date(startDate);
    const month = start.getMonth();
    const day = start.getDate();

    const expectedDate = new Date(currentYear, month, day);

    return expectedDate.toISOString().split('T')[0];
  };

  const calculateAnnualStatus = (lastDate: string | null, expectedDate: string | null, currentYear: number): 'overdue' | 'due-soon' | 'current' => {
    if (!expectedDate) return 'overdue';

    const expected = new Date(expectedDate);
    const now = new Date();
    const daysUntilExpected = Math.floor((expected.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (!lastDate) {
      if (daysUntilExpected < 0) return 'overdue';
      if (daysUntilExpected <= 30) return 'due-soon';
      return 'current';
    }

    const last = new Date(lastDate);

    if (last >= expected) {
      return 'current';
    }

    if (daysUntilExpected < 0) return 'overdue';
    if (daysUntilExpected <= 30) return 'due-soon';
    return 'current';
  };

  const getStatusColor = (status: 'overdue' | 'due-soon' | 'current') => {
    switch (status) {
      case 'overdue':
        return 'bg-red-500';
      case 'due-soon':
        return 'bg-yellow-500';
      case 'current':
        return 'bg-green-500';
    }
  };

  const getStatusIcon = (status: 'overdue' | 'due-soon' | 'current') => {
    switch (status) {
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      case 'due-soon':
        return <Clock className="w-4 h-4" />;
      case 'current':
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const handleSchedule = async (date: string) => {
    const { memberId, type } = modalState;

    const now = new Date(date);
    const quarter = `Q${Math.floor(now.getMonth() / 3) + 1}`;
    const year = now.getFullYear();

    const { error } = await supabase.from('performance_reviews').insert({
      team_member_id: memberId,
      manager_id: user!.id,
      review_date: date,
      type: type === 'quarterly' ? 'quarterly' : 'annual',
      quarter: type === 'quarterly' ? quarter : null,
      year: type === 'quarterly' ? year : null,
      period_start: null,
      period_end: null,
    });

    if (error) {
      console.error('Error creating check-in:', error);
      throw error;
    }

    await fetchCadenceStatuses();
  };

  const formatDateDisplay = (dateString: string) => {
    // Parse the date string in YYYY-MM-DD format without timezone conversion
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
    return `${weekday}, ${monthStr}. ${day}`;
  };

  const openScheduleModal = async (memberId: string, memberName: string, type: 'oneOnOne' | 'quarterly' | 'annual', existingDate: string | null, expectedDate: string | null = null) => {
    if (type === 'oneOnOne') {
      const { data: oneOnOnes } = await supabase
        .from('one_on_ones')
        .select('*')
        .eq('team_member_id', memberId)
        .order('meeting_date', { ascending: false })
        .limit(1);

      const oneOnOne = oneOnOnes?.[0] || null;
      if (!oneOnOne && existingDate) {
        setSelectedOneOnOne({ meeting_date: existingDate } as OneOnOne);
      } else {
        setSelectedOneOnOne(oneOnOne);
      }
      setSelectedMemberId(memberId);
      setShowOneOnOneForm(true);
    } else {
      const { data: checkIns } = await supabase
        .from('performance_reviews')
        .select('*')
        .eq('team_member_id', memberId)
        .eq('type', type)
        .order('review_date', { ascending: false })
        .limit(1);

      const checkIn = checkIns?.[0] || null;
      if (!checkIn && (existingDate || expectedDate)) {
        const dateToUse = expectedDate || existingDate;
        const now = new Date(dateToUse!);
        const quarter = `Q${Math.floor(now.getMonth() / 3) + 1}`;
        const year = now.getFullYear();

        setSelectedCheckIn({
          review_date: dateToUse,
          quarter: type === 'quarterly' ? quarter : null,
          year: type === 'quarterly' ? year : null,
        } as PerformanceReview);
      } else {
        setSelectedCheckIn(checkIn);
      }
      setSelectedMemberId(memberId);
      setCheckInType(type);
      setShowCheckInForm(true);
    }
  };

  const closeScheduleModal = () => {
    setModalState({ isOpen: false, memberId: '', memberName: '', type: 'oneOnOne', existingDate: null });
  };

  const handleOneOnOneFormClose = () => {
    setShowOneOnOneForm(false);
    setSelectedMemberId(null);
    setSelectedOneOnOne(null);
  };

  const handleOneOnOneFormSave = () => {
    setShowOneOnOneForm(false);
    setSelectedMemberId(null);
    setSelectedOneOnOne(null);
    fetchCadenceStatuses();
  };

  const handleCheckInFormClose = () => {
    setShowCheckInForm(false);
    setSelectedMemberId(null);
    setSelectedCheckIn(null);
  };

  const handleCheckInFormSave = () => {
    setShowCheckInForm(false);
    setSelectedMemberId(null);
    setSelectedCheckIn(null);
    fetchCadenceStatuses();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showOneOnOneForm && selectedMemberId) {
    return (
      <OneOnOneForm
        teamMemberId={selectedMemberId}
        existingData={selectedOneOnOne}
        onSave={handleOneOnOneFormSave}
        onCancel={handleOneOnOneFormClose}
      />
    );
  }

  if (showCheckInForm && selectedMemberId) {
    const memberName = statuses.find(s => s.memberId === selectedMemberId)?.memberName || '';
    return (
      <CheckInForm
        teamMemberId={selectedMemberId}
        memberName={memberName}
        type={checkInType}
        existingData={selectedCheckIn}
        onSave={handleCheckInFormSave}
        onCancel={handleCheckInFormClose}
      />
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Cadence Compliance Tracker</h2>
              <p className="text-sm text-slate-600">Monitor and schedule team check-ins</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Team Member
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">
                  1:1
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Quarterly
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Annual
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {statuses.map((status) => (
                <tr key={status.memberId} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{status.memberName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => openScheduleModal(status.memberId, status.memberName, 'oneOnOne', status.oneOnOneLastDate)}
                      className="flex flex-col items-center gap-2 mx-auto group"
                    >
                      <div className={`w-8 h-8 rounded-full ${getStatusColor(status.oneOnOneStatus)} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition`}>
                        {getStatusIcon(status.oneOnOneStatus)}
                      </div>
                      {status.oneOnOneLastDate && (
                        <span className="text-xs text-slate-500 text-center">
                          {formatDateDisplay(status.oneOnOneLastDate)}
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => openScheduleModal(status.memberId, status.memberName, 'quarterly', status.quarterlyLastDate)}
                      className="flex flex-col items-center gap-2 mx-auto group"
                    >
                      <div className={`w-8 h-8 rounded-full ${getStatusColor(status.quarterlyStatus)} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition`}>
                        {getStatusIcon(status.quarterlyStatus)}
                      </div>
                      {status.quarterlyLastDate && (
                        <span className="text-xs text-slate-500 text-center">
                          {formatDateDisplay(status.quarterlyLastDate)}
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => openScheduleModal(status.memberId, status.memberName, 'annual', status.annualLastDate, status.annualExpectedDate)}
                      className="flex flex-col items-center gap-2 mx-auto group"
                    >
                      <div className={`w-8 h-8 rounded-full ${getStatusColor(status.annualStatus)} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition`}>
                        {getStatusIcon(status.annualStatus)}
                      </div>
                      {(status.annualLastDate || status.annualExpectedDate) && (
                        <span className="text-xs text-slate-500 text-center">
                          {formatDateDisplay(status.annualLastDate || status.annualExpectedDate!)}
                        </span>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {statuses.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No team members</h3>
              <p className="text-slate-600">Add team members to track their check-in cadence</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-slate-600">Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-slate-600">Due Soon</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-slate-600">Overdue</span>
            </div>
          </div>
        </div>
      </div>

      <ScheduleModal
        isOpen={modalState.isOpen}
        onClose={closeScheduleModal}
        memberId={modalState.memberId}
        memberName={modalState.memberName}
        type={modalState.type}
        existingDate={modalState.existingDate}
        onSchedule={handleSchedule}
      />
    </>
  );
}
