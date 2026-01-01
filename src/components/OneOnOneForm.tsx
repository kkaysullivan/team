import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Mic, MicOff, Sparkles, Plus, Trash2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import type { Database } from '../lib/supabase';

type OneOnOne = Database['public']['Tables']['one_on_ones']['Row'];
type TeamMember = Database['public']['Tables']['team_members']['Row'];

interface AgendaItem {
  text: string;
  completed: boolean;
}

interface OneOnOneFormProps {
  teamMemberId?: string;
  existingData?: OneOnOne | null;
  onSave: () => void;
  onCancel: () => void;
}

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic',
  'list', 'bullet'
];

export default function OneOnOneForm({ teamMemberId, existingData, onSave, onCancel }: OneOnOneFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'transcript' | 'summary'>('notes');
  const [notesChanged, setNotesChanged] = useState(false);
  const recognitionRef = useRef<any>(null);
  const initialNotesRef = useRef<string>('');

  const normalizeAgenda = (agenda: any): AgendaItem[] => {
    if (!Array.isArray(agenda)) return [];
    return agenda.map(item => {
      if (typeof item === 'string') {
        return { text: item, completed: false };
      }
      return { text: item.text || '', completed: item.completed || false };
    });
  };

  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return new Date().toISOString().split('T')[0];
    const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
    return datePart;
  };

  const [formData, setFormData] = useState({
    team_member_id: existingData?.team_member_id || teamMemberId || '',
    meeting_date: formatDateForInput(existingData?.meeting_date),
    notes: existingData?.notes || '',
    transcript: existingData?.transcript || '',
    summary: existingData?.summary || '',
    agenda: normalizeAgenda(existingData?.agenda),
  });
  const [newAgendaItem, setNewAgendaItem] = useState('');

  useEffect(() => {
    fetchMembers();
    if (existingData) {
      initialNotesRef.current = existingData.notes || '';
      if (existingData.summary) {
        setActiveTab('summary');
      }
    }
  }, [existingData]);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('status', 'active');

    if (data) {
      setMembers(data);
    }
  };

  const startTranscription = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        }
      }

      if (finalTranscript) {
        setFormData(prev => ({
          ...prev,
          transcript: prev.transcript + finalTranscript
        }));
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsTranscribing(false);
    };

    recognition.onend = () => {
      if (isTranscribing) {
        recognition.start();
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsTranscribing(true);
    setActiveTab('transcript');
  };

  const stopTranscription = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsTranscribing(false);
  };

  const addAgendaItem = () => {
    if (newAgendaItem.trim()) {
      setFormData(prev => ({
        ...prev,
        agenda: [...prev.agenda, { text: newAgendaItem.trim(), completed: false }]
      }));
      setNewAgendaItem('');
    }
  };

  const removeAgendaItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      agenda: prev.agenda.filter((_, i) => i !== index)
    }));
  };

  const toggleAgendaItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      agenda: prev.agenda.map((item, i) =>
        i === index ? { ...item, completed: !item.completed } : item
      )
    }));
  };

  const handleAgendaKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAgendaItem();
    }
  };

  const generateSummary = async () => {
    setIsGeneratingSummary(true);
    setActiveTab('summary');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-meeting-summary`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: formData.notes,
          transcript: formData.transcript,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const { summary } = await response.json();

      setFormData(prev => ({ ...prev, summary }));
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary. Creating a basic summary instead.');

      const basicSummary = `<h2 class="text-2xl font-bold text-slate-900 mb-4">Meeting Summary</h2><h3 class="text-xl font-semibold text-slate-800 mb-3 mt-6">Notes</h3><p class="text-slate-700 mb-4">${formData.notes || 'No notes provided'}</p><h3 class="text-xl font-semibold text-slate-800 mb-3 mt-6">Transcript</h3><p class="text-slate-700 mb-4">${formData.transcript || 'No transcript available'}</p><h3 class="text-xl font-semibold text-slate-800 mb-3 mt-6">Next Steps</h3><ul class="list-disc list-inside space-y-2 text-slate-700"><li class="ml-4">Review action items</li><li class="ml-4">Schedule follow-up</li></ul>`;
      setFormData(prev => ({ ...prev, summary: basicSummary }));
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const data = {
        team_member_id: formData.team_member_id,
        meeting_date: formData.meeting_date,
        notes: formData.notes,
        transcript: formData.transcript,
        summary: formData.summary,
        agenda: formData.agenda,
        manager_id: user.id,
      };

      if (existingData?.id) {
        const { error } = await supabase
          .from('one_on_ones')
          .update(data)
          .eq('id', existingData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('one_on_ones')
          .insert([data]);

        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving 1:1:', error);
      alert('Failed to save meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'notes' as const, label: 'Notes' },
    ...(formData.transcript || isTranscribing ? [{ id: 'transcript' as const, label: 'Transcript' }] : []),
    ...(formData.summary ? [{ id: 'summary' as const, label: 'Summary' }] : []),
  ];

  const selectedMember = members.find(m => m.id === formData.team_member_id);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {existingData?.id ? 'Edit 1:1' : 'New 1:1 Meeting'}
          </h2>
          {selectedMember && (
            <p className="text-slate-600 mt-1">{selectedMember.full_name}</p>
          )}
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Team Member
            </label>
            <select
              required
              value={formData.team_member_id}
              onChange={(e) => setFormData({ ...formData, team_member_id: e.target.value })}
              disabled={!!teamMemberId}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-600"
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
              Meeting Date
            </label>
            <input
              type="date"
              required
              value={formData.meeting_date}
              onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Agenda
          </label>
          <div className="border border-slate-300 rounded-lg p-4 bg-slate-50">
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newAgendaItem}
                onChange={(e) => setNewAgendaItem(e.target.value)}
                onKeyPress={handleAgendaKeyPress}
                placeholder="Add agenda item..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
              <button
                type="button"
                onClick={addAgendaItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {formData.agenda.length > 0 ? (
              <ul className="space-y-2">
                {formData.agenda.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleAgendaItem(index)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className={`flex-1 ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {item.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAgendaItem(index)}
                      className="text-red-600 hover:text-red-700 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-sm text-center py-2">
                No agenda items yet. Add items above to create an agenda for this meeting.
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2 border-b border-slate-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                  )}
                  {tab.id === 'transcript' && isTranscribing && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                  )}
                </button>
              ))}
            </div>

            {(activeTab === 'notes' || (activeTab === 'transcript' && isTranscribing)) && (
              <button
                type="button"
                onClick={isTranscribing ? stopTranscription : startTranscription}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  isTranscribing
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isTranscribing ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    Stop Transcribing
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Start Transcribing
                  </>
                )}
              </button>
            )}
          </div>

          {activeTab === 'notes' && (
            <div className="space-y-3">
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={formData.notes}
                  onChange={(value) => {
                    setFormData({ ...formData, notes: value });
                    setNotesChanged(value !== initialNotesRef.current);
                  }}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="What did you discuss?"
                  className="bg-white"
                  style={{ minHeight: '300px' }}
                />
              </div>
              {(notesChanged || formData.transcript) && (
                <button
                  type="button"
                  onClick={() => {
                    generateSummary();
                    setNotesChanged(false);
                    initialNotesRef.current = formData.notes;
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Summary
                </button>
              )}
            </div>
          )}

          {activeTab === 'transcript' && (
            <div className="w-full min-h-[300px] px-4 py-3 border border-slate-300 rounded-lg bg-slate-50">
              {isTranscribing && (
                <div className="flex items-center gap-2 mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-900">Recording in progress...</span>
                </div>
              )}
              <p className="text-slate-700 whitespace-pre-wrap">
                {formData.transcript || (isTranscribing ? 'Listening...' : 'No transcript available')}
              </p>
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-3">
              <div className="w-full min-h-[300px] px-4 py-3 border border-slate-300 rounded-lg bg-white">
                {isGeneratingSummary ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      <span>Generating summary...</span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.summary || '<p class="text-slate-500">No summary available. Generate one from the Notes tab.</p>' }}
                  />
                )}
              </div>
              {!isGeneratingSummary && !formData.summary && (formData.notes || formData.transcript) && (
                <button
                  type="button"
                  onClick={() => {
                    generateSummary();
                    setNotesChanged(false);
                    initialNotesRef.current = formData.notes;
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Summary
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : (existingData?.id ? 'Update' : 'Save')} Meeting
          </button>
        </div>
      </form>
    </div>
  );
}
