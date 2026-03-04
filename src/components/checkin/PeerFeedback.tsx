import { Plus, Trash2 } from 'lucide-react';
import { memo, useCallback, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  peerId
}: {
  peer: PeerFeedbackEntry;
  index: number;
  teamMemberName: string;
  onUpdate: (id: string, field: keyof PeerFeedbackEntry, value: string) => void;
  onRemove: (id: string) => void;
  peerId: string;
}) => {
  const handleUpdate = useCallback((field: keyof PeerFeedbackEntry, value: string) => {
    onUpdate(peerId, field, value);
  }, [peerId, onUpdate]);

  const handleRemove = useCallback(() => {
    onRemove(peerId);
  }, [peerId, onRemove]);

  return (
    <div className="border border-slate-200 rounded-lg p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-slate-900">Peer {index + 1}</h4>
        <button
          type="button"
          onClick={handleRemove}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
        >
          <Trash2 className="w-4 h-4" />
          Remove
        </button>
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
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if peer data actually changed
  return (
    prevProps.peerId === nextProps.peerId &&
    prevProps.peer.peer_name === nextProps.peer.peer_name &&
    prevProps.peer.crushing_it === nextProps.peer.crushing_it &&
    prevProps.peer.growth_areas === nextProps.peer.growth_areas &&
    prevProps.peer.other === nextProps.peer.other &&
    prevProps.index === nextProps.index &&
    prevProps.teamMemberName === nextProps.teamMemberName &&
    prevProps.onUpdate === nextProps.onUpdate &&
    prevProps.onRemove === nextProps.onRemove
  );
});

PeerFeedbackCard.displayName = 'PeerFeedbackCard';

export default function PeerFeedback({ data, onChange, teamMemberName = 'team member' }: PeerFeedbackProps) {
  // Keep a stable map of array indices to IDs
  const idMapRef = useRef<Map<number, string>>(new Map());

  // Keep a ref to the latest data and onChange to avoid recreating callbacks
  const dataRef = useRef(data);
  dataRef.current = data;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const addPeerFeedback = useCallback(() => {
    onChangeRef.current([
      ...dataRef.current,
      {
        id: crypto.randomUUID(),
        peer_name: '',
        crushing_it: '',
        growth_areas: '',
        other: ''
      }
    ]);
  }, []);

  const removePeerFeedbackById = useCallback((id: string) => {
    onChangeRef.current(dataRef.current.filter(peer => peer.id !== id));
  }, []);

  const updatePeerFeedbackById = useCallback((id: string, field: keyof PeerFeedbackEntry, value: string) => {
    onChangeRef.current(dataRef.current.map(peer =>
      peer.id === id
        ? { ...peer, [field]: value }
        : peer
    ));
  }, []);

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
        <div className="space-y-6">
          {normalizedData.map((peer, index) => (
            <PeerFeedbackCard
              key={peer.id}
              peer={peer}
              index={index}
              teamMemberName={teamMemberName}
              onUpdate={updatePeerFeedbackById}
              onRemove={removePeerFeedbackById}
              peerId={peer.id!}
            />
          ))}
        </div>
      )}
    </div>
  );
}
