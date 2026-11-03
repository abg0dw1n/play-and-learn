"""Make the spoken-line audio clips for the site (run by a grown-up developer, not by the site).

Uses the open-source Kokoro text-to-speech model (Apache-2.0) with a warm female voice,
run locally with onnxruntime. Nothing is sent to any service.

  python3 tools/tts.py --models DIR --espeak DIR --lines lines.json --out audio

  --models  folder holding kokoro.int8.onnx, voices.bin and vocab.json
            (model files: github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0)
  --espeak  folder holding the `espeak-ng` program, its libraries and `espeak-ng-data`
            (from the piper release tarball: github.com/rhasspy/piper/releases)
  --lines   JSON list of the lines to speak
  --out     where the .mp3 clips and manifest.json go
"""
import argparse, hashlib, json, os, re, subprocess, sys
import numpy as np
import onnxruntime as ort

SAMPLE_RATE = 24000
VOICE = 'af_heart'   # warm, friendly female voice
SPEED = 0.95

# Lines that the phonemizer would read the wrong way when they stand alone.
SPEAK_AS = {'a.': 'uh.', 'a!': 'uh!', 'A.': 'uh.'}

def clip_id(text):
    return hashlib.sha1(text.encode('utf-8')).hexdigest()[:12]

_espeak = None
def _load_espeak(espeak_dir):
    global _espeak
    if _espeak: return _espeak
    import ctypes
    lib = ctypes.CDLL(os.path.join(espeak_dir, 'libespeak-ng.so.1'))
    lib.espeak_Initialize.restype = ctypes.c_int
    lib.espeak_Initialize.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_char_p, ctypes.c_int]
    lib.espeak_SetVoiceByName.argtypes = [ctypes.c_char_p]
    lib.espeak_TextToPhonemes.restype = ctypes.c_char_p
    lib.espeak_TextToPhonemes.argtypes = [ctypes.POINTER(ctypes.c_char_p), ctypes.c_int, ctypes.c_int]
    if lib.espeak_Initialize(2, 0, espeak_dir.encode(), 0) < 0:  # 2 = synchronous, no audio output
        raise RuntimeError('espeak init failed (is espeak-ng-data inside %s?)' % espeak_dir)
    lib.espeak_SetVoiceByName(b'en-us')
    _espeak = lib
    return lib

def _ipa(lib, clause):
    import ctypes
    buf = ctypes.c_char_p(clause.encode('utf-8'))
    out = []
    while buf.value:
        ph = lib.espeak_TextToPhonemes(ctypes.byref(buf), 1, 0x02)  # 1 = UTF-8 text, 0x02 = IPA
        if ph: out.append(ph.decode('utf-8'))
    return ' '.join(out)

def phonemize(text, espeak_dir):
    """IPA for a line, keeping . , ! ? between clauses so the voice gets the right rhythm."""
    lib = _load_espeak(espeak_dir)
    parts = re.findall(r"[^.,!?;:]+|[.,!?;:]", text)
    out = ''
    for part in parts:
        if part in '.,!?;:' and len(part) == 1:
            out = out.rstrip() + part + ' '
        elif part.strip():
            out += re.sub(r'\s+', ' ', _ipa(lib, part.strip())).replace('\u200d', '') + ' '
    return out.strip()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--models', required=True); ap.add_argument('--espeak', required=True)
    ap.add_argument('--lines', required=True); ap.add_argument('--out', required=True)
    ap.add_argument('--voice', default=VOICE); ap.add_argument('--speed', type=float, default=SPEED)
    ap.add_argument('--limit', type=int, default=0)
    a = ap.parse_args()
    vocab = json.load(open(os.path.join(a.models, 'vocab.json')))
    voices = np.load(os.path.join(a.models, 'voices.bin'))
    style_bank = voices[a.voice]
    sess = ort.InferenceSession(os.path.join(a.models, 'kokoro.int8.onnx'), providers=['CPUExecutionProvider'])
    lines = json.load(open(a.lines))
    if a.limit: lines = lines[:a.limit]
    os.makedirs(a.out, exist_ok=True)
    manifest_path = os.path.join(a.out, 'manifest.json')
    manifest = json.load(open(manifest_path)) if os.path.exists(manifest_path) else {}
    for n, text in enumerate(lines):
        cid = clip_id(text + '|' + a.voice)
        mp3 = os.path.join(a.out, cid + '.mp3')
        if manifest.get(text) == cid and os.path.exists(mp3):
            continue
        ph = ''.join(c for c in phonemize(SPEAK_AS.get(text, text), a.espeak) if c in vocab)
        tokens = [vocab[c] for c in ph]
        if not tokens or len(tokens) > 510:
            print('SKIP (bad length)', text); continue
        style = style_bank[min(len(tokens), len(style_bank)) - 1]
        audio = sess.run(None, {'tokens': np.array([[0, *tokens, 0]], dtype=np.int64),
                                'style': np.asarray(style, dtype=np.float32),
                                'speed': np.array([a.speed], dtype=np.float32)})[0].ravel()
        # trim long leading/trailing silence, keep a short breath
        amp = np.abs(audio); idx = np.where(amp > 0.01 * max(amp.max(), 1e-6))[0]
        if len(idx):
            s, e = max(idx[0] - 1200, 0), min(idx[-1] + 2400, len(audio)); audio = audio[s:e]
        pcm = (np.clip(audio, -1, 1) * 32767).astype('<i2').tobytes()
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SAMPLE_RATE), '-ac', '1', '-i', '-',
                        '-codec:a', 'libmp3lame', '-b:a', '40k', mp3], input=pcm, check=True)
        manifest[text] = cid
        if n % 50 == 0:
            print(n, '/', len(lines), text[:50], flush=True)
            json.dump(manifest, open(manifest_path, 'w'), ensure_ascii=False, indent=0)
    json.dump(manifest, open(manifest_path, 'w'), ensure_ascii=False, indent=0, sort_keys=True)
    print('done', len(manifest), 'clips')

if __name__ == '__main__':
    main()
