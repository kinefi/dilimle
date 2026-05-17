export interface GameConfig {
  GRID_WIDTH: number;
  GRID_HEIGHT: number;
  COLORS: {
    BACKGROUND: string;
    SAFE_ZONE: string;
    BORDER: string;
    PLAYER: string;
    SHIELD: string;
    TRAIL: string;
    ENEMY: string;
  };
  PLAYER_SPEED: number;
  WIN_PERCENTAGE: number;
  INITIAL_LIVES: number;
  SHIELD_DURATION: number;
  SOUNDS: {
    SLICE: string;
    CAPTURE: string;
    BGM: string;
  };
}

export const GAME_CONFIG: GameConfig = {
  GRID_WIDTH: 800,
  GRID_HEIGHT: 600,
  COLORS: {
    BACKGROUND: '#1a1a2e',
    SAFE_ZONE: '#16213e',
    BORDER: '#4ecca3', // Brighter, more distinct border color
    PLAYER: '#ffffff',
    SHIELD: '#38bdf8',
    TRAIL: '#e94560',
    ENEMY: '#ffde7d',
  },
  PLAYER_SPEED: 4,
  WIN_PERCENTAGE: 80,
  INITIAL_LIVES: 3,
  SHIELD_DURATION: 300, // Frames (approx 5 seconds at 60fps)
  SOUNDS: {
    SLICE: '/sounds/slice.mp3',
    CAPTURE: '/sounds/capture.mp3',
    BGM: '/sounds/bgm.mp3',
  },
};