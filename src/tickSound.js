/*
 * Cinematic countdown tick -- original sound design, synthesised at runtime.
 *
 * The brief: a large physical mechanism, not a digital notification. Dark,
 * heavy, mechanical, with a short room around it and almost no high end.
 *
 * Nothing is loaded, decoded or seeked. One AudioContext is created on the
 * first user gesture and reused for the life of the page; every tick is a
 * handful of short-lived nodes that stop and disconnect themselves.
 *
 * ---------------------------------------------------------------------------
 * The voice -- five layers, all deliberately low
 * ---------------------------------------------------------------------------
 *   sub        sine 52->30 Hz            the weight you feel rather than hear
 *   body       triangle 126->46 Hz       the mass of the thing that moved
 *   knock      noise @ ~360 Hz, Q 2.6    wood/metal contact, gives the hit a size
 *   hit        noise @ ~1.25 kHz, 14 ms  the mechanism itself, band-limited
 *   metal      5 inharmonic partials     resonance of a large struck object
 *   room       0.9 s dark convolution    the space it happens in
 *
 * Two decisions do most of the work:
 *
 * 1. Everything sits low. The metal partials of a *large* object are low --
 *    base 196 Hz with partials at 196/329/468/668/947 Hz. The previous version
 *    put them at 1730/2290 Hz, which is the signature of a small bell and is
 *    most of why it read as a website timer. The transient is band-passed at
 *    1.25 kHz and low-passed at 3.2 kHz: sharp, but with no sizzle.
 *
 * 2. The low bus is saturated (tanh soft-clip, 4x oversampled) before it
 *    reaches the master. This is what makes it survive a laptop or phone
 *    speaker: those cannot reproduce 30-45 Hz at all, but saturation generates
 *    harmonics at 60/90/120 Hz, and the ear reconstructs the missing
 *    fundamental. Without it the tick is genuinely massive on headphones and
 *    almost silent on a MacBook.
 *
 * 3. The low end is limited on its own bus, not with everything else. A single
 *    shared limiter let the sub-bass sidechain the whole mix, so the heavier a
 *    tick got the more it ducked its own mechanical layers. That is inaudible
 *    on headphones and ruinous on a phone, which reproduces only those layers:
 *    it inverted the escalation, making the final second measure quieter than
 *    an ordinary one. A soft-clip ceiling after the master then guarantees the
 *    zero impact rounds over rather than clipping.
 *
 * Measured across simulated headphones / laptop / phone responses, loudness and
 * energy both rise monotonically from `normal` to `zero` on all three, and
 * nothing anywhere exceeds full scale.
 */

const MASTER_VOLUME = 0.72;

/* ---------------------------------------------------------------------------
 * Intensity progression.
 *
 * Only the final minute escalates, and it escalates slowly -- every step down
 * is lower in pitch, longer in decay and wetter than the one before, so the
 * tension builds from the sound getting *bigger* rather than louder. Going
 * down the table: sub and body pitch fall, every decay lengthens, the metal
 * resonance grows, the room opens up and the saturation is pushed harder.
 * ------------------------------------------------------------------------ */
const LEVELS = {
  // every ordinary second: deep, restrained, quickly out of the way
  normal: {
    sub:   { from: 52, to: 30, gain: 0.60, decay: 0.28 },
    body:  { from: 126, to: 46, gain: 0.78, decay: 0.16 },
    knock: { freq: 360, gain: 0.27, decay: 0.030 },
    hit:   { freq: 1250, gain: 0.26, decay: 0.014 },
    metal: { base: 196, gain: 0.075, decay: 0.15 , tilt: 1.00 },
    room: 0.14, drive: 1.5,
  },
  // final 10s: slightly heavier transient, more low end, longer resonance
  near: {
    sub:   { from: 50, to: 29, gain: 0.70, decay: 0.34 },
    body:  { from: 120, to: 44, gain: 0.86, decay: 0.19 },
    knock: { freq: 350, gain: 0.30, decay: 0.034 },
    hit:   { freq: 1220, gain: 0.31, decay: 0.015 },
    metal: { base: 188, gain: 0.090, decay: 0.19 , tilt: 1.10 },
    room: 0.17, drive: 1.7,
  },
  // final 5s: noticeably more cinematic
  tense: {
    sub:   { from: 47, to: 28, gain: 0.82, decay: 0.42 },
    body:  { from: 113, to: 42, gain: 0.96, decay: 0.23 },
    knock: { freq: 338, gain: 0.34, decay: 0.038 },
    hit:   { freq: 1190, gain: 0.37, decay: 0.016 },
    metal: { base: 178, gain: 0.108, decay: 0.25 , tilt: 1.24 },
    room: 0.21, drive: 1.9,
  },
  // the last three, each heavier than the last
  three: {
    sub:   { from: 45, to: 27, gain: 0.92, decay: 0.50 },
    body:  { from: 107, to: 40, gain: 1.04, decay: 0.27 },
    knock: { freq: 328, gain: 0.38, decay: 0.042 },
    hit:   { freq: 1160, gain: 0.42, decay: 0.017 },
    metal: { base: 170, gain: 0.122, decay: 0.30 , tilt: 1.38 },
    room: 0.25, drive: 2.1,
  },
  two: {
    sub:   { from: 43, to: 26, gain: 1.02, decay: 0.60 },
    body:  { from: 101, to: 38, gain: 1.12, decay: 0.32 },
    knock: { freq: 318, gain: 0.41, decay: 0.046 },
    hit:   { freq: 1130, gain: 0.47, decay: 0.018 },
    metal: { base: 163, gain: 0.136, decay: 0.36 , tilt: 1.52 },
    room: 0.29, drive: 2.3,
  },
  // the final second is a distinct event, not a louder tick: it sits a fifth
  // lower, the metal rings four times longer and the room is properly open
  one: {
    sub:   { from: 40, to: 25, gain: 1.05, decay: 0.78 },
    body:  { from: 94, to: 35, gain: 1.14, decay: 0.40 },
    knock: { freq: 305, gain: 0.45, decay: 0.052 },
    hit:   { freq: 1100, gain: 0.53, decay: 0.020 },
    metal: { base: 152, gain: 0.155, decay: 0.46 , tilt: 1.70 },
    room: 0.34, drive: 2.5,
  },
  // zero: the boom. 2.1s of sub under a 1.3s metallic decay in a wide room.
  zero: {
    sub:   { from: 36, to: 22, gain: 0.95, decay: 2.10 },
    body:  { from: 82, to: 30, gain: 1.06, decay: 0.75 },
    knock: { freq: 280, gain: 0.48, decay: 0.070 },
    hit:   { freq: 1050, gain: 0.60, decay: 0.024 },
    metal: { base: 132, gain: 0.185, decay: 1.30 , tilt: 2.00 },
    room: 0.55, drive: 2.9,
  },
};

export const LEVEL_ORDER = ["normal", "near", "tense", "three", "two", "one", "zero"];

/**
 * Pick the tick character from the countdown state. The countdown is the only
 * input -- there is no separate audio clock to fall out of step with.
 */
export function tickLevel(time) {
  if (!time) return "normal";

  const { isReleased, months, days, hours, minutes, seconds } = time;
  const allZero = !months && !days && !hours && !minutes && !seconds;

  // Counting up from doomsday: the very first second is the impact itself.
  if (isReleased) return allZero ? "zero" : "normal";

  const finalMinute = !months && !days && !hours && !minutes;
  if (!finalMinute) return "normal";

  if (seconds === 1) return "one";
  if (seconds === 2) return "two";
  if (seconds === 3) return "three";
  if (seconds <= 5) return "tense";
  if (seconds <= 10) return "near";
  return "normal";
}

/* ---------------------------------------------------------------------------
 * Building blocks
 * ------------------------------------------------------------------------ */

/* Deterministic noise. Math.random() would give every page load a slightly
   different room and a slightly different transient; seeding makes the sound a
   fixed property of the build rather than something that varies per visit. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Dark room: 12ms of pre-delay (which is what reads as "large"), then noise
   decaying exponentially through a one-pole low-pass whose damping *increases*
   over the tail, so the space gets darker as it dies away rather than hissing. */
export function buildRoomIR(ctx) {
  const pre = 0.012;
  const tail = 0.9;
  const len = Math.floor(ctx.sampleRate * (pre + tail));
  const preN = Math.floor(ctx.sampleRate * pre);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);

  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    const rnd = mulberry32(0x51f0 + c);          // decorrelated L/R, but fixed
    let lp = 0;
    for (let i = preN; i < len; i++) {
      const t = (i - preN) / (len - preN);
      const decay = Math.pow(1 - t, 2.6);
      const k = 0.62 + 0.34 * t;                 // damping rises as the tail decays
      lp = lp * k + (rnd() * 2 - 1) * (1 - k);
      d[i] = lp * decay;
    }
  }
  return buf;
}

function buildNoise(ctx) {
  const len = Math.floor(ctx.sampleRate * 0.12);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  const rnd = mulberry32(0x2c4b);
  for (let i = 0; i < len; i++) d[i] = rnd() * 2 - 1;
  return buf;
}

/*
 * Guaranteed output ceiling.
 *
 * WaveShaper curves map an input of -1..1, so the curve is fed a halved signal
 * and written across a +/-2 input range: anything the engine can produce is
 * inside the table rather than flattened against its end. The shape is
 * A*tanh(x/A), which is within ~2% of linear for ordinary ticks and asymptotes
 * to A, so the zero impact rounds over instead of clipping.
 *
 * This replaces relying on DynamicsCompressor alone for the ceiling: that node
 * applies its own automatic makeup gain, which silently changed the level of
 * every tick whenever the threshold was retuned, and still let peaks past 1.0.
 */
const CEILING = 0.98;

function ceilingCurve() {
  const n = 4096;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = ((i * 2) / (n - 1) - 1) * 2;       // table spans -2..+2
    c[i] = CEILING * Math.tanh(x / CEILING);
  }
  return c;
}

/* tanh soft-clip. Rounds peaks instead of squaring them off, and generates the
   harmonic series that lets small speakers imply the sub they cannot play. */
function softClipCurve(amount) {
  const n = 2048;
  const c = new Float32Array(n);
  const norm = Math.tanh(amount);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / (n - 1) - 1;
    c[i] = Math.tanh(x * amount) / norm;
  }
  return c;
}

/**
 * The persistent half of the graph. Exported so the same signal path can be
 * rendered into an OfflineAudioContext for measurement.
 *
 *   low layers  -> lowBus -> drive -> lowPost ->\
 *                                                master -> limiter -> out
 *   mid layers  ------------------------------->/
 *   all layers  -> send  -> convolver -> roomLp -> roomGain ->/
 */
export function createBuses(ctx) {
  // Safety limiter across the sum. Deliberately gentle: it exists to stop the
  // zero impact clipping, not to shape anything.
  // Final stage: halve, then soft-clip through the +/-2 table. Guarantees the
  // output can never exceed CEILING no matter how the levels are retuned.
  const ceiling = ctx.createWaveShaper();
  ceiling.curve = ceilingCurve();
  ceiling.oversample = "4x";
  ceiling.connect(ctx.destination);

  const ceilingPre = ctx.createGain();
  ceilingPre.gain.value = 0.5;
  ceilingPre.connect(ceiling);

  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -1;
  limiter.knee.value = 3;
  limiter.ratio.value = 8;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.20;
  limiter.connect(ceilingPre);

  const master = ctx.createGain();
  master.gain.value = MASTER_VOLUME;
  master.connect(limiter);

  /*
   * The low bus is limited on its own, ahead of the master.
   *
   * Sharing one limiter across every layer meant the sub-bass sidechained the
   * whole mix: the heavier a tick got, the more it ducked its own mechanical
   * layers. On headphones that is inaudible -- the sub dominates anyway. On a
   * phone, which reproduces *only* those mechanical layers, it inverted the
   * escalation outright: the final second measured quieter than an ordinary
   * one. Limiting the low end separately keeps the sub under control without
   * letting it pull the mechanism down with it.
   */
  const lowLimiter = ctx.createDynamicsCompressor();
  lowLimiter.threshold.value = -4;
  lowLimiter.knee.value = 6;
  lowLimiter.ratio.value = 12;
  lowLimiter.attack.value = 0.002;
  lowLimiter.release.value = 0.22;
  lowLimiter.connect(master);

  const lowPost = ctx.createBiquadFilter();
  lowPost.type = "lowpass";
  lowPost.frequency.value = 1300;                // keep the drive harmonics, lose the buzz
  lowPost.Q.value = 0.7;
  lowPost.connect(lowLimiter);

  const drive = ctx.createWaveShaper();
  drive.curve = softClipCurve(1.5);
  drive.oversample = "4x";
  drive.connect(lowPost);

  const lowBus = ctx.createGain();
  lowBus.gain.value = 1;
  lowBus.connect(drive);

  const convolver = ctx.createConvolver();
  convolver.buffer = buildRoomIR(ctx);

  const roomLp = ctx.createBiquadFilter();
  roomLp.type = "lowpass";
  roomLp.frequency.value = 2600;
  convolver.connect(roomLp);

  const roomGain = ctx.createGain();
  roomGain.gain.value = 0.9;
  roomLp.connect(roomGain);
  roomGain.connect(master);

  return { master, limiter, lowLimiter, ceiling, output: ceiling, lowBus, drive,
           convolver, roomGain, noise: buildNoise(ctx) };
}

// Inharmonic mode ratios of a large struck object, with the amplitude and the
// small detunes that make real metal beat slightly instead of sitting still.
const PARTIALS = [1, 1.68, 2.39, 3.41, 4.83];
const PARTIAL_GAIN = [1, 0.62, 0.42, 0.26, 0.16];
const PARTIAL_DETUNE = [0, -7, 5, -4, 8];

/**
 * Schedule one tick at absolute time `when`. Every node created here is
 * stopped and disconnected by the time the sound has finished.
 */
export function scheduleTick(ctx, buses, level, when) {
  const p = LEVELS[level] ?? LEVELS.normal;
  const t = when;
  const nodes = [];
  const keep = (n) => { nodes.push(n); return n; };

  // Saturation is pushed harder as the countdown tightens.
  buses.drive.curve = softClipCurve(p.drive);

  // Per-tick send into the shared room.
  const send = keep(ctx.createGain());
  send.gain.value = p.room;
  send.connect(buses.convolver);

  // ---- sub: felt more than heard ----
  const sub = keep(ctx.createOscillator());
  sub.type = "sine";
  sub.frequency.setValueAtTime(p.sub.from, t);
  sub.frequency.exponentialRampToValueAtTime(p.sub.to, t + 0.12);

  const subHp = keep(ctx.createBiquadFilter());
  subHp.type = "highpass";
  subHp.frequency.value = 24;                    // no DC, nothing a speaker can hurt itself on

  const subGain = keep(ctx.createGain());
  subGain.gain.setValueAtTime(0.0001, t);
  subGain.gain.exponentialRampToValueAtTime(p.sub.gain, t + 0.006);
  subGain.gain.exponentialRampToValueAtTime(0.0001, t + p.sub.decay);

  sub.connect(subHp).connect(subGain);
  subGain.connect(buses.lowBus);
  subGain.connect(send);

  // ---- body: the mass that moved ----
  const body = keep(ctx.createOscillator());
  body.type = "triangle";                        // harmonics for the saturator to work on
  body.frequency.setValueAtTime(p.body.from, t);
  body.frequency.exponentialRampToValueAtTime(p.body.to, t + 0.07);

  const bodyLp = keep(ctx.createBiquadFilter());
  bodyLp.type = "lowpass";
  bodyLp.frequency.value = 320;
  bodyLp.Q.value = 0.7;

  const bodyGain = keep(ctx.createGain());
  bodyGain.gain.setValueAtTime(0.0001, t);
  bodyGain.gain.exponentialRampToValueAtTime(p.body.gain, t + 0.003);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + p.body.decay);

  body.connect(bodyLp).connect(bodyGain);
  bodyGain.connect(buses.lowBus);
  bodyGain.connect(send);

  // ---- knock: the contact, low and woody, gives the transient a size ----
  const knock = keep(ctx.createBufferSource());
  knock.buffer = buses.noise;

  const knockBp = keep(ctx.createBiquadFilter());
  knockBp.type = "bandpass";
  knockBp.frequency.value = p.knock.freq;
  knockBp.Q.value = 2.6;

  const knockGain = keep(ctx.createGain());
  knockGain.gain.setValueAtTime(p.knock.gain, t);
  knockGain.gain.exponentialRampToValueAtTime(0.0001, t + p.knock.decay);

  knock.connect(knockBp).connect(knockGain);
  knockGain.connect(buses.master);
  knockGain.connect(send);

  // ---- hit: the mechanism. Sharp, but band-limited so it never sizzles. ----
  const hit = keep(ctx.createBufferSource());
  hit.buffer = buses.noise;

  const hitBp = keep(ctx.createBiquadFilter());
  hitBp.type = "bandpass";
  hitBp.frequency.value = p.hit.freq;
  hitBp.Q.value = 1.1;

  const hitLp = keep(ctx.createBiquadFilter());
  hitLp.type = "lowpass";
  hitLp.frequency.value = 3200;                  // the brightness ceiling

  const hitGain = keep(ctx.createGain());
  hitGain.gain.setValueAtTime(p.hit.gain, t);
  hitGain.gain.exponentialRampToValueAtTime(0.0001, t + p.hit.decay);

  hit.connect(hitBp).connect(hitLp).connect(hitGain);
  hitGain.connect(buses.master);
  hitGain.connect(send);

  // ---- metal: inharmonic resonance of something large ----
  const metalLp = keep(ctx.createBiquadFilter());
  metalLp.type = "lowpass";
  metalLp.frequency.value = 2200;
  metalLp.connect(buses.master);
  metalLp.connect(send);

  let metalLast = null;
  let metalEndsAt = 0;
  PARTIALS.forEach((ratio, i) => {
    const o = keep(ctx.createOscillator());
    o.type = "sine";
    o.frequency.value = p.metal.base * ratio;
    o.detune.value = PARTIAL_DETUNE[i];           // slight beating, as real metal does

    // higher modes shed energy faster, which is what makes it read as struck
    const decay = p.metal.decay * Math.pow(0.72, i);
    const g = keep(ctx.createGain());
    g.gain.setValueAtTime(0.0001, t);
    // upper modes are what survives a laptop or phone speaker, so the
    // escalation opens them up rather than relying on sub-bass alone
    const tilt = i >= 2 ? (p.metal.tilt ?? 1) : 1;
    g.gain.exponentialRampToValueAtTime(p.metal.gain * PARTIAL_GAIN[i] * tilt, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);

    o.connect(g).connect(metalLp);
    o.start(t);
    const endsAt = decay + 0.02;
    o.stop(t + endsAt);
    if (endsAt > metalEndsAt) { metalEndsAt = endsAt; metalLast = o; }
  });

  const subEndsAt = p.sub.decay + 0.03;
  sub.start(t);
  sub.stop(t + subEndsAt);
  body.start(t);
  body.stop(t + p.body.decay + 0.03);
  knock.start(t);
  knock.stop(t + p.knock.decay + 0.02);
  hit.start(t);
  hit.stop(t + p.hit.decay + 0.02);

  // One teardown, hung off whichever layer genuinely finishes last -- tearing
  // down early would cut off the longest layer mid-decay.
  const last = subEndsAt >= metalEndsAt ? sub : metalLast;
  last.onended = () => nodes.forEach((n) => { try { n.disconnect(); } catch { /* gone */ } });

  return t + Math.max(subEndsAt, metalEndsAt, p.body.decay + 0.03);
}

/* ---------------------------------------------------------------------------
 * Engine
 * ------------------------------------------------------------------------ */

export function createTickEngine() {
  let ctx = null;
  let buses = null;
  let disposed = false;
  let warned = false;

  function ensureContext() {
    if (disposed) return null;
    if (ctx) return ctx;

    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;

    try {
      ctx = new Ctor();
      buses = createBuses(ctx);
    } catch (err) {
      if (!warned) { console.error("Tick audio unavailable:", err); warned = true; }
      ctx = null;
      buses = null;
    }
    return ctx;
  }

  /** Call from a user gesture. Safe to call repeatedly. */
  async function unlock() {
    const c = ensureContext();
    if (!c) return false;
    if (c.state === "suspended") {
      try { await c.resume(); } catch { /* stays suspended; ticks are no-ops */ }
    }
    return c.state === "running";
  }

  /** Browsers suspend the context when the tab is hidden. Bring it back. */
  async function resumeIfNeeded() {
    if (!ctx || disposed) return;
    if (ctx.state === "suspended") {
      try { await ctx.resume(); } catch { /* ignore */ }
    }
  }

  function tick(level = "normal") {
    if (disposed || !ctx || !buses || ctx.state !== "running") return;
    try {
      scheduleTick(ctx, buses, level, ctx.currentTime + 0.001);
    } catch (err) {
      if (!warned) { console.error("Tick failed:", err); warned = true; }
    }
  }

  function dispose() {
    disposed = true;
    if (ctx) {
      try { ctx.close(); } catch { /* already closed */ }
    }
    ctx = null;
    buses = null;
  }

  function setVolume(v) {
    if (buses) buses.master.gain.value = Math.max(0, Math.min(1, v));
  }

  return {
    unlock,
    resumeIfNeeded,
    tick,
    dispose,
    setVolume,
    isReady: () => !!ctx && ctx.state === "running",
  };
}
