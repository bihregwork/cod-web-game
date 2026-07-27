export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function missedBottom(item: Rect, bottomY: number): boolean {
  return item.y > bottomY;
}
