import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Missions from '@/components/Missions';
import HowItWorks from '@/components/HowItWorks';
import BossBattles from '@/components/BossBattles';
import Gamification from '@/components/Gamification';
import Footer from '@/components/Footer';
import Dashboard from '@/components/Dashboard';
import ParentDashboard from '@/components/ParentDashboard';
import MissionPlayer from '@/components/MissionPlayer';
import AuthModal from '@/components/AuthModal';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function AppContent() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const { isAuthModalOpen, closeAuthModal } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  const handleAuthSuccess = (role: 'student' | 'parent' | 'teacher') => {
    if (role === 'parent' || role === 'teacher') {
      setCurrentView('parent-dashboard');
    } else {
      setCurrentView('dashboard');
    }
  };

  return (
    <div className="min-h-screen spider-bg text-white relative">
      <div className="fixed inset-0 spider-halftone pointer-events-none z-0 opacity-70" />
      <div className="relative z-10 flex flex-col min-h-screen">
        {!currentView.startsWith('mission') && <Navbar setView={setCurrentView} />}
        
        <main className="flex-1">
          {currentView === 'landing' && (
            <>
              <Hero setView={setCurrentView} />
              <Missions setView={setCurrentView} />
              <HowItWorks />
              <BossBattles setView={setCurrentView} />
              <Gamification setView={setCurrentView} />
            </>
          )}
          {currentView === 'dashboard' && <Dashboard setView={setCurrentView} />}
          {currentView === 'parent-dashboard' && <ParentDashboard setView={setCurrentView} />}
          {currentView.startsWith('mission') && (
            <MissionPlayer 
              bossId={currentView.split(':')[1] || 'goblin'} 
              onExit={() => setCurrentView('dashboard')} 
              onNextLevel={(nextBoss) => setCurrentView('mission:' + nextBoss)} 
            />
          )}
        </main>

        {!currentView.startsWith('mission') && <Footer />}

        {/* Auth Modal for Student, Parent, and Teacher Login / Registration */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal}
          onSuccess={handleAuthSuccess}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
