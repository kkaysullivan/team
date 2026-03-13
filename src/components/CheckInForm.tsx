import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, ChevronDown, ChevronUp, FileDown } from 'lucide-react';
import type { Database } from '../lib/supabase';
import ReflectionQuestions from './checkin/ReflectionQuestions';
import PeerFeedback from './checkin/PeerFeedback';
import MaturitySnapshot from './checkin/MaturitySnapshot';
import GrowthAreasSection from './checkin/GrowthAreasSection';
import AnnualCheckInChecklist from './checkin/AnnualCheckInChecklist';
import { exportAnnualCheckInToWord } from '../utils/exportAnnualCheckIn';

type CheckIn = Database['public']['Tables']['performance_reviews']['Row'];
type TeamMember = Database['public']['Tables']['team_members']['Row'];

interface CheckInFormProps {
  teamMemberId?: string;
  existingData?: CheckIn | null;
  onSave: () => void;
  onCancel: () => void;
}

const initialReflectionData = {
  wins: { team_member: '', leader: '' },
  learnings: { team_member: '', leader: '' },
  fail_forward: { team_member: '', leader: '' },
  level_up: { team_member: '', leader: '' },
  steps_taking: { team_member: '', leader: '' },
  next_year_goals: { team_member: '', leader: '' },
  impact_areas: { team_member: '', leader: '' }
};

interface AccordionSectionProps {
  title: string;
  sectionKey: string;
  children: React.ReactNode;
  onUpdate?: () => void;
  expandedSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
  loading: boolean;
  existingDataId?: string;
}

function AccordionSection({
  title,
  sectionKey,
  children,
  onUpdate,
  expandedSections,
  toggleSection,
  loading,
  existingDataId
}: AccordionSectionProps) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => toggleSection(sectionKey)}
        className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition"
      >
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="w-5 h-5 text-slate-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-600" />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="p-6 bg-white">
          {children}
          {onUpdate && existingDataId && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={onUpdate}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Section'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CheckInForm({ teamMemberId, existingData, onSave, onCancel }: CheckInFormProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMemberName, setSelectedMemberName] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    checklist: false,
    reflection: false,
    peer: false,
    maturity: false,
    growth: false
  });
  const [selectedMemberAnniversary, setSelectedMemberAnniversary] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    team_member_id: teamMemberId || existingData?.team_member_id || '',
    type: existingData?.type || 'quarterly',
    review_date: existingData?.review_date || new Date().toISOString().split('T')[0],
  });

  const [reflectionQuestions, setReflectionQuestions] = useState((existingData?.reflection_questions as any) || initialReflectionData);
  const [peerFeedback, setPeerFeedback] = useState((existingData?.peer_feedback as any) || []);
  const [maturitySnapshot, setMaturitySnapshot] = useState((existingData?.maturity_snapshot as any) || []);
  const [growthAreas, setGrowthAreas] = useState((existingData?.growth_areas as any) || []);

  const handlePeerFeedbackChange = useCallback((data: any) => {
    setPeerFeedback(data);
  }, []);

  const getQuarterFromDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth();
    return `Q${Math.floor(month / 3) + 1}`;
  };

  const getYearFromDate = (dateString: string) => {
    return new Date(dateString).getFullYear();
  };

  const calculatedQuarter = formData.review_date ? getQuarterFromDate(formData.review_date) : '';
  const calculatedYear = formData.review_date ? getYearFromDate(formData.review_date) : null;

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (formData.team_member_id && members.length > 0) {
      const member = members.find(m => m.id === formData.team_member_id);
      if (member) {
        setSelectedMemberName(member.full_name);
        setSelectedMemberAnniversary(member.start_date);
      }
    }
  }, [formData.team_member_id, members]);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('status', 'active')
      .order('full_name');

    if (data) {
      setMembers(data);
      if (formData.team_member_id) {
        const member = data.find(m => m.id === formData.team_member_id);
        if (member) {
          setSelectedMemberName(member.full_name);
        }
      }
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateSection = async (sectionData: Partial<any>) => {
    if (!existingData?.id || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('performance_reviews')
        .update(sectionData)
        .eq('id', existingData.id);

      if (error) throw error;
      alert('Section updated successfully!');
    } catch (error) {
      console.error('Error updating section:', error);
      alert('Failed to update section. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const data: any = {
        team_member_id: formData.team_member_id,
        manager_id: user.id,
        type: formData.type,
        review_date: formData.review_date,
        overall_rating: null,
        period_start: null,
        period_end: null,
      };

      if (formData.type === 'quarterly') {
        data.quarter = calculatedQuarter;
        data.year = calculatedYear;
        data.reflection_questions = null;
        data.peer_feedback = null;
        data.maturity_snapshot = maturitySnapshot;
        data.growth_areas = growthAreas;
      } else {
        data.quarter = null;
        data.year = calculatedYear;
        data.reflection_questions = reflectionQuestions;
        data.peer_feedback = peerFeedback;
        data.maturity_snapshot = maturitySnapshot;
        data.growth_areas = growthAreas;
      }

      if (existingData?.id) {
        const { error } = await supabase
          .from('performance_reviews')
          .update(data)
          .eq('id', existingData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('performance_reviews')
          .insert([data]);

        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving check-in:', error);
      alert('Failed to save check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportToWord = async () => {
    if (!user || !existingData?.id) return;

    try {
      const { data: managerData } = await supabase
        .from('team_members')
        .select('full_name')
        .eq('manager_id', user.id)
        .maybeSingle();

      await exportAnnualCheckInToWord({
        teamMemberName: selectedMemberName,
        reviewDate: formData.review_date,
        managerName: managerData?.full_name || user.email || 'Manager',
        reflectionQuestions: reflectionQuestions,
        peerFeedback: peerFeedback,
        maturitySnapshot: maturitySnapshot,
        growthAreas: growthAreas,
      });
    } catch (error) {
      console.error('Error exporting to Word:', error);
      alert('Failed to export document. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {existingData?.id ? 'Edit' : 'New'} Check-in
          </h2>
          {existingData?.id && formData.type === 'annual' && (
            <button
              onClick={handleExportToWord}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <FileDown className="w-4 h-4" />
              Export to Word
            </button>
          )}
        </div>

        <div className="mb-6 pb-6 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Team Member
              </label>
              <select
                required
                disabled={!!teamMemberId}
                value={formData.team_member_id}
                onChange={(e) => setFormData({ ...formData, team_member_id: e.target.value })}
                className="w-full h-[42px] px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10"
              >
                <option value="">Select team member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full h-[42px] px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10"
              >
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Review Date {formData.type === 'quarterly' && calculatedQuarter && (
                  <span className="text-slate-600 font-normal">({calculatedQuarter} {calculatedYear})</span>
                )}
              </label>
              <input
                type="date"
                required
                value={formData.review_date}
                onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                className="w-full h-[42px] px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {existingData?.id && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => updateSection({
                  team_member_id: formData.team_member_id,
                  type: formData.type,
                  review_date: formData.review_date,
                  quarter: formData.type === 'quarterly' ? calculatedQuarter : null,
                  year: calculatedYear
                })}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Basic Information'}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">

          {formData.type === 'annual' && formData.team_member_id && (
            <>
              {selectedMemberName && (
                <AnnualCheckInChecklist
                  teamMemberId={formData.team_member_id}
                  teamMemberName={selectedMemberName}
                  anniversaryDate={selectedMemberAnniversary}
                  checkinId={existingData?.id}
                  reviewDate={formData.review_date}
                />
              )}

              <AccordionSection
                title="Reflection Questions"
                sectionKey="reflection"
                onUpdate={() => updateSection({ reflection_questions: reflectionQuestions })}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                loading={loading}
                existingDataId={existingData?.id}
              >
                <ReflectionQuestions
                  data={reflectionQuestions}
                  onChange={setReflectionQuestions}
                />
              </AccordionSection>

              <AccordionSection
                title="Peer Feedback"
                sectionKey="peer"
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                loading={loading}
                existingDataId={existingData?.id}
              >
                <PeerFeedback
                  data={peerFeedback}
                  onChange={handlePeerFeedbackChange}
                  teamMemberName={selectedMemberName || 'Team Member'}
                  checkInId={existingData?.id}
                />
              </AccordionSection>

              <AccordionSection
                title="Maturity Model Snapshot"
                sectionKey="maturity"
                onUpdate={() => updateSection({ maturity_snapshot: maturitySnapshot })}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                loading={loading}
                existingDataId={existingData?.id}
              >
                <MaturitySnapshot
                  data={maturitySnapshot}
                  onChange={setMaturitySnapshot}
                  teamMemberId={formData.team_member_id}
                />
              </AccordionSection>

              <AccordionSection
                title="Growth Areas"
                sectionKey="growth"
                onUpdate={() => updateSection({ growth_areas: growthAreas })}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                loading={loading}
                existingDataId={existingData?.id}
              >
                <GrowthAreasSection
                  data={growthAreas}
                  onChange={setGrowthAreas}
                  teamMemberId={formData.team_member_id}
                />
              </AccordionSection>
            </>
          )}

          {formData.type === 'quarterly' && formData.team_member_id && (
            <>
              <AccordionSection
                title="Maturity Model Snapshot"
                sectionKey="maturity"
                onUpdate={() => updateSection({ maturity_snapshot: maturitySnapshot })}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                loading={loading}
                existingDataId={existingData?.id}
              >
                <MaturitySnapshot
                  data={maturitySnapshot}
                  onChange={setMaturitySnapshot}
                  teamMemberId={formData.team_member_id}
                />
              </AccordionSection>

              <AccordionSection
                title="Growth Areas"
                sectionKey="growth"
                onUpdate={() => updateSection({ growth_areas: growthAreas })}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                loading={loading}
                existingDataId={existingData?.id}
              >
                <GrowthAreasSection
                  data={growthAreas}
                  onChange={setGrowthAreas}
                  teamMemberId={formData.team_member_id}
                />
              </AccordionSection>
            </>
          )}

          {!existingData?.id && (
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Check-in'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
