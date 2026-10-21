"""Chiptune score for the trailer animatic: 30 s, 120 bpm, D minor, locked to the cut.

Voices in the style of an old sound chip (two pulse channels, a triangle, a noise channel), pushed
with modern production: kick ducking, a stereo echo on the lead, saturation. Writes a stereo 16-bit WAV.
"""
import sys, wave
import numpy as np

SR = 44100
DUR = 30.0
N = int(SR * DUR)
L = np.zeros(N)
R = np.zeros(N)
rng = np.random.default_rng(3)
BEAT = 0.5
S16 = BEAT / 4

# separate buses so the kick can duck the music and the lead can get its echo
bus = {k: np.zeros(N) for k in ('pad', 'bass', 'lead', 'drums', 'sfx')}


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(name, at, sig, gain=1.0):
    i = int(round(at * SR))
    if i >= N or i + len(sig) <= 0:
        return
    j = min(N, i + len(sig))
    bus[name][i:j] += sig[: j - i] * gain


def adsr(n, a=0.002, d=0.05, s=0.6, r=0.03):
    e = np.full(n, float(s))
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na) if na else e[:na]
    nd = min(nd, n - na)
    e[na : na + nd] = np.linspace(1, s, nd)
    if nr and n > nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def crush(x, bits):
    q = 2 ** (bits - 1)
    return np.round(x * q) / q


def pulse(freq, dur, duty=0.5, vib=0.0, vib_rate=6.0, slide=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = freq * (1 + vib * np.sin(2 * np.pi * vib_rate * t) * np.clip(t / 0.15 - 0.5, 0, 1)) * 2 ** (slide * t)
    ph = np.cumsum(f) / SR % 1.0
    return crush(np.where(ph < duty, 1.0, -1.0), 4)


def tri(freq, dur, slide=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = np.cumsum(freq * 2 ** (slide * t)) / SR % 1.0
    return crush(4 * np.abs(ph - 0.5) - 1, 4)  # the stepped 4-bit triangle of old chips


_lfsr_long = rng.choice([-1.0, 1.0], size=SR)
_lfsr_short = np.tile(rng.choice([-1.0, 1.0], size=93), SR // 93 + 1)  # the metallic short mode


def noise(dur, rate=SR, short=False):
    """Stepped noise: one random value held for SR/rate samples, like a noise channel's period."""
    n = int(dur * SR)
    src = _lfsr_short if short else _lfsr_long
    hold = max(1, int(SR / rate))
    idx = (np.arange(n) // hold) % len(src)
    return src[idx]


# ---------------- instruments ----------------
def kick(at, g=1.0):
    d = 0.16
    s = tri(150, d, slide=-18) * np.exp(-np.arange(int(d * SR)) / SR / 0.06)
    s[: int(0.004 * SR)] += 0.8  # the click
    place('drums', at, s, 0.75 * g)
    duck_points.append(at)


def snare(at, g=1.0):
    d = 0.14
    n = int(d * SR)
    s = noise(d, 18000) * np.exp(-np.arange(n) / SR / 0.05) * 0.8 + pulse(220, d, 0.5, slide=-6) * np.exp(-np.arange(n) / SR / 0.02) * 0.5
    place('drums', at, s, 0.55 * g)


def hat(at, g=1.0, open_=False):
    d = 0.12 if open_ else 0.03
    n = int(d * SR)
    s = noise(d, 30000, short=True) * np.exp(-np.arange(n) / SR / (0.04 if open_ else 0.01))
    place('drums', at, s, 0.22 * g)


def crash(at, g=1.0, d=1.4):
    n = int(d * SR)
    s = noise(d, 22000) * np.exp(-np.arange(n) / SR / (d / 4))
    place('drums', at, s, 0.45 * g)


def boom(at, g=1.0):
    """A big hit: kick, crash and a low square drop."""
    kick(at, 1.2 * g)
    crash(at, 0.9 * g)
    d = 0.5
    place('drums', at, pulse(midi(38), d, 0.5, slide=-2) * adsr(int(d * SR), d=0.3, s=0, r=0.02), 0.35 * g)


def lead(at, m, dur, g=1.0, duty=0.25, vib=0.006):
    s = pulse(midi(m), dur, duty, vib=vib) * adsr(int(dur * SR), d=0.08, s=0.7, r=0.03)
    place('lead', at, s, 0.3 * g)


def bassnote(at, m, dur, g=1.0):
    s = tri(midi(m), dur) * adsr(int(dur * SR), a=0.001, d=0.02, s=0.9, r=0.01)
    place('bass', at, s, 0.38 * g)


def chip_chord(at, notes, dur, g=1.0, rate=1 / 48, duty=0.125):
    """The classic chip chord: one pulse voice cycling through the chord tones very fast."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    step = (t // rate).astype(int) % len(notes)
    freqs = np.array([midi(m) for m in notes])[step]
    ph = np.cumsum(freqs) / SR % 1.0
    s = crush(np.where(ph < duty, 1.0, -1.0), 4) * adsr(n, d=0.1, s=0.75, r=0.04)
    place('pad', at, s, 0.15 * g)


def blip(at, m, d=0.05, g=1.0, duty=0.5, slide=0.0, bus_='sfx'):
    s = pulse(midi(m), d, duty, slide=slide) * adsr(int(d * SR), d=d * 0.8, s=0.0, r=0.005)
    place(bus_, at, s, 0.2 * g)


duck_points = []

# ---------------- harmony ----------------
# D minor: i - VI - VII - V (the V with its raised third for bite)
CH = {
    'Dm': (50, [62, 65, 69]),
    'Bb': (46, [58, 62, 65]),
    'C': (48, [60, 64, 67]),
    'A': (45, [61, 64, 69]),
    'F': (41, [60, 65, 69]),
    'Gm': (43, [62, 67, 70]),
}


def chords_over(start, seq, each, octave=0, g=1.0, arp=True):
    for k, name in enumerate(seq):
        root, tones = CH[name]
        if arp:
            chip_chord(start + k * each, [n + octave for n in tones], each, g)


def bass_line(start, seq, each, g=1.0, style='octave'):
    for k, name in enumerate(seq):
        root = CH[name][0]
        steps = int(each / (S16 * 2))
        for j in range(steps):
            at = start + k * each + j * S16 * 2
            if style == 'octave':
                m = root + (12 if j % 2 else 0)
            elif style == 'drive':
                m = root if j % 4 != 3 else root + 7
            else:
                m = root
            bassnote(at, m, S16 * 2 * 0.9, g)


def groove(start, bars, g=1.0, busy=False, fill=False):
    """A bar is 16 sixteenths. Kick on 1 and the and-of-2 and 3, snare on 2 and 4, hats on the eighths (sixteenths when busy)."""
    for b in range(bars):
        t0 = start + b * 2.0
        for st in (0, 6, 8, 11):
            kick(t0 + st * S16, g)
        for st in (4, 12):
            snare(t0 + st * S16, g)
        for st in range(16):
            if busy or st % 2 == 0:
                hat(t0 + st * S16, g * (1.0 if st % 2 == 0 else 0.6), open_=(st == 14))
        if fill and b == bars - 1:
            for st in (13, 14, 15):
                snare(t0 + st * S16, g * 0.8)


# ================= the score, cue by cue =================

# 0-2 s, Endgame: straight in. Chip chords and the octave bass from the first frame; trap spires on 0, 0.5, 1.0; the big hit on 1.5.
chords_over(0.0, ['Dm', 'Dm'], 0.75)
chords_over(1.5, ['Dm'], 0.5, g=1.2)
bass_line(0.0, ['Dm'], 1.5, style='octave')
for at in (0.0, 0.5, 1.0):
    kick(at)
    blip(at + 0.01, 93, 0.12, 0.8, 0.25, slide=-3)  # a spire: a high zap falling
for st in range(12):
    hat(st * S16, 0.8)
snare(1.25)
snare(1.375)
boom(1.5)
lead(1.5, 74, 0.5, 1.1, duty=0.5)

# 2-3 s, Pick a class: the music thins to chords; one menu blip per class card.
chords_over(2.0, ['Bb'], 1.0, g=0.8)
for k in range(6):
    blip(2.0 + k * 0.125, [79, 81, 82, 84, 86, 81][k], 0.04, 0.7, 0.5)
blip(2.75, 86, 0.1, 0.9, 0.25)  # lands on the Vanguard

# 3-6 s, the Vanguard: the groove comes in under the tree. Node chimes climb; the slam on 5.0.
groove(3.0, 1, 0.9)
groove(5.0, 1)
chords_over(3.0, ['Bb', 'C', 'C'], 1.0)
bass_line(3.0, ['Bb', 'C', 'C'], 1.0, style='octave')
for k, m in enumerate((74, 77, 81, 86)):
    blip(3.2 + k * 0.18, m, 0.16, 1.0, 0.125)
    blip(3.2 + k * 0.18 + 0.06, m + 12, 0.08, 0.4, 0.125)
boom(5.0)
# a lead answer after the slam
for at, m, d in ((5.25, 76, 0.25), (5.5, 79, 0.25), (5.75, 84, 0.25)):
    lead(at, m, d)

# 6-10.5 s, the Shade: the main groove. Socket blip and a rising tick, trap zaps on the beats, the loot jingle, Equip.
groove(6.0, 2, busy=True)
groove(10.0, 1)
chords_over(6.0, ['A', 'Dm', 'Bb', 'Bb'], 1.0)
chords_over(10.0, ['Bb'], 0.5)
bass_line(6.0, ['A', 'Dm', 'Bb', 'Bb'], 1.0, style='drive')
blip(6.4, 69, 0.03, 1.2, 0.5)
for k in range(8):
    blip(6.5 + k * 0.05, 72 + k * 2, 0.04, 0.6, 0.25)
melody_shade = [
    (6.5, 76, 0.25), (6.75, 73, 0.25), (7.0, 69, 0.5),
    (8.0, 74, 0.25), (8.25, 77, 0.25), (8.5, 81, 0.25), (8.75, 77, 0.25),
]
for at, m, d in melody_shade:
    lead(at, m, d, 0.8)
for at in (7.5, 8.0, 8.5):
    blip(at, 98, 0.1, 0.9, 0.125, slide=-4)
    blip(at + 0.02, 86, 0.08, 0.5, 0.5, slide=-2)
# the loot jingle: a bright rising arpeggio over the drop
for k, m in enumerate((81, 86, 89, 93, 98)):
    blip(9.02 + k * 0.06, m, 0.12, 0.9, 0.5)
blip(9.32, 98, 0.35, 0.6, 0.25)
blip(10.2, 74, 0.05, 1.2, 0.5)
blip(10.25, 86, 0.08, 0.8, 0.5)

# 10.5-12.5 s, three more builds: the energy lifts; three rhythms on top of the groove.
groove(10.5, 1, busy=True)
chords_over(10.5, ['C', 'A'], 1.0, g=1.1)
bass_line(10.5, ['C', 'A'], 1.0, style='octave')
for n in range(11):  # the arrows: a quick rattle
    blip(10.65 + n * 0.18, 91 + (n % 3), 0.025, 0.5, 0.5)
for at in (10.85, 11.45, 12.05):  # the sweeps: a falling square
    blip(at, 72, 0.18, 0.9, 0.5, slide=-5)
for n in range(5):  # the totem: a high bell
    blip(11.05 + n * 0.33, 93, 0.2, 0.5, 0.125)
for at, m, d in ((10.5, 81, 0.25), (10.75, 84, 0.25), (11.0, 88, 0.5), (11.5, 85, 0.25), (11.75, 81, 0.25), (12.0, 76, 0.5)):
    lead(at, m, d, 0.9)

# 12.5-16 s, the climb: one hit per cut, the harmony climbs, the drums build to a roll.
seq = ['Dm', 'Bb', 'C', 'A', 'Dm', 'F', 'Gm']
for k, name in enumerate(seq):
    at = 12.5 + k * 0.5
    chords_over(at, [name], 0.5, octave=12 if k >= 4 else 0, g=1.1)
    bassnote(at, CH[name][0], 0.22)
    bassnote(at + 0.25, CH[name][0] + 12, 0.22)
    kick(at)
    crash(at + 0.02, 0.35, 0.4)
    lead(at, [74, 77, 79, 81, 86, 88, 89][k], 0.45, 0.9, duty=0.5)
for st in range(28):
    at = 12.5 + st * S16
    if st >= 16:
        snare(at, 0.5 + 0.5 * st / 28)
    hat(at, 0.7)
# a rising pulse sweep into the fall
d = 3.5
place('sfx', 12.5, pulse(midi(50), d, 0.25, slide=0.9) * np.linspace(0, 1, int(d * SR)) ** 2, 0.08)

# 16-19 s, the fall: everything stops. The boss charges (a falling sweep), the impact on 16.5, then a held silence with
# a slow low pulse, and a sad jingle on the duel button at 18.25.
place('sfx', 16.0, pulse(midi(74), 0.5, 0.5, slide=-3) * np.linspace(0.2, 1, int(0.5 * SR)), 0.18)
place('sfx', 16.0, noise(0.5, 4000) * np.linspace(0, 1, int(0.5 * SR)) ** 2, 0.15)
boom(16.5, 1.4)
crash(16.5, 0.7, 1.2)
place('bass', 16.5, tri(midi(26), 1.6) * np.exp(-np.arange(int(1.6 * SR)) / SR / 0.5), 0.6)
for at in (17.25, 17.75):  # a slow heartbeat in the dark
    place('bass', at, tri(midi(38), 0.12, slide=-4) * adsr(int(0.12 * SR), d=0.1, s=0), 0.5)
for k, (m, dd) in enumerate(((74, 0.15), (72, 0.15), (69, 0.15), (65, 0.15), (62, 0.5))):
    blip(18.25 + k * 0.12, m, dd, 0.8, 0.5)
# a snare run back in for the duel
for st in range(4):
    snare(18.5 + st * S16 * 2, 0.5 + st * 0.12)
for st in range(4):
    snare(18.75 + st * S16, 0.9)

# 19-25 s, the duel and the board: the chorus. Harmony every second, the full lead, the held frame at 22.0, the hit at 22.25.
duel = ['Dm', 'Bb', 'C', 'A', 'Dm', 'Bb']
for k, name in enumerate(duel):
    at = 19.0 + k * 1.0
    if 22.0 <= at < 23.0:
        chords_over(22.25, [name], 0.75, g=1.2)
    else:
        chords_over(at, [name], 1.0, g=1.1)
boom(19.0)
groove(19.0, 1, busy=True)
for st in (0, 6, 8):  # bar 22-23 only from the hit
    pass
groove(23.0, 1, busy=True)
# 21-22 s drums, then nothing for the held frame, then the hit
for st in range(8):
    at = 21.0 + st * S16
    if st in (0, 6):
        kick(at)
    if st == 4:
        snare(at)
    hat(at, 0.8)
boom(22.25, 1.3)
for st in range(6):
    at = 22.5 + st * S16 * 2
    hat(at)
    if st in (0, 3):
        kick(at)
    if st == 2:
        snare(at)
for k, name in enumerate(duel):
    at = 19.0 + k * 1.0
    if 22.0 <= at < 23.0:
        bass_line(22.25, [name], 0.75, style='drive')
    else:
        bass_line(at, [name], 1.0, style='drive')
melody_duel = [
    (19.0, 81, 0.25), (19.25, 86, 0.25), (19.5, 84, 0.125), (19.625, 81, 0.125), (19.75, 77, 0.25),
    (20.0, 77, 0.25), (20.25, 79, 0.125), (20.375, 81, 0.125), (20.5, 82, 0.25), (20.75, 81, 0.125), (20.875, 79, 0.125),
    (21.0, 79, 0.25), (21.25, 84, 0.25), (21.5, 76, 0.25), (21.75, 79, 0.25),
    (22.25, 85, 0.25), (22.5, 88, 0.25), (22.75, 81, 0.25),
    (23.0, 86, 0.5), (23.5, 81, 0.25), (23.75, 77, 0.25),
    (24.0, 77, 0.125), (24.125, 79, 0.125), (24.25, 81, 0.125), (24.375, 82, 0.125), (24.5, 84, 0.25), (24.75, 86, 0.25),
]
for at, m, d in melody_duel:
    lead(at, m, d, 1.1, duty=0.25 if at < 22 else 0.5)
# the rating counting up, and coin blips for the places gained
for k in range(10):
    blip(22.6 + k * 0.05, 76 + k * 2, 0.04, 0.5, 0.125)
for at in (23.9, 24.2):
    blip(at, 88, 0.06, 1.0, 0.5)
    blip(at + 0.06, 93, 0.14, 1.0, 0.5)

# 25-27 s, the genres: four stabs, one per word, walking to the dominant; then the title resolves to D minor on 27.
for k, name in enumerate(['Bb', 'C', 'Gm', 'A']):
    at = 25.0 + k * 0.5
    boom(at, 0.8)
    chords_over(at, [name], 0.45, octave=12, g=1.4)
    bassnote(at, CH[name][0], 0.4, 1.2)
    lead(at, [82, 84, 86, 85][k], 0.4, 1.0, duty=0.5)
for st in range(16):
    hat(25.0 + st * S16, 0.6)
snare(26.75)
snare(26.875)

# 27-30 s, the title: the tonic lands and rings; the arpeggio slows as the torch gutters out.
boom(27.0, 1.3)
crash(27.0, 0.8, 3.0)
bassnote(27.0, 38, 2.8, 0.8)
lead(27.0, 86, 1.5, 1.0, duty=0.5, vib=0.01)
lead(28.5, 81, 1.4, 0.7, duty=0.5, vib=0.012)
tones = [62, 65, 69, 74, 77, 81]
t = 27.0
k = 0
while t < 29.8:
    gap = 0.05 + 0.25 * ((t - 27.0) / 2.8) ** 1.5
    blip(t, tones[k % len(tones)], min(0.12, gap), 0.7 * (1 - (t - 27) / 3.2), 0.125, bus_='pad')
    t += gap
    k += 1
place('sfx', 29.5, noise(0.5, 9000) * np.exp(-np.arange(int(0.5 * SR)) / SR / 0.15), 0.12)  # the torch

# ================= the mix =================
# kick ducking: the music dips under each kick and swells back (the modern pump)
duck = np.ones(N)
for at in duck_points:
    i = int(at * SR)
    n = int(0.18 * SR)
    j = min(N, i + n)
    curve = 1 - 0.55 * np.exp(-np.arange(j - i) / SR / 0.06)
    duck[i:j] = np.minimum(duck[i:j], curve)

mono = bus['drums'] + bus['sfx'] * 0.9
music = (bus['pad'] + bus['bass']) * duck
L += mono + music
R += mono + music
# the chip chord a little wide: a short offset on one side
off = int(0.012 * SR)
R[off:] += bus['pad'][:-off] * duck[off:] * 0.35
L += bus['pad'] * duck * 0.0
# the lead in the middle with a ping-pong echo of a dotted eighth
ld = bus['lead'] * duck
L += ld
R += ld
d1 = int(0.375 * SR)
L[d1:] += ld[:-d1] * 0.32
R[2 * d1 :] += ld[: -2 * d1] * 0.22


def finish(x):
    x = np.tanh(x * 1.35) / np.tanh(1.35)  # glue and grit
    return x


L, R = finish(L), finish(R)
# fade the last half second
fade = np.ones(N)
fade[-int(0.4 * SR) :] = np.linspace(1, 0, int(0.4 * SR))
L *= fade
R *= fade
peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
L, R = L / peak * 0.95, R / peak * 0.95

st = np.empty(N * 2)
st[0::2], st[1::2] = L, R
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())

# a quick loudness read per second, to catch a section that is far too quiet or loud
rms = [np.sqrt(np.mean(((L + R) / 2)[int(s * SR) : int((s + 1) * SR)] ** 2)) for s in range(30)]
print(' '.join(f'{20 * np.log10(max(r, 1e-6)):.0f}' for r in rms))
