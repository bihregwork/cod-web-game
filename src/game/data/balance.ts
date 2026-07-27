export const BALANCE = {
  startingLives: 3,
  maxFuel: 60,
  fuelCanLiters: 20,
  movement: {
    heroSpeedPxPerSecond: 230,
    carSpeedPxPerSecond: 340,
    speedBonusLevel1To20: 0.01,
    speedBonusLevel21To40: 0.02,
  },
  difficulty: {
    maxLevel: 40,
    scoreStep: 200_000,
    contractChanceMin: 0.02,
    contractChanceMax: 0.05,
    maxFallSpeedMultiplier: 4,
    spawnIntervalLevel1Ms: 2_000,
    spawnIntervalMaxLevelMs: 650,
  },
  fallingItems: {
    baseFallSpeedPxPerSecond: 100,
    fuelCanSpeedMultiplier: 0.85,
  },
  hazards: {
    taxShare: 0.7,
  },
  fuelSpawn: {
    unassembledBelowMax: 0.03,
    assembledEmpty: 0.06,
    activeCritical: 0.08,
    activeLow: 0.06,
    activeMiddle: 0.04,
    activeHigh: 0.02,
    pityThresholdLiters: 20,
    pityTimerMs: 15_000,
  },
  carParts: {
    spawnChanceLevel1To10: 0.04,
    spawnChanceLevel11To20: 0.05,
    spawnChanceLevel21To30: 0.06,
    spawnChanceLevel31To40: 0.07,
    minSpawnGapMs: 8_000,
  },
  scoring: {
    taxPenalty: 50_000,
    missedContractLifePenalty: 1,
    missedCatchableBeforeLifePenalty: 3,
  },
} as const;
