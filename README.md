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
- **Add & Take Away** — adding and subtracting, alternating: pictures to count first (within 5, then 10), then numbers only (up to 20 on Super Star); pictures appear as a hint after a miss. Every question and answer is a whole recorded sentence ("What is 3 plus 2?"), ~800 clips (`tools/addsub-lines.json`)
- **Greater or Less** — which number is greater/less, then the `>` `<` `=` signs with numbers and groups of pictures
- **Heavy or Light** — which weighs more/less, then heaviest/lightest of three
- **Letter Sounds** — paused for now (`paused: true` in `js/games/sounds.js`); phone voices read made-up sounds like "buh" as letters
  Sound Check (Grown-ups) picks the voice and per-letter spellings per device
- Archived in `js/games/archive/` (too easy for her now, not on the home screen): Letter Hunt, Rhyme Time, Count It!

Word lists live in `js/data/reading.js`; each game keeps its question bank and difficulty table at the top of its file.
Spoken lines can be a list (`say: ['Which rhymes?', 'cat.', 'hat.']`) — each line is spoken with a short pause.
The voice picker prefers Premium / Enhanced / Natural voices when the device has them.

## Screens
Home has four big picture tiles (Reading World, Math World, Print & Color, My World) and **Pip**, the guide (`js/core/guide.js`,
drawn in code, five poses). Worlds list their games (`worlds` in `js/games/index.js`). Pip pops up in games (cheers on a right
answer, "oops" on a miss) and on the finish screen. **My World** is a scene that fills with the stickers she earns. On tablets in
landscape the games show the picture on the left and the answers on the right. Screens: `js/ui/home.js`, `js/ui/grownups.js`.
Everything that isn't for her (name, challenge level, look, Sound Check, My Worksheets, progress) is in the **Grown-ups** corner:
press and hold the button at the bottom of the home screen.

## Looks
Pick a look in the Grown-ups corner. It switches the whole site's look (7 themes in `js/core/themes.js`: colors, a soft background pattern, Pip's color; default Rainbow Party). Saved per device. Add a theme by adding an entry to `THEMES`. New spoken lines (Pip's greetings, sticker names) are in `tools/ui-lines.json`; make their clips with `tools/tts.py` like the others.

## Print & Color
Home → **Print & Color**: color by number / word / sum, mazes, word searches and dot-to-dots. Every page is random and sized for
one Letter or A4 sheet (Print button → phone's print menu). The color-by pages can also be colored on screen. Difficulty follows
the home-screen setting. Code: `js/print/sheets.js` (page makers, pure functions) and `js/print/shop.js` (screens).
Add a picture by adding a 12×12 grid to `PICTURES`.

## My Worksheets (grown-ups)
Parents add photos, scans or PDFs of her school sheets and see them on any device. Home → **My Worksheets** (🔒) →
the first time, choose a parent passcode; after that each phone or tablet asks for it once (stays signed in 30 days).
- `js/worksheets/` — the screens (`hub.js`: sign-in, add, list, view, rename, notes, delete) and `api.js` (talks to the service,
  shrinks photos to 2200 px JPEG before upload)
- `supabase/functions/worksheets/` — the private service (Supabase edge function `worksheets`, project `play-and-learn`):
  `core.js` is all the logic (passcode hash, lock-out after 8 wrong tries, 30-day sign-in tokens, file-type checks, limits),
  `index.ts` connects it to the database and a **private** storage bucket. The database tables have row-level security with
  no public access, so nothing is readable without going through the passcode.
- `js/config.js` holds the service address (not secret). Tests: `node tests/worksheets-core.test.mjs`
- Planned next: read the words on each scan (OCR) into `worksheet_pages.text`, edit them in the hub, and turn them into games.
  Changing the service code means re-deploying the function (Supabase → Edge Functions → worksheets).

## Sound
Sound always starts **off** when the page loads (never saved); the bell turns it on for that visit. The 🔊 buttons in games and Sound Check still speak when pressed on purpose.

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
