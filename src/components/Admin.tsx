import { useState } from 'react';
import { Settings } from 'lucide-react';
import AdminLevels from './admin/AdminLevels';
import AdminCategories from './admin/AdminCategories';
import AdminSkills from './admin/AdminSkills';
import AdminRoles from './admin/AdminRoles';
import AdminMaturityModels from './admin/AdminMaturityModels';
import AdminTeamMembers from './admin/AdminTeamMembers';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('members');

  const tabs = [
    { id: 'members', label: 'Team Members' },
    { id: 'models', label: 'Maturity Models' },
    { id: 'roles', label: 'Roles' },
    { id: 'categories', label: 'Categories' },
    { id: 'skills', label: 'Skills' },
    { id: 'levels', label: 'Levels' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'members':
        return <AdminTeamMembers />;
      case 'levels':
        return <AdminLevels />;
      case 'categories':
        return <AdminCategories />;
      case 'skills':
        return <AdminSkills />;
      case 'roles':
        return <AdminRoles />;
      case 'models':
        return <AdminMaturityModels />;
      default:
        return <AdminTeamMembers />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-slate-700" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Admin Settings</h2>
          <p className="text-slate-600 mt-1">Manage maturity models and system configuration</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">{renderContent()}</div>
      </div>
    </div>
  );
}
