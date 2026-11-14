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
Every finished game awards one new everyday sticker (40 in `js/core/stickers.js`) until all are found; then just a star.
Stars earned before the sticker book existed were turned into stickers once.

**Rare and legendary stickers** (17 in `js/core/rare.js`: 12 rare, 5 legendary) are earned by doing something specific, so repeating one
game never finds them: a game with no wrong answers (the same game again doesn't count twice), perfect games in different games or worlds,
trying every game in a world, Super Star wins, playing on 3 / 7 different days, a weekend, an early morning, a top level, and so on.
They show as ❓ in My World with a hint when tapped (the hints are the rules, for grown-ups). Rules are plain functions in `RARE`
(tested by `node tests/rare.test.mjs`); each game tells the finish screen whether it was `perfect`. Add one by adding an entry to `RARE`,
then make its voice clips (name + "Wow! A rare sticker! You got …" line; see `tools/ui-lines.json`).

## My World
`#/stickers` is a living scene (`js/ui/myworld.js`, scene in `js/world/scene.js`, styles in `css/world.css`, data in `js/world/data.js`, rules in `js/world/progress.js`; `node tests/world.test.mjs`).
- **Opening a sticker:** the finish screen shows a glowing pack she taps; a perfect game on Growing Strong+ has a 40% chance of a ✨ shiny version; the sticker then flies to the My World button and lands in her world with a spotlight.
- **Living scene:** each friend idles and reacts (and makes a synthesized sound) when tapped (`BEHAVIOR` in data.js, `SOUNDS` in sfx.js); day/night follows the device clock; light rain then a rainbow; Pip wanders and can be tapped. Reduced motion turns the motion off.
- **Moving friends:** no mode needed: drag any friend to move it, tap it to pick it (then bigger, smaller, flip, or put it away in the tray; 🧹 tidies everything). The layout is saved. **Places** unlock by sticker count: meadow 0, beach 6, space 12 (always night), snow 20, candy land 30.
- **Collections:** 8 sets of 5 everyday stickers; finishing one gives a bonus decoration. **Gift boxes** come every 3 finished games and from the daily hunt (2 different games in a day); they hold a decoration, a new sticker or a shiny upgrade.
- **Secrets** (`js/world/secrets.js`, 14): found by poking around the world (tickle the sun or the moon, tap a cloud or the night stars, dig in the grass, catch the rainbow, tap Pip 5 times, put 3 friends together, visit in the morning or at night, visit every place, open 5 gifts, hatch an egg; finding all of them gives the golden crown). A ❓ tapped speaks a clue, and Pip sometimes whispers one. Each secret gives a **hat for Pip** (worn everywhere Pip appears), a **magic power**, or a **treasure** for the world.
- **Magic** (🪄 panel): bubbles, snowfall, love hearts, fireworks from secrets; dragon flight, star shower, float away, magic wish and rainbow party from the 5 legendary stickers.
- **Magic egg:** warms by one per finished game and hatches after 4 into a new creature she can place in her world; every 4th egg is golden with a legendary creature (baby dragon, long neck dinosaur, mermaid, fairy).
- **Grown-ups:** a reward goal ("20 new stickers = ice cream", shown as a bar in My World) and a progress summary. **Print & Color** has a My World poster and a sticker sheet.
- Saved fields (`shinies, decor, world, gifts, giftTick, daily, goal, secrets, hat, hatched, eggN, giftsOpened, visited`) are repaired in `store.load` and cleared by Reset progress. Every spoken line needs clips in both voices (`tools/ui-lines.json`).

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

## Play lock
Grown-ups corner → **Play lock** sets a 4-number PIN and locks the app: only home, the worlds, games and stickers are reachable
(no Grown-ups corner, Print & Color, worksheets or Sound Check), the back button/swipe stays inside the app, and Android Chrome goes full screen.
Press and hold the small 🔒 (bottom-left) and enter the PIN to unlock. Three wrong PINs pause the pad for a minute.
The PIN is stored only as a salted hash on that device. Forgot it? Clear this site's data in the browser settings (this also resets progress).
It guards against wandering inside the app; for a hard lock on the whole phone use iPhone Guided Access or Android app pinning.
Code: `js/core/lock.js`.
