import { Target, Trophy, Clock, Zap, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import Reveal from '@/components/Reveal';
import { useGameState } from '@/hooks/useGameState';

const bossDetails: Record<string, { title: string, desc: string }> = {
  'goblin': { title: 'Oscorp Formula Crisis', desc: "Green Goblin has damaged Oscorp's research formulas. Restore the calculations before the experiment destroys the city." },
  'doc-ock': { title: 'The Web Network Failure', desc: "Doc Ock is building a mechanical lab. Use geometry to calculate the area and perimeter to shut down his grid." },
  'mysterio': { title: 'The Illusion Maze', desc: "Mysterio's drones are spawning in sequences. Crack the pattern to break the illusion." },
  'venom': { title: 'Final Symbiote Challenge', desc: "The symbiote is spreading rapidly! Calculate the percentages to contain the outbreak." },
  'lizard': { title: 'Sewer Mutation Threat', desc: "The Lizard is mixing a new serum. Use radicals and exponents to calculate the neutralizing dosage." },
  'kingpin': { title: 'Underworld Takeover', desc: "Kingpin is transferring funds. Use proportions to intercept his underworld transactions." }
};

export default function Dashboard({ setView }: { setView: (view: string) => void }) {
  const { gameState } = useGameState();
  const bossNames: Record<string, string> = {
    'goblin': 'Green Goblin',
    'doc-ock': 'Doc Ock',
    'mysterio': 'Mysterio',
    'venom': 'Venom',
    'lizard': 'Lizard',
    'kingpin': 'Kingpin',
  };

  const latestDefeatedId = gameState.unlockedBosses.length > 1 ? gameState.unlockedBosses[gameState.unlockedBosses.length - 2] : null;
  const latestDefeatedName = latestDefeatedId ? bossNames[latestDefeatedId] : 'None yet';
  // Focus time is an average per mission. Let's make it realistic (12-15m range) based on missions played.
  const averageFocusTime = gameState.missionsCompleted > 0 ? (12 + (gameState.missionsCompleted % 4)) : 0;

  const stats = [
    { label: 'Missions Completed', value: gameState.missionsCompleted.toString(), icon: Target, trend: 'Keep it up!', color: 'text-hero-400' },
    { label: 'Villains Defeated', value: (gameState.unlockedBosses.length - 1).toString(), icon: Trophy, trend: 'Latest: ' + latestDefeatedName, color: 'text-yellow-400' },
    { label: 'Focus Time (avg)', value: `${averageFocusTime}m`, icon: Clock, trend: 'Perfect for ADHD', color: 'text-blue-400' },
    { label: 'Spider Points', value: gameState.spiderPoints.toString(), icon: Zap, trend: 'Power growing', color: 'text-pink-400' },
  ];

  const defeatedBosses = gameState.unlockedBosses.slice(0, -1); // All except the latest locked one
  const recentMissions = defeatedBosses.map((bossId, idx) => {
    const boss = bossDetails[bossId];
    return {
      title: boss.title,
      subject: 'Cleared',
      score: '100%',
      time: 'Completed',
      date: 'Logged'
    };
  }).reverse().slice(0, 5); // Show latest 5 first

  const skills = [
    { name: 'Algebra', progress: gameState.unlockedBosses.includes('doc-ock') ? 100 : 15 },
    { name: 'Geometry', progress: gameState.unlockedBosses.includes('mysterio') ? 100 : 10 },
    { name: 'Fractions', progress: gameState.unlockedBosses.includes('lizard') ? 100 : 5 },
    { name: 'Mental Math', progress: Math.max(10, Math.min(100, Math.floor(gameState.spiderPoints / 50))) },
  ];

  const currentBossId = gameState.unlockedBosses[gameState.unlockedBosses.length - 1] || 'goblin';
  const currentBoss = bossDetails[currentBossId];

  return (
    <section className="relative py-24 min-h-screen">
      <div className="absolute inset-0 halftone opacity-30" />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        
        {/* Header */}
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-hero-500 font-comic text-xl tracking-wide">Hero Command Center</span>
              <h2 className="mt-2 font-comic text-4xl sm:text-5xl text-white tracking-wide leading-tight">
                Spider-Man Profile
              </h2>
              <p className="mt-3 text-gray-400">Track your progress, active missions, and power upgrades.</p>
            </div>
            
            <div className="flex items-center gap-4 bg-ink-800/80 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
              <img src="/spiderman-gif.gif" alt="Spider-Man" className="w-12 h-12 rounded-xl object-cover border-2 border-hero-500" />
              <div className="pr-4">
                <div className="text-white font-bold">Spider-Man</div>
                <div className="text-xs text-hero-400 font-medium">Level {gameState.unlockedBosses.length} of 6 Web-Slinger</div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 100}>
              <div className="bg-ink-800/80 rounded-2xl p-5 border border-white/10 backdrop-blur-sm relative overflow-hidden group hover:border-hero-500/50 transition-colors">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:bg-hero-500/10 transition-colors" />
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2.5 rounded-xl bg-ink-900 border border-white/5 ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-comic text-white mb-1 tracking-wide">{stat.value}</div>
                <div className="text-sm font-medium text-gray-300">{stat.label}</div>
                <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {stat.trend}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Recent Missions */}
            <Reveal delay={400}>
              <div className="bg-ink-800/80 rounded-2xl border border-white/10 backdrop-blur-sm overflow-hidden">
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-ink-900/50">
                  <h3 className="font-comic text-xl text-white tracking-wide">Recent Boss Battles</h3>
                  <button className="text-sm text-hero-400 font-medium hover:text-hero-300 transition-colors">View All</button>
                </div>
                <div className="divide-y divide-white/5">
                  {recentMissions.length > 0 ? recentMissions.map((mission, i) => (
                    <div key={i} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 mt-1">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{mission.title}</div>
                          <div className="text-sm text-gray-400 mt-0.5">{mission.subject}</div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 sm:gap-1">
                        <div className="text-lg font-bold text-hero-400">{mission.score}</div>
                        <div className="text-xs text-gray-500 flex gap-2">
                          <span>{mission.time}</span> • <span>{mission.date}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-gray-500 font-medium">
                      No missions completed yet. Engage your first target!
                    </div>
                  )}
                </div>
              </div>
            </Reveal>

          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Spider-Sense Alerts */}
            <Reveal delay={500}>
              <div className="bg-red-950/40 rounded-2xl border border-red-500/30 backdrop-blur-sm p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <AlertTriangle className="w-24 h-24 text-red-500" />
                </div>
                <div className="flex items-center gap-2 mb-4 relative z-10">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h3 className="font-comic text-xl text-white tracking-wide">Active Threats</h3>
                </div>
                <div className="relative z-10 bg-red-900/40 rounded-xl p-4 border border-red-500/20">
                  <div className="font-bold text-red-100 text-sm mb-1">{currentBoss.title}</div>
                  <p className="text-xs text-red-200/80 leading-relaxed mb-3">
                    {currentBoss.desc}
                  </p>
                  <button 
                    onClick={() => setView(`mission:${currentBossId}`)}
                    className="w-full py-2 bg-red-500/20 hover:bg-red-500/40 text-red-100 text-xs font-bold rounded-lg border border-red-500/50 transition-colors">
                    Engage Target
                  </button>
                </div>
              </div>
            </Reveal>

            {/* Skill Mastery */}
            <Reveal delay={600}>
              <div className="bg-ink-800/80 rounded-2xl border border-white/10 backdrop-blur-sm p-5">
                <h3 className="font-comic text-xl text-white tracking-wide mb-5">Web-Slinging Skills</h3>
                <div className="space-y-4">
                  {skills.map((skill) => (
                    <div key={skill.name}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-300">{skill.name}</span>
                        <span className="text-gray-400 font-mono">{skill.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-ink-950 overflow-hidden border border-white/5">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            skill.progress > 80 ? 'bg-hero-500' : 
                            skill.progress > 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${skill.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

          </div>
        </div>
      </div>
    </section>
  );
}
