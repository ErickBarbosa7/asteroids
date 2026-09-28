# AGENTS.md

Classic Asteroids clone: pure HTML5 Canvas game. Single-file, no build, no packages, no tests, no lint.

## Run

- Open `index.html` in a browser, or `npx serve .` and visit `http://localhost:3000`.
- There is no dev server, build, test, lint, or typecheck step. Verify changes by opening the page and playing.

## Structure

- `game.js` — all game logic (input, entities, update/draw, game loop). Script is a plain `<script src>` include: no modules, everything is global scope. File starts with `'use strict'`.
- `index.html` — page + inline CSS + `<canvas id="canvas" width="800" height="600">`.
- `favicon.svg` — favicon only.
- `.opencode/agents/triage.md` — read-only agent that classifies an issue into strict JSON. Powers the triage workflow; it has no write or shell permissions.
- `.github/workflows/issue-triage.yml` — auto-triage on new issues (see below).

## Issue triage

`issue-triage.yml` runs on every new issue. It **never rewrites what the reporter
wrote**: it only normalizes the title, appends a collapsible triage table plus any
missing `## Pasos para reproducir` / `## Resultado esperado` / `## Entorno` sections
at the end of the body, and posts one bot comment.

- The `triage` agent returns JSON between `<<<JSON>>>` sentinels. A deterministic
  script validates it against a fixed label taxonomy and drops anything unknown, so
  a bad model response can only produce `needs-triage`, never a broken issue.
- Re-running is idempotent: the block is delimited by `<!-- triage:begin -->` /
  `<!-- triage:end -->`, and the bot comment is edited rather than duplicated.
- Re-triage manually: **Actions → triage de issues → Run workflow** with the issue number.
- Configurable via repo variables: `TRIAGE_MODEL` (default
  `opencode-go/deepseek-v4-flash`) and `AREA_OWNERS` (JSON, e.g. `{"hud":"@user"}`).
  Default assignee is the repository owner.
- **When adding a game module, add its `area:*` label to the `AREAS` array** in the
  workflow, and the key to the agent's field table, otherwise it falls back to `area:ui`.

## Gotchas

- Canvas size is duplicated: hardcoded `width`/`height` in `index.html` **and** the `W`/`H` constants in `game.js:5-6`. Resize requires editing both, plus any size-derived values (e.g. `SAFE_DIST`, spawn logic).
- The game loop (`loop`, `game.js:412`) uses `requestAnimationFrame` with `dt` clamped to `0.05s`. All movement is via `update(dt)`; do not use per-frame movement.
- World wraps toroidally via the `wrap` util (`game.js:27`).
- HUD text, game text, README, and code comments are in Spanish — keep new UI text and comments in Spanish.
- Code style: class-per-entity (`Ship`, `Asteroid`, `Bullet`, `Particle`), mutable global state (`ship`, `bullets`, etc.), `// ── Section ──` comment separators (box-drawing chars), entities removed via `.filter(e => !e.dead)`.
- Game states are strings: `'playing' | 'dead' | 'gameover'` (`game.js:241`).