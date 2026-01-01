import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TeamMemberDetail from './components/TeamMemberDetail';
import Admin from './components/Admin';
import OneOnOnes from './components/OneOnOnes';
import CheckIns from './components/CheckIns';
import SelfAssessment from './components/SelfAssessment';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isSelfAssessment, setIsSelfAssessment] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasAssessmentToken = urlParams.has('token');
    setIsSelfAssessment(hasAssessmentToken);
  }, []);

  if (isSelfAssessment) {
    return <SelfAssessment />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
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
