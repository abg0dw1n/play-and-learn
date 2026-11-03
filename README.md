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
- `js/data/words.js` — picture words (one per letter) and the choice-count rule · `js/data/reading.js` — 3/4/5-letter picture words
- `js/games/` — one file per game, listed in `js/games/index.js`
- `sw.js` + `manifest.webmanifest` + `icons/` — add to home screen, works offline

## Games
Pitched at a kindergartner who is already sounding out, blending and building words, and whose class is starting
greater/less than and measuring weight.
- **Build a Word** — hear a word, see its picture, tap the letters in order (multi-step rounds via `advance` in the engine)
- **Read the Word** — a word is shown (not spoken); sound it out and tap the matching picture
- **Sight Words** — hear a word and find it; later, pick the word that fits a sentence
- **Story Time** — a short story is read aloud, then a question about it
- **Greater or Less** — which number is greater/less, then the `>` `<` `=` signs with numbers and groups of pictures
- **Heavy or Light** — which weighs more/less, then heaviest/lightest of three
- **Letter Sounds** — paused for now (`paused: true` in `js/games/sounds.js`); phone voices read made-up sounds like "buh" as letters
  Sound Check (Grown-ups) picks the voice and per-letter spellings per device
- Archived in `js/games/archive/` (too easy for her now, not on the home screen): Letter Hunt, Rhyme Time, Count It!

Word lists live in `js/data/reading.js`; each game keeps its question bank and difficulty table at the top of its file.
Spoken lines can be a list (`say: ['Which rhymes?', 'cat.', 'hat.']`) — each line is spoken with a short pause.
The voice picker prefers Premium / Enhanced / Natural voices when the device has them.

## Voice
Every line the games say has a recorded clip made with the open-source Kokoro voice (`af_heart`, a warm female voice),
stored in `audio/` and listed in `audio/manifest.json` (text → clip). `js/core/voice.js` plays the clip for a line and
falls back to the device's built-in voice for any line without one (or if a phone blocks playback).
Names aren't spoken (the clips are the same for everyone).

When you add or change anything the voice says (including `PRAISE`/`RETRY` in `choice-game.js`), make the new clips:
1. `python3 -m http.server 8090`, then `node tools/collect-lines.mjs` (rewrites `tools/lines.json`)
2. `python3 tools/tts.py --models <dir> --espeak <dir> --lines tools/lines.json --out audio` (see the top of `tools/tts.py`
   for where the free model files come from; only new lines are generated)
3. Commit `audio/`

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
