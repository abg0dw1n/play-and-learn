#!/bin/sh
# Records Pip saying "Hi, <name>!" in both voices for the home-screen greeting.
#   sh tools/name-clip.sh <name> <kokoro-models-dir> <espeak-dir> [say-as]
# say-as: optional spelling to steer pronunciation, e.g. Eelayna for EE-lay-na (the file is still matched to <name>).
# The files are named by a hash of the greeting (see helloKey in js/core/voice.js), so the name isn't written in the site.
set -e
NAME="$1"; MODELS="$2"; ESPEAK="$3"; SAYAS="${4:-$1}"
[ -n "$NAME" ] && [ -d "$MODELS" ] && [ -d "$ESPEAK" ] || { echo "usage: sh tools/name-clip.sh <name> <models-dir> <espeak-dir>"; exit 1; }
LINE="Hi, $SAYAS!"
KEY=$(printf '%s' "hi, $(echo "$NAME" | tr '[:upper:]' '[:lower:]')!" | sha256sum | cut -c1-16)
TMP=$(mktemp -d)
python3 -c 'import json,sys; json.dump([sys.argv[1]], open(sys.argv[2], "w"))' "$LINE" "$TMP/lines.json"
python3 tools/tts.py --models "$MODELS" --espeak "$ESPEAK" --lines "$TMP/lines.json" --out "$TMP/heart" >/dev/null
python3 tools/tts.py --models "$MODELS" --espeak "$ESPEAK" --lines "$TMP/lines.json" --out "$TMP/bella" --voice af_bella >/dev/null
mkdir -p audio/names
cp "$TMP"/heart/*.mp3 "audio/names/$KEY-heart.mp3"
cp "$TMP"/bella/*.mp3 "audio/names/$KEY-bella.mp3"
rm -rf "$TMP"
echo "audio/names/$KEY-heart.mp3 and -bella.mp3"
