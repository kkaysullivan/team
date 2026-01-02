import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TeamMemberDetail from './components/TeamMemberDetail';
import Admin from './components/Admin';
import OneOnOnes from './components/OneOnOnes';
import CheckIns from './components/CheckIns';
import SelfAssessment from './components/SelfAssessment';
import TeamMemberPortal from './components/TeamMemberPortal';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isSelfAssessment, setIsSelfAssessment] = useState(false);
  const [userRole, setUserRole] = useState<'manager' | 'team_member' | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasAssessmentToken = urlParams.has('token');
    setIsSelfAssessment(hasAssessmentToken);
  }, []);

  useEffect(() => {
    let mounted = true;

    const detectUserRole = async () => {
      console.log('[Role Detection] Starting, user:', user?.id);

      if (!user) {
        console.log('[Role Detection] No user, ending');
        if (mounted) {
          setRoleLoading(false);
        }
        return;
      }

      try {
        console.log('[Role Detection] Checking if user is a team member...');
        const { data: teamMemberData, error: teamMemberError } = await supabase
          .from('team_members')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('[Role Detection] Team member check:', { data: teamMemberData, error: teamMemberError });

        if (!mounted) return;

        if (teamMemberData) {
          console.log('[Role Detection] User is a team member');
          setUserRole('team_member');
          setRoleLoading(false);
          return;
        }

        console.log('[Role Detection] Checking if user is a manager...');
        const { data: managerData, error: managerError } = await supabase
          .from('team_members')
          .select('id')
          .eq('manager_id', user.id)
          .limit(1)
          .maybeSingle();

        console.log('[Role Detection] Manager check:', { data: managerData, error: managerError });

        if (mounted) {
          const role = managerData ? 'manager' : 'manager';
          console.log('[Role Detection] Setting role to:', role);
          setUserRole(role);
          setRoleLoading(false);
        }
      } catch (error) {
        console.error('[Role Detection] Error:', error);
        if (mounted) {
          setUserRole('manager');
          setRoleLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      if (mounted && roleLoading) {
        console.warn('[Role Detection] Timed out after 5 seconds, defaulting to manager');
        setUserRole('manager');
        setRoleLoading(false);
      }
    }, 5000);

    detectUserRole();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [user]);

  if (isSelfAssessment) {
    return <SelfAssessment />;
  }

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 text-sm">
            {loading ? 'Loading authentication...' : 'Detecting user role...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  // Show team member portal if user is a team member
  if (userRole === 'team_member') {
    return <TeamMemberPortal />;
  }

  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    setCurrentView('member-detail');
  };

  const handleBackToDashboard = () => {
    setSelectedMemberId(null);
    setCurrentView('dashboard');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onSelectMember={handleSelectMember} onNavigate={setCurrentView} />;
      case 'member-detail':
        return selectedMemberId ? (
          <TeamMemberDetail memberId={selectedMemberId} onBack={handleBackToDashboard} />
        ) : (
          <Dashboard onSelectMember={handleSelectMember} onNavigate={setCurrentView} />
        );
      case 'one-on-ones':
        return <OneOnOnes openFormInitially={true} />;
      case 'check-ins':
        return <CheckIns openFormInitially={true} />;
      case 'admin':
        return <Admin />;
      default:
        return <Dashboard onSelectMember={handleSelectMember} onNavigate={setCurrentView} />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
