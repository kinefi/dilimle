# Dilimle

**Dilimle** (Turkish for "Slice it") is a modern Volfied/Qix-inspired arcade game built with React, TypeScript, Vite, and the [HTML5 Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API).

The objective is to capture the "void" by slicing off sections while avoiding enemies that inhabit the danger zones.

## Key Features

- **Modular Architecture:** Adheres to SOLID principles and Clean Architecture by separating concerns into dedicated hooks (Input, PowerUps, Progression) and utility modules (Geometry, Collision).
- **Advanced Capture Logic:** Uses `polygon-clipping` for robust geometric calculations, ensuring the playable area is correctly preserved while slicing.
- **Fragment Analysis:** Intelligent fragment sorting that prevents the player from accidentally capturing the "main field" while trapping enemies.
- **Dynamic Difficulty:** Level-based scaling that introduces multiple enemy types (Bouncers, Chasers, and Fire Trailers) with increasing velocity scales.
- **Power-up System:** Includes Shields, Fire Resistance, and Slow Motion to aid in capturing dense areas.
- **High Performance:** Optimized HTML5 Canvas rendering pipeline with a decoupled physics update loop.

## Tech Stack

- **Frontend:** React 19 + TypeScript 5
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 4 + PostCSS
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

## Available Scripts

- `pnpm dev`: Starts the Vite development server.
- `pnpm lint`: Runs `tsc` to perform a full type-check across the project.
- `pnpm validate`: Runs type-checking, linting, and formatting checks (used by CI and Git hooks).
- `pnpm test`: Runs the test suite (currently a placeholder).
- `pnpm build`: Bundles the application for production into the `dist` folder.
- `pnpm format`: Automatically formats the codebase using Prettier.

## Git Hooks

This project uses **Husky** to enforce code quality before pushing code.

- **Pre-push:** Runs `pnpm validate` to ensure that no code with type errors or linting issues is pushed to the remote.

## CI/CD & Deployment

This project uses **GitHub Actions** for automated deployment.

Every push to the `main` branch triggers a workflow that:

1. Installs dependencies using `pnpm`.
2. Performs a type-check (`pnpm lint`).
3. Runs tests (`pnpm test`).
4. Builds the production bundle.
5. Automatically deploys the result to the `gh-pages` branch.

## License

Licensed under the [Apache License, Version 2.0](./LICENSE).
