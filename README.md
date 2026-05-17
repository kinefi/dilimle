# Dilimle

**Dilimle** (Turkish for "Slice it") is a modern Volfied/Qix-inspired arcade game built with React, TypeScript, Vite, and the [HTML5 Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API). 

The objective is to capture the "void" by slicing off sections while avoiding enemies that inhabit the danger zones.

## Key Features
- **Modular Architecture:** Adheres to SOLID principles and Clean Architecture by separating concerns into dedicated hooks (Input, PowerUps, Progression) and utility modules (Geometry, Collision).
- **Advanced Capture Logic:** Uses `polygon-clipping` for robust geometric calculations, ensuring the playable area is correctly preserved while slicing.
- **Dynamic Difficulty:** Level-based scaling that introduces new enemy types (Chasers, Fire Trailers) and increases speeds as you progress.
- **Power-up System:** Includes Shields, Fire Resistance, and Slow Motion to aid in capturing dense areas.
- **High Performance:** Optimized HTML5 Canvas rendering pipeline with a decoupled physics update loop.

## Tech Stack
- **Frontend:** React 19 + TypeScript 6
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS 4
- **Rendering:** HTML5 Canvas
- **Geometry Processing:** [polygon-clipping](https://github.com/mfogel/polygon-clipping)

## Controls
- **Arrow Keys:** Move the player and slice through the void.
- **Space (Reserved):** Power-up interaction (if applicable).
- **Volume Slider:** Adjust background music levels in real-time.

## Getting Started

### Prerequisites
- Node.js (v20 or higher)
- pnpm, npm, or yarn

## Music
- Background music https://pixabay.com/music/video-games-8-bit-retro-game-music-233964/
- Capture music https://pixabay.com/music/video-games-game-8-bit-on-short-278081/

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```

## Development Workflow
- **Type Safety:** TypeScript is strictly enforced during the build process. Running `pnpm build` will trigger a type-check pass that must succeed before the project is bundled.

## License
Licensed under the [Apache License, Version 2.0](./LICENSE).