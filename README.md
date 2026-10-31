# 🎈 Play & Learn

A gentle, game-based learning site for 5–6 year olds, starring original Pixar-style
characters. Open `index.html` in any browser — no install, no build step, no ads.

## Games
- **Counting Buddy** — count objects and feed your buddy the right number of treats.
- **Color Factory** — sort glowing blobs into matching color bins.

## How to run
Just double-click `index.html`, or serve the folder with any static server:
```
python3 -m http.server 8000
```
Then visit `http://localhost:8000`.

## Structure
```
index.html        # home / character picker
css/style.css     # shared look & feel
js/characters.js  # the buddy characters
games/
  counting-buddy/   # counting game
  color-factory/    # color-sorting game
```

## License
Built with love for a curious kid. Free for personal use.