import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Save, Pencil, Copy, CheckCircle2 } from 'lucide-react';

interface CalendarTemplate {
  id: string;
  manager_id: string;
  template_name: string;
  subject_template: string;
  body_template: string;
  is_default: boolean;
}

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

export default function AdminCheckIns() {
  const [loading, setLoading] = useState(true);
  const [calendarTemplate, setCalendarTemplate] = useState<CalendarTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from('calendar_invite_templates')
        .select('*')
        .eq('manager_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      if (data) {
        setCalendarTemplate(data);
      } else {
        await createDefaultTemplate(user.id);
      }
    }

    setLoading(false);
  };

  const createDefaultTemplate = async (userId: string) => {
    const { data } = await supabase
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

    if (data) {
      setCalendarTemplate(data);
    }
  };

  const openEditor = () => {
    if (calendarTemplate) {
      setEditSubject(calendarTemplate.subject_template);
      setEditBody(calendarTemplate.body_template);
      setShowEditor(true);
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
      setShowEditor(false);
    }
    setSaving(false);
  };

  const copyExample = async () => {
    if (!calendarTemplate) return;

    const example = {
      subject: calendarTemplate.subject_template.replace(/\[TeamMember\]/g, 'John Smith'),
      body: calendarTemplate.body_template.replace(/\[TeamMember\]/g, 'John Smith')
    };

    const textToCopy = `Subject: ${example.subject}\n\n${example.body}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  if (loading) {
    return <div className="text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Annual Check-In Calendar Invite Template</h3>
        <p className="text-sm text-slate-600 mt-1">
          Manage your calendar invite template for annual check-ins. Use <span className="font-mono bg-slate-100 px-1 rounded">[TeamMember]</span> as a placeholder for the team member's name.
        </p>
      </div>

      {calendarTemplate && (
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-900">Current Template</h4>
              <p className="text-sm text-slate-600 mt-1">This template will be available when creating annual check-ins</p>
            </div>
            <button
              onClick={openEditor}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit Template
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Subject Template</label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-slate-900 font-mono text-sm">{calendarTemplate.subject_template}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Body Template</label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <pre className="text-slate-900 whitespace-pre-wrap font-sans text-sm">{calendarTemplate.body_template}</pre>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-3">Preview (with example name)</label>
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-slate-700 mb-2">Subject:</p>
                  <p className="text-slate-900">{calendarTemplate.subject_template.replace(/\[TeamMember\]/g, 'John Smith')}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-slate-700 mb-2">Body:</p>
                  <pre className="text-slate-900 whitespace-pre-wrap font-sans">{calendarTemplate.body_template.replace(/\[TeamMember\]/g, 'John Smith')}</pre>
                </div>
                <button
                  onClick={copyExample}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors w-full justify-center"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied Example!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Example to Clipboard
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditor && (
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
                <div className="bg-white rounded p-3 text-sm space-y-3">
                  <div>
                    <p className="font-medium text-slate-700 mb-1">Subject:</p>
                    <p className="text-slate-900">
                      {editSubject.replace(/\[TeamMember\]/g, 'John Smith')}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700 mb-1">Body:</p>
                    <pre className="text-slate-900 whitespace-pre-wrap font-sans">
                      {editBody.replace(/\[TeamMember\]/g, 'John Smith')}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowEditor(false)}
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
