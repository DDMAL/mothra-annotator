export function screenToImage(
  sx: number,
  sy: number,
  zoom: number,
  panX: number,
  panY: number,
): [number, number] {
  return [(sx - panX) / zoom, (sy - panY) / zoom];
}

export function imageToScreen(
  ix: number,
  iy: number,
  zoom: number,
  panX: number,
  panY: number,
): [number, number] {
  return [ix * zoom + panX, iy * zoom + panY];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
