import { useState, useEffect } from 'react';
import { Menu, X, Bell } from 'lucide-react';

const links = [
  { label: 'Spider Academy', href: '#hero' },
  { label: 'Missions', href: '#missions' },
  { label: 'Boss Battles', href: '#bosses' },
  { label: 'Rewards', href: '#rewards' },
];

export default function Navbar({ setView }: { setView: (view: string) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-ink-900/95 backdrop-blur-md border-b border-hero-600/30' : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <button onClick={() => setView('landing')} className="flex items-center gap-2 group">

          <span className="font-comic text-2xl tracking-wide text-white">
            Math<span className="text-hero-500">Verse</span>
          </span>
        </button>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={(e) => {
                  if (l.href.startsWith('#')) {
                    setView('landing');
                  }
                }}
                className="text-sm font-medium text-gray-300 hover:text-hero-400 transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 hover:after:w-full after:bg-hero-500 after:transition-all"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-6">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-gray-300 hover:text-white transition-colors" 
              title="Messages from Gwen & JJJ"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hero-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-hero-500"></span>
              </span>
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-4 w-72 bg-ink-900 border border-hero-600/30 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-white/10 flex justify-between items-center bg-ink-950">
                  <span className="font-comic text-white tracking-wide">Communications</span>
                  <span className="text-xs bg-hero-600 text-white px-2 py-0.5 rounded-full">2 New</span>
                </div>
                <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                  
                  <div className="p-3 hover:bg-white/5 transition-colors cursor-pointer flex gap-3">
                    <img src="/j-jonah-jameson.png" alt="JJJ" className="w-10 h-10 rounded-full object-cover border border-red-500/50 shrink-0" />
                    <div>
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-sm font-bold text-red-400">J. Jonah Jameson</span>
                        <span className="text-[10px] text-gray-500">Just now</span>
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-2">"I don't pay you to stand around! Defeat the Goblin or YOU'RE FIRED!"</p>
                    </div>
                  </div>

                  <div className="p-3 hover:bg-white/5 transition-colors cursor-pointer flex gap-3">
                    <img src="/gwen.jpeg" alt="Gwen" className="w-10 h-10 rounded-full object-cover border border-pink-500 shrink-0" />
                    <div>
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-sm font-bold text-pink-400">Gwen Stacy</span>
                        <span className="text-[10px] text-gray-500">5m ago</span>
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-2">"Hey! Need a hint on that last geometry puzzle? I'm ready when you are."</p>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setView('dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink-800 border border-hero-500/30 hover:bg-hero-600 hover:border-hero-500 text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
          >
            Portal
          </button>
          
          <a
            href="#login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-hero-600 hover:bg-hero-500 text-white font-semibold rounded-lg comic-shadow transition-all hover:scale-105 active:scale-95"
          >
            Login
          </a>
        </div>

        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden bg-ink-800 border-t border-hero-600/30 px-5 py-4 space-y-3">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => {
                setView('landing');
                setOpen(false);
              }}
              className="block text-gray-200 font-medium py-1.5 hover:text-hero-400"
            >
              {l.label}
            </a>
          ))}
          <button
            onClick={() => {
              setView('dashboard');
              setOpen(false);
            }}
            className="block w-full text-center px-5 py-2.5 bg-ink-700 border border-hero-500/30 text-white font-semibold rounded-lg mt-2"
          >
            Portal
          </button>
          <a
            href="#login"
            onClick={() => setOpen(false)}
            className="block text-center px-5 py-2.5 bg-hero-600 text-white font-semibold rounded-lg"
          >
            Login
          </a>
        </div>
      )}
    </header>
  );
}
