import { GAME_CONFIG } from '../constants/config';

export type Point = { x: number; y: number };

export const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

export const loadAudio = async (url: string): Promise<AudioBuffer | null> => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Audio 404: File not found at ${window.location.origin}${url}. Please ensure file exists in /public${url}`);
      return null;
    }

    const contentType = response.headers.get('Content-Type');
    // Check for HTML fallback or missing content-type
    if (!contentType || contentType.includes('text/html')) {
      console.error(`Audio 404: File not found at ${url}. Ensure it exists in /public/sounds/`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error(`Error decoding audio data for ${url}:`, error);
    return null;
  }
};

export const assetsPromise = Promise.all([
  loadAudio(GAME_CONFIG.SOUNDS.SLICE),
  loadAudio(GAME_CONFIG.SOUNDS.CAPTURE),
  loadAudio(GAME_CONFIG.SOUNDS.BGM),
]).then(([slice, capture, bgm]) => ({ slice, capture, bgm }));

let bgmSource: AudioBufferSourceNode | null = null;
const bgmFilter = audioCtx.createBiquadFilter();
bgmFilter.type = 'lowpass';
bgmFilter.frequency.setValueAtTime(20000, audioCtx.currentTime);
bgmFilter.connect(audioCtx.destination);

export const startBGM = (buffer: AudioBuffer | null) => {
  if (!buffer || bgmSource) return;
  
  // Safety resume for browser autoplay policies
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  bgmSource = audioCtx.createBufferSource();
  bgmSource.buffer = buffer;
  bgmSource.loop = true;
  bgmSource.connect(bgmFilter);
  bgmSource.start(0);
};

export const setBGMMuffled = (muffled: boolean) => {
  const freq = muffled ? 600 : 20000;
  // Smooth transition to the muffled "underwater" sound
  bgmFilter.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.1);
};

export const stopBGM = () => {
  if (bgmSource) {
    try {
      bgmSource.stop();
    } catch (e) { /* Already stopped */ }
    bgmSource = null;
  }
};

export const playSound = (buffer: AudioBuffer | null, duration?: number) => {
  if (!buffer || audioCtx.state === 'suspended') {
    return; // Cannot play yet
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  if (duration) {
    source.start(0, 0, duration);
  } else {
    source.start(0);
  }
};

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
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = 
      ((yi > point.y) !== (yj > point.y)) && 
      (point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi);
      
    if (intersect) inside = !inside;
  }
  return inside;
};

/**
 * Calculates the shortest distance from a point to a line segment.
 * Used for detecting if the Boss hits the player's trail.
 */
export const distToSegment = (p: Point, v: Point, w: Point) => {
  const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
  if (l2 === 0) return Math.sqrt(Math.pow(p.x - v.x, 2) + Math.pow(p.y - v.y, 2));
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt(
    Math.pow(p.x - (v.x + t * (w.x - v.x)), 2) + Math.pow(p.y - (v.y + t * (w.y - v.y)), 2)
  );
};