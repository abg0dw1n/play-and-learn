# Play & Learn

Voice-led learning games for a kindergartner. Static site, no build step — same setup as the exam simulator.
Live at https://play-and-learn-pi.vercel.app (every push to `main` deploys).

## Layout
- `index.html`, `css/styles.css`, `js/app.js` — home screen, difficulty picker, sound on/off (🔔), grown-ups panel (press and hold),
  router: `#/` home, `#/play/<game>`, `#/stickers`, `#/sound-check`
- `js/core/` — shared pieces:
  - `choice-game.js` the game engine (prompt, 🔊 repeat, retries, hints, Next button, stars, level-ups, finish screen)
  - `voice.js` spoken prompts, voice choice, sound toggle · `sfx.js` sound effects · `confetti.js`
  - `store.js` everything saved on the device (localStorage): stars, stickers, difficulty, per-difficulty levels, voice, Sound Check picks
  - `stickers.js` sticker book · `sound-check.js` grown-ups Sound Check page
- `js/data/words.js` — shared picture words (one per letter) and the choice-count rule
- `js/games/` — one file per game, listed in `js/games/index.js`
- `sw.js` + `manifest.webmanifest` + `icons/` — add to home screen, works offline

## Games
- **Letter Hunt** — picture + its name, tap the first letter
- **Letter Sounds** — hear "buh", tap B. Each letter has spelling options in `SOUND_OPTIONS`
  (device voices spell some made-up words out as letters); a grown-up picks per device on Sound Check, which also picks the voice
- **Count It!** — tap to count, pick the number
- **Rhyme Time** — picture + spoken choices, tap the one that rhymes

## Sticker book
Every finished game awards one new sticker (40 in `js/core/stickers.js`) until all are found; then just a star.
Stars earned before the sticker book existed were turned into stickers once.

## Difficulty
Three modes chosen on the home screen: First Steps, Growing Strong (default), Super Star.
Each game keeps a separate level for each mode, and goes up a level after 3 first-try right answers in a row,
up to that game's `maxLevels[mode]`.

## Adding a game
Create `js/games/<name>.js` exporting
`{ id, title, emoji, color, blurb, rounds, maxLevels: [firstSteps, growingStrong, superStar], makeRound(level, history, difficulty) }`
and add it to `js/games/index.js`. `makeRound` returns a round object (see the comment at the top of `js/core/choice-game.js`).
A game that needs its own screen can export `run(root, game, { onHome, onRestart, onStickers })` instead; return a cleanup function.

## Run locally
`python3 -m http.server 8080` then open http://localhost:8080
