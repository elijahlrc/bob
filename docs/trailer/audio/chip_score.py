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
# Rhythm first. One note of harmony (a D pedal) under drums that carry the energy; no melody. Pitch comes only from
# the bass pulse, a low stab on the big hits and the cue sounds.

D1, D2, Eb2, C2, Bb1 = 26, 38, 39, 36, 34


def pulse_bass(start, dur, step=S16 * 2, g=1.0, notes=None):
    """A pulsing bass on D, a note per step; `notes` may bend the last steps of each bar."""
    n = int(round(dur / step))
    for j in range(n):
        at = start + j * step
        m = D2
        if notes:
            m = notes(at, j)
        bassnote(at, m, step * 0.7, g * (1.0 if j % 2 == 0 else 0.75))


def turn(at, j):
    """Every second bar ends on a half-step lift and back: D D D ... Eb D."""
    pos = round((at % 4.0) / (S16 * 2))
    return Eb2 if pos == 14 else D2


def stab(at, g=1.0, d=0.35):
    """A low, hard stab: D and A an octave apart on two pulse voices."""
    for m, duty in ((D2 + 12, 0.5), (D2 + 19, 0.25)):
        place('pad', at, pulse(midi(m), d, duty) * adsr(int(d * SR), d=d * 0.9, s=0, r=0.01), 0.5 * g)


def tom(at, m, g=1.0):
    d = 0.14
    place('drums', at, tri(midi(m), d, slide=-5) * np.exp(-np.arange(int(d * SR)) / SR / 0.05), 0.7 * g)


def beat(start, bars, kind='full', g=1.0):
    """The patterns. half: kick on 1 and 3, snare on 3. full: a driving kick and a backbeat. drive: four on the floor, sixteenth hats."""
    for b in range(bars):
        t0 = start + b * 2.0
        for st in range(16):
            at = t0 + st * S16
            if kind == 'half':
                if st in (0, 10):
                    kick(at, g)
                if st == 8:
                    snare(at, g)
                if st % 4 == 2:
                    hat(at, 0.7 * g)
            elif kind == 'full':
                if st in (0, 3, 8, 10):
                    kick(at, g)
                if st in (4, 12):
                    snare(at, g)
                if st % 2 == 0:
                    hat(at, g * (0.9 if st % 4 == 2 else 0.6))
            elif kind == 'drive':
                if st % 4 == 0:
                    kick(at, g)
                if st in (4, 12):
                    snare(at, g)
                hat(at, g * (0.9 if st % 2 else 0.5), open_=(st % 4 == 2))


def roll(start, dur, step=S16, g0=0.4, g1=1.0):
    n = int(round(dur / step))
    for j in range(n):
        snare(start + j * step, g0 + (g1 - g0) * j / max(1, n - 1))


# 0-2 s, Endgame: a hard start. Kick and stab with each trap spire, sixteenth hats, the big hit on 1.5.
for at in (0.0, 0.5, 1.0):
    kick(at, 1.1)
    stab(at, 0.7, 0.2)
    blip(at + 0.01, 86, 0.08, 0.5, 0.25, slide=-4)
for st in range(12):
    hat(st * S16, 0.8)
pulse_bass(0.0, 1.5, S16)
roll(1.25, 0.25, S16 / 2, 0.5, 0.9)
boom(1.5)
stab(1.5, 1.0, 0.5)

# 2-3 s, Pick a class: drop to the bass pulse and a tick per card.
pulse_bass(2.0, 1.0, S16 * 2, 0.8)
for k in range(6):
    hat(2.0 + k * 0.125, 1.0)
blip(2.75, 74, 0.06, 0.7, 0.5)

# 3-6 s, the Vanguard: a half-time beat under the tree, four ticks for the nodes, the full beat from the slam.
beat(3.0, 1, 'half')
pulse_bass(3.0, 2.0, S16 * 2, 0.9, turn)
for k in range(4):
    blip(3.2 + k * 0.18, 62 + k * 5, 0.06, 0.6, 0.5)
boom(5.0)
stab(5.0)
beat(5.0, 1, 'full')
pulse_bass(5.0, 1.0, S16 * 2, 1.0, turn)

# 6-10.5 s, the Shade: the full beat with a sixteenth bass. Traps are snare-and-zap accents on the beats; the drop gets two notes.
beat(6.0, 2, 'full')
pulse_bass(6.0, 4.0, S16, 1.0, turn)
blip(6.4, 69, 0.03, 1.0, 0.5)
for at in (7.5, 8.0, 8.5):
    snare(at, 0.8)
    blip(at, 93, 0.06, 0.6, 0.125, slide=-6)
blip(9.02, 81, 0.1, 0.7, 0.5)
blip(9.14, 86, 0.25, 0.6, 0.5)
beat(10.0, 1, 'half', 0.9)
pulse_bass(10.0, 0.5, S16 * 2, 0.9)
blip(10.2, 74, 0.04, 0.9, 0.5)

# 10.5-12.5 s, three more builds: four on the floor. Each panel is a rhythm laid on top: arrow ticks, sweep toms, totem rim clicks.
beat(10.5, 1, 'drive')
pulse_bass(10.5, 2.0, S16, 1.0)
for n in range(11):
    hat(10.65 + n * 0.18, 0.7)
for at in (10.85, 11.45, 12.05):
    tom(at, 45, 0.9)
    tom(at + 0.07, 41, 0.7)
for n in range(5):
    blip(11.05 + n * 0.33, 84, 0.02, 0.5, 0.5)

# 12.5-16 s, the climb: a hit on every cut, the kicks double, a roll builds into the fall.
for k in range(7):
    at = 12.5 + k * 0.5
    kick(at, 1.1)
    crash(at + 0.01, 0.3, 0.35)
    stab(at, 0.55 + 0.06 * k, 0.15)
for st in range(28):
    at = 12.5 + st * S16
    hat(at, 0.6)
    if st >= 14 and st % 2:
        kick(at, 0.8)
pulse_bass(12.5, 3.5, S16, 1.0)
roll(14.75, 1.25, S16 / 2, 0.3, 1.0)

# 16-19 s, the fall: everything stops. A falling charge, the impact on 16.5, a slow heartbeat in the dark,
# a two-note fall on the duel button, a roll back in.
place('sfx', 16.0, pulse(midi(62), 0.5, 0.5, slide=-3) * np.linspace(0.2, 1, int(0.5 * SR)), 0.16)
place('sfx', 16.0, noise(0.5, 4000) * np.linspace(0, 1, int(0.5 * SR)) ** 2, 0.15)
boom(16.5, 1.4)
crash(16.5, 0.7, 1.2)
place('bass', 16.5, tri(midi(D1), 1.4) * np.exp(-np.arange(int(1.4 * SR)) / SR / 0.45), 0.6)
for at in (17.25, 17.45, 17.95, 18.15):
    kick(at, 0.45)
blip(18.25, 62, 0.15, 0.7, 0.5)
blip(18.4, 61, 0.4, 0.6, 0.5)
roll(18.5, 0.5, S16 / 2, 0.3, 1.0)

# 19-25 s, the duel and the board: the drive beat at full weight, sixteenth bass, the held frame silent, the hit on 22.25.
boom(19.0)
stab(19.0)
beat(19.0, 1, 'drive')
pulse_bass(19.0, 3.0, S16, 1.0, turn)
for st in range(8):  # 21-22: the drive beat continues to the hold
    at = 21.0 + st * S16
    if st % 4 == 0:
        kick(at)
    if st == 4:
        snare(at)
    hat(at, 0.8)
boom(22.25, 1.3)
stab(22.25, 1.1, 0.5)
for st in range(6):
    at = 22.5 + st * S16 * 2
    hat(at)
    if st % 2 == 0:
        kick(at)
    if st == 3:
        snare(at)
pulse_bass(22.25, 0.75, S16, 1.0)
beat(23.0, 1, 'drive')
pulse_bass(23.0, 2.0, S16, 1.0, turn)
for k in range(6):  # the rating counts up in ticks
    hat(22.6 + k * 0.06, 0.9)
for at in (23.9, 24.2):
    blip(at, 81, 0.05, 0.7, 0.5)
roll(24.5, 0.5, S16 / 2, 0.4, 0.9)

# 25-27 s, the genres: one hit and one stab per word, nothing between.
for k in range(4):
    at = 25.0 + k * 0.5
    boom(at, 0.85)
    stab(at, 0.9, 0.3)
    bassnote(at, [Bb1, C2, Eb2, D2][k], 0.3, 1.1)

# 27-30 s, the title: the last hit, the D pedal rings out, the pulse slows and stops; the torch gutters out.
boom(27.0, 1.3)
crash(27.0, 0.7, 2.5)
stab(27.0, 1.0, 1.2)
bassnote(27.0, D2, 2.0, 0.6)
t = 27.5
gap = 0.25
while t < 29.6:
    kick(t, 0.5 * (1 - (t - 27.5) / 2.4))
    t += gap
    gap *= 1.25
place('sfx', 29.5, noise(0.5, 9000) * np.exp(-np.arange(int(0.5 * SR)) / SR / 0.15), 0.12)  # the torch

# ---- the motif: one short, dark phrase, low and quiet, the same every time; it sits under the drums ----
MOTIF = ((0.0, 62, 0.4), (0.75, 65, 0.2), (1.0, 63, 0.4), (1.5, 62, 0.45))  # D F Eb D, a bar long


def motif(bar_start, g=0.55, octave=0):
    for off, m, d in MOTIF:
        lead(bar_start + off, m + octave, d, g, duty=0.125, vib=0.004)


for b0 in (6.0, 8.0):  # the Shade's groove
    motif(b0)
for b0 in (12.5, 14.5):  # the climb: the same phrase, cut short by the roll
    motif(b0, 0.5)
for b0 in (19.0, 21.0, 23.0):  # the duel: an octave up, still under the drums
    motif(b0, 0.6, 12)
lead(27.0, 62, 2.0, 0.6, duty=0.125, vib=0.008)  # the title: the first note of the phrase, held

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
