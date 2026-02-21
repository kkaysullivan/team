import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';

const TeamMemberDetail = lazy(() => import('./components/TeamMemberDetail'));
const TeamMemberDashboard = lazy(() => import('./components/TeamMemberDashboard'));
const Admin = lazy(() => import('./components/Admin'));
const AllCheckIns = lazy(() => import('./components/AllCheckIns'));
const SelfAssessment = lazy(() => import('./components/SelfAssessment'));
const TeamMemberPortal = lazy(() => import('./components/TeamMemberPortal'));

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [editingCheckInId, setEditingCheckInId] = useState<string | null>(null);
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
      if (!user) {
        if (mounted) {
          setRoleLoading(false);
        }
        return;
      }

      try {
        const { data: teamMemberData, error: teamMemberError } = await supabase
          .from('team_members')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!mounted) return;

        if (teamMemberData) {
          setUserRole('team_member');
          setRoleLoading(false);
          return;
        }

        const { data: managerData, error: managerError } = await supabase
          .from('team_members')
          .select('id')
          .eq('manager_id', user.id)
          .limit(1)
          .maybeSingle();

        if (mounted) {
          const role = managerData ? 'manager' : 'manager';
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
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <SelfAssessment />
      </Suspense>
    );
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
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <TeamMemberPortal />
      </Suspense>
    );
  }

  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    setCurrentView('member-dashboard');
  };

  const handleBackToDashboard = () => {
    setSelectedMemberId(null);
    setCurrentView('dashboard');
  };

  const handleViewSection = (section: 'growth' | 'kras' | 'checkins' | 'maturity' | 'profile') => {
    setCurrentView(`member-${section}`);
  };

  const handleEditCheckIn = (checkInId: string) => {
    setEditingCheckInId(checkInId);
    setCurrentView('member-checkins');
  };

  const handleDeleteCheckIn = async (checkInId: string) => {
    if (!confirm('Are you sure you want to delete this check-in?')) return;

    await supabase.from('performance_reviews').delete().eq('id', checkInId);
    setCurrentView('dashboard');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onSelectMember={handleSelectMember} onNavigate={setCurrentView} />;
      case 'member-dashboard':
        return selectedMemberId ? (
          <TeamMemberDashboard
            memberId={selectedMemberId}
            onClose={handleBackToDashboard}
            onViewSection={handleViewSection}
            onEditCheckIn={handleEditCheckIn}
            onDeleteCheckIn={handleDeleteCheckIn}
          />
        ) : (
          <Dashboard onSelectMember={handleSelectMember} onNavigate={setCurrentView} />
        );
      case 'member-growth':
        return selectedMemberId ? (
          <TeamMemberDetail memberId={selectedMemberId} onBack={() => setCurrentView('member-dashboard')} initialTab="growth" />
        ) : (
          <Dashboard onSelectMember={handleSelectMember} onNavigate={setCurrentView} />
        );
      case 'member-kras':
        return selectedMemberId ? (
          <TeamMemberDetail memberId={selectedMemberId} onBack={() => setCurrentView('member-dashboard')} initialTab="kras" />
        ) : (
          <Dashboard onSelectMember={handleSelectMember} onNavigate={setCurrentView} />
        );
      case 'member-checkins':
        return selectedMemberId ? (
          <TeamMemberDetail
            memberId={selectedMemberId}
            onBack={() => {
              setCurrentView('member-dashboard');
              setEditingCheckInId(null);
            }}
            initialTab="checkins"
            initialEditCheckInId={editingCheckInId || undefined}
          />
        ) : (
          <Dashboard onSelectMember={handleSelectMember} onNavigate={setCurrentView} />
        );
      case 'member-maturity':
        return selectedMemberId ? (
          <TeamMemberDetail memberId={selectedMemberId} onBack={() => setCurrentView('member-dashboard')} initialTab="maturity" />
        ) : (
          <Dashboard onSelectMember={handleSelectMember} onNavigate={setCurrentView} />
        );
      case 'member-profile':
        return selectedMemberId ? (
          <TeamMemberDetail memberId={selectedMemberId} onBack={() => setCurrentView('member-dashboard')} initialTab="profile" />
        ) : (
          <Dashboard onSelectMember={handleSelectMember} onNavigate={setCurrentView} />
        );
      case 'check-ins':
        return <AllCheckIns onBack={handleBackToDashboard} />;
      case 'admin':
        return <Admin />;
      default:
        return <Dashboard onSelectMember={handleSelectMember} onNavigate={setCurrentView} />;
    }
  };

  const LoadingFallback = () => (
    <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      <Suspense fallback={<LoadingFallback />}>
        {renderView()}
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
