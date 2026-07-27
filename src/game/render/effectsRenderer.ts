export function scorePopupText(points: number): string {
  return points > 0 ? `+${points}` : `${points}`;
}
