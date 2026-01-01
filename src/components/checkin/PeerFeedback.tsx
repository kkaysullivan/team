import { Plus, Trash2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface PeerFeedbackEntry {
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

export default function PeerFeedback({ data, onChange, teamMemberName = 'team member' }: PeerFeedbackProps) {
  const addPeerFeedback = () => {
    onChange([
      ...data,
      {
        peer_name: '',
        crushing_it: '',
        growth_areas: '',
        other: ''
      }
    ]);
  };

  const removePeerFeedback = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updatePeerFeedback = (index: number, field: keyof PeerFeedbackEntry, value: string) => {
    const updated = [...data];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    onChange(updated);
  };

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

      {data.length === 0 ? (
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
          {data.map((peer, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-slate-900">Peer {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removePeerFeedback(index)}
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
                    onChange={(e) => updatePeerFeedback(index, 'peer_name', e.target.value)}
                    placeholder="Enter peer's name"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Where is {peer.peer_name || teamMemberName} crushing it right now?
                  </label>
                  <div className="bg-white rounded-lg border border-slate-300">
                    <ReactQuill
                      theme="snow"
                      value={peer.crushing_it}
                      onChange={(value) => updatePeerFeedback(index, 'crushing_it', value)}
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
                      onChange={(value) => updatePeerFeedback(index, 'growth_areas', value)}
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
                      onChange={(value) => updatePeerFeedback(index, 'other', value)}
                      modules={quillModules}
                      formats={quillFormats}
                      className="min-h-[120px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
