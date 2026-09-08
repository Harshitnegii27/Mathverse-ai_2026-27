import { useState, useEffect } from 'react';

interface GameState {
  spiderPoints: number;
  unlockedBosses: string[]; // e.g. ['goblin', 'doc-ock']
  missionsCompleted: number;
}

const DEFAULT_STATE: GameState = {
  spiderPoints: 0,
  unlockedBosses: ['goblin'], // Goblin is unlocked by default
  missionsCompleted: 0,
};

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('mathverse_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_STATE;
      }
    }
    return DEFAULT_STATE;
  });

  useEffect(() => {
    localStorage.setItem('mathverse_state', JSON.stringify(gameState));
  }, [gameState]);

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
