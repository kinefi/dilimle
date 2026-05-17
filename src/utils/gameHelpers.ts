import { GAME_CONFIG } from '../constants/config';
import type { MultiPolygon, Polygon } from 'polygon-clipping';
import polygonClipping from 'polygon-clipping';
import type { Enemy } from '../game/entities/Enemy';
import type { Point } from './geometryUtils';
import { getPolygonArea, isPointInPolygon, generateKnifeSegments } from './geometryUtils';

/**
 * Helper to calculate the true area of a MultiPolygon (Shells - Holes)
 */
export const calculateTotalArea = (polys: Point[][]): number => {
  if (polys.length === 0) return 0;
  const subject = polys.map((p) => [p.map((pt) => [pt.x, pt.y] as [number, number])]) as Polygon[];
  const unified = polygonClipping.union(subject);

  return unified.reduce((acc: number, poly: Polygon) => {
    const shellArea = getPolygonArea(poly[0].map(([x, y]) => ({ x, y })));
    const holeArea = poly
      .slice(1)
      .reduce((hAcc: number, hole) => hAcc + getPolygonArea(hole.map(([x, y]) => ({ x, y }))), 0);
    return acc + (shellArea - holeArea);
  }, 0);
};

/**
 * Analyzes void fragments to find which ones contain enemies.
 */
export const analyzeFragments = (fragmentedVoid: MultiPolygon, enemies: Enemy[]) => {
  const allFragments: { poly: Polygon; area: number; enemyCount: number }[] = [];
  fragmentedVoid.forEach((fv) => {
    const shell = fv[0].map(([x, y]) => ({ x, y }));
    const holes = fv.slice(1).map((h) => h.map(([x, y]) => ({ x: x, y: y })));

    let enemiesInThisFragment = 0;
    enemies.forEach((enemy) => {
      const inShell = isPointInPolygon({ x: enemy.x, y: enemy.y }, shell);
      if (!inShell) return;
      const inHole = holes.some((h) => isPointInPolygon({ x: enemy.x, y: enemy.y }, h));
      if (!inHole) enemiesInThisFragment++;
    });

    allFragments.push({
      poly: fv,
      area: getPolygonArea(shell),
      enemyCount: enemiesInThisFragment,
    });
  });

  // Always sort primarily by area (largest first) to ensure the playable area remains the main field
  allFragments.sort((a, b) => b.area - a.area);

  return { allFragments };
};

/**
 * Core Domain Logic for capturing areas.
 * Extracts the geometry calculations from the React lifecycle.
 */
export const performCaptureCalculation = (
  trail: Point[],
  player: Point,
  capturedPolygons: Point[][],
  enemies: Enemy[],
): { finalCaptured: Point[][]; capturedPercent: number; shouldDie: boolean } | null => {
  const fullField: [number, number][][] = [
    [
      [0, 0],
      [GAME_CONFIG.GRID_WIDTH, 0],
      [GAME_CONFIG.GRID_WIDTH, GAME_CONFIG.GRID_HEIGHT],
      [0, GAME_CONFIG.GRID_HEIGHT],
    ],
  ];

  const currentCaptured = capturedPolygons.map((p) => [
    p.map((pt) => [pt.x, pt.y] as [number, number]),
  ]) as Polygon[];
  const currentVoid = polygonClipping.difference(fullField, currentCaptured);

  const knifeSegments = generateKnifeSegments(trail, player, 1.0);
  if (knifeSegments.length === 0) return null;

  try {
    const knifeUnion = knifeSegments.length > 0 ? polygonClipping.union(knifeSegments) : [];
    const fragmentedVoid = polygonClipping.difference(currentVoid, knifeUnion);
    if (fragmentedVoid.length === 0) return null;

    // Use the optimized analyzeFragments helper
    const { allFragments } = analyzeFragments(fragmentedVoid, enemies);

    // Rule: The largest fragment (index 0) is ALWAYS the new playable void.

    // Check if any other fragment (the ones about to be captured) contains an enemy.
    // This prevents "trapping" the boss in a small area and capturing the main field.
    // If the boss is in a fragment being captured, the player dies.
    const trappedEnemy = allFragments.slice(1).some((f) => f.enemyCount > 0);
    if (trappedEnemy) {
      return { finalCaptured: capturedPolygons, capturedPercent: 0, shouldDie: true };
    }

    const capturedFragments = allFragments
      .slice(1) // Capture everything except the largest fragment
      .map((f) => f.poly);

    const finalCapturedRaw = polygonClipping.union([...currentCaptured, ...capturedFragments]);
    const finalCaptured = finalCapturedRaw.map((mp) => mp[0].map(([x, y]) => ({ x, y })));

    // Use the robust area calculator that accounts for holes
    const currentArea = calculateTotalArea(finalCaptured);

    return {
      finalCaptured,
      capturedPercent: currentArea,
      shouldDie: false,
    };
  } catch (e) {
    console.error('Capture geometry error:', e);
    return null;
  }
};
