import React, { useEffect, useRef, useState } from 'react';
import { GameLoop } from '../game/engine/GameLoop';
import { Renderer } from '../game/engine/Renderer';
import { GAME_CONFIG } from '../constants/config';
import { Enemy, EnemyType } from '../game/entities/Enemy';
import { Spark } from '../game/entities/Spark';
import { Shield, ShieldType } from '../game/entities/Shield';
import { 
  Point, 
  playSound, 
  startBGM,
  setBGMMuffled,
  getPolygonArea, 
  isPointInPolygon,
  distToSegment
} from '../utils/gameHelpers';
import polygonClipping from 'polygon-clipping';

export const useGameEngine = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>, 
  audioAssets: any,
  isStarted: boolean
) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(GAME_CONFIG.INITIAL_LIVES);
  const [capturedPercent, setCapturedPercent] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [shieldTime, setShieldTime] = useState(0);
  const shieldTimeRef = useRef(0);
  const initialAreaRef = useRef(0);
  const capturedPercentRef = useRef(0);
  const [fireShieldTime, setFireShieldTime] = useState(0);
  const fireShieldTimeRef = useRef(0);
  const [slowMotionTime, setSlowMotionTime] = useState(0);
  const slowMotionTimeRef = useRef(0);

  const playerRef = useRef({ x: 0, y: 0 });
  const keysRef = useRef<Record<string, boolean>>({});
  const enemiesRef = useRef([
    new Enemy(200, 200, EnemyType.BOUNCER),
    new Enemy(GAME_CONFIG.GRID_WIDTH - 200, GAME_CONFIG.GRID_HEIGHT - 200, EnemyType.CHASER)
  ]);
  const sparkRef = useRef(new Spark());
  const shieldRef = useRef(new Shield());

  const sliceState = useRef({
    isSlicing: false,
    trail: [] as Point[],
    capturedPolygons: [
      [{ x: 0, y: 0 }, { x: GAME_CONFIG.GRID_WIDTH, y: 0 }, { x: GAME_CONFIG.GRID_WIDTH, y: 20 }, { x: 0, y: 20 }],
      [{ x: GAME_CONFIG.GRID_WIDTH - 20, y: 0 }, { x: GAME_CONFIG.GRID_WIDTH, y: 0 }, { x: GAME_CONFIG.GRID_WIDTH, y: GAME_CONFIG.GRID_HEIGHT }, { x: GAME_CONFIG.GRID_WIDTH - 20, y: GAME_CONFIG.GRID_HEIGHT }],
      [{ x: 0, y: GAME_CONFIG.GRID_HEIGHT - 20 }, { x: GAME_CONFIG.GRID_WIDTH, y: GAME_CONFIG.GRID_HEIGHT - 20 }, { x: GAME_CONFIG.GRID_WIDTH, y: GAME_CONFIG.GRID_HEIGHT }, { x: 0, y: GAME_CONFIG.GRID_HEIGHT }],
      [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: GAME_CONFIG.GRID_HEIGHT }, { x: 0, y: GAME_CONFIG.GRID_HEIGHT }]
    ] as Point[][]
  });

  // Helper to calculate non-overlapping area
  const calculateArea = (polys: Point[][]) => {
    const totalArea = GAME_CONFIG.GRID_WIDTH * GAME_CONFIG.GRID_HEIGHT;
    if (polys.length === 0) return 0;
    
    const subject = polys.map(p => [p.map(pt => [pt.x, pt.y] as [number, number])]) as any;
    const unified = subject.length > 0 ? polygonClipping.union(...subject) : [];
    
    return unified.reduce((acc, poly) => {
      const shellArea = getPolygonArea(poly[0].map(([x, y]) => ({ x, y })));
      let holeArea = 0;
      for (let i = 1; i < poly.length; i++) {
        holeArea += getPolygonArea(poly[i].map(([x, y]) => ({ x, y })));
      }
      return acc + (shellArea - holeArea);
    }, 0);
  };

  const calculatePercent = (currentArea: number) => {
    const totalArea = GAME_CONFIG.GRID_WIDTH * GAME_CONFIG.GRID_HEIGHT;
    const playableArea = totalArea - initialAreaRef.current;
    if (playableArea <= 0) return 0;
    
    const capturedFromVoid = Math.max(0, currentArea - initialAreaRef.current);
    return Math.min(100, Math.floor((capturedFromVoid / playableArea) * 100));
  };

  // Calculate initial percentage on mount
  useEffect(() => {
    if (!isStarted) return;
    
    const area = calculateArea(sliceState.current.capturedPolygons);
    initialAreaRef.current = area;
    capturedPercentRef.current = 0;
    setCapturedPercent(0);
    
    // Spawn a shield randomly every 15-30 seconds
    const shieldTimer = setInterval(() => {
      if (!sliceState.current.isSlicing && !isGameOver && !isWin) {
        // We need the current void to spawn inside it
        const fullField: [number, number][][] = [[[0, 0], [GAME_CONFIG.GRID_WIDTH, 0], [GAME_CONFIG.GRID_WIDTH, GAME_CONFIG.GRID_HEIGHT], [0, GAME_CONFIG.GRID_HEIGHT]]];
        const currentCaptured = sliceState.current.capturedPolygons.map(p => [p.map(pt => [pt.x, pt.y] as [number, number])]);
        const currentVoid = polygonClipping.difference(fullField as any, currentCaptured as any);
        const voidPolys: Point[][] = currentVoid.map(mp => mp[0].map(([x, y]) => ({ x, y })));
        
        const rand = Math.random();
        const type = rand > 0.66 ? ShieldType.SLOW_MOTION : rand > 0.33 ? ShieldType.FIRE : ShieldType.NORMAL;
        
        shieldRef.current.spawn(voidPolys, type);
      }
    }, 15000);

    return () => clearInterval(shieldTimer);
  }, [isStarted]);

  const resetGame = () => {
    // Determine if we are advancing or restarting
    const isNextLevel = isWin;
    const nextLevel = isNextLevel ? level + 1 : 1;
    
    // Calculate target percentage for the next level: starts at 70%, +2% per level, max 95%
    const targetPercent = Math.min(70 + nextLevel * 2, 95);

    if (!isNextLevel) {
      setLives(GAME_CONFIG.INITIAL_LIVES);
    }
    
    setLevel(nextLevel);
    if (!isNextLevel) setScore(0);

    initialAreaRef.current = 0;
    setCapturedPercent(0);
    capturedPercentRef.current = 0;
    setIsGameOver(false);
    setIsWin(false);
    setShieldTime(0);
    shieldTimeRef.current = 0;
    setSlowMotionTime(0);
    slowMotionTimeRef.current = 0;
    playerRef.current = { x: 0, y: 0 };

    const newEnemies = [];
    const enemyCount = nextLevel + 1;
    for (let i = 0; i < enemyCount; i++) {
      let type = EnemyType.BOUNCER;
      // Gating: Introduce Chasers at level 2, Fire Trailers at level 3
      if (nextLevel >= 2 && i % 3 === 1) type = EnemyType.CHASER;
      if (nextLevel >= 3 && i % 3 === 2) type = EnemyType.FIRE_TRAILER;
      
      // Difficulty spike after level 10: Upgrade Bouncers to Chasers and increase speed scaling
      let speedScale = 1 + (nextLevel - 1) * 0.1;
      if (nextLevel > 10) {
        speedScale *= 1.3; // 30% speed boost
        if (type === EnemyType.BOUNCER) type = EnemyType.CHASER;
      }

      newEnemies.push(new Enemy(200 + i * 50, 200, type, speedScale));
    }
    enemiesRef.current = newEnemies;

    sparkRef.current = new Spark();
    sliceState.current.isSlicing = false;
    sliceState.current.trail = [];
    sliceState.current.capturedPolygons = [
      [{ x: 0, y: 0 }, { x: GAME_CONFIG.GRID_WIDTH, y: 0 }, { x: GAME_CONFIG.GRID_WIDTH, y: 20 }, { x: 0, y: 20 }],
      [{ x: GAME_CONFIG.GRID_WIDTH - 20, y: 0 }, { x: GAME_CONFIG.GRID_WIDTH, y: 0 }, { x: GAME_CONFIG.GRID_WIDTH, y: GAME_CONFIG.GRID_HEIGHT }, { x: GAME_CONFIG.GRID_WIDTH - 20, y: GAME_CONFIG.GRID_HEIGHT }],
      [{ x: 0, y: GAME_CONFIG.GRID_HEIGHT - 20 }, { x: GAME_CONFIG.GRID_WIDTH, y: GAME_CONFIG.GRID_HEIGHT - 20 }, { x: GAME_CONFIG.GRID_WIDTH, y: GAME_CONFIG.GRID_HEIGHT }, { x: 0, y: GAME_CONFIG.GRID_HEIGHT }],
      [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: GAME_CONFIG.GRID_HEIGHT }, { x: 0, y: GAME_CONFIG.GRID_HEIGHT }]
    ];

    const area = calculateArea(sliceState.current.capturedPolygons);
    initialAreaRef.current = area;
    capturedPercentRef.current = 0;
    setCapturedPercent(0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioAssets || isGameOver || isWin || !isStarted) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    startBGM(audioAssets.bgm);

    const handleKeyDown = (e: KeyboardEvent) => { 
      // Prevent browser from scrolling when using arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current[e.key] = true; 
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    const update = (): void => {
      const player = playerRef.current;
      const state = sliceState.current;

      setBGMMuffled(state.isSlicing);

      const radius = 5;

      // Restrict to 4 directions by using else-if priority
      if (keysRef.current['ArrowUp']) {
        player.y = Math.max(radius, player.y - GAME_CONFIG.PLAYER_SPEED);
      } else if (keysRef.current['ArrowDown']) {
        player.y = Math.min(GAME_CONFIG.GRID_HEIGHT - radius, player.y + GAME_CONFIG.PLAYER_SPEED);
      } else if (keysRef.current['ArrowLeft']) {
        player.x = Math.max(radius, player.x - GAME_CONFIG.PLAYER_SPEED);
      } else if (keysRef.current['ArrowRight']) {
        player.x = Math.min(GAME_CONFIG.GRID_WIDTH - radius, player.x + GAME_CONFIG.PLAYER_SPEED);
      }

      const handleCapture = () => {
        if (state.trail.length < 2) {
          state.isSlicing = false;
          state.trail = [];
          return;
        }

        const targetPercent = Math.min(70 + level * 2, 95);

        const fullField: [number, number][][] = [[
          [0, 0], [GAME_CONFIG.GRID_WIDTH, 0], 
          [GAME_CONFIG.GRID_WIDTH, GAME_CONFIG.GRID_HEIGHT], [0, GAME_CONFIG.GRID_HEIGHT]
        ]];
        const currentCaptured = state.capturedPolygons.map(p => [p.map(pt => [pt.x, pt.y] as [number, number])]);
        const currentVoid = polygonClipping.difference(fullField as any, currentCaptured as any);
        
        // Create a "knife" polygon from the trail
        const uniqueTrail = state.trail.concat([player]).filter((p, i, arr) => i === 0 || p.x !== arr[i-1].x || p.y !== arr[i-1].y);
        if (uniqueTrail.length < 2) return;

        // Optimize clipping by using segment-based cutting.
        // Each segment is a thin rectangle; clipping with multiple small polygons is 
        // significantly more robust against self-intersections than one complex ribbon.
        const knifeSegments: any[] = [];
        for (let i = 0; i < uniqueTrail.length - 1; i++) {
          const p1 = uniqueTrail[i];
          const p2 = uniqueTrail[i + 1];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len < 0.1) continue;

          // Calculate normal vector for the offset
          const nx = (-dy / len) * 0.1;
          const ny = (dx / len) * 0.1;

          const p1L = [p1.x - nx, p1.y - ny];
          const p2L = [p2.x - nx, p2.y - ny];
          const p2R = [p2.x + nx, p2.y + ny];
          const p1R = [p1.x + nx, p1.y + ny];

          knifeSegments.push([[[p1L, p2L, p2R, p1R, p1L]]]);
        }

        try {
          const fragmentedVoid = polygonClipping.difference(currentVoid as any, ...knifeSegments);
          
          // Capture fragments that contain NO enemies
          const capturedFragments = fragmentedVoid.filter(fv => {
            const fragPoints = fv[0].map(([x, y]) => ({ x, y }));
            return !enemiesRef.current.some(enemy => enemy.isInsidePolygon(fragPoints));
          });

          const finalCaptured = polygonClipping.union(currentCaptured as any, capturedFragments as any);

          state.capturedPolygons = finalCaptured.map(mp => mp[0].map(([x, y]) => ({ x, y })));
          
          const currentArea = calculateArea(state.capturedPolygons);
          const newPercent = calculatePercent(currentArea);
          
          const delta = newPercent - capturedPercentRef.current;
          if (delta > 0) {
            const multiplier = 1 + Math.floor(delta / 10);
            setScore(prev => prev + (delta * 100 * multiplier));
          }

          capturedPercentRef.current = newPercent;
          setCapturedPercent(newPercent);
          
          if (newPercent >= targetPercent) {
            setIsWin(true);
          }
          playSound(audioAssets.capture, 1.0); // Play only the first second of the music
        } catch (e) { console.error(e); }

        state.isSlicing = false;
        state.trail = [];
        sparkRef.current.isActive = false;
      };

      // Check Shield Collection
      if (shieldRef.current.isActive) {
        const dist = Math.sqrt(Math.pow(player.x - shieldRef.current.x, 2) + Math.pow(player.y - shieldRef.current.y, 2));
        if (dist < 20) {
          if (shieldRef.current.type === ShieldType.FIRE) {
            fireShieldTimeRef.current = GAME_CONFIG.SHIELD_DURATION;
            setFireShieldTime(GAME_CONFIG.SHIELD_DURATION);
          } else if (shieldRef.current.type === ShieldType.SLOW_MOTION) {
            slowMotionTimeRef.current = GAME_CONFIG.SHIELD_DURATION;
            setSlowMotionTime(GAME_CONFIG.SHIELD_DURATION);
          } else {
            shieldTimeRef.current = GAME_CONFIG.SHIELD_DURATION;
            setShieldTime(GAME_CONFIG.SHIELD_DURATION);
          }
          shieldRef.current.isActive = false;
        }
      }

      const inSafeZone = state.capturedPolygons.some(poly => isPointInPolygon(player, poly));
      if (!inSafeZone && !state.isSlicing) {
        state.isSlicing = true;
        state.trail = [ { x: player.x, y: player.y } ];
        sparkRef.current.activate(state.trail[0]);
        playSound(audioAssets.slice);
      } else if (state.isSlicing) {
        const lastPoint = state.trail[state.trail.length - 1];
        if (Math.abs(lastPoint.x - player.x) > 2 || Math.abs(lastPoint.y - player.y) > 2) {
          state.trail.push({ x: player.x, y: player.y });
        }

        // Collision Check: Boss vs Trail
        for (const enemy of enemiesRef.current) {
          for (let i = 0; i < state.trail.length - 1; i++) {
            if (distToSegment({ x: enemy.x, y: enemy.y }, state.trail[i], state.trail[i + 1]) < 10) {
              if (shieldTimeRef.current <= 0) {
                setLives(prev => {
                  if (prev <= 1) setIsGameOver(true);
                  return prev - 1;
                });
                state.isSlicing = false;
                state.trail = [];
                sparkRef.current.isActive = false;
                return;
              }
            }
          }
        }

        // Collision Check: Player vs Trail (Self-collision)
        // Skip the most recent segments (tail) to allow for movement
        for (let i = 0; i < state.trail.length - 15; i++) {
          if (distToSegment(player, state.trail[i], state.trail[i + 1]) < 5) {
            if (shieldTimeRef.current <= 0) {
              setLives(prev => {
                if (prev <= 1) setIsGameOver(true);
                return prev - 1;
              });
              state.isSlicing = false;
              state.trail = [];
              sparkRef.current.isActive = false;
              return;
            }
          }
        }

        // Collision Check: Player vs Enemy Fire Trails
        for (const enemy of enemiesRef.current) {
          for (const fire of enemy.fireTrail) {
            const dist = Math.sqrt(Math.pow(player.x - fire.x, 2) + Math.pow(player.y - fire.y, 2));
            if (dist < 8 && shieldTimeRef.current <= 0 && fireShieldTimeRef.current <= 0) {
              setLives(prev => {
                if (prev <= 1) setIsGameOver(true);
                return prev - 1;
              });
              state.isSlicing = false;
              state.trail = [];
              sparkRef.current.isActive = false;
              return;
            }
          }
        }

        if (inSafeZone) handleCapture();
      }

      if (state.isSlicing) {
        if (sparkRef.current.update(state.trail, player)) {
          if (shieldTimeRef.current <= 0) {
            setLives(prev => {
              if (prev <= 1) setIsGameOver(true);
              return prev - 1;
            });
            state.isSlicing = false;
            state.trail = [];
            sparkRef.current.isActive = false;
          }
        }
      }

      if (shieldTimeRef.current > 0) {
        shieldTimeRef.current--;
        // Only update React state occasionally or keep it in sync for the HUD
        if (shieldTimeRef.current % 10 === 0) setShieldTime(shieldTimeRef.current);
      }

      if (fireShieldTimeRef.current > 0) {
        fireShieldTimeRef.current--;
        if (fireShieldTimeRef.current % 10 === 0) setFireShieldTime(fireShieldTimeRef.current);
      }

      if (slowMotionTimeRef.current > 0) {
        slowMotionTimeRef.current--;
        if (slowMotionTimeRef.current % 10 === 0) setSlowMotionTime(slowMotionTimeRef.current);
      }

      enemiesRef.current.forEach(enemy => {
        enemy.update(
          (p) => state.capturedPolygons.some(poly => isPointInPolygon(p, poly)),
          playerRef.current,
          slowMotionTimeRef.current > 0 ? 0.3 : 1
        );
      });
    };

    const renderer = new Renderer(ctx);
    const draw = (): void => {
      renderer.draw(
        sliceState.current.capturedPolygons,
        sliceState.current.trail,
        sliceState.current.isSlicing,
        playerRef.current,
        shieldTimeRef.current,
        fireShieldTimeRef.current,
        slowMotionTimeRef.current,
        enemiesRef.current,
        sparkRef.current,
        shieldRef.current
      );
    };

    const engine = new GameLoop(update, draw);
    engine.start();
    return () => { 
      engine.stop(); 
      setBGMMuffled(false);
      window.removeEventListener('keydown', handleKeyDown); 
      window.removeEventListener('keyup', handleKeyUp); 
    };
  }, [audioAssets, isGameOver, isWin, isStarted]);

  const targetPercent = Math.min(70 + level * 2, 95);
  const bossHealth = Math.max(0, Math.floor(((targetPercent - capturedPercent) / targetPercent) * 100));

  return { level, score, lives, capturedPercent, bossHealth, isGameOver, isWin, shieldTime, fireShieldTime, slowMotionTime, resetGame };
};