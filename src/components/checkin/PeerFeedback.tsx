import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from '../../lib/supabase';

interface PeerFeedbackEntry {
  id?: string;
  peer_name: string;
  crushing_it: string;
  growth_areas: string;
  other: string;
}

interface PeerFeedbackProps {
  data: PeerFeedbackEntry[];
  onChange: (data: PeerFeedbackEntry[]) => void;
  teamMemberName?: string;
  checkInId?: string;
  onSavePeer?: (peerId: string) => Promise<void>;
}

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline',
  'list', 'bullet'
];

const PeerFeedbackCard = memo(({
  peer,
  index,
  teamMemberName,
  onUpdate,
  onRemove,
  onSave,
  peerId,
  isEditing,
  onEdit,
  onCancelEdit,
  saving
}: {
  peer: PeerFeedbackEntry;
  index: number;
  teamMemberName: string;
  onUpdate: (id: string, field: keyof PeerFeedbackEntry, value: string) => void;
  onRemove: (id: string) => void;
  onSave: (id: string) => Promise<void>;
  peerId: string;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  saving: boolean;
}) => {
  const handleUpdate = useCallback((field: keyof PeerFeedbackEntry, value: string) => {
    onUpdate(peerId, field, value);
  }, [peerId, onUpdate]);

  const handleRemove = useCallback(() => {
    onRemove(peerId);
  }, [peerId, onRemove]);

  const handleSave = useCallback(async () => {
    await onSave(peerId);
  }, [peerId, onSave]);

  const handleEdit = useCallback(() => {
    onEdit(peerId);
  }, [peerId, onEdit]);

  const isSaved = peer.peer_name.trim() !== '' && !isEditing;

  if (isSaved) {
    return (
      <div className="border border-slate-200 rounded-lg p-4 bg-white hover:bg-slate-50 transition">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-700 font-semibold text-sm">
                {peer.peer_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-slate-900">{peer.peer_name}</h4>
              <p className="text-sm text-slate-500">Peer {index + 1}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEdit}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-slate-900">Peer {index + 1}</h4>
        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Peer'}
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
            Remove
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Peer Name
          </label>
          <input
            type="text"
            value={peer.peer_name}
            onChange={(e) => handleUpdate('peer_name', e.target.value)}
            placeholder="Enter peer's name"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Where is {teamMemberName} crushing it right now?
          </label>
          <div className="bg-white rounded-lg border border-slate-300">
            <ReactQuill
              theme="snow"
              value={peer.crushing_it}
              onChange={(value) => handleUpdate('crushing_it', value)}
              modules={quillModules}
              formats={quillFormats}
              className="min-h-[120px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            What are 1-2 areas of growth?
          </label>
          <div className="bg-white rounded-lg border border-slate-300">
            <ReactQuill
              theme="snow"
              value={peer.growth_areas}
              onChange={(value) => handleUpdate('growth_areas', value)}
              modules={quillModules}
              formats={quillFormats}
              className="min-h-[120px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Anything else?
          </label>
          <div className="bg-white rounded-lg border border-slate-300">
            <ReactQuill
              theme="snow"
              value={peer.other}
              onChange={(value) => handleUpdate('other', value)}
              modules={quillModules}
              formats={quillFormats}
              className="min-h-[120px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

PeerFeedbackCard.displayName = 'PeerFeedbackCard';

export default function PeerFeedback({ data, onChange, teamMemberName = 'team member', checkInId, onSavePeer }: PeerFeedbackProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedDataRef, setSavedDataRef] = useState<Map<string, PeerFeedbackEntry>>(new Map());
  const [savingId, setSavingId] = useState<string | null>(null);

  const idMapRef = useRef<Map<number, string>>(new Map());

  const dataRef = useRef(data);
  dataRef.current = data;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const addPeerFeedback = useCallback(() => {
    const newId = crypto.randomUUID();
    onChangeRef.current([
      ...dataRef.current,
      {
        id: newId,
        peer_name: '',
        crushing_it: '',
        growth_areas: '',
        other: ''
      }
    ]);
    setEditingId(newId);
  }, []);

  const removePeerFeedbackById = useCallback((id: string) => {
    onChangeRef.current(dataRef.current.filter(peer => peer.id !== id));
    setSavedDataRef(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
    if (editingId === id) {
      setEditingId(null);
    }
  }, [editingId]);

  const updatePeerFeedbackById = useCallback((id: string, field: keyof PeerFeedbackEntry, value: string) => {
    onChangeRef.current(dataRef.current.map(peer =>
      peer.id === id
        ? { ...peer, [field]: value }
        : peer
    ));
  }, []);

  const savePeerFeedback = useCallback(async (id: string) => {
    const peer = dataRef.current.find(p => p.id === id);
    if (peer && peer.peer_name.trim() !== '') {
      setSavingId(id);
      try {
        if (checkInId) {
          const { error } = await supabase
            .from('performance_reviews')
            .update({ peer_feedback: dataRef.current })
            .eq('id', checkInId);

          if (error) throw error;
        }

        setSavedDataRef(prev => new Map(prev).set(id, { ...peer }));
        setEditingId(null);
      } catch (error) {
        console.error('Error saving peer feedback:', error);
        alert('Failed to save peer feedback. Please try again.');
      } finally {
        setSavingId(null);
      }
    }
  }, [checkInId]);

  const editPeerFeedback = useCallback((id: string) => {
    const savedData = savedDataRef.get(id);
    if (savedData) {
      onChangeRef.current(dataRef.current.map(peer =>
        peer.id === id ? { ...savedData } : peer
      ));
    }
    setEditingId(id);
  }, [savedDataRef]);

  const cancelEdit = useCallback(() => {
    if (editingId) {
      const savedData = savedDataRef.get(editingId);
      if (savedData) {
        onChangeRef.current(dataRef.current.map(peer =>
          peer.id === editingId ? { ...savedData } : peer
        ));
      }
      setEditingId(null);
    }
  }, [editingId, savedDataRef]);

  // Ensure all entries have stable IDs using ref
  const normalizedData = useMemo(() =>
    data.map((peer, index) => {
      if (peer.id) {
        return peer;
      }

      // Get or create stable ID for this index
      if (!idMapRef.current.has(index)) {
        idMapRef.current.set(index, crypto.randomUUID());
      }

      return {
        ...peer,
        id: idMapRef.current.get(index)!
      };
    })
  , [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <span className="text-xl">👥</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Peer Feedback</h3>
            <p className="text-sm text-slate-600">Collect feedback from colleagues</p>
          </div>
        </div>
        <button
          type="button"
          onClick={addPeerFeedback}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Peer
        </button>
      </div>

      {normalizedData.length === 0 ? (
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
          <p className="text-slate-500 mb-4">No peer feedback added yet</p>
          <button
            type="button"
            onClick={addPeerFeedback}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add First Peer Feedback
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {normalizedData.map((peer, index) => (
            <PeerFeedbackCard
              key={peer.id}
              peer={peer}
              index={index}
              teamMemberName={teamMemberName}
              onUpdate={updatePeerFeedbackById}
              onRemove={removePeerFeedbackById}
              onSave={savePeerFeedback}
              onEdit={editPeerFeedback}
              onCancelEdit={cancelEdit}
              peerId={peer.id!}
              isEditing={editingId === peer.id}
              saving={savingId === peer.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
