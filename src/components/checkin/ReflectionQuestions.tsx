import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface ReflectionData {
  wins: { team_member: string; leader: string };
  learnings: { team_member: string; leader: string };
  fail_forward: { team_member: string; leader: string };
  level_up: { team_member: string; leader: string };
  steps_taking: { team_member: string; leader: string };
  next_year_goals: { team_member: string; leader: string };
  impact_areas: { team_member: string; leader: string };
}

interface ReflectionQuestionsProps {
  data: ReflectionData;
  onChange: (data: ReflectionData) => void;
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

const questions = [
  { key: 'wins', label: 'What were some wins from this year?' },
  { key: 'learnings', label: 'What were some key learnings?' },
  { key: 'fail_forward', label: 'What was your biggest fail forward this year? What did it teach you?' },
  { key: 'level_up', label: 'What will it take to level up your skills?' },
  { key: 'steps_taking', label: 'What steps are you taking to get there?' },
  { key: 'next_year_goals', label: 'What do you want to have accomplished in your role by this time next year?' },
  { key: 'impact_areas', label: 'Where can you provide the most impact in the coming year?' },
];

export default function ReflectionQuestions({ data, onChange }: ReflectionQuestionsProps) {
  const handleChange = (key: keyof ReflectionData, type: 'team_member' | 'leader', value: string) => {
    onChange({
      ...data,
      [key]: {
        ...data[key],
        [type]: value
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
          <span className="text-xl">💭</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Reflection Questions</h3>
          <p className="text-sm text-slate-600">Team member and leader responses</p>
        </div>
      </div>

      {questions.map((question) => (
        <div key={question.key} className="border border-slate-200 rounded-lg p-6 bg-slate-50">
          <h4 className="text-base font-semibold text-slate-900 mb-4">{question.label}</h4>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Team Member Response
              </label>
              <div className="bg-white rounded-lg border border-slate-300">
                <ReactQuill
                  theme="snow"
                  value={data[question.key as keyof ReflectionData].team_member}
                  onChange={(value) => handleChange(question.key as keyof ReflectionData, 'team_member', value)}
                  modules={quillModules}
                  formats={quillFormats}
                  className="min-h-[150px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Leader Response
              </label>
              <div className="bg-white rounded-lg border border-slate-300">
                <ReactQuill
                  theme="snow"
                  value={data[question.key as keyof ReflectionData].leader}
                  onChange={(value) => handleChange(question.key as keyof ReflectionData, 'leader', value)}
                  modules={quillModules}
                  formats={quillFormats}
                  className="min-h-[150px]"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
