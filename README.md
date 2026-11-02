# Play & Learn

Voice-led learning games for a kindergartner. Static site, no build step — same setup as the exam simulator.
Live at https://play-and-learn-pi.vercel.app (every push to `main` deploys).

## Layout
- `index.html`, `css/styles.css`, `js/app.js` — home screen, difficulty picker, sound on/off (🔔), router (`#/play/<game>`), grown-ups panel (press and hold)
- `js/core/` — shared pieces: `voice.js` (spoken prompts + sound toggle), `sfx.js` (sounds), `confetti.js`, `store.js` (stars, difficulty, per-difficulty levels in localStorage), `choice-game.js` (the game engine)
- `js/games/` — one file per game, listed in `js/games/index.js`
- `sw.js` + `manifest.webmanifest` — add to home screen, works offline

## Difficulty
Three modes chosen on the home screen: First Steps, Growing Strong (default), Super Star.
Each game keeps a separate level for each mode, and goes up a level after 3 right answers in a row,
up to that game's `maxLevels[mode]`.

## Adding a game
Create `js/games/<name>.js` exporting
`{ id, title, emoji, color, blurb, rounds, maxLevels: [firstSteps, growingStrong, superStar], makeRound(level, history, difficulty) }`
and add it to `js/games/index.js`. `makeRound` returns a round object (see the comment at the top of `js/core/choice-game.js`);
the engine handles the spoken prompt, 🔊 repeat, retries, hints, the Next button, stars, level-ups and the celebration.
A game that needs its own screen can export `run(root, game, { onHome, onRestart })` instead.

## Run locally
`python3 -m http.server 8080` then open http://localhost:8080
