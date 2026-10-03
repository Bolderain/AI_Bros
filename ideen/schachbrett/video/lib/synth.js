'use strict';
// Instruments + sound effects, all generated from scratch.
const A = require('./audio');
const { SR, noise, env, window_, filt, biquad, sweepBP, mixInto, mulberry32 } = A;

const hz = m => 440 * Math.pow(2, (m - 69) / 12);

function partials(f0, dur, specs, rng, detune = 0.0015) {
  // specs: [[ratio, amp, decaySeconds], ...]
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  for (const [ratio, amp, dec] of specs) {
    const f = f0 * ratio * (1 + (rng() - 0.5) * 2 * detune);
    const w = 2 * Math.PI * f / SR;
    const ph = rng() * Math.PI * 2;
    const k = 3.6 / (dec * SR);
    let a = amp;
    for (let i = 0; i < n; i++) {
      out[i] += Math.sin(w * i + ph) * a;
      a *= (1 - k);
      if (a < 1e-6) break;
    }
  }
  // soft attack to kill the click from phase discontinuity
  const at = Math.round(0.0025 * SR);
  for (let i = 0; i < at; i++) out[i] *= i / at;
  return out;
}

function hammer(dur, rng, cut = 5200, amp = 0.09) {
  let n = noise(Math.min(dur, 0.012), rng);
  n = filt(n, biquad('hp', cut, 0.8));
  env(n, 0.0002, 0.006);
  for (let i = 0; i < n.length; i++) n[i] *= amp;
  return n;
}

// ------------------------------------------------------------------ pitched
function musicBox(midi, dur, rng) {
  const f0 = hz(midi);
  const out = partials(f0, dur, [
    [1, 0.5, dur * 0.95], [2.01, 0.30, dur * 0.6], [3.0, 0.14, dur * 0.36],
    [4.21, 0.075, dur * 0.22], [6.33, 0.035, dur * 0.13], [8.5, 0.015, dur * 0.08],
  ], rng);
  mixInto(out, hammer(dur, rng, 5600, 0.075));
  return out;
}

function marimba(midi, dur, rng) {
  const f0 = hz(midi);
  const out = partials(f0, dur, [
    [1, 0.62, dur * 0.9], [3.99, 0.26, dur * 0.3], [9.6, 0.07, dur * 0.12],
  ], rng);
  mixInto(out, hammer(dur, rng, 3200, 0.06));
  return filt(out, biquad('lp', 7000, 0.7));
}

function glock(midi, dur, rng) {
  const f0 = hz(midi);
  const out = partials(f0, dur, [
    [1, 0.4, dur * 0.95], [2.76, 0.2, dur * 0.5], [5.4, 0.07, dur * 0.22], [8.9, 0.025, dur * 0.1],
  ], rng);
  mixInto(out, hammer(dur, rng, 7000, 0.05));
  return out;
}

function pizz(midi, dur, rng) {
  const f0 = hz(midi);
  const n = Math.round(dur * SR);
  let out = new Float32Array(n);
  // triangle-ish: odd harmonics, 1/k^2, alternating sign
  for (let k = 1; k <= 13; k += 2) {
    const w = 2 * Math.PI * f0 * k / SR;
    const amp = (k % 4 === 1 ? 1 : -1) / (k * k);
    for (let i = 0; i < n; i++) out[i] += Math.sin(w * i) * amp;
  }
  env(out, 0.003, dur * 0.72, 4.2);
  out = filt(out, biquad('lp', Math.min(2600, f0 * 9), 0.8));
  // body thump
  const body = partials(f0 * 0.5, Math.min(dur, 0.22), [[1, 0.22, 0.14]], rng);
  mixInto(out, body, 0.5);
  mixInto(out, hammer(dur, rng, 1800, 0.035));
  return out;
}

// Karplus-Strong pluck: organic nylon-string colour
function pluck(midi, dur, rng, damping = 0.9955, bright = 0.5) {
  const f0 = hz(midi);
  const L = Math.max(4, Math.round(SR / f0));
  const buf = new Float32Array(L);
  for (let i = 0; i < L; i++) buf[i] = rng() * 2 - 1;
  // pre-filter the excitation for a softer pick
  let prev = 0;
  for (let i = 0; i < L; i++) { prev = prev * (1 - bright) + buf[i] * bright; buf[i] = prev; }
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  let idx = 0, last = 0;
  for (let i = 0; i < n; i++) {
    const cur = buf[idx];
    const v = (cur + last) * 0.5 * damping;
    last = cur;
    out[i] = cur;
    buf[idx] = v;
    idx = (idx + 1) % L;
  }
  env(out, 0.001, dur * 0.95, 2.2);
  for (let i = 0; i < n; i++) out[i] *= 0.34;
  return filt(out, biquad('lp', 5200, 0.7));
}

function pad(midi, dur, rng, amp = 0.1) {
  // slow bowed/organ-ish pad from detuned saws
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const f0 = hz(midi);
  for (const d of [-0.07, 0, 0.06]) {
    const f = f0 * (1 + d / 12);
    for (let k = 1; k <= 9; k++) {
      const w = 2 * Math.PI * f * k / SR;
      const a = 0.5 / k;
      const ph = rng() * 6.283;
      for (let i = 0; i < n; i++) out[i] += Math.sin(w * i + ph) * a;
    }
  }
  const at = Math.round(Math.min(0.55, dur * 0.35) * SR);
  const rl = Math.round(Math.min(0.9, dur * 0.45) * SR);
  for (let i = 0; i < n; i++) {
    let g = 1;
    if (i < at) g = 0.5 - 0.5 * Math.cos(Math.PI * i / at);
    const k = n - i;
    if (k < rl) g *= 0.5 - 0.5 * Math.cos(Math.PI * k / rl);
    out[i] *= g * amp * 0.1;
  }
  return filt(out, biquad('lp', 1500, 0.6));
}

function shaker(dur, rng, amp = 1, tone = 6400) {
  let n = noise(dur, rng);
  n = filt(n, biquad('bp', tone, 1.1));
  n = filt(n, biquad('hp', 2600, 0.7));
  env(n, 0.0012, dur * 0.5, 5);
  for (let i = 0; i < n.length; i++) n[i] *= 0.5 * amp;
  return n;
}

function woodKnock(dur, rng, f = 420, amp = 0.5) {
  let n = noise(dur, rng);
  n = filt(n, biquad('bp', f, 7));
  n = filt(n, biquad('bp', f * 2.3, 5));
  env(n, 0.0004, dur * 0.4, 6);
  const t = partials(f * 0.5, dur, [[1, 0.3, dur * 0.25], [2.1, 0.12, dur * 0.12]], rng);
  mixInto(n, t, 0.8);
  for (let i = 0; i < n.length; i++) n[i] *= amp;
  return n;
}

function thump(dur, rng, f0 = 105, f1 = 46, amp = 0.6) {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const f = f0 * Math.pow(f1 / f0, Math.pow(u, 0.42));
    ph += 2 * Math.PI * f / SR;
    out[i] = Math.sin(ph);
  }
  env(out, 0.0015, dur * 0.42, 4.5);
  for (let i = 0; i < n; i++) out[i] *= amp;
  return out;
}

// ------------------------------------------------------------------ sfx
function paper(dur, rng, amp = 0.5, bright = 1) {
  // layered crackle: many tiny filtered noise grains
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const grains = Math.round(28 + dur * 190);
  for (let g = 0; g < grains; g++) {
    const at = Math.pow(rng(), 0.8) * dur * 0.95;
    const gd = 0.004 + rng() * 0.02;
    let gr = noise(gd, rng);
    gr = filt(gr, biquad('bp', (1500 + rng() * 5200) * bright, 0.9));
    env(gr, 0.0004, gd * 0.45, 5);
    mixInto(out, gr, 0.5 + rng() * 0.8, Math.round(at * SR));
  }
  let bed = noise(dur, rng);
  bed = filt(bed, biquad('hp', 2200 * bright, 0.7));
  bed = filt(bed, biquad('lp', 11000, 0.7));
  window_(bed, dur * 0.18, dur * 0.5);
  mixInto(out, bed, 0.22);
  window_(out, 0.004, dur * 0.25);
  for (let i = 0; i < n; i++) out[i] *= amp * 0.55;
  return out;
}

function slide(dur, rng, amp = 0.5, dir = 1) {
  let n = noise(dur, rng);
  n = dir > 0 ? sweepBP(n, 420, 2300, 700, 1.3) : sweepBP(n, 2000, 900, 380, 1.3);
  window_(n, dur * 0.22, dur * 0.55);
  // a touch of pitched air so it reads as motion, not just hiss
  const air = partials(hz(74), dur, [[1, 0.05, dur * 0.7], [1.5, 0.025, dur * 0.5]], rng);
  mixInto(n, air, 0.35);
  for (let i = 0; i < n.length; i++) n[i] *= amp * 0.62;
  return n;
}

function magnetSnap(rng, amp = 0.6) {
  const dur = 0.18;
  const out = new Float32Array(Math.round(dur * SR));
  let click = noise(0.004, rng);
  click = filt(click, biquad('hp', 2600, 0.8));
  env(click, 0.0002, 0.003);
  mixInto(out, click, 0.9);
  mixInto(out, thump(0.1, rng, 180, 72, 0.5), 0.8);
  const ring = partials(hz(93), dur, [[1, 0.1, 0.05], [2.4, 0.05, 0.03]], rng);
  mixInto(out, ring, 0.7);
  for (let i = 0; i < out.length; i++) out[i] *= amp;
  return out;
}

function servoMove(dur, rng, amp = 0.45) {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  // whirr: buzzy saw with wobble
  let ph = 0;
  const whirr = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const f = 168 + 26 * Math.sin(u * 44) + 30 * u;
    ph += 2 * Math.PI * f / SR;
    let v = 0;
    for (let k = 1; k <= 7; k++) v += Math.sin(ph * k) / k;
    whirr[i] = v * 0.2;
  }
  let w = filt(whirr, biquad('bp', 950, 0.9));
  w = filt(w, biquad('lp', 2600, 0.7));
  window_(w, 0.012, 0.03);
  mixInto(out, w, 1);
  // two end ticks
  for (const t of [0, dur - 0.03]) {
    let tick = noise(0.012, rng);
    tick = filt(tick, biquad('bp', 2100, 2.5));
    env(tick, 0.0003, 0.008);
    mixInto(out, tick, 0.55, Math.round(Math.max(0, t) * SR));
  }
  for (let i = 0; i < n; i++) out[i] *= amp;
  return out;
}

// a toggle being thrown: two crisp contact clicks, the second a touch duller
function switchClick(rng, amp = 0.5) {
  const dur = 0.2;
  const out = new Float32Array(Math.round(dur * SR));
  for (const [t, f, g] of [[0, 2600, 1], [0.045, 1700, 0.55]]) {
    let c = noise(0.007, rng);
    c = filt(c, biquad('bp', f, 2.2));
    c = filt(c, biquad('hp', 900, 0.8));
    env(c, 0.0002, 0.0035, 6);
    mixInto(out, c, g, Math.round(t * SR));
    const body = partials(hz(76), 0.07, [[1, 0.09, 0.035], [2.7, 0.04, 0.02]], rng);
    mixInto(out, body, 0.5 * g, Math.round(t * SR));
  }
  for (let i = 0; i < out.length; i++) out[i] *= amp;
  return out;
}

// the coil singing quietly while it is energised; `tail` lets the field die away
function coilHum(dur, rng, amp = 0.2, tail = 0.12) {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  let ph = 0, ph2 = 0;
  for (let i = 0; i < n; i++) {
    const f = 118 + Math.sin(i / SR * 3.1) * 1.6;
    ph += 2 * Math.PI * f / SR;
    ph2 += 2 * Math.PI * f * 2 / SR;
    out[i] = (Math.sin(ph) > 0 ? 1 : -1) * 0.3 + Math.sin(ph2) * 0.22 + Math.sin(ph * 3) * 0.1;
  }
  let o = filt(out, biquad('bp', 240, 0.7));
  o = filt(o, biquad('lp', 1100, 0.7));
  const rel = Math.max(1, Math.round(tail * SR));
  const at = Math.round(0.02 * SR);
  for (let i = 0; i < n; i++) {
    let g = 1;
    if (i < at) g = i / at;
    const k = n - i;
    if (k < rel) g *= Math.pow(k / rel, 2);     // the field collapses, it does not fade
    o[i] *= g * amp;
  }
  return o;
}

// stepper "singing" while the gantry travels; pitch follows a speed profile
function motorRun(dur, rng, amp = 0.3) {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  let ph = 0, ph2 = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const speed = Math.sin(Math.PI * Math.min(1, u * 1.0)); // ease in / out
    const f = 95 + 150 * speed;
    ph += 2 * Math.PI * f / SR;
    ph2 += 2 * Math.PI * f * 2.01 / SR;
    const sq = (Math.sin(ph) > 0 ? 1 : -1) * 0.5 + Math.sin(ph2) * 0.3;
    out[i] = sq * (0.25 + 0.75 * speed);
  }
  let o = filt(out, biquad('bp', 420, 0.8));
  o = filt(o, biquad('lp', 1900, 0.7));
  let hiss = noise(dur, rng);
  hiss = filt(hiss, biquad('bp', 3400, 1.4));
  for (let i = 0; i < n; i++) o[i] += hiss[i] * 0.05 * Math.sin(Math.PI * i / n);
  window_(o, 0.045, 0.09);
  for (let i = 0; i < n; i++) o[i] *= amp;
  return o;
}

function blip(rng, amp = 0.35, f0 = 880, f1 = 1500, dur = 0.075) {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const f = f0 + (f1 - f0) * u;
    ph += 2 * Math.PI * f / SR;
    out[i] = Math.sin(ph) + Math.sin(ph * 2) * 0.18;
  }
  env(out, 0.0015, dur * 0.5, 4);
  for (let i = 0; i < n; i++) out[i] *= amp * 0.5;
  return out;
}

function pop(rng, amp = 0.4) {
  const dur = 0.07;
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const f = 760 * Math.pow(0.42, u);
    ph += 2 * Math.PI * f / SR;
    out[i] = Math.sin(ph);
  }
  env(out, 0.0008, dur * 0.35, 5);
  let n2 = noise(0.006, rng);
  n2 = filt(n2, biquad('hp', 3000, 0.8));
  env(n2, 0.0002, 0.004);
  mixInto(out, n2, 0.35);
  for (let i = 0; i < n; i++) out[i] *= amp;
  return out;
}

function stamp(rng, amp = 0.65) {
  const dur = 0.4;
  const out = new Float32Array(Math.round(dur * SR));
  mixInto(out, thump(0.22, rng, 150, 52, 0.85), 1);
  mixInto(out, woodKnock(0.09, rng, 320, 0.5), 0.9);
  mixInto(out, paper(0.3, rng, 0.45), 0.8, Math.round(0.02 * SR));
  for (let i = 0; i < out.length; i++) out[i] *= amp;
  return out;
}

function pencil(dur, rng, amp = 0.4) {
  // scratchy pencil stroke
  const n = Math.round(dur * SR);
  let o = noise(dur, rng);
  o = filt(o, biquad('bp', 2600, 0.8));
  o = filt(o, biquad('hp', 1500, 0.7));
  for (let i = 0; i < n; i++) {
    const u = i / n;
    o[i] *= (0.55 + 0.45 * Math.sin(u * 95 + Math.sin(u * 21) * 2));
  }
  window_(o, dur * 0.12, dur * 0.3);
  for (let i = 0; i < n; i++) o[i] *= amp * 0.5;
  return o;
}

module.exports = {
  hz, musicBox, marimba, glock, pizz, pluck, pad, shaker, woodKnock, thump,
  paper, slide, magnetSnap, servoMove, switchClick, coilHum, motorRun, blip, pop, stamp, pencil,
};
