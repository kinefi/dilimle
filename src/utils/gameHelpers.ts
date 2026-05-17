import { GAME_CONFIG } from '../constants/config';
import polygonClipping from 'polygon-clipping';
import { Enemy } from '../game/entities/Enemy';
import { Point, getPolygonArea, isPointInPolygon, generateKnifeSegments } from './geometryUtils';

/**
 * Helper to calculate the true area of a MultiPolygon (Shells - Holes)
 */
export const calculateTotalArea = (polys: Point[][]): number => {
  if (polys.length === 0) return 0;
  const subject = polys.map(p => [p.map(pt => [pt.x, pt.y] as [number, number])]) as any;
  const unified = (polygonClipping.union as any)(...subject);
  
  return unified.reduce((acc: number, poly: any) => {
    const shellArea = getPolygonArea(poly[0].map(([x, y]: any) => ({ x, y })));
    const holeArea = poly.slice(1).reduce((hAcc: number, hole: any) => 
      hAcc + getPolygonArea(hole.map(([x, y]: any) => ({ x, y }))), 0);
    return acc + (shellArea - holeArea);
  }, 0);
};

/**
 * Analyzes void fragments to find which ones contain enemies.
 */
export const analyzeFragments = (fragmentedVoid: any[], enemies: Enemy[]) => {
  const allFragments: { poly: any; area: number; enemyCount: number; }[] = [];
  fragmentedVoid.forEach(fv => {
    const shell = fv[0].map(([x, y]: [number, number]) => ({ x: x, y: y }));
    const holes = fv.slice(1).map((h: any) => h.map(([x, y]: [number, number]) => ({ x: x, y: y })));
    
    let enemiesInThisFragment = 0;
    enemies.forEach(enemy => {
      const inShell = isPointInPolygon({ x: enemy.x, y: enemy.y }, shell);
      if (!inShell) return;
      const inHole = holes.some((h: Point[]) => isPointInPolygon({ x: enemy.x, y: enemy.y }, h));
      if (!inHole) enemiesInThisFragment++;
    });

    allFragments.push({
      poly: fv,
      area: getPolygonArea(shell),
      enemyCount: enemiesInThisFragment
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
  enemies: Enemy[]
): { finalCaptured: Point[][]; capturedPercent: number; shouldDie: boolean } | null => {
  const fullField: [number, number][][] = [[
    [0, 0], [GAME_CONFIG.GRID_WIDTH, 0], 
    [GAME_CONFIG.GRID_WIDTH, GAME_CONFIG.GRID_HEIGHT], [0, GAME_CONFIG.GRID_HEIGHT]
  ]];
  
  const currentCaptured = capturedPolygons.map(p => [p.map(pt => [pt.x, pt.y] as [number, number])]);
  const currentVoid = polygonClipping.difference(fullField as any, currentCaptured as any);
  
  const uniqueTrail = trail.concat([player]).filter((p, i, arr) => i === 0 || p.x !== arr[i-1].x || p.y !== arr[i-1].y);
  if (uniqueTrail.length < 2) return null;

  const knifeSegments: any[] = [];
  for (let i = 0; i < uniqueTrail.length - 1; i++) {
    const p1 = uniqueTrail[i];
    const p2 = uniqueTrail[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.1) continue;

    // Increase thickness slightly to 1.0 for better clipping stability
    const nx = (-dy / len) * 1.0;
    const ny = (dx / len) * 1.0;

    const p1L = [p1.x - nx, p1.y - ny];
    const p2L = [p2.x - nx, p2.y - ny];
    const p2R = [p2.x + nx, p2.y + ny];
    const p1R = [p1.x + nx, p1.y + ny];

    knifeSegments.push([[[p1L, p2L, p2R, p1R, p1L]]]);
  }

  try {
    const knifeUnion = knifeSegments.length > 0 ? (polygonClipping.union as any)(...knifeSegments) : [];
    const fragmentedVoid = polygonClipping.difference(currentVoid as any, knifeUnion as any);
    if (fragmentedVoid.length === 0) return null;
    
    // Use the optimized analyzeFragments helper
    const { allFragments } = analyzeFragments(fragmentedVoid, enemies);

    // Rule: The largest fragment (index 0) is ALWAYS the new playable void.
    const newVoidFragment = allFragments[0].poly;

    // Check if any other fragment (the ones about to be captured) contains an enemy.
    // This prevents "trapping" the boss in a small area and capturing the main field.
    // If the boss is in a fragment being captured, the player dies.
    const trappedEnemy = allFragments.slice(1).some(f => f.enemyCount > 0);
    if (trappedEnemy) {
      return { finalCaptured: capturedPolygons, capturedPercent: 0, shouldDie: true };
    }
    
    const capturedFragments = allFragments
      .slice(1) // Capture everything except the largest fragment
      .map(f => f.poly);

    const finalCapturedRaw = (polygonClipping.union as any)(...currentCaptured, ...capturedFragments);
    const finalCaptured = finalCapturedRaw.map((mp: any) => mp[0].map(([x, y]: [number, number]) => ({ x, y })));
    
    // Use the robust area calculator that accounts for holes
    const currentArea = calculateTotalArea(finalCaptured);
    
    return { 
      finalCaptured, 
      capturedPercent: currentArea, 
      shouldDie: false 
    };
  } catch (e) {
    console.error("Capture geometry error:", e);
    return null;
  }
};