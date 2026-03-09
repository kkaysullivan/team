import { useState } from 'react';
import { Settings, Users, ClipboardCheck, Target, Layers, User, ChevronRight } from 'lucide-react';
import AdminLevels from './admin/AdminLevels';
import AdminCategories from './admin/AdminCategories';
import AdminSkills from './admin/AdminSkills';
import AdminRoles from './admin/AdminRoles';
import AdminMaturityModels from './admin/AdminMaturityModels';
import AdminTeamMembers from './admin/AdminTeamMembers';
import AdminProfile from './admin/AdminProfile';
import AdminCheckIns from './admin/AdminCheckIns';
import AdminCheckInPrep from './admin/AdminCheckInPrep';
import AdminGrowthAreas from './admin/AdminGrowthAreas';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('members');

  const navSections: NavSection[] = [
    {
      label: 'Team',
      items: [
        { id: 'members', label: 'Team Members', icon: Users },
        { id: 'roles', label: 'Roles', icon: Target },
        { id: 'profile', label: 'Profile', icon: User },
      ],
    },
    {
      label: 'Maturity Model',
      items: [
        { id: 'models', label: 'Models', icon: Layers },
        { id: 'categories', label: 'Categories', icon: Layers },
        { id: 'skills', label: 'Skills', icon: Target },
        { id: 'levels', label: 'Levels', icon: ChevronRight },
      ],
    },
    {
      label: 'Development',
      items: [
        { id: 'checkins', label: 'Check-Ins', icon: ClipboardCheck },
        { id: 'checkin-prep', label: 'Check-In Prep', icon: ClipboardCheck },
        { id: 'growth-areas', label: 'Growth Areas', icon: Target },
      ],
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'members':
        return <AdminTeamMembers />;
      case 'checkins':
        return <AdminCheckIns />;
      case 'checkin-prep':
        return <AdminCheckInPrep />;
      case 'growth-areas':
        return <AdminGrowthAreas />;
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
      case 'profile':
        return <AdminProfile />;
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

      <div className="flex gap-6">
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <nav className="p-2">
              {navSections.map((section, sectionIdx) => (
                <div key={section.label} className={sectionIdx > 0 ? 'mt-6' : ''}>
                  <h3 className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {section.label}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === item.id
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
