export const LEVEL_THRESHOLDS = {
  1: 0,
  2: 50,
  3: 150,
  4: 300,
  5: 500,
  6: 800,
  7: 1200,
  8: 1800,
  9: 2600,
  10: 3600,
  11: 5000,
  12: 6800,
  13: 9000,
  14: 12000,
  15: 16000,
  16: 21000,
  17: 27000,
  18: 35000,
  19: 45000,
  20: 60000,
};

export const MAX_LEVEL = 20;

export const calculateLevelInfo = (xp) => {
  let currentLevel = 1;
  while (currentLevel < MAX_LEVEL && xp >= LEVEL_THRESHOLDS[currentLevel + 1]) {
    currentLevel++;
  }

  const currentLevelXp = LEVEL_THRESHOLDS[currentLevel];
  const nextLevelXp = currentLevel < MAX_LEVEL ? LEVEL_THRESHOLDS[currentLevel + 1] : xp;
  
  const xpIntoLevel = xp - currentLevelXp;
  const xpForNextLevel = nextLevelXp - currentLevelXp;

  const progress = xpForNextLevel > 0 ? (xpIntoLevel / xpForNextLevel) * 100 : 100;

  return {
    level: currentLevel,
    xp,
    progress: Math.min(progress, 100),
    xpToNextLevel: Math.max(0, nextLevelXp - xp),
  };
};