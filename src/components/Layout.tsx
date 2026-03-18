import { ReactNode, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/ramsey-logo.png" alt="Ramsey" className="h-8 object-contain" />
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-sm text-slate-500">{user.email}</span>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-6">
        {children}
      </main>
    </div>
  );
}

export default memo(Layout);
