import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import ErrorBoundary from './components/ErrorBoundary';

const Auth = lazy(() => import('./components/Auth'));
const Layout = lazy(() => import('./components/Layout'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const TeamMemberDetail = lazy(() => import('./components/TeamMemberDetail'));
const TeamMemberDashboard = lazy(() => import('./components/TeamMemberDashboard'));
const AllCheckIns = lazy(() => import('./components/AllCheckIns'));
const SelfAssessment = lazy(() => import('./components/SelfAssessment'));
const TeamMemberPortal = lazy(() => import('./components/TeamMemberPortal'));

function AppContent() {
  const { user, loading, isSuperAdmin } = useAuth();
  const [currentView, setCurrentView] = useState('overview');
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
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const detectUserRole = async () => {
      if (!user) {
        if (mounted) {
          setRoleLoading(false);
          if (timeoutId) clearTimeout(timeoutId);
        }
        return;
      }

      if (isSuperAdmin) {
        if (mounted) {
          setRoleLoading(false);
          if (timeoutId) clearTimeout(timeoutId);
        }
        return;
      }

      try {
        const { data: teamMemberData } = await supabase
          .from('team_members')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!mounted) return;

        if (teamMemberData) {
          setUserRole('team_member');
          setRoleLoading(false);
          if (timeoutId) clearTimeout(timeoutId);
          return;
        }

        setUserRole('manager');
        setRoleLoading(false);
        if (timeoutId) clearTimeout(timeoutId);
      } catch (error) {
        console.error('[Role Detection] Error:', error instanceof Error ? error.message : 'Unknown error');
        if (mounted) {
          setUserRole('manager');
          setRoleLoading(false);
          if (timeoutId) clearTimeout(timeoutId);
        }
      }
    };

    timeoutId = setTimeout(() => {
      if (mounted && roleLoading) {
        setUserRole('manager');
        setRoleLoading(false);
      }
    }, 5000);

    detectUserRole();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, isSuperAdmin]);

  if (isSelfAssessment) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
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
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Auth />
      </Suspense>
    );
  }

  if (userRole === 'team_member') {
    return (
      <Suspense fallback={<LoadingSpinner />}>
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
    setCurrentView('overview');
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
    setCurrentView('overview');
  };

  const handleViewChange = (view: string) => {
    if (view !== currentView) {
      setSelectedMemberId(null);
    }
    setCurrentView(view);
  };

  const LoadingFallback = () => (
    <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
      case 'overview':
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
      default:
        return <Dashboard onSelectMember={handleSelectMember} onNavigate={setCurrentView} />;
    }
  };

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Layout currentView={currentView} onViewChange={handleViewChange}>
        <Suspense fallback={<LoadingFallback />}>
          {renderView()}
        </Suspense>
      </Layout>
    </Suspense>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
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
