import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import type { Database } from '../lib/supabase';
import ReflectionQuestions from './checkin/ReflectionQuestions';
import PeerFeedback from './checkin/PeerFeedback';
import MaturitySnapshot from './checkin/MaturitySnapshot';
import GrowthAreasSection from './checkin/GrowthAreasSection';

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

export default function CheckInForm({ teamMemberId, existingData, onSave, onCancel }: CheckInFormProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMemberName, setSelectedMemberName] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    notes: false,
    reflection: false,
    peer: false,
    maturity: false,
    growth: false
  });

  const [formData, setFormData] = useState({
    team_member_id: teamMemberId || existingData?.team_member_id || '',
    type: existingData?.type || 'quarterly',
    review_date: existingData?.review_date || new Date().toISOString().split('T')[0],
    one_on_one_notes: (existingData as any)?.one_on_one_notes || '',
  });

  const [annualData, setAnnualData] = useState({
    reflection_questions: (existingData?.reflection_questions as any) || initialReflectionData,
    peer_feedback: (existingData?.peer_feedback as any) || [],
    maturity_snapshot: (existingData?.maturity_snapshot as any) || [],
    growth_areas: (existingData?.growth_areas as any) || []
  });

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
        one_on_one_notes: formData.one_on_one_notes || null,
        overall_rating: null,
        period_start: null,
        period_end: null,
      };

      if (formData.type === 'quarterly') {
        data.quarter = calculatedQuarter;
        data.year = calculatedYear;
        data.reflection_questions = null;
        data.peer_feedback = null;
        data.maturity_snapshot = null;
        data.growth_areas = null;
      } else {
        data.quarter = null;
        data.year = calculatedYear;
        data.reflection_questions = annualData.reflection_questions;
        data.peer_feedback = annualData.peer_feedback;
        data.maturity_snapshot = annualData.maturity_snapshot;
        data.growth_areas = annualData.growth_areas;
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

  const AccordionSection = ({
    title,
    sectionKey,
    children,
    onUpdate
  }: {
    title: string;
    sectionKey: string;
    children: React.ReactNode;
    onUpdate?: () => void;
  }) => (
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
          {onUpdate && existingData?.id && (
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
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          {existingData?.id ? 'Edit' : 'New'} Check-in
        </h2>

        <div className="space-y-4">
          <AccordionSection
            title="Basic Information"
            sectionKey="basic"
            onUpdate={() => updateSection({
              team_member_id: formData.team_member_id,
              type: formData.type,
              review_date: formData.review_date,
              quarter: formData.type === 'quarterly' ? calculatedQuarter : null,
              year: calculatedYear
            })}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Team Member
                  </label>
                  <select
                    required
                    disabled={!!teamMemberId}
                    value={formData.team_member_id}
                    onChange={(e) => setFormData({ ...formData, team_member_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Review Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.review_date}
                    onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {formData.type === 'quarterly' && calculatedQuarter && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Quarter
                    </label>
                    <div className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700">
                      {calculatedQuarter} {calculatedYear}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AccordionSection>

          <AccordionSection
            title="1-on-1 Notes"
            sectionKey="notes"
            onUpdate={() => updateSection({ one_on_one_notes: formData.one_on_one_notes })}
          >
            <div>
              <p className="text-sm text-slate-600 mb-3">
                Paste consolidated notes from recent 1-on-1 meetings to provide context for this check-in
              </p>
              <textarea
                value={formData.one_on_one_notes}
                onChange={(e) => setFormData({ ...formData, one_on_one_notes: e.target.value })}
                rows={8}
                placeholder="Paste your 1-on-1 notes here..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono text-sm"
              />
            </div>
          </AccordionSection>

          {formData.type === 'annual' && formData.team_member_id && (
            <>
              <AccordionSection
                title="Reflection Questions"
                sectionKey="reflection"
                onUpdate={() => updateSection({ reflection_questions: annualData.reflection_questions })}
              >
                <ReflectionQuestions
                  data={annualData.reflection_questions}
                  onChange={(data) => setAnnualData({ ...annualData, reflection_questions: data })}
                />
              </AccordionSection>

              <AccordionSection
                title="Peer Feedback"
                sectionKey="peer"
                onUpdate={() => updateSection({ peer_feedback: annualData.peer_feedback })}
              >
                <PeerFeedback
                  data={annualData.peer_feedback}
                  onChange={(data) => setAnnualData({ ...annualData, peer_feedback: data })}
                  teamMemberName={selectedMemberName}
                />
              </AccordionSection>

              <AccordionSection
                title="Maturity Model Snapshot"
                sectionKey="maturity"
                onUpdate={() => updateSection({ maturity_snapshot: annualData.maturity_snapshot })}
              >
                <MaturitySnapshot
                  data={annualData.maturity_snapshot}
                  onChange={(data) => setAnnualData({ ...annualData, maturity_snapshot: data })}
                  teamMemberId={formData.team_member_id}
                />
              </AccordionSection>

              <AccordionSection
                title="Growth Areas"
                sectionKey="growth"
                onUpdate={() => updateSection({ growth_areas: annualData.growth_areas })}
              >
                <GrowthAreasSection
                  data={annualData.growth_areas}
                  onChange={(data) => setAnnualData({ ...annualData, growth_areas: data })}
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
