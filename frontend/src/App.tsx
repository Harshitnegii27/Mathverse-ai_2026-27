import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Missions from '@/components/Missions';
import HowItWorks from '@/components/HowItWorks';
import BossBattles from '@/components/BossBattles';
import Gamification from '@/components/Gamification';
import Footer from '@/components/Footer';
import Dashboard from '@/components/Dashboard';
import MissionPlayer from '@/components/MissionPlayer';
import { useState, useEffect } from 'react';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('landing');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

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
            {currentView.startsWith('mission') && <MissionPlayer bossId={currentView.split(':')[1] || 'goblin'} onExit={() => setCurrentView('dashboard')} onNextLevel={(nextBoss) => setCurrentView('mission:' + nextBoss)} />}
          </main>
        {!currentView.startsWith('mission') && <Footer />}
      </div>
    </div>
  );
}
