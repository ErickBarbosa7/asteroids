# AGENTS.md

Classic Asteroids clone: pure HTML5 Canvas game. Single-file, no build, no packages, no tests, no lint.

## Run

- Open `index.html` in a browser, or `npx serve .` and visit `http://localhost:3000`.
- There is no dev server, build, test, lint, or typecheck step. Verify changes by opening the page and playing.

## Structure

- `game.js` — all game logic (input, entities, update/draw, game loop). Script is a plain `<script src>` include: no modules, everything is global scope. File starts with `'use strict'`.
- `index.html` — page + inline CSS + `<canvas id="canvas" width="800" height="600">`.
- `favicon.svg` — favicon only.

## Gotchas

- Canvas size is duplicated: hardcoded `width`/`height` in `index.html` **and** the `W`/`H` constants in `game.js:5-6`. Resize requires editing both, plus any size-derived values (e.g. `SAFE_DIST`, spawn logic).
- The game loop (`loop`, `game.js:412`) uses `requestAnimationFrame` with `dt` clamped to `0.05s`. All movement is via `update(dt)`; do not use per-frame movement.
- World wraps toroidally via the `wrap` util (`game.js:27`).
- HUD text, game text, README, and code comments are in Spanish — keep new UI text and comments in Spanish.
- Code style: class-per-entity (`Ship`, `Asteroid`, `Bullet`, `Particle`), mutable global state (`ship`, `bullets`, etc.), `// ── Section ──` comment separators (box-drawing chars), entities removed via `.filter(e => !e.dead)`.
- Game states are strings: `'playing' | 'dead' | 'gameover'` (`game.js:241`).