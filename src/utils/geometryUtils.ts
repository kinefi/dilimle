import type { Polygon } from 'polygon-clipping';

export interface Point {
  x: number;
  y: number;
}

export const getPolygonArea = (poly: Point[]) => {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    area += poly[i].x * poly[j].y;
    area -= poly[j].x * poly[i].y;
  }
  return Math.abs(area) / 2;
};

export const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
};

export const distToSegment = (p: Point, v: Point, w: Point) => {
  const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
  if (l2 === 0) return Math.sqrt(Math.pow(p.x - v.x, 2) + Math.pow(p.y - v.y, 2));
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt(
    Math.pow(p.x - (v.x + t * (w.x - v.x)), 2) + Math.pow(p.y - (v.y + t * (w.y - v.y)), 2),
  );
};

/**
 * Generates polygon segments representing a "knife" path with thickness.
 */
export const generateKnifeSegments = (
  trail: Point[],
  player: Point,
  thickness = 1.0,
): Polygon[] => {
  const uniqueTrail = trail
    .concat([player])
    .filter((p, i, arr) => i === 0 || p.x !== arr[i - 1].x || p.y !== arr[i - 1].y);
  if (uniqueTrail.length < 2) return [];

  const segments: Polygon[] = [];
  for (let i = 0; i < uniqueTrail.length - 1; i++) {
    const p1 = uniqueTrail[i];
    const p2 = uniqueTrail[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.1) continue;

    const nx = (-dy / len) * thickness;
    const ny = (dx / len) * thickness;

    const p1L: [number, number] = [p1.x - nx, p1.y - ny];
    const p2L: [number, number] = [p2.x - nx, p2.y - ny];
    const p2R: [number, number] = [p2.x + nx, p2.y + ny];
    const p1R: [number, number] = [p1.x + nx, p1.y + ny];

    segments.push([[p1L, p2L, p2R, p1R, p1L]]);
  }
  return segments;
};
