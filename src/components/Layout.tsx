import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Home, LogOut, Menu, X, Settings } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const { signOut, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'admin', label: 'Admin', icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const handleMenuClick = (view: string) => {
    onViewChange(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-slate-900">Team Manager</h1>

              <nav className="hidden md:flex items-center gap-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id ||
                    (item.id === 'dashboard' && currentView === 'member-detail');
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.id)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
                        ${isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-sm text-slate-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="px-4 py-2 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id ||
                  (item.id === 'dashboard' && currentView === 'member-detail');
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition
                      ${isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-slate-600 hover:bg-red-50 hover:text-red-700 transition"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}
