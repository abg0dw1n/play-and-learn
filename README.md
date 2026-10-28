# Play & Learn

Voice-led learning games for a kindergartner. Static site, no build step — same setup as the exam simulator.

## Layout
- `index.html`, `css/styles.css`, `js/app.js` — home screen, router (`#/play/<game>`), grown-ups panel (press and hold)
- `js/core/` — shared pieces: `voice.js` (spoken prompts), `sfx.js` (sounds), `confetti.js`, `store.js` (stars/levels in localStorage), `choice-game.js` (the game engine)
- `js/games/` — one file per game, listed in `js/games/index.js`
- `sw.js` + `manifest.webmanifest` — add to home screen, works offline

## Adding a game
Create `js/games/<name>.js` exporting `{ id, title, emoji, color, blurb, rounds, maxLevel, makeRound(level, history) }`
and add it to `js/games/index.js`. `makeRound` returns a round object (see the comment at the top of `js/core/choice-game.js`);
the engine handles voice, retries, hints, stars, level-ups and the celebration.
A game that needs its own screen can export `run(root, game, { onHome })` instead.

## Run locally
`python3 -m http.server 8080` then open http://localhost:8080
