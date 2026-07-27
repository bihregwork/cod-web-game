import { BALANCE } from "../data/balance";

export function difficultyLevel(_elapsedSeconds: number, score: number): number {
  const scoreLevel = Math.floor(score / BALANCE.difficulty.scoreStep);
  return Math.min(BALANCE.difficulty.maxLevel, Math.max(1, 1 + scoreLevel));
}

export function contractChance(level: number): number {
  const { contractChanceMin, contractChanceMax } = BALANCE.difficulty;
  const progress = difficultyProgress(level);
  return contractChanceMin + (contractChanceMax - contractChanceMin) * progress;
}

export function hazardChance(level: number): number {
  return 0.06 + (0.22 - 0.06) * difficultyProgress(level);
}

export function fallSpeedMultiplier(level: number): number {
  return 1 + (BALANCE.difficulty.maxFallSpeedMultiplier - 1) * difficultyProgress(level);
}

export function spawnIntervalMs(level: number): number {
  const progress = difficultyProgress(level);
  const { spawnIntervalLevel1Ms, spawnIntervalMaxLevelMs } = BALANCE.difficulty;
  return Math.round(spawnIntervalLevel1Ms - (spawnIntervalLevel1Ms - spawnIntervalMaxLevelMs) * progress);
}

export function movementSpeedMultiplier(level: number): number {
  const normalizedLevel = Math.min(BALANCE.difficulty.maxLevel, Math.max(1, level));
  const level1To20Steps = Math.min(normalizedLevel - 1, 19);
  const level21To40Steps = Math.max(0, normalizedLevel - 20);

  return (
    1 +
    level1To20Steps * BALANCE.movement.speedBonusLevel1To20 +
    level21To40Steps * BALANCE.movement.speedBonusLevel21To40
  );
}

function difficultyProgress(level: number): number {
  const normalizedLevel = Math.min(BALANCE.difficulty.maxLevel, Math.max(1, level));
  return (normalizedLevel - 1) / (BALANCE.difficulty.maxLevel - 1);
}
