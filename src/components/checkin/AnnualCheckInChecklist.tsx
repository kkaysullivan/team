import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle2, Circle, ExternalLink, Copy, Download, ChevronDown, ChevronUp, AlertTriangle, Clock, ClipboardCheck } from 'lucide-react';

interface ChecklistProps {
  teamMemberId: string;
  teamMemberName: string;
  anniversaryDate: string | null;
  checkinId?: string;
  reviewDate: string;
}

interface CalendarTemplate {
  id: string;
  subject_template: string;
  body_template: string;
}

interface ChecklistData {
  id: string;
  checklist_data: Record<string, boolean>;
  notes: string;
  review_date?: string | null;
}

const CHECKLIST_STRUCTURE = {
  'alignment': {
    title: 'Make sure the business and discipline leader are on the same page',
    deadlineType: 'anniversary',
    daysBeforeDeadline: 180,
    deadlineDescription: 'Must be completed at least 6 months (180 days) before anniversary date',
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
      {
        id: 'paf_entered',
        label: 'Entered comp change 45 days prior to anniversary',
        info: 'Must be submitted at least 45 days before',
        deadlineType: 'anniversary',
        daysBeforeDeadline: 45,
        deadlineDescription: 'Must be entered at least 45 days before anniversary date'
      },
      {
        id: 'paf_approved',
        label: 'Verified approval in Paycom',
        info: 'Track and confirm approval status',
        deadlineType: 'review',
        daysBeforeDeadline: 5,
        deadlineDescription: 'Must be verified at least 5 days before review date'
      },
    ]
  },
  'schedule': {
    title: 'Schedule the annual check-in',
    hasCalendarTemplate: true,
    deadlineType: 'anniversary',
    daysBeforeDeadline: 45,
    deadlineDescription: 'Must be scheduled at least 45 days before anniversary date. Check-in must occur at least 5 days before anniversary date.',
    items: [
      {
        id: 'checkin_scheduled',
        label: 'Sent calendar invite',
        info: 'Send invite at least 45 days before anniversary, with meeting scheduled at least 5 days before anniversary',
        deadlineType: 'anniversary',
        daysBeforeDeadline: 45,
        deadlineDescription: 'Must schedule at least 45 days before anniversary, with meeting date at least 5 days before anniversary'
      },
      { id: 'time_allocated', label: 'Allocated 45-60 minutes for meeting', info: 'Block sufficient time on calendar (minimum 45 minutes, maximum 60 minutes)' },
    ]
  },
  'team_member': {
    title: 'Send team member check-in reflection questions',
    hasEmailTemplate: true,
    deadlineType: 'review',
    daysBeforeDeadline: 45,
    deadlineDescription: 'Should be sent on the same day the calendar invite is scheduled (at least 45 days before anniversary)',
    items: [
      {
        id: 'reflection_sent',
        label: 'Sent reflection questions email',
        info: 'Send on same day as calendar invite',
        deadlineType: 'anniversary',
        daysBeforeDeadline: 45,
        deadlineDescription: 'Send on the same day the calendar invite is scheduled'
      },
    ]
  },
  'prepare': {
    title: 'Prepare for the Annual Check-In',
    description: 'Schedule focus time to review 1:1 notes, current KRAs and/or goals from last year.',
    deadlineType: 'review',
    daysBeforeDeadline: 2,
    deadlineDescription: 'Must be completed at least 2 days before the annual check-in review date',
    links: [
      { label: 'Download Annual Check-In Template', url: 'https://lampogroup-my.sharepoint.com/:w:/r/personal/kristy_sullivan_daveramsey_com/Documents/Team%20Member%20Growth/Templates/Annual-Check-In.docx?d=w5f1ac303b93843dca2f4776981166306&csf=1&web=1&e=5OyDjl' },
    ],
    items: [
      { id: 'documents_received', label: 'Received completed check-in questions', info: 'Confirm receipt before check-in' },
      { id: 'template_downloaded', label: 'Downloaded annual check-in template', info: 'Get template from OneDrive Team Member Growth folder' },
      { id: 'people_listed', label: 'Listed people who need to fill out feedback', info: 'Identify all stakeholders' },
      { id: 'skills_completed', label: 'Filled out skills assessment', info: 'Complete your evaluation of skills' },
      { id: 'reflection_completed', label: 'Filled out my own reflection questions', info: 'Complete leader reflection' },
      { id: 'growth_areas', label: 'Identified top 3 growth areas', info: 'Document key areas for development' },
    ]
  },
  'feedback': {
    title: 'Team Member Feedback Survey',
    description: 'Send this out 2 weeks prior to ensure time for completion and review.',
    hasPeerFeedbackTemplate: true,
    deadlineType: 'review',
    daysBeforeDeadline: 14,
    deadlineDescription: 'Must be sent to peers at least 2 weeks (14 days) before the annual check-in review date',
    items: [
      { id: 'survey_duplicated', label: 'Duplicated the feedback survey', info: 'Copy the Creative Feedback Survey template' },
      { id: 'survey_updated', label: 'Updated the survey for team member', info: 'Customize for specific team member' },
      {
        id: 'survey_sent',
        label: 'Sent survey emails to peers',
        info: 'Send initial email to all participants',
        deadlineType: 'review',
        daysBeforeDeadline: 14,
        deadlineDescription: 'Must be sent at least 2 weeks (14 days) before the annual check-in date'
      },
      { id: 'feedback_compiled', label: 'Compiled and reviewed all feedback', info: 'Read and synthesize feedback' },
    ]
  },
  'postwork': {
    title: 'Post Check-In Work',
    description: 'After the check-in meeting is complete.',
    deadlineType: 'review',
    daysBeforeDeadline: 0,
    deadlineDescription: 'Must be completed on the day of the annual check-in, after the meeting',
    items: [
      { id: 'docs_sent', label: 'Sent digital copies of review documents', info: 'Email all documents to team member' },
      { id: 'promo_communicated', label: 'Communicated promotion to team', info: 'If applicable - celebrate!' },
      { id: 'followups_scheduled', label: 'Scheduled follow-ups for growth areas', info: 'Set up regular check-ins on growth topics' },
      { id: 'paycom_uploaded', label: 'Confirmed team member uploaded to Paycom', info: 'Team member must upload paperwork' },
    ]
  }
};

const getNextAnniversaryDate = (anniversaryDateString: string | null, reviewDateString: string | null): string | null => {
  if (!anniversaryDateString) return null;

  const originalDate = new Date(anniversaryDateString);
  const month = originalDate.getMonth();
  const day = originalDate.getDate();

  const referenceYear = reviewDateString
    ? new Date(reviewDateString).getFullYear()
    : new Date().getFullYear();

  const thisYearAnniversary = new Date(referenceYear, month, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (thisYearAnniversary >= today) {
    return thisYearAnniversary.toISOString().split('T')[0];
  } else {
    const nextYearAnniversary = new Date(referenceYear + 1, month, day);
    return nextYearAnniversary.toISOString().split('T')[0];
  }
};

const calculateDeadline = (baseDate: string, daysBeforeDeadline: number): Date => {
  const deadline = new Date(baseDate);
  deadline.setDate(deadline.getDate() - daysBeforeDeadline);
  return deadline;
};

const getDeadlineStatus = (
  deadlineType: 'anniversary' | 'review' | undefined,
  daysBeforeDeadline: number | undefined,
  anniversaryDate: string | null,
  reviewDate: string | null
): { status: 'ok' | 'warning' | 'overdue'; deadline: Date | null; daysUntil: number | null } => {
  if (!deadlineType || daysBeforeDeadline === undefined) {
    return { status: 'ok', deadline: null, daysUntil: null };
  }

  const baseDate = deadlineType === 'anniversary' ? anniversaryDate : reviewDate;
  if (!baseDate) {
    return { status: 'ok', deadline: null, daysUntil: null };
  }

  const deadline = calculateDeadline(baseDate, daysBeforeDeadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return { status: 'overdue', deadline, daysUntil };
  } else if (daysUntil <= 7) {
    return { status: 'warning', deadline, daysUntil };
  } else {
    return { status: 'ok', deadline, daysUntil };
  }
};

export default function AnnualCheckInChecklist({ teamMemberId, teamMemberName, anniversaryDate, checkinId, reviewDate }: ChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistData | null>(null);
  const [calendarTemplate, setCalendarTemplate] = useState<CalendarTemplate | null>(null);
  const [managerName, setManagerName] = useState<string>('Manager');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedCalendarTemplate, setCopiedCalendarTemplate] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPeerFeedback, setCopiedPeerFeedback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  const effectiveAnniversaryDate = getNextAnniversaryDate(anniversaryDate, reviewDate);

  useEffect(() => {
    fetchData();
  }, [teamMemberId, checkinId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const [checklistRes, templateRes, teamMemberRes] = await Promise.all([
        supabase
          .from('checkin_prep_checklists')
          .select('*')
          .eq('team_member_id', teamMemberId)
          .eq('manager_id', user.id)
          .maybeSingle(),
        supabase
          .from('calendar_invite_templates')
          .select('*')
          .eq('manager_id', user.id)
          .eq('is_default', true)
          .maybeSingle(),
        supabase
          .from('team_members')
          .select('manager_id')
          .eq('id', teamMemberId)
          .maybeSingle()
      ]);

      if (checklistRes.data) {
        setChecklist(checklistRes.data);
      } else {
        await createChecklist(user.id);
      }

      if (templateRes.data) {
        setCalendarTemplate(templateRes.data);
      }

      if (teamMemberRes.data?.manager_id) {
        const { data: managerData } = await supabase
          .from('team_members')
          .select('full_name')
          .eq('manager_id', teamMemberRes.data.manager_id)
          .maybeSingle();

        if (managerData?.full_name) {
          setManagerName(managerData.full_name.split(' ')[0]);
        } else {
          setManagerName(user.email?.split('@')[0] || 'Manager');
        }
      }
    }

    setLoading(false);
  };

  const createChecklist = async (managerId: string) => {
    const { data } = await supabase
      .from('checkin_prep_checklists')
      .insert({
        team_member_id: teamMemberId,
        manager_id: managerId,
        anniversary_date: anniversaryDate,
        checklist_data: {},
        notes: '',
        status: 'not_started',
        review_date: null
      })
      .select()
      .single();

    if (data) {
      setChecklist(data);
    }
  };

  const toggleChecklistItem = async (itemId: string) => {
    if (!checklist) return;

    const newData = {
      ...checklist.checklist_data,
      [itemId]: !checklist.checklist_data[itemId]
    };

    const { error } = await supabase
      .from('checkin_prep_checklists')
      .update({
        checklist_data: newData,
        updated_at: new Date().toISOString()
      })
      .eq('id', checklist.id);

    if (!error) {
      setChecklist({ ...checklist, checklist_data: newData });
    }
  };

  const updateNotes = async (notes: string) => {
    if (!checklist) return;

    const { error } = await supabase
      .from('checkin_prep_checklists')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', checklist.id);

    if (!error) {
      setChecklist({ ...checklist, notes });
    }
  };

  const generateCalendarInvite = () => {
    if (!calendarTemplate) return { subject: '', body: '' };

    return {
      subject: calendarTemplate.subject_template.replace(/\[TeamMember\]/g, teamMemberName),
      body: calendarTemplate.body_template.replace(/\[TeamMember\]/g, teamMemberName)
    };
  };

  const generateStaticCalendarInvite = () => {
    const subject = `${teamMemberName} + ${managerName} | Annual Check-In`;
    const body = `PURPOSE

- Let's celebrate the past year here at Ramsey. 🎉
- Be ready to chat about:

    o   Tell me about your highlights of the year. 🌟

    o   Tell me about your biggest challenges. 🗻


THE DEETS

- Just bring yourself (no computer, though bring a pen/notebook if you want to take quick notes).
- Lunch is on me today 😊 🍽️ 🧋`;

    return { subject, body };
  };

  const generateReflectionEmail = () => {
    let reflectionDueDateText = '[DOW, Month Day, 2026]';
    if (reviewDate) {
      const reviewDateObj = new Date(reviewDate);
      const dueDate = new Date(reviewDateObj);
      dueDate.setDate(reviewDateObj.getDate() - 3);

      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      reflectionDueDateText = dueDate.toLocaleDateString('en-US', options);
    }

    return `Hey ${teamMemberName},

I can't believe how quickly this year has flown by.

I would love for you to reflect on these questions in prep for the check-in.

Just fill out these questions and send back to me via email no later than ${reflectionDueDateText}.

1. What were some wins from this past year?
2. What were some key learnings?
3. What was your biggest fail forward? What did it teach you?
4. What will it take to level up your skills?
5. What steps are you taking to get there?
6. What do you want to have accomplished in your role by this time next year?
7. Where can you provide the most impact in the coming year?

Best,`;
  };

  const generatePeerFeedbackEmail = () => {
    const firstName = teamMemberName.split(' ')[0];
    const pronoun = 'them';
    const heShe = 'they';

    let feedbackDueDateText = '[DOW, Month Day, 2026]';
    if (reviewDate) {
      const reviewDateObj = new Date(reviewDate);
      const dueDate = new Date(reviewDateObj);
      dueDate.setDate(reviewDateObj.getDate() - 3);

      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      feedbackDueDateText = dueDate.toLocaleDateString('en-US', options);
    }

    return `Subject: ${teamMemberName} Peer Feedback for Annual Check-In 2026

Hi ___,

I'm gathering feedback for ${teamMemberName}'s 2026 Annual Check-In, and I'd value your input.

You've worked closely with ${pronoun}, and your perspective will help paint a clear picture of where ${heShe} is strong and where ${heShe} can grow.

The survey includes three short questions. It should take less than five minutes to complete. A few honest sentences go a long way.

Please submit your feedback by ${feedbackDueDateText}:

[${teamMemberName} Peer Feedback Survey Annual Check-In 2026] URL

Thanks for taking a few minutes to invest in ${teamMemberName}'s development. It truly makes a difference.

Best,`;
  };

  const copyToClipboard = async () => {
    const invite = generateCalendarInvite();
    const textToCopy = `Subject: ${invite.subject}\n\n${invite.body}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  const copyCalendarTemplate = async () => {
    const invite = generateStaticCalendarInvite();
    const textToCopy = `Subject: ${invite.subject}\n\n${invite.body}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedCalendarTemplate(true);
      setTimeout(() => setCopiedCalendarTemplate(false), 2000);
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  const copyEmailTemplate = async () => {
    const emailText = generateReflectionEmail();

    try {
      await navigator.clipboard.writeText(emailText);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  const copyPeerFeedbackTemplate = async () => {
    const emailText = generatePeerFeedbackEmail();

    try {
      await navigator.clipboard.writeText(emailText);
      setCopiedPeerFeedback(true);
      setTimeout(() => setCopiedPeerFeedback(false), 2000);
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-slate-600 text-sm">Loading checklist...</p>
      </div>
    );
  }

  if (!checklist) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-blue-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <h4 className="font-bold text-slate-900 text-lg">Annual Check-In Preparation Checklist</h4>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-600" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-slate-200 space-y-6 max-h-[600px] overflow-y-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <h5 className="font-semibold text-slate-900 text-sm">Important Dates</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Anniversary Date
                </label>
                <input
                  type="date"
                  value={anniversaryDate || ''}
                  disabled
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Review Date (Annual Check-In Date)
                </label>
                <input
                  type="date"
                  value={reviewDate}
                  disabled
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600 text-sm"
                />
              </div>
            </div>
            {effectiveAnniversaryDate && reviewDate && (
              <div className="text-xs text-slate-600">
                <p>Days between review and anniversary: {Math.ceil((new Date(effectiveAnniversaryDate).getTime() - new Date(reviewDate).getTime()) / (1000 * 60 * 60 * 24))} days</p>
              </div>
            )}
          </div>

          {Object.entries(CHECKLIST_STRUCTURE).map(([key, section]) => {
            const sectionDeadline = getDeadlineStatus(
              (section as any).deadlineType,
              (section as any).daysBeforeDeadline,
              effectiveAnniversaryDate,
              reviewDate
            );

            const allItemsComplete = section.items.every(item => checklist.checklist_data[item.id] || false);
            const isPastDeadline = sectionDeadline.deadline && sectionDeadline.status === 'overdue';

            return (
              <div key={key} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-lg mb-1">{section.title}</h4>
                    {(section as any).deadlineDescription && sectionDeadline.deadline && !allItemsComplete && (
                      <p className="text-xs text-slate-500 mt-1">
                        {(section as any).deadlineDescription}
                      </p>
                    )}
                  </div>
                  {sectionDeadline.deadline && (
                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded font-medium ${
                      allItemsComplete
                        ? 'bg-green-100 text-green-800'
                        : isPastDeadline
                        ? 'bg-red-100 text-red-800'
                        : sectionDeadline.status === 'warning'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {allItemsComplete ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed</span>
                        </>
                      ) : isPastDeadline ? (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>Overdue by {Math.abs(sectionDeadline.daysUntil!)} days</span>
                        </>
                      ) : sectionDeadline.status === 'warning' ? (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Due in {sectionDeadline.daysUntil} days</span>
                        </>
                      ) : (
                        <span>{sectionDeadline.daysUntil} days remaining</span>
                      )}
                    </div>
                  )}
                </div>
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
                      {link.label.includes('Download') ? (
                        <Download className="w-3 h-3" />
                      ) : (
                        <ExternalLink className="w-3 h-3" />
                      )}
                      {link.label}
                    </a>
                  ))}
                </div>
              )}

              {key === 'schedule' && (section as any).hasCalendarTemplate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                  <h6 className="font-medium text-slate-900 text-sm mb-3">Calendar Invite for {teamMemberName}</h6>
                  <div className="space-y-2">
                    <div className="bg-white rounded p-3 text-sm">
                      <p className="font-medium text-slate-700 mb-1">Subject:</p>
                      <p className="text-slate-900">{generateStaticCalendarInvite().subject}</p>
                    </div>
                    <div className="bg-white rounded p-3 text-sm">
                      <p className="font-medium text-slate-700 mb-1">Body:</p>
                      <pre className="text-slate-900 whitespace-pre-wrap font-sans">
                        {generateStaticCalendarInvite().body}
                      </pre>
                    </div>
                    <button
                      onClick={copyCalendarTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full justify-center text-sm"
                    >
                      {copiedCalendarTemplate ? (
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
                </div>
              )}

              {key === 'team_member' && (section as any).hasEmailTemplate && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                  <h6 className="font-medium text-slate-900 text-sm mb-3">Reflection Questions Email for {teamMemberName}</h6>
                  <div className="space-y-2">
                    <div className="bg-white rounded p-3 text-sm">
                      <pre className="text-slate-900 whitespace-pre-wrap font-sans">
                        {generateReflectionEmail()}
                      </pre>
                    </div>
                    <button
                      onClick={copyEmailTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full justify-center text-sm"
                    >
                      {copiedEmail ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Email Template
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {key === 'feedback' && (section as any).hasPeerFeedbackTemplate && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-3">
                  <h6 className="font-medium text-slate-900 text-sm mb-3">Peer Feedback Email for {teamMemberName}</h6>
                  <div className="space-y-2">
                    <div className="bg-white rounded p-3 text-sm">
                      <pre className="text-slate-900 whitespace-pre-wrap font-sans">
                        {generatePeerFeedbackEmail()}
                      </pre>
                    </div>
                    <button
                      onClick={copyPeerFeedbackTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors w-full justify-center text-sm"
                    >
                      {copiedPeerFeedback ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Peer Feedback Template
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {section.items.map((item) => {
                  const isChecked = checklist.checklist_data[item.id] || false;
                  const itemDeadline = getDeadlineStatus(
                    (item as any).deadlineType,
                    (item as any).daysBeforeDeadline,
                    effectiveAnniversaryDate,
                    reviewDate
                  );

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group ${
                        !isChecked && itemDeadline.status === 'overdue'
                          ? 'border-2 border-red-300 bg-red-50'
                          : !isChecked && itemDeadline.status === 'warning'
                          ? 'border-2 border-orange-300 bg-orange-50'
                          : ''
                      }`}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 group-hover:text-slate-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${isChecked ? 'text-slate-600 line-through' : 'text-slate-900'}`}>
                            {item.label}
                          </p>
                          {!isChecked && itemDeadline.deadline && (
                            <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                              itemDeadline.status === 'overdue'
                                ? 'bg-red-200 text-red-900'
                                : itemDeadline.status === 'warning'
                                ? 'bg-orange-200 text-orange-900'
                                : 'bg-green-200 text-green-900'
                            }`}>
                              {itemDeadline.status === 'overdue'
                                ? `Overdue ${Math.abs(itemDeadline.daysUntil!)}d`
                                : itemDeadline.status === 'warning'
                                ? `${itemDeadline.daysUntil}d left`
                                : `${itemDeadline.daysUntil}d`
                              }
                            </span>
                          )}
                        </div>
                        {item.info && (
                          <p className="text-xs text-slate-500 mt-1">{item.info}</p>
                        )}
                        {!isChecked && (item as any).deadlineDescription && itemDeadline.deadline && (
                          <p className="text-xs text-slate-600 mt-1 italic">
                            {(item as any).deadlineDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })}

          <div className="pt-4 border-t border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={checklist.notes}
              onChange={(e) => updateNotes(e.target.value)}
              placeholder="Add any additional notes or reminders..."
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
