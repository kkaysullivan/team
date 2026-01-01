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
    if (user) {
      detectUserRole();
    }
  }, [user]);

  const detectUserRole = async () => {
    setRoleLoading(true);

    // Check if user is a team member
    const { data: teamMemberData } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (teamMemberData) {
      setUserRole('team_member');
      setRoleLoading(false);
      return;
    }

    // Check if user is a manager (has team members)
    const { data: managerData } = await supabase
      .from('team_members')
      .select('id')
      .eq('manager_id', user?.id)
      .limit(1)
      .maybeSingle();

    if (managerData) {
      setUserRole('manager');
    } else {
      setUserRole('manager'); // Default to manager view for new accounts
    }

    setRoleLoading(false);
  };

  if (isSelfAssessment) {
    return <SelfAssessment />;
  }

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
