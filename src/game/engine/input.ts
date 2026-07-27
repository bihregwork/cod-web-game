export type Direction = -1 | 0 | 1;

export function directionFromKeys(keys: Set<string>): Direction {
  if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) {
    return -1;
  }
  if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) {
    return 1;
  }
  return 0;
}
