import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface GameState {
  spiderPoints: number;
  unlockedBosses: string[]; // e.g. ['goblin']
  missionsCompleted: number;
}

const BOSS_KEYS = ['goblin', 'doc-ock', 'mysterio', 'venom', 'lizard', 'kingpin'];

const DEFAULT_STATE: GameState = {
  spiderPoints: 0,
  unlockedBosses: ['goblin'], // ONLY Goblin is unlocked initially after signup
  missionsCompleted: 0,
};

export function useGameState() {
  const { user } = useAuth();

  const [gameState, setGameState] = useState<GameState>(() => {
    if (!user) {
      return DEFAULT_STATE;
    }
    const saved = localStorage.getItem(`mathverse_state_user_${user.userId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Level 1 = ['goblin'] only; Level 2 = ['goblin', 'doc-ock'], etc.
        const levelUnlocked = BOSS_KEYS.slice(0, Math.max(1, user.level || 1));
        const combined = Array.from(new Set([...levelUnlocked, ...(parsed.unlockedBosses || ['goblin'])]));
        return {
          spiderPoints: user.points !== undefined ? user.points : (parsed.spiderPoints || 0),
          unlockedBosses: combined,
          missionsCompleted: parsed.missionsCompleted || 0,
        };
      } catch (e) {
        return DEFAULT_STATE;
      }
    }
    // New signup: user.level is 1 -> ONLY ['goblin']
    return {
      spiderPoints: user.points || 0,
      unlockedBosses: ['goblin'],
      missionsCompleted: 0,
    };
  });

  // Keep state perfectly synchronized with current logged-in user
  useEffect(() => {
    if (!user) {
      setGameState(DEFAULT_STATE);
      return;
    }
    const saved = localStorage.getItem(`mathverse_state_user_${user.userId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const levelUnlocked = BOSS_KEYS.slice(0, Math.max(1, user.level || 1));
        const combined = Array.from(new Set([...levelUnlocked, ...(parsed.unlockedBosses || ['goblin'])]));
        setGameState({
          spiderPoints: user.points !== undefined ? user.points : (parsed.spiderPoints || 0),
          unlockedBosses: combined,
          missionsCompleted: parsed.missionsCompleted || 0,
        });
        return;
      } catch (e) {}
    }
    // Brand new user after signup: level 1 -> ONLY ['goblin']
    const levelUnlocked = BOSS_KEYS.slice(0, Math.max(1, user.level || 1));
    setGameState({
      spiderPoints: user.points || 0,
      unlockedBosses: levelUnlocked,
      missionsCompleted: 0,
    });
  }, [user?.userId, user?.level, user?.points]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`mathverse_state_user_${user.userId}`, JSON.stringify(gameState));
    }
  }, [gameState, user]);

  const addSpiderPoints = (points: number) => {
    setGameState((prev) => ({ ...prev, spiderPoints: prev.spiderPoints + points }));
  };

  const unlockBoss = (bossId: string) => {
    setGameState((prev) => {
      if (prev.unlockedBosses.includes(bossId)) return prev;
      return { ...prev, unlockedBosses: [...prev.unlockedBosses, bossId] };
    });
  };

  const incrementMissions = () => {
    setGameState((prev) => ({ ...prev, missionsCompleted: prev.missionsCompleted + 1 }));
  };

  const resetGame = () => {
    if (user) {
      localStorage.removeItem(`mathverse_state_user_${user.userId}`);
    }
    setGameState(DEFAULT_STATE);
  };

  return {
    gameState,
    addSpiderPoints,
    unlockBoss,
    incrementMissions,
    resetGame,
  };
}
