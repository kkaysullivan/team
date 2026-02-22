import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, CheckCircle2, Circle, Plus, Save, Trash2, User, ExternalLink, FileText, Copy, Edit2, Download } from 'lucide-react';

interface TeamMember {
  id: string;
  full_name: string;
  start_date: string;
}

interface Checklist {
  id: string;
  team_member_id: string;
  manager_id: string;
  checkin_date: string | null;
  anniversary_date: string | null;
  checklist_data: Record<string, boolean>;
  notes: string;
  status: string;
  created_at: string;
  team_member?: TeamMember;
}

interface CalendarTemplate {
  id: string;
  manager_id: string;
  template_name: string;
  subject_template: string;
  body_template: string;
  is_default: boolean;
}

const CHECKLIST_STRUCTURE = {
  'alignment': {
    title: 'Make sure the business and discipline leader are on the same page',
    items: [
      { id: 'discuss_comp', label: 'Discussed compensation change', info: 'Set up time to discuss and align on compensation' },
      { id: 'discuss_promo', label: 'Discussed promotions', info: 'Ensure comp change reflects significance if applicable' },
      { id: 'discuss_kra', label: 'Discussed KRA edits', info: 'Review if any KRA edits are needed' },
      { id: 'discuss_growth', label: 'Discussed growth track', info: 'If applicable' },
    ]
  },
  'paf': {
    title: 'Submit comp change and/or promotion',
    description: 'Once leadership is in alignment, complete the PAF process.',
    links: [
      { label: 'Comp Change PAF Guide', url: 'https://lampogroup.sharepoint.com/teams/RSL/SitePages/Comp-Change-Only.aspx' },
      { label: 'Promotion & Compensation PAF Guide', url: 'https://lampogroup.sharepoint.com/teams/RSL/SitePages/Promotion-&-Compensation.aspx' },
      { label: 'Pay Performance Guidelines', url: 'https://lampogroup.sharepoint.com/teams/RSL/SitePages/Ramsey-Perfomance-Ratings.aspx' },
    ],
    items: [
      { id: 'paf_entered', label: 'Entered comp change 45 days prior to anniversary', info: 'Must be submitted at least 45 days before' },
      { id: 'paf_approved', label: 'Verified approval in Paycom', info: 'Track and confirm approval status' },
    ]
  },
  'schedule': {
    title: 'Schedule the annual check-in',
    items: [
      { id: 'checkin_scheduled', label: 'Check-in scheduled at least 5 days before anniversary', info: 'Should occur 5+ days before Ramseyversary' },
      { id: 'time_allocated', label: 'Allocated 45-60 minutes for meeting', info: 'Block sufficient time on calendar' },
    ]
  },
  'prepare': {
    title: 'Prepare for the Annual Check-In',
    description: 'Schedule focus time to review 1:1 notes, current KRAs and/or goals from last year.',
    links: [
      { label: 'Download Annual Check-In Template', url: 'https://lampogroup-my.sharepoint.com/:w:/r/personal/kristy_sullivan_daveramsey_com/Documents/Team%20Member%20Growth/Templates/Annual-Check-In.docx?d=w5f1ac303b93843dca2f4776981166306&csf=1&web=1&e=5OyDjl' },
    ],
    items: [
      { id: 'template_downloaded', label: 'Downloaded annual check-in template', info: 'Get template from OneDrive Team Member Growth folder' },
      { id: 'people_listed', label: 'Listed people who need to fill out feedback', info: 'Identify all stakeholders' },
      { id: 'skills_completed', label: 'Filled out skills assessment', info: 'Complete your evaluation of skills' },
      { id: 'reflection_completed', label: 'Filled out my own reflection questions', info: 'Complete leader reflection' },
      { id: 'growth_areas', label: 'Identified top 3 growth areas', info: 'Document key areas for development' },
    ]
  },
  'team_member': {
    title: 'Send team member check-in reflection questions',
    items: [
      { id: 'reflection_sent', label: 'Sent reflection questions to team member', info: 'Specify when to complete and return' },
      { id: 'documents_received', label: 'Received completed documents from team member', info: 'Confirm receipt before check-in' },
    ]
  },
  'feedback': {
    title: 'Team Member Feedback Survey',
    description: 'Send this out 2 weeks prior to ensure time for completion and review.',
    items: [
      { id: 'survey_duplicated', label: 'Duplicated the feedback survey', info: 'Copy the Creative Feedback Survey template' },
      { id: 'survey_updated', label: 'Updated the survey for team member', info: 'Customize for specific team member' },
      { id: 'survey_sent', label: 'Sent survey to peers', info: 'Send initial email to all participants' },
      { id: 'reminder_halfway', label: 'Sent halfway reminder', info: 'Remind participants midway through' },
      { id: 'reminder_duedate', label: 'Sent due date reminder', info: 'Final reminder on due date' },
      { id: 'feedback_compiled', label: 'Compiled and reviewed all feedback', info: 'Read and synthesize feedback' },
    ]
  },
  'postwork': {
    title: 'Post Check-In Work',
    description: 'After the check-in meeting is complete.',
    items: [
      { id: 'docs_sent', label: 'Sent digital copies of review documents', info: 'Email all documents to team member' },
      { id: 'promo_communicated', label: 'Communicated promotion to team', info: 'If applicable - celebrate!' },
      { id: 'followups_scheduled', label: 'Scheduled follow-ups for growth areas', info: 'Set up regular check-ins on growth topics' },
      { id: 'paycom_uploaded', label: 'Confirmed team member uploaded to Paycom', info: 'Team member must upload paperwork' },
    ]
  }
};

const DEFAULT_CALENDAR_TEMPLATE = {
  subject: '[TeamMember] + Kristy | Annual Check-In',
  body: `PURPOSE

- Let's celebrate the past year here at Ramsey. 🎉
- Be ready to chat about:

    o   Tell me about your highlights of the year. 🌟

    o   Tell me about your biggest challenges. 🗻


THE DEETS

- Just bring yourself (no computer, though bring a pen/notebook if you want to take quick notes).
- Lunch is on me today 😊 🍽️ 🧋`
};

export default function AdminCheckInPrep() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newChecklistTeamMember, setNewChecklistTeamMember] = useState('');
  const [newChecklistDate, setNewChecklistDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [calendarTemplate, setCalendarTemplate] = useState<CalendarTemplate | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [showCalendarInvite, setShowCalendarInvite] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const [checklistsRes, membersRes, templateRes] = await Promise.all([
        supabase
          .from('checkin_prep_checklists')
          .select(`
            *,
            team_member:team_members(id, full_name, start_date)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('team_members')
          .select('id, full_name, start_date')
          .eq('manager_id', user.id)
          .eq('status', 'active')
          .order('full_name'),
        supabase
          .from('calendar_invite_templates')
          .select('*')
          .eq('manager_id', user.id)
          .eq('is_default', true)
          .maybeSingle()
      ]);

      if (checklistsRes.data) setChecklists(checklistsRes.data);
      if (membersRes.data) setTeamMembers(membersRes.data);

      if (templateRes.data) {
        setCalendarTemplate(templateRes.data);
      } else {
        await createDefaultTemplate(user.id);
      }
    }

    setLoading(false);
  };

  const createDefaultTemplate = async (userId: string) => {
    const { data, error } = await supabase
      .from('calendar_invite_templates')
      .insert({
        manager_id: userId,
        template_name: 'Annual Check-In Invite',
        subject_template: DEFAULT_CALENDAR_TEMPLATE.subject,
        body_template: DEFAULT_CALENDAR_TEMPLATE.body,
        is_default: true
      })
      .select()
      .single();

    if (!error && data) {
      setCalendarTemplate(data);
    }
  };

  const createNewChecklist = async () => {
    if (!newChecklistTeamMember) return;

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const member = teamMembers.find(m => m.id === newChecklistTeamMember);

    const { data, error } = await supabase
      .from('checkin_prep_checklists')
      .insert({
        team_member_id: newChecklistTeamMember,
        manager_id: user.id,
        checkin_date: newChecklistDate || null,
        anniversary_date: member?.start_date || null,
        checklist_data: {},
        status: 'not_started'
      })
      .select(`
        *,
        team_member:team_members(id, full_name, start_date)
      `)
      .single();

    if (!error && data) {
      setChecklists([data, ...checklists]);
      setSelectedChecklist(data);
      setShowNewForm(false);
      setNewChecklistTeamMember('');
      setNewChecklistDate('');
    }

    setSaving(false);
  };

  const toggleChecklistItem = async (itemId: string) => {
    if (!selectedChecklist) return;

    const updatedData = {
      ...selectedChecklist.checklist_data,
      [itemId]: !selectedChecklist.checklist_data[itemId]
    };

    const totalItems = Object.values(CHECKLIST_STRUCTURE).reduce(
      (sum, section) => sum + section.items.length,
      0
    );
    const completedItems = Object.values(updatedData).filter(Boolean).length;
    const newStatus = completedItems === 0 ? 'not_started' :
                     completedItems === totalItems ? 'completed' : 'in_progress';

    const { error } = await supabase
      .from('checkin_prep_checklists')
      .update({
        checklist_data: updatedData,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedChecklist.id);

    if (!error) {
      const updated = {
        ...selectedChecklist,
        checklist_data: updatedData,
        status: newStatus
      };
      setSelectedChecklist(updated);
      setChecklists(checklists.map(c => c.id === updated.id ? updated : c));
    }
  };

  const updateNotes = async (notes: string) => {
    if (!selectedChecklist) return;

    const { error } = await supabase
      .from('checkin_prep_checklists')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', selectedChecklist.id);

    if (!error) {
      const updated = { ...selectedChecklist, notes };
      setSelectedChecklist(updated);
      setChecklists(checklists.map(c => c.id === updated.id ? updated : c));
    }
  };

  const deleteChecklist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this checklist?')) return;

    const { error } = await supabase
      .from('checkin_prep_checklists')
      .delete()
      .eq('id', id);

    if (!error) {
      setChecklists(checklists.filter(c => c.id !== id));
      if (selectedChecklist?.id === id) {
        setSelectedChecklist(null);
      }
    }
  };

  const openTemplateEditor = () => {
    if (calendarTemplate) {
      setEditSubject(calendarTemplate.subject_template);
      setEditBody(calendarTemplate.body_template);
      setShowTemplateEditor(true);
    }
  };

  const saveTemplate = async () => {
    if (!calendarTemplate) return;

    setSaving(true);
    const { error } = await supabase
      .from('calendar_invite_templates')
      .update({
        subject_template: editSubject,
        body_template: editBody,
        updated_at: new Date().toISOString()
      })
      .eq('id', calendarTemplate.id);

    if (!error) {
      setCalendarTemplate({
        ...calendarTemplate,
        subject_template: editSubject,
        body_template: editBody
      });
      setShowTemplateEditor(false);
    }
    setSaving(false);
  };

  const generateCalendarInvite = (teamMemberName: string) => {
    if (!calendarTemplate) return { subject: '', body: '' };

    return {
      subject: calendarTemplate.subject_template.replace(/\[TeamMember\]/g, teamMemberName),
      body: calendarTemplate.body_template.replace(/\[TeamMember\]/g, teamMemberName)
    };
  };

  const copyToClipboard = async (teamMemberName: string) => {
    const invite = generateCalendarInvite(teamMemberName);
    const textToCopy = `Subject: ${invite.subject}\n\n${invite.body}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'not_started': 'bg-slate-100 text-slate-700',
      'in_progress': 'bg-blue-100 text-blue-700',
      'completed': 'bg-green-100 text-green-700'
    };
    const labels = {
      'not_started': 'Not Started',
      'in_progress': 'In Progress',
      'completed': 'Completed'
    };
    return { class: badges[status as keyof typeof badges], label: labels[status as keyof typeof labels] };
  };

  const getProgress = (checklist: Checklist) => {
    const total = Object.values(CHECKLIST_STRUCTURE).reduce(
      (sum, section) => sum + section.items.length,
      0
    );
    const completed = Object.values(checklist.checklist_data).filter(Boolean).length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  if (loading) {
    return <div className="text-slate-600">Loading check-in prep checklists...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Check-In Preparation</h3>
          <p className="text-sm text-slate-600">Manage annual check-in preparation checklists</p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Checklist
        </button>
      </div>

      {showNewForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 mb-3">Create New Checklist</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Team Member
              </label>
              <select
                value={newChecklistTeamMember}
                onChange={(e) => setNewChecklistTeamMember(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select team member...</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Check-In Date
              </label>
              <input
                type="date"
                value={newChecklistDate}
                onChange={(e) => setNewChecklistDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={createNewChecklist}
              disabled={!newChecklistTeamMember || saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Creating...' : 'Create Checklist'}
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h4 className="font-semibold text-slate-700">Active Checklists</h4>
          {checklists.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">No checklists yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {checklists.map((checklist) => {
                const progress = getProgress(checklist);
                const statusBadge = getStatusBadge(checklist.status);
                return (
                  <div
                    key={checklist.id}
                    onClick={() => setSelectedChecklist(checklist)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedChecklist?.id === checklist.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-900 truncate">
                          {checklist.team_member?.full_name}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${statusBadge.class}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                      <Calendar className="w-3 h-3" />
                      {checklist.checkin_date
                        ? new Date(checklist.checkin_date).toLocaleDateString()
                        : 'No date set'}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-600 flex-shrink-0">
                        {progress.completed}/{progress.total}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedChecklist ? (
            <div className="bg-white border border-slate-200 rounded-lg">
              <div className="border-b border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">
                      {selectedChecklist.team_member?.full_name}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Anniversary: {selectedChecklist.anniversary_date
                        ? new Date(selectedChecklist.anniversary_date).toLocaleDateString()
                        : 'Not set'}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteChecklist(selectedChecklist.id)}
                    className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-6 max-h-[600px] overflow-y-auto">
                {Object.entries(CHECKLIST_STRUCTURE).map(([key, section]) => (
                  <div key={key} className="space-y-3">
                    <h5 className="font-semibold text-slate-900">{section.title}</h5>
                    {section.description && (
                      <p className="text-sm text-slate-600">{section.description}</p>
                    )}
                    {section.links && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {section.links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {link.label}
                          </a>
                        ))}
                      </div>
                    )}

                    {key === 'schedule' && calendarTemplate && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                        <div className="flex items-center justify-between mb-3">
                          <h6 className="font-medium text-slate-900 text-sm">Calendar Invite Template</h6>
                          <button
                            onClick={openTemplateEditor}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit Template
                          </button>
                        </div>
                        {selectedChecklist.team_member && (
                          <div className="space-y-2">
                            <div className="bg-white rounded p-3 text-sm">
                              <p className="font-medium text-slate-700 mb-1">Subject:</p>
                              <p className="text-slate-900">
                                {generateCalendarInvite(selectedChecklist.team_member.full_name).subject}
                              </p>
                            </div>
                            <div className="bg-white rounded p-3 text-sm">
                              <p className="font-medium text-slate-700 mb-1">Body:</p>
                              <pre className="text-slate-900 whitespace-pre-wrap font-sans">
                                {generateCalendarInvite(selectedChecklist.team_member.full_name).body}
                              </pre>
                            </div>
                            <button
                              onClick={() => copyToClipboard(selectedChecklist.team_member!.full_name)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full justify-center"
                            >
                              {copiedInvite ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  Copy Calendar Invite
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      {section.items.map((item) => {
                        const isChecked = selectedChecklist.checklist_data[item.id] || false;
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleChecklistItem(item.id)}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                          >
                            {isChecked ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-400 group-hover:text-slate-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${isChecked ? 'text-slate-600 line-through' : 'text-slate-900'}`}>
                                {item.label}
                              </p>
                              {item.info && (
                                <p className="text-xs text-slate-500 mt-1">{item.info}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={selectedChecklist.notes}
                    onChange={(e) => updateNotes(e.target.value)}
                    placeholder="Add any additional notes or reminders..."
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-12 text-center">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Select a checklist to view details</p>
              <p className="text-sm text-slate-500 mt-1">
                Choose from the list on the left or create a new one
              </p>
            </div>
          )}
        </div>
      </div>

      {showTemplateEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Edit Calendar Invite Template</h3>
              <p className="text-sm text-slate-600 mt-1">
                Use <span className="font-mono bg-slate-100 px-1 rounded">[TeamMember]</span> as a placeholder for the team member's name
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="[TeamMember] + Kristy | Annual Check-In"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Invite Body
                </label>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  placeholder="Enter the calendar invite body text..."
                  rows={12}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs font-medium text-slate-700 mb-2">Preview with example name:</p>
                <div className="bg-white rounded p-3 text-sm">
                  <p className="font-medium text-slate-700 mb-1">Subject:</p>
                  <p className="text-slate-900 mb-3">
                    {editSubject.replace(/\[TeamMember\]/g, 'John Smith')}
                  </p>
                  <p className="font-medium text-slate-700 mb-1">Body:</p>
                  <pre className="text-slate-900 whitespace-pre-wrap font-sans">
                    {editBody.replace(/\[TeamMember\]/g, 'John Smith')}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowTemplateEditor(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveTemplate}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
