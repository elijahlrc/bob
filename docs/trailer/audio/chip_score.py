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


# ================= the score =================
# One groove, start to finish: the same beat and the same pulsing bass on D. It stops once, for the fall, and comes
# back for the duel; the genre words get a hit each and the title rings out. The game's own sounds come with the
# footage, so the score does not follow the cuts.

D1, D2, Eb2 = 26, 38, 39


def bar(t0, g=1.0):
    """The groove, one bar: kick on 1, the and-of-2 and 3; snare on 2 and 4; eighth hats; sixteenth bass on D,
    lifting to Eb on the last eighth of every second bar."""
    for st in range(16):
        at = t0 + st * S16
        if st in (0, 6, 8):
            kick(at, g)
        if st in (4, 12):
            snare(at, g)
        if st % 2 == 0:
            hat(at, g * (0.9 if st % 4 == 2 else 0.6))
        lift = st >= 14 and round(t0 / 2.0) % 2 == 1
        bassnote(at, Eb2 if lift else D2, S16 * 0.7, g * (1.0 if st % 2 == 0 else 0.7))


MOTIF = ((0.0, 62, 0.4), (0.75, 65, 0.2), (1.0, 63, 0.4), (1.5, 62, 0.45))  # D F Eb D


def motif(t0, g=0.32):
    for off, m, d in MOTIF:
        lead(t0 + off, m, d, g, duty=0.125, vib=0.0)


# 0-16 s: the groove, eight bars. In on the first frame, one hit at 1.5 on the opening's biggest burst.
for b in range(8):
    bar(b * 2.0)
boom(1.5)
for t0 in (4.0, 8.0, 12.0):  # the phrase every other bar from bar 3
    motif(t0)
for st in range(8):  # a short roll into the stop
    snare(15.0 + st * S16, 0.4 + 0.08 * st)

# 16-19 s: the fall. Silence but for the impact on 16.5 and its low ring; a roll back in.
boom(16.5, 1.3)
place('bass', 16.5, tri(midi(D1), 1.4) * np.exp(-np.arange(int(1.4 * SR)) / SR / 0.45), 0.6)
for st in range(4):
    snare(18.5 + st * S16 * 2, 0.4 + 0.15 * st)

# 19-25 s: the groove again, three bars, with one hit on the duel's deciding blow at 22.25 after a beat of silence.
for b in range(3):
    bar(19.0 + b * 2.0)
mute_spans = [(22.0, 22.25)]
boom(22.25, 1.1)
for t0 in (19.0, 23.0):
    motif(t0)

# 25-27 s: the genres, a hit per word on the bass note, nothing between.
for k in range(4):
    boom(25.0 + k * 0.5, 0.85)
    bassnote(25.0 + k * 0.5, D2, 0.3, 1.1)

# 27-30 s: the title. The last hit, the D rings out.
boom(27.0, 1.2)
crash(27.0, 0.6, 2.5)
bassnote(27.0, D2, 2.2, 0.6)
lead(27.0, 62, 1.8, 0.3, duty=0.125)

# ================= the mix =================
for a_, b_ in mute_spans:  # held silences
    for k_ in bus:
        bus[k_][int(a_ * SR) : int(b_ * SR)] = 0
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
