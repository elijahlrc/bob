"""Chiptune score for the trailer animatic: 31 s, 120 bpm, D minor, locked to the cut.

Voices in the style of an old sound chip (two pulse channels, a triangle, a noise channel), pushed
with modern production: kick ducking, a stereo echo on the lead, saturation. Writes a stereo 16-bit WAV.
"""
import sys, wave
import numpy as np

SR = 44100
DUR = 31.0
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


def bar(t0, g=1.0, steps=16):
    """The groove, one bar: kick on 1, the and-of-2 and 3; snare on 2 and 4; eighth hats; sixteenth bass on D,
    lifting to Eb on the last eighth of every second bar. `steps` cuts the bar short."""
    for st in range(steps):
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


# 0-17.25 s: the groove, eight bars and most of a ninth, stopped dead by the Tollkeeper's bell on 17.25 (the and of 3). In on
# the first frame, one hit at 1.5 on the opening's biggest burst.
for b in range(8):
    bar(b * 2.0)
bar(16.0, steps=10)
boom(1.5)
for t0 in (4.0, 8.0, 12.0):  # the phrase every other bar from bar 3
    motif(t0)
for st in range(8):  # a short roll into the stop
    snare(16.25 + st * S16, 0.4 + 0.08 * st)

# 17.25-20 s: the fall. The groove stops as the toll's rings show on the floor, the bell held up; it comes down as the first
# ring kills on 18.0, an impact, the bell and a low ring; a roll back in.
boom(18.0, 1.3)
place('bass', 18.0, tri(midi(D1), 1.4) * np.exp(-np.arange(int(1.4 * SR)) / SR / 0.45), 0.6)
for st in range(4):  # a pickup in sixteenths that ends before the downbeat, then the groove lands with a hit
    snare(19.5 + st * S16, 0.45 + 0.15 * st)
boom(20.0, 0.9)

# 20-26 s: the groove again, three bars; the duel's deciding blow at 23.25 gets a restrained crash, no break.
bar(20.0)
bar(22.0)
bar(24.0, steps=8)
mute_spans = [(25.875, 26.0)]

# 24-26 s: the set-up for the four words, by taking away. The groove runs half a bar, then at 25 it drops out: no kick,
# no snare, the bass holds one low D, only sixteenth hats tick. At 25.5 a tom fill falls down the kit, then a sixteenth
# of silence before the first word.
place('bass', 25.0, tri(midi(D2 - 12), 0.5) * adsr(int(0.5 * SR), d=0.3, s=0.6, r=0.05), 0.5)
for j in range(4):
    hat(25.0 + j * S16, 0.5 + 0.1 * j)


def tom(at, m, g=1.0):
    d = 0.16
    place('drums', at, tri(midi(m), d, slide=-4) * np.exp(-np.arange(int(d * SR)) / SR / 0.06), 0.85 * g)
    place('drums', at, noise(0.03, 12000) * np.exp(-np.arange(int(0.03 * SR)) / SR / 0.008), 0.2 * g)


for j, m in enumerate((57, 57, 52, 52)):  # high and mid toms in thirty-seconds: ta-ka ta-ka
    tom(25.5 + j * S16 / 2, m, 0.8 + 0.05 * j)
for at in (25.625, 25.75):  # then two long floor-tom kicks on the sixteenths: dum, dum
    d = 0.3
    place('drums', at, tri(midi(40), d, slide=-5) * np.exp(-np.arange(int(d * SR)) / SR / 0.12), 1.0)
    kick(at, 0.9)
crash(23.25, 0.4, 0.6)  # the deciding blow: a restrained crash on top of the groove, which keeps going
for t0 in (20.0, 24.0):
    motif(t0)

# 26-28 s: the genres, a hit per word, nothing between. Tight hits with no cymbal wash: a long, deep kick with
# a short bright attack, and a low D under it, each one stopping before the next.


def slam(at, g=1.0):
    d = 0.42
    n = int(d * SR)
    body = tri(140, d, slide=-7) * np.exp(-np.arange(n) / SR / 0.16)
    body[: int(0.004 * SR)] += 0.9
    place('drums', at, body, 1.0 * g)
    place('drums', at, pulse(midi(26), d, 0.5) * np.exp(-np.arange(n) / SR / 0.14), 0.3 * g)
    place('drums', at, noise(0.035, 16000) * np.exp(-np.arange(int(0.035 * SR)) / SR / 0.01), 0.35 * g)
    duck_points.append(at)


for k in range(4):
    slam(26.0 + k * 0.5, 1.0)
    bassnote(26.0 + k * 0.5, D2, 0.4, 1.1)

# 28-31 s: the title. The last hit, the D rings out.
boom(28.0, 1.2)
crash(28.0, 0.6, 2.5)
bassnote(28.0, D2, 2.2, 0.6)
lead(28.0, 62, 1.8, 0.3, duty=0.125)

# ================= sound effects =================
# The game has no sound yet, so the trailer's effects are made here: short chip sounds on their own bus, laid over
# the groove and never ducked by it. The music stays the same underneath.


def zap(at, m=93, g=1.0, d=0.1):
    blip(at, m, d, 0.9 * g, 0.125, slide=-5)
    place('sfx', at, noise(d, 20000) * np.exp(-np.arange(int(d * SR)) / SR / 0.02), 0.12 * g)


def thud(at, g=1.0):
    d = 0.3
    place('sfx', at, tri(110, d, slide=-6) * np.exp(-np.arange(int(d * SR)) / SR / 0.08), 0.5 * g)
    place('sfx', at, noise(d, 6000) * np.exp(-np.arange(int(d * SR)) / SR / 0.06), 0.3 * g)


def whoosh(at, d=0.2, g=1.0, rise=True):
    n = int(d * SR)
    env_ = np.sin(np.pi * np.arange(n) / n)
    place('sfx', at, noise(d, 9000 if rise else 5000) * env_, 0.25 * g)


def bell(at, m, g=1.0, d=1.6):
    """A struck bell in chip voices: a bell's partials (hum, prime, minor third, nominal and a high one), the high ones dying
    first."""
    n = int(d * SR)
    t = np.arange(n) / SR
    for ratio, amp, tau in ((0.5, 0.6, 0.9), (1.0, 1.0, 0.6), (1.19, 0.55, 0.45), (2.0, 0.45, 0.3), (2.76, 0.3, 0.15)):
        place('sfx', at, tri(midi(m) * ratio, d) * np.exp(-t / tau), 0.3 * g * amp)


def click(at, g=1.0):
    blip(at, 84, 0.02, 0.9 * g, 0.5)


def tick(at, m=88, g=1.0):
    blip(at, m, 0.03, 0.6 * g, 0.5)


# 0-2: three trap spires, then the big burst
for at in (0.0, 0.5, 1.0):
    zap(at)
thud(1.5, 1.2)
whoosh(1.5, 0.4, 0.8)
# 2-5: the tree grows: a chime per eighth note, climbing a pentatonic scale, the last ones fuller
SCALE = (74, 77, 79, 81, 84, 86, 89, 91, 93, 96, 98)
for k in range(11):
    at = 2.25 + k * 0.25
    blip(at, SCALE[k], 0.14 if k < 9 else 0.3, 0.7 + 0.03 * k, 0.125)
blip(4.5, 98, 0.4, 0.5, 0.25)
whoosh(4.6, 0.4, 0.8)
thud(5.0, 1.5)
place('sfx', 5.0, noise(0.6, 3000) * np.exp(-np.arange(int(0.6 * SR)) / SR / 0.15), 0.25)  # the floor cracking
# 6-10.5: the gem is picked up (6.4) and dropped into its socket (7.0), the number climbs, the traps spring, the amulet drops
# (8.5), the card (9.0) and Swap (10.0)
blip(6.4, 81, 0.25, 0.4, 0.5, slide=-2)
click(7.0, 1.3)
for k in range(8):
    tick(7.05 + k * 0.05, 76 + k * 2, 0.8)
for at in (7.5, 7.7):
    whoosh(at, 0.15, 0.6)
for at in (8.0, 8.25):
    zap(at, 96)
for k, m in enumerate((81, 86, 89, 93)):
    blip(8.52 + k * 0.06, m, 0.1, 0.7, 0.5)
blip(8.76, 98, 0.3, 0.5, 0.25)
tick(9.7, 88, 0.8)
click(10.0, 1.2)
blip(10.04, 86, 0.08, 0.6, 0.5)
# 10.5-12.5: three panels: arrows loosed, heavy sweeps, a totem's bell
for n in range(11):
    tick(10.65 + n * 0.18, 95, 0.6)
for at in (10.85, 11.45, 12.05):
    whoosh(at, 0.18, 1.0)
    thud(at + 0.12, 0.5)
place('sfx', 10.7, tri(220, 0.12, slide=-4) * adsr(int(0.12 * SR), d=0.1, s=0), 0.4)  # the totem lands
for n in range(5):
    blip(11.05 + n * 0.33, 93, 0.18, 0.5, 0.125)
# 12.5-14.5: an impact on every cut, and on the cut to the boss
for k in range(5):
    at = 12.5 + k * 0.5
    [zap, thud, zap, zap, thud][k](at + 0.12)
# 14.5-20: the Tollkeeper's bell rises (a slow climb under the fight), the rings of its fourth toll crackle onto the floor, the
# bell comes down as the first strikes; the duel button
place('sfx', 15.25, pulse(midi(50), 2.0, 0.25, slide=0.5) * np.linspace(0, 1, int(2.0 * SR)) ** 2, 0.12)
place('sfx', 17.25, noise(0.25, 16000) * np.exp(-np.arange(int(0.25 * SR)) / SR / 0.05), 0.2)  # the rings of lightning appear
place('sfx', 17.5, pulse(midi(74), 0.5, 0.5, slide=-3) * np.linspace(0.2, 1, int(0.5 * SR)), 0.16)
place('sfx', 17.5, noise(0.5, 4000) * np.linspace(0, 1, int(0.5 * SR)) ** 2, 0.15)
bell(18.0, 62, 1.2)
thud(18.0, 1.6)
place('sfx', 18.0, noise(1.2, 2500) * np.exp(-np.arange(int(1.2 * SR)) / SR / 0.35), 0.35)  # the floor shattering
click(19.25, 1.2)
blip(19.3, 74, 0.12, 0.7, 0.5)
blip(19.45, 69, 0.3, 0.6, 0.5)
# 20-23.5: the duel: our shots every half beat, the rival's fire, the held frame, the deciding hit
for n in range(5):
    blip(20.0 + n * 0.5, 88, 0.06, 0.6, 0.25, slide=-3)
    tick(20.25 + n * 0.5, 72, 0.7)
for n in range(3):
    whoosh(20.75 + n * 0.75, 0.15, 0.7)
    thud(20.75 + n * 0.75, 0.5)
thud(23.25, 0.8)
zap(23.25, 98, 0.7, 0.1)
# 23.5-26: the rating counts up, a coin per place gained
for k in range(10):
    tick(23.65 + k * 0.05, 79 + k, 0.7)
for at in (24.9, 25.2):
    blip(at, 88, 0.05, 0.9, 0.5)
    blip(at + 0.05, 93, 0.12, 0.9, 0.5)
# 30.5: the torch gutters out
place('sfx', 30.5, noise(0.5, 9000) * np.exp(-np.arange(int(0.5 * SR)) / SR / 0.15), 0.15)

# ================= the mix =================


def degrade(x, rate, bits, drive):
    """Crunch: hold each sample to a lower rate (aliasing grit), drive it into clipping, then cut the bit depth."""
    hold = max(1, int(SR / rate))
    y = np.repeat(x[::hold], hold)[: len(x)]
    y = np.tanh(y * drive) / np.tanh(drive) * np.max(np.abs(x) + 1e-9)
    q = 2 ** (bits - 1) / max(1e-9, np.max(np.abs(y)))
    return np.round(y * q) / q


def lowpass(x, cut):
    """A steep low-pass through the FFT (the whole score at once): takes the corners off the triangle so the fundamental stands alone."""
    f = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    f *= 1 / (1 + (fr / cut) ** 8)
    return np.fft.irfft(f, len(x))


def fold(x, k):
    """Wavefold: a signal pushed past full scale folds back on itself, which adds bright inharmonic partials."""
    return np.sin(np.clip(x, -1, 1) * k)


# The bass: the old gritty triangle, a clean low sine under it for weight, and the sine saturated so the note still speaks on
# a laptop speaker that cannot play 73 Hz. About 9 dB louder than it was.
_b = bus['bass']
_sub = lowpass(_b, 110)
_grit = degrade(_b, 6000, 3, 4.5)
_harm = np.tanh(_sub * 7.0) * 0.5
bus['bass'] = (_grit * 0.6 * 1.2 + _sub * 1.5 + _harm * 0.7) * 1.0

# The lead, crushed hard: held to a very low sample rate (aliasing), pushed into a hard clip, wavefolded, cut to 2 and 3 bits and
# the two blended, then a short metallic comb (a 1.7 ms delay fed back) and a copy that is crushed harder still.
_l = bus['lead']
_a = degrade(_l, 3600, 2, 9.0)
_f = degrade(fold(_l * 6.0, 2.4), 5200, 3, 6.0)
_mix = 0.55 * _a + 0.45 * _f
_cd = int(0.0017 * SR)
_comb = _mix.copy()
for _k in range(1, 4):
    _comb[_cd * _k :] += _mix[: -_cd * _k] * (0.45 ** _k)
_hard = degrade(_l, 2400, 2, 12.0)  # the same line crushed harder still, for the gritty edge
bus['lead'] = (_comb * 0.8 + _hard * 0.25) * 0.5
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

if len(sys.argv) > 2:  # `chip_score.py out.wav --stems`: how loud each voice is, before the mix
    print(' '.join(f'{k} {20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-9):.1f}' for k, v in bus.items()))
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
# a crushed, clipped signal has hard edges and a lot above the range an encoder keeps; cut it first so the encoder does not ring
# (which overshoots the peak by several dB and clips) and the sound is the same in the file as here
L, R = lowpass(L, 14000), lowpass(R, 14000)
# fade the last half second
fade = np.ones(N)
fade[-int(0.4 * SR) :] = np.linspace(1, 0, int(0.4 * SR))
L *= fade
R *= fade
peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
L, R = L / peak * 0.7, R / peak * 0.7  # headroom: the lossy encoders overshoot a crushed, clipped signal by about 2 dB

st = np.empty(N * 2)
st[0::2], st[1::2] = L, R
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())

# a quick loudness read per second, to catch a section that is far too quiet or loud
rms = [np.sqrt(np.mean(((L + R) / 2)[int(s * SR) : int((s + 1) * SR)] ** 2)) for s in range(int(DUR))]
print(' '.join(f'{20 * np.log10(max(r, 1e-6)):.0f}' for r in rms))
