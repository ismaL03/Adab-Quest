#!/usr/bin/env python3
"""
Génère les paquets audio intégrés à l'application (public/audio/packs/).

Chaque son (lettre, syllabe, mot, mot du Coran) est synthétisé hors ligne avec
une voix arabe neuronale (Piper « ar_JO-kareem-medium », moteur sherpa-onnx),
nettoyé (silences, volume), puis regroupé en paquets MP3 de ~1 minute avec un
index JSON des positions. Les paquets se lisent avec la Web Audio API, ce qui
garantit le son sur tous les appareils, sans dépendre d'une voix installée.

Prérequis (une fois) :
    python3 -m venv .venv-tts && .venv-tts/bin/pip install sherpa-onnx lameenc numpy
    curl -L -o kareem.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-ar_JO-kareem-medium.tar.bz2
    tar xjf kareem.tar.bz2

Utilisation :
    node scripts/tts/export-inputs.mjs            # liste des sons → scripts/tts/inputs.json
    .venv-tts/bin/python scripts/tts/generate.py --model vits-piper-ar_JO-kareem-medium

Les enregistrements humains déposés dans public/audio/<chemin> restent
prioritaires sur ces paquets.
"""
import argparse
import json
import math
import os
import sys
from collections import OrderedDict

import lameenc
import numpy as np
import sherpa_onnx

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

# Vitesse de diction par type de son (plus lent pour les sons courts).
SPEED = {'letter': 0.66, 'syllable': 0.62, 'word': 0.7, 'quran': 0.7}
# Nombre d'essais en cas de repli « son isolé » : on garde le plus net.
TRIES = {'letter': 3, 'syllable': 4, 'word': 2, 'quran': 2}
# Les sons sont synthétisés par séries (un verset, ou quelques mots) séparées par
# une pause « ؛ », puis découpés aux silences : la voix articule nettement mieux
# un mot prononcé dans une phrase qu'un mot isolé.
SEPARATOR = '؛ '
CHUNK = {'letter': 4, 'syllable': 5, 'word': 5, 'quran': 8}
SPLIT_TRIES = 5
PAD = 0.06  # silence ajouté avant / après chaque son (s)
GAP = 0.22  # silence entre deux sons dans un paquet (s)
MAX_PACK = 60.0  # durée maximale d'un paquet (s)
BITRATE = 48


def build_tts(model_dir):
    name = next(f for f in os.listdir(model_dir) if f.endswith('.onnx'))
    cfg = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                model=os.path.join(model_dir, name),
                tokens=os.path.join(model_dir, 'tokens.txt'),
                data_dir=os.path.join(model_dir, 'espeak-ng-data'),
                noise_scale=0.55,
                noise_scale_w=0.7,
            ),
            num_threads=max(1, (os.cpu_count() or 2) - 1),
            provider='cpu',
        ),
        max_num_sentences=1,
    )
    return sherpa_onnx.OfflineTts(cfg)


def envelope(x, sr, win=0.01):
    w = max(1, int(sr * win))
    n = len(x) // w
    if n == 0:
        return np.array([np.abs(x).mean() if len(x) else 0.0])
    return np.abs(x[: n * w]).reshape(n, w).mean(axis=1)


def voiced_span(x, sr):
    """Début et fin (en échantillons) de la partie audible."""
    env = envelope(x, sr)
    if env.max() <= 0:
        return 0, 0
    idx = np.where(env > env.max() * 0.06)[0]
    w = int(sr * 0.01)
    return int(idx[0] * w), int((idx[-1] + 1) * w)


def clean(x, sr):
    """Coupe les silences, normalise le volume, ajoute fondus et marges."""
    a, b = voiced_span(x, sr)
    margin = int(sr * 0.02)
    x = x[max(0, a - margin): min(len(x), b + margin)].astype(np.float32)
    if len(x) == 0:
        return x
    # Volume homogène : RMS cible, crête limitée à -1 dBFS.
    rms = math.sqrt(float(np.mean(x ** 2))) or 1e-6
    x = x * min(0.12 / rms, 0.89 / (np.abs(x).max() or 1e-6))
    fade = min(len(x) // 4, int(sr * 0.008))
    if fade:
        ramp = np.linspace(0, 1, fade, dtype=np.float32)
        x[:fade] *= ramp
        x[-fade:] *= ramp[::-1]
    pad = np.zeros(int(sr * PAD), dtype=np.float32)
    return np.concatenate([pad, x, pad])


def synthesize(tts, item):
    """Repli : synthèse du son seul (meilleur de plusieurs tirages)."""
    best, best_len, sr = None, -1, 22050
    for _ in range(TRIES[item['kind']]):
        audio = tts.generate(item['text'], sid=0, speed=SPEED[item['kind']])
        sr = audio.sample_rate
        x = np.array(audio.samples, dtype=np.float32)
        a, b = voiced_span(x, sr)
        if b - a > best_len:
            best, best_len = x, b - a
    return clean(best, sr), sr


def split_on_silences(x, sr, n):
    """Découpe une série en n segments séparés par des silences (ou None)."""
    env = envelope(x, sr)
    if env.max() <= 0:
        return None
    voiced = env > env.max() * 0.035
    segs, i, m = [], 0, len(env)
    while i < m:
        if voiced[i]:
            j = i
            while j < m and voiced[j]:
                j += 1
            segs.append([i, j])
            i = j
        else:
            i += 1
    segs = [sg for sg in segs if sg[1] - sg[0] >= 2]
    # Les micro-silences internes à un mot sont fusionnés (les plus courts d'abord).
    while len(segs) > n:
        gaps = [segs[k + 1][0] - segs[k][1] for k in range(len(segs) - 1)]
        k = int(np.argmin(gaps))
        segs[k] = [segs[k][0], segs[k + 1][1]]
        del segs[k + 1]
    if len(segs) != n:
        return None
    gaps = [segs[k + 1][0] - segs[k][1] for k in range(len(segs) - 1)]
    if gaps and min(gaps) < 4:  # pause trop brève (< 40 ms) : découpage peu sûr
        return None
    lengths = [b - a for a, b in segs]
    if min(lengths) < 6 or min(lengths) < 0.2 * float(np.median(lengths)):  # segment aberrant
        return None
    w = int(sr * 0.01)
    return [x[max(0, a * w - int(sr * 0.03)): min(len(x), b * w + int(sr * 0.04))] for a, b in segs]


def synthesize_chunk(tts, chunk):
    """Synthétise une série en contexte ; repli son par son si le découpage échoue."""
    kind = chunk[0]['kind']
    if len(chunk) > 1:
        text = SEPARATOR.join(it['text'] for it in chunk)
        for _ in range(SPLIT_TRIES):
            audio = tts.generate(text, sid=0, speed=SPEED[kind])
            parts = split_on_silences(np.array(audio.samples, dtype=np.float32), audio.sample_rate, len(chunk))
            if parts:
                return [clean(p, audio.sample_rate) for p in parts], audio.sample_rate, True
    out, sr = [], 22050
    for it in chunk:
        x, sr = synthesize(tts, it)
        out.append(x)
    return out, sr, False


def chunks_of(members):
    """Séries à synthétiser : un verset (coupé en morceaux) ou quelques sons voisins."""
    series, current, key = [], [], None
    for it in members:
        size = CHUNK[it['kind']]
        k = it['src'].rsplit('_', 1)[0] if it['kind'] == 'quran' else it['group']
        if current and (k != key or len(current) >= size):
            series.append(current)
            current = []
        current.append(it)
        key = k
    if current:
        series.append(current)
    return series


def encode_mp3(x, sr):
    enc = lameenc.Encoder()
    enc.set_bit_rate(BITRATE)
    enc.set_in_sample_rate(sr)
    enc.set_channels(1)
    enc.set_quality(2)
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()
    return bytes(enc.encode(pcm) + enc.flush())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', required=True, help='dossier du modèle vits-piper-ar_JO-kareem-medium')
    ap.add_argument('--inputs', default=os.path.join(ROOT, 'scripts/tts/inputs.json'))
    ap.add_argument('--out', default=os.path.join(ROOT, 'public/audio/packs'))
    ap.add_argument('--wav-dir', help='écrit aussi chaque son en WAV (vérification)')
    args = ap.parse_args()

    items = json.load(open(args.inputs, encoding='utf-8'))
    tts = build_tts(args.model)
    os.makedirs(args.out, exist_ok=True)
    for f in os.listdir(args.out):
        if f.endswith('.mp3') or f == 'index.json':
            os.remove(os.path.join(args.out, f))

    groups = OrderedDict()
    for it in items:
        groups.setdefault(it['group'], []).append(it)

    packs, clips, sr = [], {}, 22050
    done = 0
    stats = {'contexte': 0, 'isolé': 0}
    for group, members in groups.items():
        chunk, chunk_len, part = [], 0.0, 1

        def flush():
            nonlocal chunk, chunk_len, part
            if not chunk:
                return
            gap = np.zeros(int(sr * GAP), dtype=np.float32)
            parts, t = [gap], GAP
            pack_id = f'{group}-{part}'
            for src, x in chunk:
                dur = len(x) / sr
                clips[src.rsplit('.', 1)[0]] = [len(packs), round(t, 4), round(dur, 4)]
                parts += [x, gap]
                t += dur + GAP
            data = np.concatenate(parts)
            with open(os.path.join(args.out, f'{pack_id}.mp3'), 'wb') as fh:
                fh.write(encode_mp3(data, sr))
            packs.append({'id': pack_id, 'file': f'packs/{pack_id}.mp3', 'duration': round(len(data) / sr, 3)})
            chunk, chunk_len, part = [], 0.0, part + 1

        for series in chunks_of(members):
            xs, sr, in_context = synthesize_chunk(tts, series)
            stats['contexte' if in_context else 'isolé'] += len(series)
            for it, x in zip(series, xs):
                if args.wav_dir:
                    import wave
                    path = os.path.join(args.wav_dir, it['src'].rsplit('.', 1)[0] + '.wav')
                    os.makedirs(os.path.dirname(path), exist_ok=True)
                    with wave.open(path, 'wb') as w:
                        w.setnchannels(1)
                        w.setsampwidth(2)
                        w.setframerate(sr)
                        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())
                dur = len(x) / sr
                if chunk and chunk_len + dur + GAP > MAX_PACK:
                    flush()
                chunk.append((it['src'], x))
                chunk_len += dur + GAP
                done += 1
                if done % 200 == 0:
                    print(f'  {done}/{len(items)}', file=sys.stderr)
        flush()

    index = {
        'voice': 'Piper ar_JO-kareem-medium (synthèse)',
        'sampleRate': sr,
        'packs': packs,
        'clips': clips,
    }
    with open(os.path.join(args.out, 'index.json'), 'w', encoding='utf-8') as fh:
        json.dump(index, fh, ensure_ascii=False, separators=(',', ':'))
    total = sum(os.path.getsize(os.path.join(args.out, p['file'].split('/')[-1])) for p in packs)
    print(f'✓ {len(clips)} sons dans {len(packs)} paquets ({total / 1e6:.1f} Mo) → {os.path.relpath(args.out, ROOT)}')
    print(f'  synthèse en contexte : {stats["contexte"]} · repli son isolé : {stats["isolé"]}')


if __name__ == '__main__':
    main()
