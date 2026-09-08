import { useState, useEffect, useRef } from 'react';
import { Zap, CheckCircle2, ShieldAlert, Cpu, AlertTriangle, Clock } from 'lucide-react';
import Reveal from '@/components/Reveal';
import { generateQuestions, Question } from '@/lib/QuestionGenerator';
import { useGameState } from '@/hooks/useGameState';

interface MissionPlayerProps {
  bossId: string;
  onExit: () => void;
  onNextLevel?: (bossId: string) => void;
}

export default function MissionPlayer({ bossId, onExit, onNextLevel }: MissionPlayerProps) {
  const { addSpiderPoints, unlockBoss, incrementMissions } = useGameState();
  
  const [phase, setPhase] = useState<'briefing' | 'combat' | 'victory' | 'defeat'>('combat');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  const [villainHealth, setVillainHealth] = useState(100);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [combo, setCombo] = useState(0);
  const [showHint, setShowHint] = useState(false);
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [combatFeedback, setCombatFeedback] = useState<'strike' | 'counter' | 'timeout' | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>('');
  
  const [timeSpent, setTimeSpent] = useState(0);

  const webShooterAudioRef = useRef<HTMLAudioElement>(null);
  const goblinLaughAudioRef = useRef<HTMLAudioElement>(null);
  const drottoAudioRef = useRef<HTMLAudioElement>(null);
  const drottoloosingAudioRef = useRef<HTMLAudioElement>(null);
  const victoryMemeAudioRef = useRef<HTMLAudioElement>(null);

  const SUCCESS_DIALOGUES = ["WEB STRIKE!", "AMAZING!", "SPECTACULAR!", "THWIP!", "BULLSEYE!"];
  const FAILURE_DIALOGUES = [
    "COUNTER ATTACK!", 
    "OUCH!", 
    "DODGE THIS!", 
    "WATCH OUT!", 
    "TOO SLOW, SPIDER!", 
    "IS THAT ALL YOU'VE GOT?!", 
    "PATHETIC!", 
    "YOUR MATH CAN'T SAVE YOU!", 
    "SLEEP, LITTLE SPIDER!"
  ];

  // Initialize questions
  useEffect(() => {
    setQuestions(generateQuestions(bossId, 10));
  }, [bossId]);

  // Timer logic
  useEffect(() => {
    if (phase !== 'combat' || selectedAnswer !== null) return;
    
    const interval = setInterval(() => {
      setTimeSpent(t => t + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [phase, selectedAnswer]);

  // Handle timeout
  useEffect(() => {
    if (timeSpent >= 300 && selectedAnswer === null && phase === 'combat') {
      handleTimeout();
    }
  }, [timeSpent, selectedAnswer, phase]);

  const handleTimeout = () => {
    if (bossId === 'doc-ock') {
      if (drottoAudioRef.current) {
        drottoAudioRef.current.currentTime = 0;
        drottoAudioRef.current.play().catch(console.error);
      }
    } else {
      if (goblinLaughAudioRef.current) {
        goblinLaughAudioRef.current.currentTime = 0;
        goblinLaughAudioRef.current.play().catch(console.error);
      }
    }
    
    setCombatFeedback('timeout');
    setFeedbackText('TIME OUT!');
    setCombo(0);
    
    const newPlayerHealth = Math.max(0, playerHealth - 10);
    setPlayerHealth(newPlayerHealth);
    
    setTimeout(() => {
      if (newPlayerHealth === 0) {
        setPhase('defeat');
      } else {
        setTimeSpent(0);
        setCombatFeedback(null);
      }
    }, 2000);
  };

  useEffect(() => {
    document.body.style.backgroundColor = "#000";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  useEffect(() => {
    if (phase === 'victory') {
      if (victoryMemeAudioRef.current) {
        victoryMemeAudioRef.current.currentTime = 0;
        victoryMemeAudioRef.current.play().catch(console.error);
        setTimeout(() => {
          if (victoryMemeAudioRef.current) {
            victoryMemeAudioRef.current.pause();
          }
        }, 6000);
      }
      
      // Save progression
      addSpiderPoints(combo * 100 + 250);
      incrementMissions();
      if (bossId === 'goblin') unlockBoss('doc-ock');
      if (bossId === 'doc-ock') unlockBoss('mysterio');
      if (bossId === 'mysterio') unlockBoss('venom');
      if (bossId === 'venom') unlockBoss('lizard');
      if (bossId === 'lizard') unlockBoss('kingpin');
    }
  }, [phase]);

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || questions.length === 0) return;
    
    setSelectedAnswer(index);
    const correct = index === questions[currentQuestion].correct;
    setIsCorrect(correct);
    
    if (correct) {
      if (webShooterAudioRef.current) {
        webShooterAudioRef.current.currentTime = 0;
        webShooterAudioRef.current.play().catch(console.error);
      }
      if (bossId === 'doc-ock' && drottoloosingAudioRef.current) {
        drottoloosingAudioRef.current.currentTime = 0;
        drottoloosingAudioRef.current.play().catch(console.error);
      }
      setCombatFeedback('strike');
      setFeedbackText(SUCCESS_DIALOGUES[Math.floor(Math.random() * SUCCESS_DIALOGUES.length)]);
      setCombo(c => c + 1);
    } else {
      if (bossId === 'doc-ock') {
        if (drottoAudioRef.current) {
          drottoAudioRef.current.currentTime = 0;
          drottoAudioRef.current.play().catch(console.error);
        }
      } else {
        if (goblinLaughAudioRef.current) {
          goblinLaughAudioRef.current.currentTime = 0;
          goblinLaughAudioRef.current.play().catch(console.error);
        }
      }
      setCombatFeedback('counter');
      setFeedbackText(FAILURE_DIALOGUES[Math.floor(Math.random() * FAILURE_DIALOGUES.length)]);
      setCombo(0);
    }

    setTimeout(() => {
      if (correct) {
        // 10 questions total = 10% damage each
        const newHealth = Math.max(0, villainHealth - 10);
        setVillainHealth(newHealth);
        if (newHealth === 0 || currentQuestion === questions.length - 1) {
          setTimeout(() => {
            setPhase('victory');
          }, 1500);
        } else {
          setTimeout(() => {
            setCurrentQuestion(c => c + 1);
            resetTurn();
          }, 1000);
        }
      } else {
        // 10% damage on wrong answer
        const newPlayerHealth = Math.max(0, playerHealth - 10);
        setPlayerHealth(newPlayerHealth);
        if (newPlayerHealth === 0) {
          if (bossId === 'doc-ock') {
            if (drottoAudioRef.current) {
              drottoAudioRef.current.currentTime = 0;
              drottoAudioRef.current.play().catch(console.error);
            }
          } else {
            if (goblinLaughAudioRef.current) {
              goblinLaughAudioRef.current.currentTime = 0;
              goblinLaughAudioRef.current.play().catch(console.error);
            }
          }
          setTimeout(() => setPhase('defeat'), 1500);
        } else {
          setTimeout(() => resetTurn(), 1000);
        }
      }
    }, 1500);
  };

  const resetTurn = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowHint(false);
    setCombatFeedback(null);
    setTimeSpent(0);
  };

  const handleRestart = () => {
    setQuestions(generateQuestions(bossId, 10));
    setPhase('combat');
    setCurrentQuestion(0);
    setVillainHealth(100);
    setPlayerHealth(100);
    setCombo(0);
    resetTurn();
  };

  if (questions.length === 0) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center text-white">Loading Mission...</div>;
  }

  if (phase === 'victory') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
        <audio ref={victoryMemeAudioRef} src="/spiderman-meme-song.mp3" preload="auto" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-hero-600/30 via-black to-black" />
        <Reveal className="relative text-center max-w-md w-full bg-ink-950/80 backdrop-blur-xl border border-hero-600/50 rounded-3xl p-8 comic-shadow-red">
          <div className="w-24 h-24 mx-auto bg-green-500/20 border-4 border-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(34,197,94,0.4)]">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-comic text-white mb-4 uppercase text-shadow-sm tracking-wide text-stroke-white">THREAT NEUTRALIZED</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-black/50 rounded-xl p-5 border border-hero-500/30">
              <div className="text-hero-400 font-comic text-4xl mb-1">+{combo * 100 + 250}</div>
              <div className="text-sm text-hero-500 uppercase tracking-widest font-bold">Spider Points</div>
            </div>
            <div className="bg-black/50 rounded-xl p-5 border border-green-500/30">
              <div className="text-green-400 font-comic text-4xl mb-1">{combo > 0 ? combo : '-'}</div>
              <div className="text-sm text-green-500 uppercase tracking-widest font-bold">Max Combo</div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={handleRestart}
              className="flex-1 py-5 bg-hero-600 text-white font-comic text-[15px] sm:text-xl tracking-wider rounded-xl hover:bg-hero-500 transition-all hover:scale-105 active:scale-95 comic-shadow whitespace-nowrap"
            >
              PLAY AGAIN
            </button>
            {(bossId !== 'kingpin') && onNextLevel && (
              <button 
                onClick={() => {
                  const nextMap: Record<string, string> = {
                    'goblin': 'doc-ock',
                    'doc-ock': 'mysterio',
                    'mysterio': 'venom',
                    'venom': 'lizard',
                    'lizard': 'kingpin'
                  };
                  onNextLevel(nextMap[bossId]);
                }}
                className="flex-1 py-5 bg-blue-600 text-white font-comic text-[15px] sm:text-xl tracking-wider rounded-xl hover:bg-blue-500 transition-all hover:scale-105 active:scale-95 comic-shadow-blue whitespace-nowrap"
              >
                NEXT LEVEL
              </button>
            )}
            <button 
              onClick={onExit}
              className="flex-1 py-5 bg-ink-800 text-white font-comic text-[15px] sm:text-xl tracking-wider rounded-xl hover:bg-ink-700 transition-all hover:scale-105 active:scale-95 border-2 border-hero-600/50 whitespace-nowrap"
            >
              HQ
            </button>
          </div>
        </Reveal>
      </div>
    );
  }

  if (phase === 'defeat') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/40 via-black to-black" />
        <Reveal className="relative text-center max-w-md w-full bg-ink-950/80 backdrop-blur-xl border border-red-600/50 rounded-3xl p-8 comic-shadow-red">
          <div className="w-24 h-24 mx-auto bg-red-500/20 border-4 border-red-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(220,38,38,0.4)]">
            <ShieldAlert className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-comic text-white mb-4 uppercase text-shadow-sm tracking-wide text-stroke-white">MISSION FAILED</h2>
          
          <p className="text-red-400 font-comic text-2xl mb-10">The Villain escaped this time...</p>

          <div className="flex gap-4">
            <button 
              onClick={handleRestart}
              className="flex-1 py-5 bg-red-600 text-white font-comic text-xl tracking-wider rounded-xl hover:bg-red-500 transition-all hover:scale-105 active:scale-95 comic-shadow-red"
            >
              TRY AGAIN
            </button>
            <button 
              onClick={onExit}
              className="flex-1 py-5 bg-ink-800 text-white font-comic text-xl tracking-wider rounded-xl hover:bg-ink-700 transition-all hover:scale-105 active:scale-95 border-2 border-red-600/50"
            >
              RETREAT
            </button>
          </div>
        </Reveal>
      </div>
    );
  }

  const q = questions[currentQuestion];
  
  let bossName = 'UNKNOWN THREAT';
  let bossGif = '/doc-ock-spider-man.gif'; // Placeholder
  let bossColor = 'slate-400';
  let bossBorder = 'border-slate-500';
  let bossBg = 'bg-slate-950/50';
  let healthGradient = 'from-slate-700 via-slate-500 to-slate-300';
  let bossIndex = 0;

  switch (bossId) {
    case 'goblin':
      bossName = 'GREEN GOBLIN';
      bossGif = '/goblin-gif.gif';
      bossColor = 'green-400';
      bossBorder = 'border-green-500';
      bossBg = 'bg-green-950/50';
      healthGradient = 'from-green-700 via-green-500 to-green-300';
      bossIndex = 1;
      break;
    case 'doc-ock':
      bossName = 'DOCTOR OCTOPUS';
      bossGif = '/doc-ock-spider-man.gif';
      bossColor = 'slate-400';
      bossBorder = 'border-slate-500';
      bossBg = 'bg-slate-950/50';
      healthGradient = 'from-slate-700 via-slate-500 to-slate-300';
      bossIndex = 2;
      break;
    case 'mysterio':
      bossName = 'MYSTERIO';
      bossColor = 'purple-400';
      bossBorder = 'border-purple-500';
      bossBg = 'bg-purple-950/50';
      healthGradient = 'from-purple-700 via-purple-500 to-purple-300';
      bossIndex = 3;
      break;
    case 'venom':
      bossName = 'VENOM';
      bossColor = 'slate-100';
      bossBorder = 'border-slate-300';
      bossBg = 'bg-black/50';
      healthGradient = 'from-black via-slate-700 to-slate-400';
      bossIndex = 4;
      break;
    case 'lizard':
      bossName = 'THE LIZARD';
      bossColor = 'lime-400';
      bossBorder = 'border-lime-500';
      bossBg = 'bg-lime-950/50';
      healthGradient = 'from-lime-700 via-lime-500 to-lime-300';
      bossIndex = 5;
      break;
    case 'kingpin':
      bossName = 'KINGPIN';
      bossColor = 'red-500';
      bossBorder = 'border-red-600';
      bossBg = 'bg-red-950/50';
      healthGradient = 'from-red-800 via-red-600 to-red-400';
      bossIndex = 6;
      break;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden font-sans">
      {/* Audio Refs */}
      <audio ref={webShooterAudioRef} src="https://actions.google.com/sounds/v1/foley/swoosh.ogg" preload="auto" />
      <audio ref={goblinLaughAudioRef} src="/green_goblin_laugh.mp3" preload="auto" />
      <audio ref={drottoAudioRef} src="/drotto.wav" preload="auto" />
      <audio ref={drottoloosingAudioRef} src="/drottoloosing.wav" preload="auto" />
      <audio ref={victoryMemeAudioRef} src="/spiderman-meme-song.mp3" preload="auto" />

      {/* Background Arena */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=3228&auto=format&fit=crop')] bg-cover bg-center opacity-20 filter grayscale blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-hero-900/40 via-ink-950/80 to-black" />
      <div className="absolute inset-0 halftone opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* Top Combat HUD */}
      <div className="relative z-20 flex justify-between items-start p-2 max-w-[1400px] mx-auto w-full pt-2">
        {/* Left: Spider-Man */}
        <div className="flex items-center gap-4 w-1/3">
          <div className="relative group shrink-0">
            <div className="absolute -inset-2 bg-hero-600/20 rounded-full blur-xl group-hover:bg-hero-600/40 transition-all" />
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-[3px] border-hero-600 bg-ink-900 overflow-hidden relative z-10 comic-shadow-red shadow-[0_0_20px_rgba(220,38,38,0.5)]">
              <img src="/spiderman-gif.gif" alt="Spidey" className="w-full h-full object-cover scale-110" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-black border-2 border-hero-500 text-hero-400 font-comic text-xs px-2 py-0.5 rounded-lg z-20">
              LVL 7
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <div className="flex justify-between items-end mb-1.5">
              <h1 className="text-xl sm:text-2xl font-comic text-white tracking-widest text-stroke-white italic whitespace-nowrap pr-2">SPIDER-MAN</h1>
            </div>
            <div className="h-3 bg-ink-950/80 rounded-full border-2 border-white/10 overflow-hidden relative shadow-[0_0_15px_rgba(220,38,38,0.3)]">
              <div 
                className="h-full bg-gradient-to-r from-red-700 via-hero-500 to-red-400 transition-all duration-500 ease-out" 
                style={{ width: `${playerHealth}%` }} 
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-1.5 text-hero-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-hero-950/50 px-2 py-1 rounded border border-hero-500/30 whitespace-nowrap">
                <Zap className="w-3 h-3 text-yellow-400" /> Spider Sense
              </div>
              <div className="text-white font-comic text-lg sm:text-xl">
                COMBO <span className="text-yellow-400 text-xl sm:text-2xl">{combo}x</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center VS */}
        <div className="flex-1 flex items-center justify-center mt-2 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-1 bg-gradient-to-r from-hero-600/0 via-white to-green-500/0 opacity-20" />
          <div className="font-comic text-4xl sm:text-5xl text-white italic tracking-tighter opacity-80 animate-pulse text-shadow-sm text-stroke-white">
            VS
          </div>
        </div>

        {/* Right: Boss */}
        <div className="flex items-center gap-4 w-1/3 flex-row-reverse text-right">
          <div className="relative shrink-0">
            <div className="absolute -inset-2 bg-green-500/20 rounded-full blur-xl" />
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-[3px] ${bossBorder} bg-ink-900 overflow-hidden relative z-10 shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-center`}>
              {bossId === 'goblin' || bossId === 'doc-ock' ? (
                <img src={bossGif} alt={bossName} className={`w-full h-full object-cover scale-110 object-top ${bossId === 'doc-ock' ? 'grayscale-[0.3]' : ''}`} />
              ) : (
                <ShieldAlert className={`w-8 h-8 text-${bossColor}`} />
              )}
            </div>
            <div className={`absolute -bottom-2 -left-2 bg-black border-2 ${bossBorder} text-${bossColor} font-comic text-[10px] sm:text-xs px-2 py-0.5 rounded-lg z-20 flex items-center gap-1`}>
              <ShieldAlert className="w-3 h-3" /> BOSS
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <div className="flex justify-between items-end mb-1.5 flex-row-reverse">
              <h1 className={`text-xl sm:text-2xl font-comic text-${bossColor} tracking-widest text-stroke-white italic whitespace-nowrap pr-2 uppercase`}>{bossName}</h1>
            </div>
            <div className="h-3 bg-ink-950/80 rounded-full border-2 border-white/10 overflow-hidden relative shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              <div 
                className={`h-full transition-all duration-500 ease-out bg-gradient-to-l ${healthGradient}`} 
                style={{ width: `${villainHealth}%`, marginLeft: 'auto' }} 
              />
            </div>
            <div className="flex justify-end items-center mt-2">
              <div className={`flex items-center gap-2 text-${bossColor} text-[10px] sm:text-xs font-bold uppercase tracking-widest ${bossBg} px-2 py-1 rounded border ${bossBorder}/30 whitespace-nowrap`}>
                Threat: CRITICAL
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Combat Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-2 min-h-0 w-full">
        
        {/* Holographic Question Panel */}
        <div className="w-full max-w-3xl relative mt-2">
          
          <div className="absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-hero-500 opacity-50" />
          <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-hero-500 opacity-50" />
          <div className="absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-hero-500 opacity-50" />
          <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-hero-500 opacity-50" />
          
          <div className="bg-black/60 backdrop-blur-2xl border border-red-500/20 rounded-3xl p-4 sm:p-5 shadow-[0_0_40px_rgba(220,38,38,0.1)] relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 border-b border-red-500/20 pb-2">
                <div>
                  <div className="text-red-500 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> THREAT DETECTED
                  </div>
                  <div className="text-white font-comic text-lg sm:text-xl tracking-widest uppercase">MISSION 0{bossIndex}: {bossName} ATTACK</div>
                </div>
                
                {/* Timer Section */}
                <div className="text-right flex items-center gap-4">
                  <div className={`flex flex-col items-end ${timeSpent > 240 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-sm">
                      <Clock className="w-4 h-4" /> 
                      {Math.floor((300 - timeSpent) / 60)}:{( (300 - timeSpent) % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider">Time Limit (5M)</div>
                  </div>
                  
                  <div className="hidden sm:block border-l border-white/10 pl-4">
                    <div className="text-gray-500 font-mono text-[10px] uppercase mb-1">OBJECTIVE {currentQuestion + 1} / {questions.length}</div>
                    <div className="text-hero-400 font-mono font-bold animate-pulse text-xs">AWAITING INPUT...</div>
                  </div>
                </div>
              </div>

              <div className="mb-4 text-sm sm:text-base text-white font-medium leading-tight whitespace-pre-line text-shadow-sm font-mono">
                {q.question.split('\n').map((line, i) => (
                  <span key={i} className={line.includes('Solve:') || line.includes('Find') || line.includes('What is') ? 'text-hero-400 font-bold' : ''}>
                    {line.includes('ALERT') || line.includes('THREAT') ? <span className="text-red-500 font-bold">{line}</span> : line}<br/>
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {q.options.map((opt, idx) => {
                  let stateClasses = "bg-red-950/10 border-red-500/20 text-white hover:bg-red-900/30 hover:border-hero-500/80 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:-translate-y-1";
                  
                  if (selectedAnswer !== null) {
                    if (idx === q.correct) {
                      stateClasses = "bg-green-500/20 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)] text-green-400 scale-[1.02] z-10";
                    } else if (idx === selectedAnswer) {
                      stateClasses = "bg-red-600/30 border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.6)] text-red-400 scale-[0.98]";
                    } else {
                      stateClasses = "bg-black/50 border-white/5 text-gray-700 opacity-30";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={selectedAnswer !== null || combatFeedback === 'timeout'}
                      onClick={() => handleAnswer(idx)}
                      className={`relative overflow-hidden p-3 rounded-xl border-2 text-left font-comic text-lg sm:text-xl transition-all duration-300 group ${stateClasses}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-hero-500/0 via-hero-500/10 to-hero-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      
                      <div className="relative z-10 flex items-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-black/40 border border-white/10 text-hero-400 text-xs mr-3 font-mono shadow-inner shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {opt}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <style>{`
            @keyframes phraseZoomIn {
              0% { transform: scale(0.5); opacity: 0; }
              70% { transform: scale(1.1); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
          
          {combatFeedback === 'strike' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-hero-600/10 backdrop-blur-sm overflow-hidden">
              <div style={{ animation: 'phraseZoomIn 0.4s ease-out forwards' }}>
                <div className="relative text-white font-comic text-5xl md:text-7xl italic tracking-tighter text-shadow-xl text-stroke-white rotate-[-10deg] shadow-[0_0_100px_rgba(220,38,38,1)] p-6 md:p-8 bg-black/60 border-4 border-hero-500 rounded-3xl z-10 backdrop-blur-md">
                  {feedbackText}
                </div>
              </div>
            </div>
          )}

          {combatFeedback === 'counter' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-red-900/20 backdrop-blur-sm overflow-hidden">
              <div style={{ animation: 'phraseZoomIn 0.4s ease-out forwards' }}>
                <div className="relative text-red-400 font-comic text-5xl md:text-7xl italic tracking-tighter text-shadow-xl text-stroke-white rotate-[5deg] shadow-[0_0_100px_rgba(220,38,38,0.6)] p-6 md:p-8 bg-black/80 border-4 border-red-500 rounded-3xl z-10 backdrop-blur-md">
                  {feedbackText}
                </div>
              </div>
            </div>
          )}

          {combatFeedback === 'timeout' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-yellow-900/40 backdrop-blur-sm overflow-hidden">
              <div style={{ animation: 'phraseZoomIn 0.4s ease-out forwards' }}>
                <div className="relative text-yellow-400 font-comic text-5xl md:text-7xl italic tracking-tighter text-shadow-xl text-stroke-white shadow-[0_0_100px_rgba(234,179,8,0.6)] p-6 md:p-8 bg-black/80 border-4 border-yellow-500 rounded-3xl z-10 backdrop-blur-md">
                  {feedbackText}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-30 flex items-end gap-3 max-w-sm">
        {showHint ? (
          <div className="bg-pink-950/80 backdrop-blur-md border border-pink-500/40 p-4 rounded-2xl rounded-bl-none shadow-[0_0_30px_rgba(236,72,153,0.2)] animate-pulse relative">
            <div className="absolute -bottom-3 left-4 w-3 h-3 bg-pink-950 border-b border-l border-pink-500/40 rotate-[-45deg]" />
            <div className="flex justify-between items-center mb-2">
              <span className="text-pink-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1"><Cpu className="w-3 h-3" /> Gwen's Analysis</span>
              <button onClick={() => setShowHint(false)} className="text-gray-400 hover:text-white text-xs">✕</button>
            </div>
            <p className="text-white text-sm leading-relaxed font-mono">{q.hint}</p>
          </div>
        ) : (
          <button 
            onClick={() => setShowHint(true)}
            className="group bg-black/50 border border-pink-500/30 backdrop-blur-sm px-4 py-2 rounded-full text-pink-400 font-bold text-sm flex items-center gap-2 hover:bg-pink-500/20 hover:border-pink-500 transition-all hover:-translate-y-1"
          >
            <Cpu className="w-4 h-4 group-hover:animate-pulse" /> Request Gwen's Intel
          </button>
        )}
        
        <div className="relative shrink-0">
          <div className="absolute -inset-2 bg-pink-500/20 rounded-full blur-lg animate-pulse" />
          <img src="/gwen.jpeg" alt="Gwen" className="relative z-10 w-14 h-14 rounded-full border-2 border-pink-500 object-cover opacity-90 hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <button 
        onClick={onExit}
        className="absolute bottom-4 right-4 z-50 text-gray-500 hover:text-white font-bold text-[10px] sm:text-xs tracking-widest uppercase transition-colors"
      >
        Abort Mission
      </button>

    </div>
  );
}
