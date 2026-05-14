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

export function pointInRect(
  ix: number,
  iy: number,
  bbox: [number, number, number, number],
): boolean {
  const [x, y, w, h] = bbox;
  return ix >= x && ix <= x + w && iy >= y && iy <= y + h;
}

export function rectsIntersect(
  // left, bottom, width, height
  a: [number, number, number, number],
  b: [number, number, number, number],
): boolean {
  const aRight = a[0] + a[2];
  const aTop = a[1] + a[3];
  const bRight = b[0] + b[2];
  const bTop = b[1] + b[3];
  return a[0] < bRight && aRight > b[0] && a[1] < bTop && aTop > b[1];
}

export function computeFitZoom(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): number {
  return Math.min(containerWidth / imageWidth, containerHeight / imageHeight);
}
